# Русский — Website luyện 20 đề Tiếng Nga cơ bản

Website tĩnh chạy trực tiếp trên **GitHub Pages**, thiết kế mobile-first, không cần database, backend, đăng nhập hay công cụ build. Toàn bộ 20 đề được trích xuất từ tệp Word được cung cấp (**20 × 45 = 900 câu**). Mỗi đề gồm 5 phần: chọn đáp án, nối câu, chọn câu hỏi cho phần gạch chân, đọc hiểu và chọn câu từ các từ cho trước.

## Đưa website lên GitHub Pages

1. Giải nén ZIP này trên máy tính.
2. Trên GitHub, tạo một repository mới, ví dụ `luyen-tieng-nga` (chọn **Public** nếu học sinh cần truy cập dễ dàng).
3. Tải **toàn bộ tệp và thư mục ở bên trong** thư mục `russian-exam-20` lên **thư mục gốc của repository**. Phải thấy `index.html`, `assets/` và `data/` tại gốc, không nằm trong một thư mục lồng thêm.
4. Mở repository → **Settings** → **Pages** → **Build and deployment** → **Deploy from a branch** → chọn `main`, thư mục `/ (root)` → **Save**.
5. Truy cập đường dẫn GitHub Pages do GitHub cung cấp. Với repository dự kiến, địa chỉ thường là:

   `https://TEN-TAI-KHOAN.github.io/luyen-tieng-nga/`

6. Gửi đường dẫn cho học sinh. Học sinh mở trên Chrome hoặc Safari và có thể thêm website vào màn hình chính của điện thoại (PWA). Sau khi tải đủ dữ liệu lần đầu, ứng dụng hỗ trợ mở lại khi ngoại tuyến nếu trình duyệt giữ bộ nhớ đệm.

Không tải riêng ZIP lên repository mà không giải nén. Không cần npm, Node, thiết lập token hay API key.

## Sử dụng

- Chọn đề → chọn phần I–V → làm từng câu; chuyển bằng nút **Trước / Câu tiếp**, thanh phần học hoặc bảng số câu.
- Cả 45 câu đều chọn phương án. Sau mỗi lần chọn, trang tự chuyển sang câu kế tiếp. Cuối mỗi phần, hộp thoại hiện yêu cầu của phần tiếp theo và nút bắt đầu. Chọn ở câu 45 sẽ mở Tổng kết để bạn kiểm tra và nộp bài. Câu 26–35 giữ phần gạch chân của Word.
- Có đồng hồ tự bấm giờ (không phải thời gian thi quy định), đánh dấu xem lại, chỉnh cỡ chữ, sáng/tối.
- Bài làm được **lưu tại trình duyệt trên thiết bị** qua `localStorage`. Không tự động đồng bộ giữa các điện thoại hoặc khi học sinh dùng trình duyệt riêng tư/xóa dữ liệu.
- Sau khi nộp bài, **Tổng kết** hiển thị điểm trên thang 100 và mục **Ôn ngữ pháp theo đề** với quy tắc, ví dụ và liên kết đến các câu liên quan.
- **Tổng kết** → **Tải bài làm .txt** để gửi giáo viên. **Cài đặt** → **Xuất dữ liệu .json** để sao lưu cả 20 đề hoặc chuyển máy; có thể nhập lại JSON đó.
- Cài đặt → **Tên học sinh** để ghi tên trên file `.txt`.

## Về đáp án và chấm điểm

Trang dùng bộ đáp án Word cho 20 đề. Thang điểm 100 theo tệp đáp án, gồm 2 điểm cho mỗi câu phần I, II, III và V, cùng 4 điểm cho mỗi câu phần IV. Câu sai hoặc chưa chọn được 0 điểm. Tiến độ `x/45` là số câu đã chọn phương án.

Sau khi xác nhận nộp bài, trang hiện điểm và mục ôn ngữ pháp. Mục xem lại hiển thị đủ câu hỏi, các phương án, lời giải thích hoặc gợi ý đối chiếu. Câu đúng có màu xanh, câu sai có màu đỏ và câu chưa chọn có nhãn riêng. Có thể tải bài đã nộp hoặc làm lại đề. Bài tự luận cũ đã lưu vẫn xem và tải được. Các câu đó cần chọn phương án khi làm lại để được chấm tự động.

Giáo viên có thể nhập khóa JSON sửa đổi cục bộ trong **Cài đặt** từ mẫu `data/answer-key-template.json`. Câu 21–25 dùng **а, б, в, г, д**. Các câu khác dùng **А, Б, В, Г**. File khóa trên GitHub Pages có thể đọc công khai. Trang dùng để luyện tập.

## Cấu trúc

```text
index.html                     Trang khởi chạy
assets/styles.css              Giao diện responsive
assets/app.js                  Logic làm bài, lưu, xuất/nhập, tổng kết
assets/grammar.js              Quy tắc ngữ pháp và câu liên quan theo đề
assets/icon.svg                Biểu tượng
manifest.webmanifest           Cài lên màn hình chính (PWA)
service-worker.js              Lưu bộ đệm offline sau lần tải thành công
.nojekyll                      Bỏ qua xử lý Jekyll trên GitHub Pages
data/exams.json                Đủ 20 đề × 45 câu, trích từ Word
data/answer-key.json           Khóa chấm cho toàn bộ 900 câu
data/converted-questions.json  Phương án cho câu 26–45 của từng đề
data/answer-key-template.json  Mẫu cho giáo viên (để trống)
tools/extract_exams.py         Script trích xuất câu hỏi từ DOCX
tools/convert_answers.py      Script tạo phương án và khóa chấm từ DOCX đáp án
extraction-audit.txt           Kết quả đối chiếu số lượng nội dung
```

## Kiểm tra cục bộ

Tại thư mục chứa `index.html`:

```bash
python3 -m http.server 8000
```

Sau đó mở `http://localhost:8000`. Tránh nhấn đúp `index.html` trực tiếp theo đường dẫn `file://` vì trình duyệt có thể chặn việc tải JSON.

## Chất lượng dữ liệu

- Mỗi đề có **20 câu trắc nghiệm**, **5 câu nối**, **10 câu đặt câu hỏi**, **5 câu đọc hiểu**, **5 câu hoàn thành**.
- Các đoạn văn đọc hiểu, phương án gốc và định dạng gạch chân ở phần III được trích xuất từ Word. Các phương án nhiễu câu 26–45 được tạo thêm từ bộ đáp án và từ các dạng từ trong câu gốc.
- **Nguyên văn nguồn được giữ lại**, kể cả một số lỗi chính tả hoặc câu có thể chưa thống nhất. Phương án đúng được lấy từ bộ đáp án Word.
- Không thu thập tài khoản hoặc bài làm lên server. Không dùng thư viện JavaScript, font hay dịch vụ CDN bên ngoài.

### Cập nhật nguồn DOCX

Có thể trích xuất lại bằng:

```bash
python3 tools/extract_exams.py "de-goc.docx"
python3 tools/convert_answers.py "dap-an.docx"
```

Script sẽ sinh lại `data/exams.json`, báo lỗi nếu thiếu câu hoặc có bất thường ở lựa chọn А/Б/В/Г. Cần chạy thử giao diện sau khi thay nguồn.

---

Dành cho giáo viên: có thể yêu cầu học sinh xuất bản `.txt` để nhận bài qua email, nhóm học tập hoặc công cụ do lớp sử dụng. Website không tự nhận bài từ xa.
