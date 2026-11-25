# ✦ Gemini Office AI — Trợ lý AI cho Microsoft Word & Excel

Dự án **Gemini Office Add-in** tích hợp mô hình ngôn ngữ lớn **Google Gemini (Gemini 1.5 Flash / 2.0 Flash / 1.5 Pro)** trực tiếp vào Microsoft Word và Microsoft Excel thông qua chuẩn **Office Web Add-in**.

---

## 🚀 Các Tính Năng Nổi Bật

### 1. Trên Microsoft Word:
- 🔴 **Soát lỗi & Bôi màu trực tiếp:** Rà soát lỗi chính tả, câu từ lủng củng và tự động tô màu đỏ/vàng trên tài liệu Word.
- ⚡ **Sửa lỗi 1-chạm (One-click Fix):** Bấm nút `[Sửa trên Word]` trên thẻ nhiệm vụ để tự động thay thế từ sai bằng từ đúng mà không làm mất định dạng xung quanh.
- ✍️ **Viết lại chuẩn văn phong hành chính:** Nâng cấp câu văn trang trọng, mạch lạc và súc tích; hỗ trợ nút `[Thay thế vào Word]`.
- 💡 **Tóm tắt văn bản cho lãnh đạo:** Trích xuất 5 ý cốt lõi (Trích yếu, Đơn vị chủ trì, Nội dung chính, Kiến nghị, Thời hạn).
- 📐 **Căn lề trang in chuẩn Nghị định 30/2020/NĐ-CP:** Tự động thiết lập lề chuẩn (Trên/Dưới 20mm, Trái 30mm, Phải 15mm) và font Times New Roman 13pt chỉ với 1 cú click.

### 2. Trên Microsoft Excel:
- ƒx **Trợ lý Công thức AI:** Diễn giải yêu cầu bằng ngôn ngữ tự nhiên thành công thức Excel chuẩn và chèn thẳng vào ô đang chọn (Active Cell).
- 🔢 **Chèn công thức đánh STT tự động khi lọc (`SUBTOTAL`):** Tự động điền công thức `=IF(..., "", SUBTOTAL(3, ...))` để khi lọc dữ liệu STT không bị nhảy.
- 🔎 **Quét ô lỗi công thức:** Tự động rà soát toàn bộ Sheet để phát hiện các ô lỗi `#REF!`, `#DIV/0!`, `#VALUE!`, `#N/A`.
- 📊 **Viết báo cáo từ bảng số liệu:** Đọc bảng tính và tổng hợp thành đoạn văn xuôi báo cáo hành chính để dán sang Word.

---

## 📁 Cấu Trúc Thư Mục

```text
gemini-office-addin/
├── manifest.xml            # Tệp khai báo Add-in cho Microsoft Office
├── package.json            # Cấu hình dự án Node.js
├── dev-server.mjs          # Máy chủ HTTPS cục bộ phục vụ Add-in
├── start-server.bat        # File chạy nhanh máy chủ (Click đúp chuột)
├── assets/                 # Bộ biểu tượng (Icon 16x16, 32x32, 64x64, 80x80)
├── certs/                  # Chứng chỉ SSL PFX phục vụ HTTPS localhost:3000
└── src/
    ├── taskpane.html       # Giao diện khung làm việc bên phải
    ├── taskpane.css        # Giao diện hiện đại, responsive
    ├── taskpane.js         # Logic điều khiển chính
    ├── gemini-api.js       # Module kết nối Google Gemini REST API
    └── office-bridge.js    # Module giao tiếp 2 chiều với Word & Excel qua Office.js
```

---

## 🛠️ Hướng Dẫn Khởi Động & Cài Đặt (Sideload)

### Bước 1: Khởi động máy chủ Add-in
Chỉ cần nhấp đúp vào tệp:
👉 **`start-server.bat`** (hoặc mở terminal chạy `node dev-server.mjs`).

Máy chủ HTTPS sẽ chạy tại địa chỉ: `https://localhost:3000`.

---

### Bước 2: Nạp Add-in vào Word / Excel trên máy tính (Side-load)

Đây là cách chuẩn của Microsoft để nạp Add-in đang phát triển vào Word & Excel trên Windows:

1. **Tạo thư mục chia sẻ (Shared Folder) trên máy:**
   - Tạo một thư mục bất kỳ (ví dụ: `C:\OfficeManifests`).
   - Sao chép tệp `D:\projects\gemini-office-addin\manifest.xml` vào thư mục này.
   - Chuột phải vào thư mục `OfficeManifests` ➔ Chọn **Properties** ➔ Thẻ **Sharing** ➔ Bấm **Share...** ➔ Chọn chính tài khoản của bạn (Read) ➔ Bấm **Share**.
   - Sao chép đường dẫn mạng (Network Path), ví dụ: `\\TÊN-MÁY-TÍNH\OfficeManifests`.

2. **Khai báo trong Word hoặc Excel:**
   - Mở Word hoặc Excel ➔ Chọn **File** ➔ **Options** ➔ **Trust Center** ➔ Bấm nút **Trust Center Settings...**
   - Chọn mục **Trusted Add-in Catalogs** ở cột bên trái.
   - Tại ô **Catalog Url**, dán đường dẫn mạng vừa sao chép ở trên (ví dụ: `\\TÊN-MÁY-TÍNH\OfficeManifests`).
   - Bấm **Add catalog** ➔ Tích chọn ô **Show in Menu** ➔ Bấm **OK**.
   - Khởi động lại Word hoặc Excel.

3. **Mở Add-in:**
   - Mở một tài liệu Word hoặc Excel bất kỳ.
   - Vào thẻ **Insert** ➔ Bấm **My Add-ins** (hoặc **Get Add-ins** ➔ **Shared Folder**).
   - Bạn sẽ thấy **"Trợ lý AI Gemini (Word & Excel)"** xuất hiện. Bấm **Add**.
   - Nút **"Mở Trợ lý Gemini"** sẽ xuất hiện vĩnh viễn trên thẻ **Home**!

*(Nếu dùng Word / Excel trên Web - Office Online: Vào Insert ➔ Add-ins ➔ Upload My Add-in ➔ Chọn file `manifest.xml` là xong ngay lập tức).*

---

### Bước 3: Cấu hình Gemini API Key
1. Bấm nút biểu tượng bánh răng ⚙️ ở góc trên thanh công cụ của Taskpane.
2. Dán mã **Google Gemini API Key** của bạn (lấy miễn phí tại: [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)).
3. Chọn model: `gemini-1.5-flash` hoặc `gemini-2.0-flash`.
4. Bấm **Lưu cấu hình**. Key sẽ được lưu an toàn trên máy bạn.
