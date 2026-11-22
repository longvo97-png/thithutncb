const firstExam = [
  'Командир là danh từ giống đực số ít ở chủ cách, nên tính từ đi kèm có dạng новый.',
  'Сестра и её дочь là hai người, nên читать dùng ngôi thứ ba số nhiều читают.',
  'Где hỏi nơi làm việc. На + cách 6 cho biết vị trí, vì vậy dùng на заводе.',
  'И nối hai chủ ngữ cùng thực hiện hành động смотрят телевизор.',
  'Trong mẫu «Меня зовут…», tên đứng sau зовут và đại từ chỉ người được gọi là меня.',
  'Учитель là danh từ giống đực số ít, nên dùng từ sở hữu мой.',
  'Я и Иван Иванович gồm người nói và một người khác, nên chủ ngữ tương ứng là мы.',
  'Địa điểm với tên thành phố dùng в + cách 6 trong cụm в Москве.',
  'Учительница là danh từ giống cái số ít. Từ hỏi sở hữu tương ứng là чья.',
  'Với số 8, danh từ chỉ giờ có dạng часов. Với 1 dùng час, còn 3 và 4 dùng часа.',
  'Утром chỉ thời điểm, nên câu hỏi cần từ когда.',
  'Идёт diễn tả chuyển động. Домой chỉ hướng về nhà, còn дома chỉ vị trí ở nhà.',
  'Раньше chỉ quá khứ và дочь là chủ ngữ giống cái số ít, nên жить có dạng жила.',
  'Ở đây учить có nghĩa là học một môn. Русский язык là tân ngữ trực tiếp chỉ môn học.',
  'Иван и Анна tương ứng với они và đi với работают. Иван и я tương ứng với мы và đi với работаем.',
  'Sau люблю, dùng động từ nguyên mẫu читать để nêu hoạt động mình thích.',
  'Книга là danh từ giống cái số ít ở chủ cách, nên новый đổi thành новая.',
  'Sau số 7, danh từ chỉ giờ dùng dạng số nhiều cách 2 часов.',
  'Иван и Миша là chủ ngữ số nhiều, nên быть ở quá khứ có dạng были.',
  'Mẫu «У кого есть что?» diễn tả sự sở hữu. У меня есть nghĩa là «tôi có».',
];

const questionCues = [
  [/^(?:на|в|с) ч[её]м(?![а-яё])/iu, 'xác định phương tiện hoặc đối tượng mà giới từ đang hỏi đến'],
  [/^у кого(?![а-яё])/iu, 'xác định người sở hữu'],
  [/^кого(?![а-яё])|^кому(?![а-яё])/iu, 'xác định người chịu tác động và dùng dạng từ hỏi phù hợp với cách của người đó'],
  [/^кто(?![а-яё])/iu, 'xác định người hoặc nghề nghiệp'],
  [/^где(?![а-яё])/iu, 'xác định nơi sự việc diễn ra'],
  [/^куда(?![а-яё])/iu, 'xác định đích đến của chuyển động'],
  [/^откуда(?![а-яё])/iu, 'xác định nơi xuất phát'],
  [/^когда(?![а-яё])/iu, 'xác định thời điểm'],
  [/^сколько(?![а-яё])/iu, 'xác định số lượng, tuổi hoặc giờ theo ngữ cảnh'],
  [/^чь[яёиое](?![а-яё])|^чей(?![а-яё])/iu, 'xác định người sở hữu và hòa hợp với danh từ được hỏi'],
  [/^как(?:ой|ая|ое|ие|ом)(?![а-яё])/iu, 'xác định đặc điểm của danh từ'],
  [/^как(?![а-яё])/iu, 'xác định cách thức hoặc tên gọi tùy theo động từ'],
  [/^что(?![а-яё])/iu, 'xác định sự vật hoặc hành động được hỏi'],
];

function cue(text) {
  return questionCues.find(([pattern]) => pattern.test(text.trim()))?.[1];
}

function words(text) {
  return new Set((text.toLocaleLowerCase('ru').match(/[а-яё]{4,}|\d+/gu) ?? []));
}

