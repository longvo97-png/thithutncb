"""Generate the multiple-choice supplements and key from the teacher's DOCX."""
import argparse
import json
import re
from collections import Counter
from pathlib import Path
from random import Random

from extract_exams import paragraphs

ROOT = Path(__file__).resolve().parents[1]
LABELS = "АБВГ"
WORD = re.compile(r"[А-ЯЁа-яё]+")
EXAM = re.compile(r"Đề\s+Số\s+(\d+)", re.IGNORECASE)
NUMBER = re.compile(r"Câu\s*[ВB]?\s*(\d+)\s*:")
QUESTION_WORD = re.compile(
    r"^(?:(?:в|на|у|с|о|к|из) )?(?:ч[её]м|чь[яиёе]|что|кого|кому|кто|"
    r"где|куда|откуда|как(?:ой|ая|ие|ое|ом)?|когда|сколько|который)\b", re.IGNORECASE
)


def read_answers(docx):
    answers = {}
    for raw, _ in paragraphs(docx):
        line = " ".join(raw.split())
        if match := EXAM.fullmatch(line):
            current = answers.setdefault(int(match[1]), {})
            number = None
        elif match := NUMBER.fullmatch(line):
            number = int(match[1])
            if number in current:
                raise ValueError(f"Duplicate answer {number}")
            current[number] = ""
        elif re.match(r"^(?:I|II|III|IV|V)\s*\.", line) or "КОНЕЦ" in line.upper():
            number = None
        elif answers and number is not None:
            current[number] = " ".join(filter(None, (current[number], line)))
    return answers


def question_word(text):
    match = QUESTION_WORD.match(text)
    return match[0].casefold().replace("ё", "е") if match else ""


def tokens(text):
    return set(WORD.findall(text.casefold().replace("ё", "е")))


def writing_options(answer, source, rng):
    words = list(WORD.finditer(answer))
    source_words = list(dict.fromkeys(WORD.findall(source)))
    # Replace an inflected word with its supplied form when a related lemma
    # occurs in the source. The fallback drops a supplied content word.
    related = []
    omissions = []
    for word in words:
        value = word[0].casefold()
        if len(value) >= 3:
            omissions.append(" ".join((answer[:word.start()] + answer[word.end():]).split()))
        for lemma in source_words:
            base = lemma.casefold()
            if len(base) >= 4 and base != value and value.startswith(base[:max(4, len(base) - 3)]):
                if word[0].isupper():
                    lemma = lemma.capitalize()
                related.append(answer[:word.start()] + lemma + answer[word.end():])
    rng.shuffle(related)
    rng.shuffle(omissions)
    # Make at least one distractor test inflection where the source allows it.
    number_variants = []
    for match in re.finditer(r"\d+", answer):
        for delta in (1, 2, 3):
            number_variants.append(answer[:match.start()] + str(int(match[0]) + delta) + answer[match.end():])
    if len(omissions) < 3:
        omissions.extend(" ".join((answer[:word.start()] + answer[word.end():]).split()) for word in words)
    return related[:1] + number_variants + omissions


def conversion(exams, answers):
    if set(answers) != {exam["id"] for exam in exams}:
        raise ValueError("Exam numbers differ between the question bank and the answer document")
    for exam_id, rows in answers.items():
        if set(rows) != set(range(1, 46)) or not all(rows.values()):
            raise ValueError(f"Incomplete answer sheet: exam {exam_id}")
    reading = [
        (question_word(item["text"]), answers[exam["id"]][item["number"]])
        for exam in exams for item in exam["questions"][35:40]
    ]
    converted, keys = {}, {}
    for exam in exams:
        exam_id = exam["id"]
        converted[exam_id], keys[exam_id] = {}, {}
        for question in exam["questions"]:
            n = question["number"]
            answer = answers[exam_id][n]
            if n <= 25:
                label = answer.rstrip(".").translate(str.maketrans("ABa", "АВа"))
                if label not in question.get("choices", exam["matching"]):
                    raise ValueError(f"Invalid answer label: {exam_id}/{n}: {answer!r}")
                keys[exam_id][n] = label
                continue

            # Keep this order stable so existing stored answer letters retain their meaning.
            rng = Random(exam_id * 100 + n)
            if n <= 40:
                section = range(26, 36) if n <= 35 else range(36, 41)
                pool = [rows[k] for rows in answers.values() for k in section]
                rng.shuffle(pool)
                correct_kind = question_word(answer)
                correct_words = tokens(answer)
                if n <= 35:
                    pool = [text for text in pool if text.endswith("?") and question_word(text)
                            and question_word(text) != correct_kind]
                    pool.sort(key=lambda text: -len(tokens(text) & correct_words))
                else:
                    kind = question_word(question["text"])
                    ordered = reading[:]
                    rng.shuffle(ordered)
                    ordered.sort(key=lambda row: not kind or row[0] != kind)
                    pool = [text for _, text in ordered]
                    # Favor responses with different facts. Exclude rephrasings
                    # that repeat any of the answer's significant content words.
                    content = {word for word in correct_words if len(word) > 3}
                    pool = [text for text in pool if not content.intersection(tokens(text))]
                    polarity = re.match(r"^(да|нет)\b", answer.casefold())
                    if polarity:
                        opposite = "Нет" if polarity[1] == "да" else "Да"
                        bare = f"{opposite}."
                        pool = [bare] + [text for text in pool if not re.match(r"^(да|нет)\b", text.casefold())]
                    else:
                        pool = [text for text in pool if not re.match(r"^(да|нет)\b", text.casefold())]
            else:
                pool = writing_options(answer, question["text"], rng)

            answer = re.sub(r"\s+([,.!?])", r"\1", answer)
            distinct = {answer.casefold()}
            options = [answer]
            for candidate in pool:
                candidate = re.sub(r"\s+([,.!?])", r"\1", candidate.strip())
                candidate = candidate[:1].upper() + candidate[1:]
                if candidate.casefold() in distinct or not WORD.search(candidate):
                    continue
                distinct.add(candidate.casefold())
                options.append(candidate)
                if len(options) == 4:
                    break
            if len(options) != 4:
                raise ValueError(f"Insufficient distractors: {exam_id}/{n}")
            rng.shuffle(options)
            converted[exam_id][n] = dict(zip(LABELS, options))
            keys[exam_id][n] = LABELS[options.index(answer)]
    distribution = Counter(label for row in keys.values() for n, label in row.items() if n > 25)
    print(f"Generated {sum(distribution.values())} choice questions and {sum(map(len, keys.values()))} answer keys")
    return converted, keys


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("answer_docx", type=Path)
    parser.add_argument("--output-dir", type=Path, default=ROOT / "data")
    args = parser.parse_args()
    exams = json.loads((ROOT / "data/exams.json").read_text(encoding="utf-8"))
    questions, keys = conversion(exams, read_answers(args.answer_docx))
    for name, result in (("converted-questions.json", questions), ("answer-key.json", keys)):
        (args.output_dir / name).write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
