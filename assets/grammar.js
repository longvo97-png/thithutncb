const topics = [
  {
    title: 'Vị trí và hướng di chuyển',
    explanation: 'Где? hỏi vị trí. Với в hoặc на, danh từ chỉ nơi chốn thường ở cách 6. Куда? hỏi đích đến và thường dùng в hoặc на với cách 4. Откуда? hỏi nơi xuất phát và thường dùng из hoặc с với cách 2.',
    example: 'Я живу в Москве. → Где? · Я еду в Москву. → Куда? · Я приехал из Москвы. → Откуда?',
    match: /(?<!\p{L})(где|куда|откуда)(?!\p{L})/iu,
  },
  {
    title: 'Thời gian và số đếm',
    explanation: 'Когда? hỏi thời điểm. Khi nói giờ, dùng час sau 1, часа sau 2–4 và часов sau 5–20. В + giờ trả lời câu hỏi «vào lúc mấy giờ».',
    example: 'Сейчас один час. Сейчас три часа. Сейчас пять часов. Урок начинается в пять часов.',
    match: /(?<!\p{L})(когда|сколько|час|часа|часов|времени)(?!\p{L})/iu,
  },
  {
    title: 'Giống, số và sự hòa hợp',
    explanation: 'Tính từ và từ sở hữu như мой hòa hợp theo giống, số và cách của danh từ đi cùng. Ở chủ cách, чей, чья, чьё và чьи lần lượt đi với danh từ giống đực, giống cái, giống trung và số nhiều.',
    example: 'мой новый словарь · моя новая книга · моё новое окно · мои новые книги',
    match: /(?<!\p{L})(чей|чья|чьё|чьи|мой|моя|моё|мои|новый|новая|новое|новые)(?!\p{L})/iu,
  },
  {
    title: 'Chia động từ theo chủ ngữ và thời',
    explanation: 'Ở hiện tại, động từ đổi theo ngôi và số. Ở quá khứ, dạng số ít đổi theo giống của chủ ngữ, còn số nhiều chung một dạng. Sau любить, động từ chỉ hoạt động được dùng ở nguyên mẫu.',
    example: 'я читаю · он читает · они читают · она читала · они читали · я люблю читать',
    match: /(?<!\p{L})(раньше|вчера|сейчас|люб\p{L}*|чита\p{L}*)(?!\p{L})/iu,
  },
  {
    title: 'Hỏi về phần được gạch chân',
    explanation: 'Xác định phần gạch chân chỉ người, vật, nơi chốn, thời điểm hay cách thức. Dùng từ hỏi tương ứng và giữ phần thông tin còn lại. Với tân ngữ, chọn dạng như кого? hoặc что? theo vai trò trong câu.',
    example: 'Анна читает книгу. → Что читает Анна? · Анна едет на метро. → На чём едет Анна?',
    range: [26, 35],
  },
  {
    title: 'Tìm căn cứ trong đoạn đọc',
    explanation: 'Xác định từ hỏi và chủ thể trước khi tìm chi tiết. Когда hỏi thời điểm, где hỏi vị trí, còn кто hỏi người. Khi trả lời, giữ đúng thông tin của đoạn và biến đổi cách nếu cấu trúc câu yêu cầu.',
    example: 'Олег работает на заводе. → Где работает Олег? → На заводе.',
    range: [36, 40],
  },
  {
    title: 'Dựng câu từ các từ cho trước',
    explanation: 'Tìm chủ ngữ và động từ trước, rồi chọn thời dựa vào dấu hiệu như вчера hoặc завтра. Chia động từ theo chủ ngữ và đổi cách của danh từ sau giới từ hoặc khi làm tân ngữ.',
    example: 'мы / вчера / читать / книга → Вчера мы читали книгу.',
    range: [41, 45],
  },
];

export function grammarReview(exam) {
  return topics.flatMap(topic => {
    const questions = exam.questions.filter(({number, text, choices}) => {
      if (topic.range) return number >= topic.range[0] && number <= topic.range[1];
      return number <= 25 && topic.match.test([text, ...Object.values(choices ?? {})].join(' '));
    }).map(({number}) => number);
    return questions.length ? [{...topic, questions}] : [];
  });
}
