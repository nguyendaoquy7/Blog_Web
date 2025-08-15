# MyBlog (HTML • CSS • JS)

Website blog tĩnh, hiện đại, hỗ trợ tìm kiếm, lọc theo thẻ, trang chi tiết và bình luận cục bộ (localStorage).

## Chạy nhanh

- Mở file `blog/index.html` trực tiếp trên trình duyệt hoặc chạy server tĩnh:

```bash
cd blog
python3 -m http.server 8000
# Truy cập: http://localhost:8000
```

## Cấu trúc

```
blog/
├── index.html      # Trang chủ: danh sách bài viết, tìm kiếm, lọc thẻ
├── post.html       # Trang chi tiết: hiển thị nội dung, bình luận, bài viết mới
├── about.html      # Giới thiệu
├── styles.css      # Giao diện, dark/light mode
├── main.js         # Logic render, tìm kiếm, bình luận (localStorage)
└── posts.json      # Dữ liệu bài viết (mẫu)
```

Bạn có thể thay `posts.json` bằng dữ liệu thật (tự tạo thêm bài viết, thẻ, hình ảnh).
