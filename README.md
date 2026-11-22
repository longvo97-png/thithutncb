# Русский — Website luyện 20 đề Tiếng Nga cơ bản

Website tĩnh chạy trực tiếp trên **GitHub Pages**, thiết kế mobile-first, không cần database, backend, đăng nhập hay công cụ build. Toàn bộ 20 đề được trích xuất từ tệp Word được cung cấp (**20 × 45 = 900 câu**). Mỗi đề gồm 5 phần: chọn đáp án, nối câu, đặt câu hỏi cho phần gạch chân, đọc hiểu và viết câu từ các từ cho trước.

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
- Trắc nghiệm dùng nút chạm lớn, nối câu dùng danh sách lựa chọn, tự luận dùng ô nhập tiếng Nga. Phần gạch chân ở câu 26–35 giữ đúng đánh dấu của Word.
- Có đồng hồ tự bấm giờ (không phải thời gian thi quy định), đánh dấu xem lại, chỉnh cỡ chữ, sáng/tối.
- Bài làm được **lưu tại trình duyệt trên thiết bị** qua `localStorage`. Không tự động đồng bộ giữa các điện thoại hoặc khi học sinh dùng trình duyệt riêng tư/xóa dữ liệu.
- **Tổng kết** → **Tải bài làm .txt** để gửi giáo viên. **Cài đặt** → **Xuất dữ liệu .json** để sao lưu cả 20 đề hoặc chuyển máy; có thể nhập lại JSON đó.
- Cài đặt → **Tên học sinh** để ghi tên trên file `.txt`.

## Về đáp án và chấm điểm

**Tệp Word nguồn không có bảng đáp án.** Website cố ý **không suy đoán đáp án hoặc công bố điểm số giả**. Tiến độ `x/45` là **số câu đã trả lời**, không phải số câu đúng. Bài đã xác nhận hoàn thành được khóa để xem lại và xuất kết quả.

Để kích hoạt đối chiếu câu 1–25 sau khi giáo viên đã kiểm tra đáp án:

1. Tải `data/answer-key-template.json` hoặc dùng trực tiếp file mẫu trong ZIP.
2. Điền đáp án theo đề và số câu: `1`–`20` nhận ký tự **А, Б, В, Г** (chữ Kirin, không phải A/B Latin); `21`–`25` nhận **а, б, в, г, д**. Có thể nhập đáp án tham khảo cho câu 26–45, nhưng ứng dụng không tự chấm tự luận.
3. Đổi tên file thành `answer-key.json`, đặt trong `data/` rồi đẩy lên GitHub cùng website **hoặc** giữ riêng và dùng **Cài đặt → Dành cho giáo viên → Nhập JSON đáp án** trên thiết bị có nhu cầu đối chiếu.
4. Sau khi học sinh bấm **Xác nhận hoàn thành** tại trang Tổng kết, các câu có đáp án mới được so sánh. Website chỉ hiện **số câu đúng / số câu có khóa đáp án** cho câu 1–25; không tính thành điểm toàn bài vì các phần tự luận cần giáo viên chấm.

**Cảnh báo**: `data/answer-key.json` trong repository Public là công khai. Cơ chế chỉ mở đáp án sau khi hoàn thành là quy ước giao diện, **không bảo mật đáp án**. Website chỉ phục vụ luyện tập, không dành cho kỳ thi giám sát hoặc chống gian lận.

## Cấu trúc

```text
index.html                     Trang khởi chạy
assets/styles.css              Giao diện responsive
assets/app.js                  Logic làm bài, lưu, xuất/nhập, tổng kết
assets/icon.svg                Biểu tượng
manifest.webmanifest           Cài lên màn hình chính (PWA)
service-worker.js              Lưu bộ đệm offline sau lần tải thành công
.nojekyll                      Bỏ qua xử lý Jekyll trên GitHub Pages
data/exams.json                Đủ 20 đề × 45 câu, trích từ Word
data/answer-key.json          Tùy chọn, không có sẵn vì Word thiếu đáp án
data/answer-key-template.json  Mẫu cho giáo viên (để trống)
tools/extract_exams.py         Script trích xuất lại từ DOCX (thư viện chuẩn Python)
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
- Các đoạn văn đọc hiểu, phương án chữ Nga và định dạng gạch chân ở phần III đã được trích xuất từ Word.
- **Nguyên văn nguồn được giữ lại**, kể cả một số lỗi chính tả hoặc câu có thể chưa thống nhất. Không ngầm thay đổi nội dung câu hỏi hoặc tạo đáp án.
- Không thu thập tài khoản hoặc bài làm lên server. Không dùng thư viện JavaScript, font hay dịch vụ CDN bên ngoài.

### Cập nhật nguồn DOCX

Có thể trích xuất lại bằng:

```bash
python3 tools/extract_exams.py "duong-dan-den-file.docx"
```

Script sẽ sinh lại `data/exams.json`, báo lỗi nếu thiếu câu hoặc có bất thường ở lựa chọn А/Б/В/Г. Cần chạy thử giao diện sau khi thay nguồn.

---

Dành cho giáo viên: có thể yêu cầu học sinh xuất bản `.txt` để nhận bài qua email, nhóm học tập hoặc công cụ do lớp sử dụng. Website không tự nhận bài từ xa.
