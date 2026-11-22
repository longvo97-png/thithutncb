import {grammarReview} from './grammar.js';

const app = document.querySelector('#app');
const storageKey = 'russian-practice-v1';
const sections = [
  [1, 20, 'I', 'Chọn đáp án'],
  [21, 25, 'II', 'Nối câu'],
  [26, 35, 'III', 'Chọn câu hỏi cho phần gạch chân'],
  [36, 40, 'IV', 'Đọc hiểu'],
  [41, 45, 'V', 'Chọn câu dùng đủ các từ cho sẵn'],
];

function el(tag, text, attrs = {}) {
  const item = document.createElement(tag);
  if (text !== undefined) item.textContent = text;
  for (const [name, value] of Object.entries(attrs)) item.setAttribute(name, value);
  return item;
}

function button(text, action, attrs) {
  const item = el('button', text, {type: 'button', ...attrs});
  item.addEventListener('click', action);
  return item;
}

function emptyState() {
  return {name: '', theme: 'light', size: 'normal', exams: {}, keys: {}};
}

function validChoice(number, answer) {
  return (number >= 21 && number <= 25 ? /^[абвгд]$/ : /^[АБВГ]$/).test(answer ?? '');
}

function normalizeKeys(input, allowLegacy = false) {
  const keys = {};
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw Error();
  for (const [id, answers] of Object.entries(input)) {
    if (!/^(?:[1-9]|1\d|20)$/.test(id) || !answers || typeof answers !== 'object' || Array.isArray(answers)) throw Error();
    keys[id] = {};
    for (const [number, value] of Object.entries(answers)) {
      if (!/^(?:[1-9]|[1-3]\d|4[0-5])$/.test(number) || typeof value !== 'string') throw Error();
      const answer = value.trim();
      if (!answer) continue;
      if (!validChoice(Number(number), answer)) {
        if (allowLegacy && Number(number) > 25) continue;
        throw Error();
      }
      keys[id][number] = answer;
    }
  }
  return keys;
}

function normalizeState(input) {
  if (!input || typeof input !== 'object' || !input.exams || typeof input.exams !== 'object' || Array.isArray(input.exams)) throw Error();
  const result = emptyState();
  result.name = typeof input.name === 'string' ? input.name.slice(0, 120) : '';
  result.theme = input.theme === 'dark' ? 'dark' : 'light';
  result.size = input.size === 'large' ? 'large' : 'normal';
  result.keys = normalizeKeys(input.keys ?? {}, true);
  for (const [id, item] of Object.entries(input.exams)) {
    if (!/^(?:[1-9]|1\d|20)$/.test(id) || !item || typeof item !== 'object') throw Error();
    const answers = {};
    for (const [number, answer] of Object.entries(item.answers ?? {})) {
      if (/^(?:[1-9]|[1-3]\d|4[0-5])$/.test(number) && typeof answer === 'string') answers[number] = answer;
    }
    result.exams[id] = {
      answers,
      marked: Array.isArray(item.marked) ? [...new Set(item.marked.filter(n => Number.isInteger(n) && n >= 1 && n <= 45))] : [],
      current: Number.isInteger(item.current) && item.current >= 1 && item.current <= 45 ? item.current : 1,
      elapsed: Number.isFinite(item.elapsed) && item.elapsed >= 0 ? item.elapsed : 0,
      complete: item.complete === true,
    };
  }
  return result;
}

let state = emptyState();
let storageError = false;
try {
  const saved = localStorage.getItem(storageKey);
  if (saved) state = normalizeState(JSON.parse(saved));
} catch {
  storageError = true;
}

let exams = [];
let publishedKeys = {};

function answerKeys(id) {
  return {...publishedKeys[id], ...state.keys[id]};
}

function choicesFor(question) {
  return question.choices ?? exam.matching;
}
let exam = null;
let page = 'home';
let timerStarted = null;
let timerBase = 0;
let status;
let timer;

function record() {
  return state.exams[exam.id] ??= {answers: {}, marked: [], current: 1, elapsed: 0, complete: false};
}

function elapsed() {
  return timerBase + (timerStarted === null ? 0 : Math.max(0, Date.now() - timerStarted));
}

