# Trang quản lý kết quả

Khi được bật, website gửi họ tên, mã đề, đáp án đã chọn và thời lượng đến Worker. Worker chấm lại theo khóa có sẵn, lưu họ tên và kết quả vào D1, rồi trả biên nhận. Trang `/admin` hiển thị kết quả mới nhất trước. Dữ liệu được giữ trong D1 của tài khoản triển khai.

## Bật nhận kết quả trên GitHub Pages

1. Đăng nhập Cloudflare bằng Wrangler và tạo cơ sở dữ liệu D1. Chạy các lệnh dưới đây trong thư mục `results/`.

   ```bash
   npx wrangler login
   npx wrangler d1 create thithutncb-results
   ```

2. Điền ID cơ sở dữ liệu mới vào `database_id` trong `wrangler.toml`. Giữ nguyên `SITE_ORIGIN` khi website dùng địa chỉ GitHub Pages hiện tại. Nếu chuyển sang tên miền riêng, điền origin HTTPS của tên miền, gồm giao thức và tên miền.

   ```bash
   npx wrangler d1 execute thithutncb-results --remote --file schema.sql
   npx wrangler deploy
   npx wrangler secret put ADMIN_PASSWORD
   ```

   Nhập mật khẩu ở lời nhắc của Wrangler hoặc đặt Worker secret `ADMIN_PASSWORD` trong bảng điều khiển Cloudflare. Giữ giá trị ngoài tệp cấu hình và mã nguồn.

3. Mở URL HTTPS của Worker với đường dẫn `/admin`, rồi đăng nhập bằng tài khoản `admin` và mật khẩu đã đặt.
4. Đặt trường `endpoint` trong `results-config.json` ở gốc repo thành URL HTTPS của Worker với đường dẫn `/api/results`. Cập nhật nhánh triển khai GitHub Pages. Thử nộp một bài và xác nhận trang báo đã nhận, rồi xem dòng tương ứng trong `/admin`.

Nếu đường truyền gián đoạn, bài đã hoàn thành vẫn có điểm trên thiết bị. Trang giữ kết quả chờ gửi, tự thử lại khi mở lại website hoặc khi có mạng và có nút gửi lại trên Tổng kết. Mỗi mã lượt làm chỉ tạo một bản ghi. Các kết quả làm trước khi bật địa chỉ nhận vẫn nằm trên thiết bị.

Trang dùng để luyện tập. Học viên tự khai họ tên và khóa chấm của bài luyện được công bố trên website, nên kết quả không xác minh danh tính học viên.
