# ✦ MinhDuong84vn Office AI — Trợ lý AI & Bộ Tiện Ích Văn Phòng Toàn Diện Cho Word & Excel

[![Deploy to Cloudflare Pages](https://img.shields.io/badge/Deploy-Cloudflare%20Pages-orange?logo=cloudflare)](https://minhduong84vn-office.pages.dev)
[![Platform](https://img.shields.io/badge/Platform-Microsoft%20Office%20(Word%20%7C%20Excel)-blue?logo=microsoftoffice)](https://minhduong84vn-office.pages.dev)
[![AI Engine](https://img.shields.io/badge/AI-Google%20Gemini%20%7C%20DeepSeek-purple?logo=google)](https://minhduong84vn-office.pages.dev)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

Dự án **MinhDuong84vn Office AI** là bộ tiện ích văn phòng kết hợp giữa **Trí tuệ nhân tạo thế hệ mới (Google Gemini & DeepSeek)** và **Bộ công cụ xử lý văn phòng thực chiến Việt Nam** (được tối ưu và nâng cấp toàn diện từ di sản *Tiện ích văn phòng v3.4 / VnTools* sang chuẩn **Microsoft Office Web Add-in** hiện đại).

Add-in hoạt động trực tiếp trong thanh tác vụ (Taskpane) của **Microsoft Word** và **Microsoft Excel**, chạy trên nền tảng đám mây **Cloudflare Pages** tốc độ cao, hỗ trợ làm việc cả online lẫn offline.

---

## 🌐 Địa Chỉ Triển Khai Hệ Thống (Production)
* **Web Add-in URL:** `https://minhduong84vn-office.pages.dev/src/taskpane.html`
* **Trang chủ dịch vụ:** `https://minhduong84vn-office.pages.dev`

---

## 🚀 Các Nhóm Tính Năng Nổi Bật

### 🏢 PHÂN HỆ 1: BỘ TIỆN ÍCH VĂN PHÒNG VIỆT NAM (100% OFFLINE)
*(Các tính năng này chạy hoàn toàn cục bộ trên máy, **không cần API Key AI**, bảo mật tuyệt đối và tốc độ tức thì).*

#### 1. Dùng chung cho cả Word & Excel:
* **🔤 Chuyển đổi mã Font chữ toàn diện (Khắc phục triệt để lỗi Font cũ):**
  * Tự động nhận diện hoặc ép chuyển đổi từ bảng mã **TCVN3 / ABC (.VnTime, .VnArial,...)** và **VNI-Windows (VNI-Times,...)** sang chuẩn **Unicode dựng sẵn (Times New Roman)**.
  * Khắc phục hoàn toàn lỗi trùng lặp mã ký tự `Case 181` trong các bản macro VBA cũ.
* **🔠 Đổi kiểu chữ (Change Case):**
  * Đổi tức thì vùng chọn sang: **CHỮ HOA TOÀN BỘ**, **chữ thường**, **Viết Hoa Đầu Từ**, **Viết hoa đầu câu**.
  * Hỗ trợ chuẩn xác 100% toàn bộ ký tự tiếng Việt có dấu (`Đ`, `ă`, `â`, `ê`, `ô`, `ơ`, `ư`,...).
* **📐 Bảng ký hiệu đơn vị đo lường & chỉ số trên/dưới:**
  * Bấm chọn nhanh các ký hiệu chuyên ngành để chèn vào văn bản: `m²`, `m³`, `cm²`, `cm³`, `mm²`, `km²`, `°C`, `±`, `≠`, `≤`, `≥`, `≈`, `Ø`, `‰`.

#### 2. Tiện ích thực chiến trên Microsoft Excel:
* **🔤 Sắp xếp danh sách tiếng Việt chuẩn A-Z (Tên trước, Họ sau):**
  * Tự động phân tách Họ đệm và Tên để xếp vần theo Tên trước (`An` trước `Anh`, `Bình`), nếu trùng tên sẽ xét theo Họ đệm (`Lê Văn An` trước `Nguyễn Văn An`). Đúng quy chuẩn danh sách học sinh, nhân sự, bảng lương Việt Nam.
* **🧩 Gộp ô giữ chữ (Safe Merge Cells):**
  * Khắc phục nhược điểm của nút *Merge & Center* mặc định của Excel (vốn xóa sạch dữ liệu các ô phía sau). Add-in cho phép chọn ký tự nối (dấu phẩy `, `, khoảng trắng, gạch nối ` - `, xuống dòng `Alt + Enter`) và ghép toàn bộ nội dung mà không mất dữ liệu.
* **💎 Lọc danh sách duy nhất không trùng (Extract Unique List):**
  * Quét cột dữ liệu, loại bỏ dữ liệu trùng lặp và trích xuất danh sách duy nhất ghi tự động sang cột bên cạnh.
* **👁️ Hiện toàn bộ Sheet (Unhide All Hidden Sheets):**
  * Quét toàn bộ Workbook và bỏ ẩn tất cả các Sheet đang bị ẩn (kể cả các Sheet bị ẩn sâu dạng `xlSheetVeryHidden`) chỉ với 1 cú click.
* **🎨 Tính tổng theo màu nền (Sum by Fill Color):**
  * Phân tích và tính tổng số liệu theo từng nhóm màu nền (Tổng ô màu vàng, màu xanh, màu cam, không màu). Cực kỳ hữu ích cho KCS, QS, kế toán theo dõi công nợ.
* **🧹 Dọn dẹp Name rác & Name lỗi `#REF!`:**
  * Quét toàn bộ Workbook và tự động xóa sạch các Defined Name bị lỗi `#REF!` hoặc Name rác ẩn làm nặng file Excel.
* **🗑️ Xóa hàng trắng tự động:**
  * Quét và dọn sạch các hàng trống không có dữ liệu trong bảng, tự động đẩy dữ liệu bên dưới lên.
* **🎨 Tô màu xen kẽ các hàng (Zebra Striping):**
  * Kẻ nền xen kẽ trắng - xám thanh lịch giúp người đọc không bị hoa mắt khi dò bảng nhiều dòng.
* **💵 Đổi số tiền thành chữ VND chuẩn tài chính:**
  * Đọc các ô số tiền thành chữ tiếng Việt kèm đuôi "đồng chẵn." điền vào cột bên cạnh.
* **🔢 Đánh STT tự động khi lọc (`SUBTOTAL`):**
  * Chèn công thức `=IF(..., "", SUBTOTAL(3, ...))` để khi lọc/filter dữ liệu thì số thứ tự vẫn chạy liên tục 1, 2, 3...
* **📐 Chuẩn hóa bảng KCS/QS:**
  * Định dạng Header bảng màu xanh Navy `#1E3A8A`, cố định Freeze Panes, căn lề chuẩn (STT giữa, số căn phải, chữ căn trái), kẻ viền Hairline thanh thoát.
* **🔎 Quét ô lỗi công thức:**
  * Phát hiện toàn bộ các ô bị lỗi `#REF!`, `#DIV/0!`, `#VALUE!`, `#N/A`.

#### 3. Tiện ích thực chiến trên Microsoft Word:
* **📅 Chèn địa danh ngày tháng chuẩn hành chính (Nghị định 30):**
  * Bấm chọn nhanh địa danh (*Hà Nội, TP. Hồ Chí Minh, Đà Nẵng, Hải Phòng, Cần Thơ* hoặc gõ tỉnh/thành bất kỳ) để chèn dòng ngày tháng chuẩn thể thức: *in nghiêng, căn phải, font Times New Roman 13pt*.
* **💵 Đổi số thành chữ VND trực tiếp trên Word:**
  * Bôi đen số tiền (ví dụ: `15.500.000`), bấm nút là Add-in tự động đổi thành chữ: *`(Mười lăm triệu năm trăm nghìn đồng chẵn.)`* và chèn ngay sau số.
* **📐 Căn lề trang in chuẩn Nghị định 30/2020/NĐ-CP:**
  * Thiết lập lề trang in chuẩn xác (Trên 20mm, Dưới 20mm, Trái 30mm, Phải 15mm, Khổ A4 đứng).
* **📑 Kho mẫu văn bản hành chính chuẩn Nghị định 30:**
  * Chèn sẵn khung sườn chuẩn cho 9 loại văn bản: *Công văn, Tờ trình, Quyết định, Báo cáo, Biên bản, Thông báo, Giấy mời, Giấy ủy quyền, Kế hoạch*.

---

### 🌐 PHÂN HỆ 2: DỊCH THUẬT CHUYÊN NGÀNH & TỪ ĐIỂN ÉP CHUẨN (CSV GLOSSARY)
* **Đa ngôn ngữ chuyên sâu:** Hỗ trợ dịch tài liệu, hợp đồng, chứng từ giữa các thứ tiếng: **Trung 🇨🇳, Anh 🇬🇧, Việt 🇻🇳, Hàn 🇰🇷, Nhật 🇯🇵**.
* **Chế độ Song ngữ đối chiếu:** Chèn bản dịch màu xanh navy ngay dưới từng đoạn văn bản gốc, hỗ trợ đắc lực cho việc kiểm tra, soát xét hợp đồng ngoại thương, hồ sơ kỹ thuật, file PDF xuất nhập khẩu.
* **Từ điển thuật ngữ ép chuẩn (CSV):** Cho phép nạp bảng thuật ngữ chuyên ngành (đã nạp sẵn mẫu cho ngành *May mặc / Xuất nhập khẩu* và *Hợp đồng / Pháp lý*). AI bắt buộc dịch đúng 100% theo từ điển, không được bịa nghĩa.
* **Dịch dữ liệu bảng tính Excel:** Quét chọn cột văn bản tiếng Trung hoặc tiếng Anh trên Excel, AI tự động dịch và điền kết quả sang cột bên cạnh.

---

### 🧠 PHÂN HỆ 3: TRÍ TUỆ NHÂN TẠO AI THẾ HỆ MỚI (GEMINI & DEEPSEEK)
* **Đa nhà cung cấp AI:**
  * **Google Gemini:** `gemini-3.6-flash` (ổn định nhất, cực nhanh), `gemini-3.8-flash`, `gemini-3.6-pro`, `gemini-3.8-pro`. Hỗ trợ nút tự động lấy danh sách model trực tiếp từ tài khoản Google.
  * **DeepSeek / OpenAI Compatible:** `deepseek-chat` (DeepSeek-V3), `deepseek-reasoner` (DeepSeek-R1 suy luận sâu), hoặc tùy biến endpoint qua OpenRouter, Groq.
* **Cơ chế xoay vòng nhiều API Key (Auto Key Rotation):** Nhập nhiều API Key (mỗi key 1 dòng), Add-in tự động xoay vòng key sau mỗi yêu cầu để nhân gấp nhiều lần hạn mức Free Tier và tự động chuyển key khi gặp giới hạn hạn mức (Rate Limit / Quota).
* **🔴 Soát lỗi chính tả & Bôi màu trực tiếp trên Word:** Tự động phát hiện lỗi sai và bôi màu đỏ/vàng trên file Word; kèm nút `[Sửa trên Word]` 1 chạm.
* **✍️ Viết lại chuẩn văn phong hành chính:** Trau chuốt câu văn mạch lạc, trang trọng.
* **💡 Tóm tắt văn bản cho lãnh đạo:** Trích xuất nhanh 5 ý cốt lõi của tài liệu dài.
* **ƒx Trợ lý Công thức Excel thông minh:** Nhập yêu cầu bằng tiếng Việt thường, AI tự sinh công thức hàm tối ưu.
* **📊 Viết báo cáo & Đề xuất lập Sheet mới:** AI phân tích toàn bộ số liệu và hiển thị nút bấm để người dùng tạo Sheet mới kèm bảng tổng hợp trực tiếp trên Excel.

---

## 📦 Hướng Dẫn Cài Đặt Siêu Nhanh 1-Click (Cho Windows)

### Dành cho máy tính cá nhân hoặc máy văn phòng công ty:
1. Tải bộ cài đặt: **[MinhDuong84vn_Addin_Cai_Cho_Vo.zip](./MinhDuong84vn_Addin_Cai_Cho_Vo.zip)**.
2. Giải nén tệp zip ra một thư mục bất kỳ.
3. Nhấp đúp chuột vào tệp:
   👉 **`Cai_Dat_Addin_May_Vo.bat`**
4. Chờ 2 giây thấy thông báo **`CAI DAT HOAN TAT THANH CONG!`** là xong!
5. Mở **Word** hoặc **Excel** lên, tạo một tài liệu mới:
   * Trên thanh Menu **Home (Trang chủ)** ở góc phải sẽ xuất hiện biểu tượng:
   * **✦ MinhDuong84vn AI**
   * Bấm vào nút để mở khung trợ lý và bắt đầu sử dụng!

---

## 📁 Cấu Trúc Dự Án

```text
gemini-office-addin/
├── manifest.xml                        # Tệp cấu hình Add-in chuẩn Microsoft Office (Cloudflare URL)
├── manifest.prod.xml                   # Bản sao cấu hình Cloudflare Pages
├── Cai_Dat_Addin_May_Vo.bat            # Script cài đặt tự động 1-Click cho máy tính Windows
├── MinhDuong84vn_Addin_Cai_Cho_Vo.zip  # Gói cài đặt đóng gói sẵn tiện lợi
├── package.json                        # Cấu hình dự án Node.js
├── assets/                             # Bộ icon Add-in (16x16, 32x32, 80x80)
└── src/
    ├── taskpane.html                   # Giao diện chính của Taskpane
    ├── taskpane.css                    # Bảng định kiểu giao diện hiện đại
    ├── taskpane.js                     # Điều khiển giao diện, Quick Chips & tương tác người dùng
    ├── office-bridge.js                # Cầu nối điều khiển 2 chiều Word & Excel (Office.js)
    ├── vietnamese-tools.js             # Engine xử lý tiếng Việt: Bảng mã TCVN3, VNI, Sort A-Z
    └── gemini-api.js                   # Client giao tiếp AI (Google Gemini & DeepSeek + Key Rotation)
```

---

## ⚙️ Cấu Hình API Key AI

Add-in hỗ trợ 2 chế độ:
1. **Sử dụng thuần Tiện ích văn phòng Việt Nam:** Hoàn toàn **không cần API Key**, hoạt động 100% offline.
2. **Sử dụng thêm tính năng AI thông minh:**
   * Bấm vào biểu tượng bánh răng **⚙️** trên góc Taskpane.
   * **Google Gemini:** Lấy API Key miễn phí tại [Google AI Studio](https://aistudio.google.com/app/apikey).
   * **DeepSeek:** Lấy API Key tại [DeepSeek Platform](https://platform.deepseek.com).
   * Bấm **Lưu cấu hình** (Key được mã hóa và lưu an toàn tại LocalStorage của máy người dùng).

---

## 📄 Bản Quyền & Giấy Phép
Dự án được xây dựng và phát triển bởi **MinhDuong84vn** phục vụ công việc văn phòng, dịch thuật và xử lý dữ liệu doanh nghiệp. Mọi mã nguồn được mở dưới giấy phép MIT.
