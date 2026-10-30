# anscinwine

Trang cá nhân tương tác (interactive bio profile) của **anscinwine** với hình nền động sắc nét, trình phát nhạc vinyl, trình xem ảnh dạng cuộn marquee mượt mà, và hỗ trợ đa ngôn ngữ EN / VI.

## Tính năng chính
- **Hình nền động toàn màn hình**: Chạy mượt mà, tự động phát (`autoPlay`, `loop`, `muted`).
- **Trình phát nhạc**: Tích hợp bài hát *Atlantis - Seafret* với đĩa than xoay tròn.
- **Thư viện ảnh lướt Marquee**: Di chuột vào từng ảnh để dừng và bấm để xem phóng to (Lightbox).
- **Hỗ trợ đa ngôn ngữ**: Chuyển đổi mượt mà giữa Tiếng Việt và Tiếng Anh.
- **Tối ưu GitHub Pages**: Cấu hình đường dẫn tương đối (`base: './'`), sẵn sàng deploy 1-click qua GitHub Actions.

## Hướng dẫn cài đặt & chạy trên máy tính

1. **Cài đặt thư viện**:
   ```bash
   npm install
   ```

2. **Chạy ở chế độ phát triển (Dev server)**:
   ```bash
   npm run dev
   ```
   Mở trình duyệt tại: `http://localhost:3000`

3. **Đóng gói sản phẩm (Build for production)**:
   ```bash
   npm run build
   ```
   Kết quả xuất ra tại thư mục `dist/`.

## Hướng dẫn đưa lên GitHub & GitHub Pages

1. **Khởi tạo và đẩy lên GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit for anscinwine profile"
   git branch -M main
   git remote add origin https://github.com/<tai-khoan-cua-ban>/<ten-repo>.git
   git push -u origin main
   ```

2. **Bật GitHub Pages tự động**:
   - Truy cập trang Repository của bạn trên GitHub.
   - Chọn mục **Settings** -> **Pages**.
   - Tại phần **Build and deployment** -> **Source**, chọn **GitHub Actions**.
   - File workflow `.github/workflows/deploy.yml` đã được cài sẵn sẽ tự động build và xuất bản trang web của bạn mà không gặp lỗi đường dẫn 404.