function updateTimer() {
  if (timer) {
    const seconds = Math.floor(elapsed() / 1000);
    timer.textContent = [Math.floor(seconds / 60), seconds % 60].map(n => String(n).padStart(2, '0')).join(':');
  }
}

function save() {
  if (exam) record().elapsed = elapsed();
  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
    storageError = false;
    if (status) status.textContent = '';
  } catch {
    storageError = true;
    if (status) status.textContent = 'Không thể lưu trên trình duyệt. Hãy xuất bản sao trong Cài đặt.';
  }
}

function navigate(next) {
  save();
  if (next === 'home') {
    exam = null;
    timerStarted = null;
  }
  page = next;
  render(true);
}

function openExam(item) {
  exam = item;
  const data = record();
  timerBase = data.elapsed;
  timerStarted = data.complete ? null : Date.now();
  navigate(data.complete ? 'summary' : 'question');
}

function chooseQuestion(n) {
  record().current = n;
  navigate('question');
}

function count(data) {
  return Object.entries(data?.answers ?? {}).filter(([n, answer]) => validChoice(Number(n), answer)).length;
}

function download(name, text, mime) {
  const url = URL.createObjectURL(new Blob([text], {type: mime}));
  const link = el('a', undefined, {href: url, download: name});
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function home(main) {
  main.append(el('p', '20 đề gốc · 900 câu hỏi', {class: 'eyebrow'}), el('h1', 'Luyện thi Tiếng Nga cơ bản'),
    el('p', 'Chọn một đề để bắt đầu hoặc tiếp tục bài đã lưu.', {class: 'muted'}));
  const grid = el('div', undefined, {class: 'exam-grid'});
  for (const item of exams) {
    const progress = state.exams[item.id];
    const entry = button('', () => openExam(item), {class: 'exam'});
    entry.append(el('strong', `Đề ${String(item.id).padStart(2, '0')}`),
      el('span', progress?.complete ? `Hoàn thành · ${count(progress)}/45` : `${count(progress)}/45 đã trả lời`));
    grid.append(entry);
  }
  main.append(grid);
}

function questionText(question) {
  const prompt = el('p', undefined, {class: 'prompt', lang: 'ru'});
  let offset = 0;
  const chars = Array.from(question.text);
  for (const [start, end] of question.underline ?? []) {
    prompt.append(chars.slice(offset, start).join(''), el('u', chars.slice(start, end).join('')));
    offset = end;
  }
  prompt.append(chars.slice(offset).join(''));
  return prompt;
}

function questionPage(main) {
  const data = record();
  const n = data.current;
  const question = exam.questions[n - 1];
  const section = sections.find(([start, end]) => n >= start && n <= end);
  const progress = el('span', `${count(data)}/45 đã chọn`);
  timer = el('span', undefined, {class: 'timer', 'aria-label': 'Thời gian làm bài'});
  const meta = el('div', undefined, {class: 'row spread muted'});
  meta.append(progress, timer);
  main.append(el('h1', `Đề ${exam.id} · Câu ${n}`), meta);
  const tabs = el('nav', undefined, {class: 'row tabs', 'aria-label': 'Phần của đề'});
  for (const [start, , roman, name] of sections) {
    tabs.append(button(roman, () => chooseQuestion(start), {'aria-label': name, 'aria-current': section[0] === start ? 'true' : 'false'}));
  }
  main.append(tabs);
  const card = el('section', undefined, {class: 'card'});
  card.append(el('h2', section[3]));
  if (n >= 36 && n <= 40) {
    const passage = el('div', undefined, {class: 'passage', lang: 'ru'});
    for (const paragraph of exam.reading) passage.append(el('p', paragraph));
    card.append(passage);
  }
  card.append(questionText(question));
  const oldAnswer = data.answers[n];
  if (oldAnswer?.trim() && !validChoice(n, oldAnswer)) {
    card.append(el('p', `Câu trả lời đã lưu trước đây: ${oldAnswer}`, {class: 'muted'}));
  }
  const choices = el('fieldset', undefined, {class: 'choices'});
  choices.append(el('legend', 'Các phương án', {class: 'sr-only'}));
  for (const [key, value] of Object.entries(choicesFor(question))) {
    const option = button(`${key}. ${value}`, () => {
      data.answers[n] = key;
      if (n === 45) navigate('summary');
      else chooseQuestion(n + 1);
    }, {lang: 'ru', 'aria-pressed': String(oldAnswer === key)});
    option.disabled = data.complete;
    choices.append(option);
  }
  card.append(choices);

  const controls = el('div', undefined, {class: 'row spread controls'});
  const previous = button('← Trước', () => chooseQuestion(n - 1));
  previous.disabled = n === 1;
  const mark = button('', () => {
    data.marked = data.marked.includes(n) ? data.marked.filter(number => number !== n) : [...data.marked, n];
    updateMark();
    save();
  });
  function updateMark() {
    const marked = data.marked.includes(n);
    mark.textContent = marked ? '★ Đã đánh dấu' : '☆ Đánh dấu';
    mark.setAttribute('aria-pressed', String(marked));
    jump.classList.toggle('marked', marked);
  }
  controls.append(previous, mark, button(n === 45 ? 'Tổng kết' : 'Câu tiếp →', () => n === 45 ? navigate('summary') : chooseQuestion(n + 1), {class: 'primary'}));
  const grid = el('nav', undefined, {class: 'question-grid', 'aria-label': 'Chuyển đến câu hỏi'});
  let jump;
  for (const {number} of exam.questions) {
    const entry = button(String(number), () => chooseQuestion(number), {'aria-label': `Câu ${number}`});
    entry.classList.toggle('answered', validChoice(number, data.answers[number]));
    entry.classList.toggle('marked', data.marked.includes(number));
    if (number === n) {
      entry.setAttribute('aria-current', 'true');
      jump = entry;
    }
    grid.append(entry);
  }
  updateMark();
  main.append(card, controls, grid);
  updateTimer();
}

function grade(data, keys) {
  let points = 0;
  let correct = 0;
  for (const [number, key] of Object.entries(keys)) {
    if (data.answers[number] === key) {
      correct++;
      points += Number(number) >= 36 && Number(number) <= 40 ? 4 : 2;
    }
  }
  return {points, correct};
}

function showGrammar(main) {
  const review = el('section', undefined, {class: 'card grammar', 'aria-labelledby': 'grammar-title'});
  review.append(el('h2', 'Ôn ngữ pháp theo đề', {id: 'grammar-title'}));
  for (const topic of grammarReview(exam)) {
    const item = el('details');
    item.append(el('summary', topic.title), el('p', topic.explanation), el('p', topic.example, {lang: 'ru'}));
    const links = el('div', undefined, {class: 'row', 'aria-label': 'Câu liên quan'});
    links.append(el('span', 'Câu liên quan', {class: 'muted'}));
    for (const n of topic.questions) links.append(button(String(n), () => chooseQuestion(n), {'aria-label': `Ôn câu ${n}`}));
    item.append(links);
    review.append(item);
  }
  main.append(review);
}

function summary(main) {
  const data = record();
  const answered = count(data);
  main.append(el('h1', `Tổng kết đề ${exam.id}`), el('p', `${answered}/45 đã chọn phương án`));
  const keys = answerKeys(exam.id);
  const score = grade(data, keys);
  if (data.complete) {
    const result = el('section', undefined, {class: 'card score', 'aria-labelledby': 'score-title'});
    result.append(el('h2', 'Kết quả chấm tự động', {id: 'score-title'}));
    result.append(el('p', `${score.points}/100 điểm`, {class: 'score-value'}),
      el('p', `${score.correct}/45 câu đúng · Đọc hiểu 4 điểm/câu, các phần còn lại 2 điểm/câu.`, {class: 'muted'}));
    if (Object.entries(data.answers).some(([number, value]) => value.trim() && !validChoice(Number(number), value))) {
      result.append(el('p', 'Bài cũ có câu trả lời tự luận được giữ lại để xem và xuất bài. Để chấm các câu này, hãy làm lại đề và chọn phương án.'));
    }
    main.append(result);
  } else {
    main.append(el('p', 'Sau khi nộp bài, trang sẽ hiện điểm của cả 45 câu và nội dung ôn ngữ pháp.', {class: 'muted'}));
  }
  const controls = el('div', undefined, {class: 'row controls'});
  controls.append(button('Xem lại bài', () => navigate('question')),
    button('Tải bài làm .txt', () => {
      const rows = exam.questions.map(question => {
      const value = data.answers[question.number];
      const choice = Object.hasOwn(choicesFor(question), value) ? choicesFor(question)[value] : undefined;
      return `${question.number}. ${choice ? `${value}. ${choice}` : value?.trim() || '—'}`;
    });
      download(`bai-lam-de-${exam.id}.txt`, [`Đề ${exam.id}`, `Họ tên: ${state.name || '—'}`, `Đã chọn: ${answered}/45`, ...(data.complete ? [`Điểm: ${score.points}/100`] : []), '', ...rows].join('\n'), 'text/plain;charset=utf-8');
    }));
  if (!data.complete) {
    controls.append(button('Xác nhận hoàn thành', () => {
      if (!window.confirm(`Hoàn thành đề ${exam.id} với ${45 - answered} câu chưa chọn phương án? Sau khi xác nhận, bài làm sẽ được khóa.`)) return;
      timerBase = elapsed();
      timerStarted = null;
      data.complete = true;
      navigate('summary');
    }, {class: 'primary'}));
  } else {
    controls.append(button('Làm lại đề', () => {
      if (!window.confirm('Bắt đầu lại và xóa bài làm đã lưu của đề này? Bạn có thể tải bài cũ trước.')) return;
      delete state.exams[exam.id];
      openExam(exam);
    }));
  }
  main.append(controls);
  if (data.complete) showGrammar(main);
  const list = el('ol', undefined, {class: 'summary-list'});
  for (const question of exam.questions) {
    const {number} = question;
    const row = el('li');
    const key = data.complete ? keys[number] : '';
    const value = data.answers[number];
    const options = choicesFor(question);
    const chosen = Object.hasOwn(options, value) ? options[value] : undefined;
    row.append(button(`Câu ${number}`, () => chooseQuestion(number)),
      el('span', chosen ? `${value}. ${chosen}` : value?.trim() || 'Chưa chọn', {lang: value?.trim() ? 'ru' : 'vi'}));
    if (key) {
      const result = value === key ? 'Đúng' : 'Đáp án';
      row.append(el('span', `${result} · ${key}. ${options[key]}`, {class: 'muted'}));
      if (exam.id === 1 && number === 39) {
        row.append(el('span', 'Khóa đáp án suy luận từ chi tiết Oleg là cầu thủ bóng đá.', {class: 'muted'}));
      }
    }
    if (data.marked.includes(number)) row.append(el('span', '★', {'aria-label': 'Đã đánh dấu'}));
    list.append(row);
  }
  main.append(list);
}

function settings(main) {
  main.append(el('h1', 'Cài đặt'));
  const card = el('section', undefined, {class: 'card settings'});
  const name = el('input', undefined, {id: 'student', maxlength: '120', autocomplete: 'name'});
  name.value = state.name;
  name.addEventListener('input', () => { state.name = name.value; save(); });
  card.append(el('label', 'Tên học sinh', {for: 'student'}), name);
  for (const [field, title, options] of [
    ['theme', 'Giao diện', {light: 'Sáng', dark: 'Tối'}],
    ['size', 'Cỡ chữ', {normal: 'Mặc định', large: 'Lớn'}],
  ]) {
    const select = el('select', undefined, {id: field});
    for (const [value, label] of Object.entries(options)) select.append(el('option', label, {value}));
    select.value = state[field];
    select.addEventListener('change', () => {
      state[field] = select.value;
      document.documentElement.dataset[field] = select.value;
      save();
    });
    card.append(el('label', title, {for: field}), select);
  }
  const feedback = el('p', '', {role: 'status'});
  function fileInput(id, title, apply) {
    const input = el('input', undefined, {id, type: 'file', accept: '.json,application/json'});
    input.addEventListener('change', async () => {
      const file = input.files[0];
      if (!file) return;
      try { apply(JSON.parse(await file.text())); }
      catch { feedback.textContent = 'Tệp JSON không đúng định dạng.'; }
      finally { input.value = ''; }
    });
    card.append(el('label', title, {for: id}), input);
  }

  card.append(el('h2', 'Sao lưu bài làm'), button('Xuất dữ liệu .json', () => {
    save();
    download('tien-do-tieng-nga.json', JSON.stringify(state, null, 2), 'application/json');
  }));
  fileInput('backup', 'Nhập bản sao lưu JSON', input => {
    const updated = normalizeState(input);
    if (!window.confirm('Thay bài làm và cài đặt hiện tại bằng bản sao lưu này?')) return;
    exam = null;
    timerStarted = null;
    state = updated;
    save();
    render(true);
    app.querySelector('.settings [role=status]').textContent = 'Đã nhập bản sao lưu.';
  });

  card.append(el('h2', 'Dành cho giáo viên'), el('a', 'Tải mẫu JSON đáp án', {href: './data/answer-key-template.json', download: ''}));
  fileInput('keys', 'Nhập JSON đáp án', input => {
    for (const [id, keys] of Object.entries(normalizeKeys(input))) {
      state.keys[id] = {...state.keys[id], ...keys};
    }
    save();
    feedback.textContent = 'Đã nhập đáp án.';
  });
  card.append(feedback);
  main.append(card);
}

function render(focus = false) {
  timer = null;
  Object.assign(document.documentElement.dataset, {theme: state.theme, size: state.size});
  const header = el('header');
  const nav = el('nav', undefined, {class: 'shell row spread', 'aria-label': 'Điều hướng chính'});
  nav.append(button('Русский', () => navigate('home'), {class: 'brand', lang: 'ru', 'aria-label': 'Trang chủ'}));
  const links = el('div', undefined, {class: 'row'});
  if (exam) links.append(
    button('Làm bài', () => navigate('question')),
    button('Tổng kết', () => navigate('summary')),
  );
  links.append(button('Cài đặt', () => navigate('settings')));
  nav.append(links);
  header.append(nav);
  const main = el('main', undefined, {id: 'main-content', class: 'shell', tabindex: '-1'});
  status = el('p', storageError ? 'Không đọc hoặc lưu được tiến độ trên trình duyệt này.' : '', {role: 'status', class: 'status'});
  main.append(status);
  ({home, question: questionPage, summary, settings})[page](main);
  app.replaceChildren(header, main);
  if (focus) {
    const heading = main.querySelector('h1');
    heading.setAttribute('tabindex', '-1');
    heading.focus({preventScroll: true});
    window.scrollTo(0, 0);
  }
}

async function loadJson(path) {
  const response = await fetch(path);
  if (!response.ok) throw Error(response.status);
  return response.json();
}

try {
  const [bank, converted, keys] = await Promise.all([
    loadJson('./data/exams.json'),
    loadJson('./data/converted-questions.json'),
    loadJson('./data/answer-key.json'),
  ]);
  publishedKeys = normalizeKeys(keys);
  if (bank.length !== 20) throw Error('Incomplete exam bank');
  for (const item of bank) {
    if (item.questions.length !== 45) throw Error('Incomplete exam');
    for (const question of item.questions) {
      if (question.number > 25) question.choices = converted[item.id]?.[question.number];
      const options = question.choices ?? (question.number >= 21 && question.number <= 25 ? item.matching : {});
      if (!Object.hasOwn(options, publishedKeys[item.id]?.[question.number])) throw Error('Incomplete answer key');
    }
  }
  exams = bank;
  render();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('./service-worker.js').catch(error => console.warn('Offline:', error));
  setInterval(updateTimer, 1000);
  setInterval(() => { if (timerStarted !== null) save(); }, 15000);
  window.addEventListener('pagehide', save);
  document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });
} catch {
  const main = el('main', undefined, {id: 'main-content', class: 'shell'});
  main.append(el('h1', 'Không tải được bộ đề'), el('p', 'Kiểm tra kết nối rồi thử tải lại.'), button('Tải lại', () => location.reload()));
  app.replaceChildren(main);
}
