"""Extract the 20 Russian practice exams from the original DOCX."""
import argparse
import json
import re
from pathlib import Path
from xml.etree import ElementTree
from zipfile import ZipFile

W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
QUESTION = re.compile(r"Câu\s*(\d+)\s*[:.]")
SECTION = re.compile(r"^(I|II|III|IV|V)\s*\.")
OPTION = re.compile(r"^([АAБВBГабвгдa])(?:\s*[.)]\s*|\s+)(.*)$")


def paragraphs(source):
    with ZipFile(source) as archive:
        root = ElementTree.fromstring(archive.read("word/document.xml"))
    for paragraph in root.iter(W + "p"):
        text = ""
        ranges = []
        for run in paragraph.iter(W + "r"):
            underline = run.find(f"{W}rPr/{W}u")
            value = "".join(
                (node.text or "") if node.tag == W + "t" else " "
                for node in run if node.tag in (W + "t", W + "tab", W + "br")
            )
            if underline is not None and underline.get(W + "val") != "none" and value:
                if ranges and ranges[-1][1] == len(text):
                    ranges[-1][1] += len(value)
                else:
                    ranges.append([len(text), len(text) + len(value)])
            text += value
        if text.strip():
            yield text, ranges


def extract(source):
    exams = []
    question = None
    reading = False
    for raw, underline in paragraphs(source):
        line = raw.strip()
        if match := SECTION.match(line):
            if match[1] == "I":
                exam = {"id": len(exams) + 1, "questions": [], "matching": {}, "reading": []}
                exams.append(exam)
            question = None
            reading = match[1] == "IV"
            continue
        if match := QUESTION.fullmatch(line):
            n = int(match[1])
            question = {"number": n, "parts": []}
            exam["questions"].append(question)
            reading = False
            continue
        if "КОНЕЦ" in line.upper() or line.startswith("Ghi chú:"):
            question = None
        elif reading:
            exam["reading"].append(line)
        elif question is not None:
            question["parts"].append((raw, underline))

    if len(exams) != 20:
        raise ValueError(f"Expected 20 exams, found {len(exams)}")
    for exam in exams:
        if [q["number"] for q in exam["questions"]] != list(range(1, 46)) or not exam["reading"]:
            raise ValueError(f"Incomplete exam {exam['id']}")
        for q in exam["questions"]:
            n = q["number"]
            parts = q.pop("parts")
            if n <= 25:
                prompt, choices, label = [], {}, None
                for raw, _ in parts:
                    line = raw.strip()
                    if prompt and (match := OPTION.fullmatch(line)) and (n <= 20 or label is None):
                        label = match[1].translate(str.maketrans("ABa", "АВа"))
                        choices[label] = match[2]
                    elif label is None:
                        prompt.append(line)
                    else:
                        choices[label] = " ".join(filter(None, (choices[label], line)))
                expected = "АБВГ" if n <= 20 else "абвгд"[n - 21]
                if set(choices) != set(expected) or not all(choices.values()) or not prompt:
                    raise ValueError(f"Exam {exam['id']}, question {n}: {parts}")
                q["text"] = "\n".join(prompt)
                if n <= 20:
                    q["choices"] = choices
                else:
                    exam["matching"].update(choices)
            else:
                if not parts:
                    raise ValueError(f"Missing text: exam {exam['id']}, question {n}")
                q["text"] = "\n".join(raw for raw, _ in parts).strip() if n > 35 else "\n".join(raw for raw, _ in parts)
                if 26 <= n <= 35:
                    offset = 0
                    q["underline"] = []
                    for raw, ranges in parts:
                        q["underline"].extend([a + offset, b + offset] for a, b in ranges)
                        offset += len(raw) + 1
                    if not q["underline"]:
                        print(f"No underline: exam {exam['id']}, question {n}")
    return exams


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("--output", type=Path, default=Path(__file__).resolve().parents[1] / "data/exams.json")
    args = parser.parse_args()
    result = extract(args.source)
    args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Extracted {len(result)} exams and {sum(len(exam['questions']) for exam in result)} questions")
