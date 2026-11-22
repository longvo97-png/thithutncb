import answerKey from '../data/answer-key.json' with {type: 'json'};

function json(body, status = 200, headers = {}) {
  return Response.json(body, {status, headers: {'Cache-Control': 'no-store', ...headers}});
}

const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]));

async function authorized(request, password) {
  const header = request.headers.get('Authorization') ?? '';
  if (!password || !header.startsWith('Basic ') || header.length > 2048) return false;
  try {
    const submitted = atob(header.slice(6));
    const encoder = new TextEncoder();
    const [actual, expected] = await Promise.all([submitted, `admin:${password}`].map(value =>
      crypto.subtle.digest('SHA-256', encoder.encode(value))));
    const actualBytes = new Uint8Array(actual);
    const expectedBytes = new Uint8Array(expected);
    let differs = 0;
    for (let i = 0; i < actualBytes.length; i++) differs |= actualBytes[i] ^ expectedBytes[i];
    return differs === 0;
  } catch {
    return false;
  }
}

async function admin(request, env, url) {
  if (!env.ADMIN_PASSWORD) return new Response('Chưa cấu hình mật khẩu quản trị.', {status: 503});
  const headers = {
    'Cache-Control': 'no-store',
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'",
    'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff',
  };
  if (!await authorized(request, env.ADMIN_PASSWORD)) {
    return new Response('Yêu cầu đăng nhập quản trị.', {
      status: 401,
      headers: {...headers, 'WWW-Authenticate': 'Basic realm="Ket qua tieng Nga", charset="UTF-8"'},
    });
  }
  const page = Math.max(1, Math.min(100000, Number.parseInt(url.searchParams.get('page'), 10) || 1));
  const {results} = await env.RESULTS.prepare(
    'SELECT student_name, exam_id, score, correct, answered, elapsed_ms, received_at FROM submissions ORDER BY received_at DESC, id DESC LIMIT 101 OFFSET ?'
  ).bind((page - 1) * 100).all();
  const rows = results.slice(0, 100).map(row => `<tr><td>${escapeHtml(row.student_name)}</td><td>${row.exam_id}</td>
    <td>${row.score}/100</td><td>${row.correct}/45</td><td>${row.answered}/45</td>
    <td>${Math.floor(row.elapsed_ms / 60000)} phút ${Math.floor(row.elapsed_ms / 1000) % 60} giây</td>
    <td>${escapeHtml(new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh',
  }).format(new Date(row.received_at)))}</td></tr>`).join('');
  return new Response(`<!doctype html><html lang="vi"><meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1"><title>Admin · Kết quả luyện thi</title>
    <style>
      :root{color-scheme:light dark;font:100%/1.5 system-ui,sans-serif}body{max-width:72rem;margin:2rem auto;padding:0 1rem}
      h1{line-height:1.15}.table{overflow:auto}table{border-collapse:collapse;width:100%}
      th,td{padding:.65rem .8rem;border-bottom:1px solid #8887;text-align:left}th{white-space:nowrap}
      nav{display:flex;gap:1rem;margin-top:1rem}
    </style>
    <main><h1>Admin · Kết quả luyện thi</h1><div class="table"><table>
    <thead><tr><th>Họ và tên</th><th>Đề</th><th>Điểm</th><th>Đúng</th><th>Đã chọn</th><th>Thời lượng</th><th>Giờ nhận (Việt Nam)</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="7">Chưa có kết quả.</td></tr>'}</tbody></table></div>
    <nav>${page > 1 ? `<a href="?page=${page - 1}">Trang trước</a>` : ''}
    ${results.length > 100 ? `<a href="?page=${page + 1}">Trang sau</a>` : ''}</nav>
    </main></html>`, {headers});
}

async function submit(request, env) {
  const origin = request.headers.get('Origin');
  if (origin !== env.SITE_ORIGIN) return json({error: 'origin'}, 403);
  const cors = {'Access-Control-Allow-Origin': origin, Vary: 'Origin'};
  if (request.method === 'OPTIONS') {
    return new Response(null, {status: 204, headers: {
      ...cors, 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type',
    }});
  }
  if (request.method !== 'POST') return json({error: 'method'}, 405, cors);
  let data;
  try {
    const reader = request.body.getReader();
    const decoder = new TextDecoder();
    let input = '';
    let bytes = 0;
    for (;;) {
      const {done, value} = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 8192) {
        await reader.cancel();
        return json({error: 'size'}, 413, cors);
      }
      input += decoder.decode(value, {stream: true});
    }
    data = JSON.parse(input + decoder.decode());
  } catch {
    return json({error: 'json'}, 400, cors);
  }
  const {attemptId, examId, studentName, answers, elapsedMs} = data ?? {};
  const name = typeof studentName === 'string' ? studentName.trim() : '';
  if (typeof attemptId !== 'string' || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/u.test(attemptId)
      || !Number.isInteger(examId) || !Object.hasOwn(answerKey, examId)
      || !name || name.length > 120 || /[\u0000-\u001f\u007f]/u.test(name)
      || !Number.isInteger(elapsedMs) || elapsedMs < 0 || elapsedMs > 2147483647
      || !answers || typeof answers !== 'object' || Array.isArray(answers)) {
    return json({error: 'fields'}, 400, cors);
  }
  const key = answerKey[examId];
  let correct = 0;
  let score = 0;
  let answered = 0;
  for (const [n, value] of Object.entries(answers)) {
    if (!Object.hasOwn(key, n) || typeof value !== 'string'
        || !(Number(n) >= 21 && Number(n) <= 25 ? /^[абвгд]$/u : /^[АБВГ]$/u).test(value)) {
      return json({error: 'answers'}, 400, cors);
    }
    answered++;
    if (value === key[n]) {
      correct++;
      score += Number(n) >= 36 && Number(n) <= 40 ? 4 : 2;
    }
  }
  await env.RESULTS.prepare(`INSERT INTO submissions
    (id, student_name, exam_id, score, correct, answered, elapsed_ms, received_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO NOTHING`)
    .bind(attemptId, name, examId, score, correct, answered, elapsedMs, new Date().toISOString()).run();
  return json({received: true, attemptId}, 200, cors);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/results') return submit(request, env);
    if (url.pathname === '/admin' && request.method === 'GET') return admin(request, env, url);
    return new Response('Không tìm thấy trang.', {status: 404});
  },
};