function evidence(passage, answer) {
  const target = words(answer);
  const sentences = passage.flatMap(paragraph => paragraph.split(/(?<=[.!?])\s+/u));
  const ranked = sentences.map(text => ({
    text,
    score: [...words(text)].filter(word => target.has(word)).length,
  })).sort((a, b) => b.score - a.score);
  return ranked[0]?.score >= 2 ? ranked[0].text : undefined;
}

function choiceHint(question, answer) {
  const options = Object.values(question.choices);
  if (options.every(value => /^\d+$/u.test(value)) && /часов/u.test(question.text)) {
    return 'Часов đi với 5–20. Với 1 dùng час và với 2–4 dùng часа.';
  }
  const information = cue(question.text);
  if (information) {
    return `Từ hỏi ở đầu câu yêu cầu ${information}. Hãy đối chiếu loại thông tin đó với phương án đúng.`;
  }
  if (/(?:люблю|любишь|любит|любим|любите|любят)/iu.test(question.text) && /(?:ть|ти|чь)$/u.test(answer)) {
    return 'Sau любить, động từ chỉ hoạt động được yêu thích đứng ở dạng nguyên mẫu.';
  }
  if (options.every(value => /^(?:мой|моя|мо[её]|мои|наш|наша|наше|наши)$/iu.test(value))) {
    return 'Từ sở hữu phải hòa hợp với danh từ đi sau. Ở chủ cách, мой/наш dùng cho giống đực, моя/наша cho giống cái, моё/наше cho giống trung và мои/наши cho số nhiều.';
  }
  if (/(?:вчера|раньше)/iu.test(question.text) && /(?:л|ла|ло|ли)$/u.test(answer)) {
    return 'Dấu hiệu thời gian chỉ quá khứ. Động từ quá khứ dùng -л với giống đực, -ла với giống cái, -ло với giống trung và -ли với số nhiều.';
  }
  const stems = options.map(value => value.toLocaleLowerCase('ru').slice(0, -2));
  if (stems[0]?.length >= 3 && stems.every(stem => stem === stems[0])) {
    return 'Các phương án dùng cùng một gốc từ. Hãy xác định từ chi phối trong câu và đối chiếu phần đuôi của phương án đúng với các phương án còn lại.';
  }
  return 'Đọc câu hoàn chỉnh bên dưới và đối chiếu từ đã điền với phần trước và sau chỗ trống.';
}

export function explainAnswer(exam, question, answer, official) {
  const n = question.number;
  const text = question.text.trim();
  if (n <= 20) {
    return {
      reason: exam.id === 1 && official ? firstExam[n - 1] : choiceHint(question, answer),
      example: text.replace(/_+/u, answer),
    };
  }
  if (n <= 25) {
    const information = cue(text);
    return {
      reason: information
        ? `Câu hỏi yêu cầu ${information}. Phương án đúng trả lời trực tiếp thông tin được hỏi.`
        : 'Đối chiếu câu hỏi với câu trả lời như một lượt hội thoại. Giữ đúng người xưng hô và thông tin đang được hỏi.',
    };
  }
  if (n <= 35) {
    const chars = Array.from(question.text);
    const focus = question.underline.map(([a, b]) => chars.slice(a, b).join('').trim()).filter(Boolean).join(' ');
    const information = cue(answer);
    return {
      reason: information
        ? `Phần gạch chân «${focus}» là thông tin cần hỏi. Câu hỏi đúng dùng từ hỏi để ${information}.`
        : `Đặt câu hỏi sao cho câu trả lời chính là phần gạch chân «${focus}». Giữ lại các chi tiết khác làm ngữ cảnh.`,
    };
  }
  if (n <= 40) {
    if (exam.id === 1 && n === 39 && official) {
      return {reason: 'Khóa đáp án suy luận từ chi tiết Oleg là cầu thủ bóng đá.', example: 'Его сын Олег футболист.'};
    }
    const example = evidence(exam.reading, answer);
    return {
      reason: example
        ? 'Đối chiếu đáp án với câu liên quan trong đoạn văn bên dưới.'
        : 'Xác định người hoặc sự việc được hỏi, rồi đối chiếu câu trả lời với các chi tiết trong đoạn văn.',
      example,
    };
  }
  return {
    reason: 'Phương án đúng dùng đủ ý của các từ cho sẵn. Đối chiếu chủ ngữ với dạng động từ và kiểm tra dạng danh từ sau giới từ nếu có.',
    example: `${text} → ${answer}`,
  };
}
