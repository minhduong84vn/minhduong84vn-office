// src/vietnamese-tools.js
// Bộ công cụ tiện ích Tiếng Việt chuyên sâu (kế thừa và tối ưu từ Tien ich van phong v3.4 / VnTools)
// Hỗ trợ: Chuyển mã TCVN3/VNI sang Unicode, sắp xếp tiếng Việt A-Z chuẩn, đổi kiểu chữ, chèn ngày tháng hành chính.

// Bảng mã chuyển đổi TCVN3 (ABC / .VnTime) sang Unicode
const TCVN3_TO_UNICODE = {
  "167": "Đ",
  "168": "ă",
  "169": "â",
  "170": "ê",
  "171": "ô",
  "172": "ơ",
  "173": "ư",
  "174": "đ",
  "181": "à",
  "182": "ả",
  "183": "ã",
  "184": "á",
  "185": "ạ",
  "187": "ằ",
  "188": "ẳ",
  "189": "ẵ",
  "190": "ắ",
  "198": "ặ",
  "199": "ầ",
  "200": "ẩ",
  "201": "ẫ",
  "202": "ấ",
  "203": "ậ",
  "204": "è",
  "206": "ẻ",
  "207": "ẽ",
  "208": "é",
  "209": "ẹ",
  "210": "ề",
  "211": "ể",
  "212": "ễ",
  "213": "ế",
  "214": "ệ",
  "215": "ì",
  "216": "ỉ",
  "220": "ĩ",
  "221": "í",
  "222": "ị",
  "223": "ò",
  "225": "ỏ",
  "226": "õ",
  "227": "ó",
  "228": "ọ",
  "229": "ồ",
  "230": "ổ",
  "231": "ỗ",
  "232": "ố",
  "233": "ộ",
  "234": "ờ",
  "235": "ở",
  "236": "ỡ",
  "237": "ớ",
  "238": "ợ",
  "239": "ù",
  "241": "ủ",
  "242": "ũ",
  "243": "ú",
  "244": "ụ",
  "245": "ừ",
  "246": "ử",
  "247": "ữ",
  "248": "ứ",
  "249": "ự",
  "250": "ỳ",
  "251": "ỷ",
  "252": "ỹ",
  "253": "ý",
  "254": "ỵ",
  "162": "Â",
  "163": "Ê",
  "164": "Ô",
  "205": "Í",
  "7894": "O",
  "161": "Ă",
  "165": "Ơ",
  "166": "Ư"
};

// Bảng mã chuyển đổi VNI sang Unicode (gồm các ký tự 2-byte và 1-byte)
const VNI_TO_UNICODE = {
  "aù": "¸",
  "aø": "µ",
  "aû": "ả",
  "aơ": "ã",
  "aï": "ạ",
  "aé": "ắ",
  "aè": "ằ",
  "aú": "ẳ",
  "aü": "ẵ",
  "aë": "ặ",
  "aâ": "©",
  "aá": "ấ",
  "aà": "ầ",
  "aå": "ẩ",
  "aä": "ậ",
  "eù": "Ð",
  "eø": "Ì",
  "eû": "ẻ",
  "eï": "ẹ",
  "eâ": "ª",
  "eá": "ế",
  "eà": "ề",
  "eå": "ể",
  "eă": "ễ",
  "eä": "ệ",
  "où": "ã",
  "oø": "ß",
  "oû": "ỏ",
  "oï": "ọ",
  "oâ": "«",
  "oá": "ố",
  "oà": "ồ",
  "oå": "ổ",
  "oä": "ộ",
  "ôù": "ớ",
  "ôø": "ờ",
  "ôû": "ở",
  "ôơ": "ỡ",
  "ôï": "ợ",
  "uù": "ó",
  "uø": "ï",
  "uû": "ủ",
  "uï": "ụ",
  "öù": "ứ",
  "öø": "ừ",
  "öû": "ử",
  "öï": "ự",
  "yù": "ý",
  "yø": "ỳ",
  "yû": "ỷ",
  "AÙ": "¸",
  "AØ": "µ",
  "AÛ": "Ả",
  "AƠ": "Ã",
  "AÏ": "Ạ",
  "AÉ": "Ắ",
  "AÈ": "Ằ",
  "AÚ": "Ẳ",
  "AÜ": "Ẵ",
  "AË": "Ặ",
  "AÂ": "¢",
  "AÁ": "Ấ",
  "AÀ": "Ầ",
  "AÅ": "Ẩ",
  "AÄ": "Ậ",
  "EÙ": "Ð",
  "EØ": "Ì",
  "EÛ": "Ẻ",
  "EÏ": "Ẹ",
  "EÂ": "£",
  "EÁ": "Ế",
  "EÀ": "Ề",
  "EÅ": "Ể",
  "EĂ": "Ễ",
  "EÄ": "Ö",
  "OÙ": "ã",
  "OØ": "ß",
  "OÛ": "Ỏ",
  "OƠ": "Õ",
  "OÏ": "Ọ",
  "OÂ": "¤",
  "OÁ": "Ố",
  "OÀ": "Ồ",
  "OÅ": "Ổ",
  "OÄ": "Ộ",
  "ÔÙ": "Ớ",
  "ÔØ": "Ờ",
  "ÔƠ": "Ỡ",
  "ÔÏ": "Ợ",
  "UÙ": "ó",
  "UØ": "Ù",
  "UÛ": "Ủ",
  "UÏ": "Ụ",
  "ÖÙ": "Ứ",
  "ÖØ": "Ừ",
  "ÖÛ": "Ử",
  "ÖÏ": "Ự",
  "YÙ": "ý",
  "YØ": "Ỳ",
  "YÛ": "Ỷ",
  "YƠ": "Ỹ"
};

/**
 * Chuyển đổi chuỗi văn bản từ mã TCVN3 (.VnTime, .VnArial) sang Unicode chuẩn
 */
export function convertTcvn3ToUnicode(str) {
  if (!str || typeof str !== "string") return str;
  let result = "";
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (TCVN3_TO_UNICODE[code]) {
      result += TCVN3_TO_UNICODE[code];
    } else {
      result += str[i];
    }
  }
  return result;
}

/**
 * Chuyển đổi chuỗi văn bản từ mã VNI-Windows (VNI-Times) sang Unicode chuẩn
 */
export function convertVniToUnicode(str) {
  if (!str || typeof str !== "string") return str;
  let result = "";
  let i = 0;
  while (i < str.length) {
    if (i < str.length - 1) {
      const twoChar = str.substring(i, i + 2);
      if (VNI_TO_UNICODE[twoChar]) {
        result += VNI_TO_UNICODE[twoChar];
        i += 2;
        continue;
      }
    }
    const oneChar = str[i];
    if (VNI_TO_UNICODE[oneChar]) {
      result += VNI_TO_UNICODE[oneChar];
    } else {
      result += oneChar;
    }
    i++;
  }
  return result;
}

/**
 * Tự động nhận diện và chuyển đổi bảng mã cũ (TCVN3 hoặc VNI) sang Unicode
 */
export function convertFontToUnicode(str, encoding = "auto") {
  if (!str || typeof str !== "string") return str;
  if (encoding === "tcvn3") return convertTcvn3ToUnicode(str);
  if (encoding === "vni") return convertVniToUnicode(str);
  // Ưu tiên thử VNI nếu có các tổ hợp ký tự đặc trưng của VNI
  let converted = convertVniToUnicode(str);
  // Tiếp tục chuyển các ký tự TCVN3 nếu còn
  converted = convertTcvn3ToUnicode(converted);
  return converted;
}

/**
 * Tách Họ Tên tiếng Việt thành { hoDem, ten }
 */
export function splitVietnameseName(fullName) {
  if (!fullName || typeof fullName !== "string") return { hoDem: "", ten: "" };
  const parts = fullName.trim().replace(/\s+/g, " ").split(" ");
  if (parts.length <= 1) {
    return { hoDem: "", ten: parts[0] || "" };
  }
  const ten = parts.pop();
  const hoDem = parts.join(" ");
  return { hoDem, ten };
}

/**
 * So sánh 2 tên tiếng Việt chuẩn A-Z theo quy tắc Bộ GD&ĐT (so sánh Tên trước, Họ đệm sau)
 */
export function compareVietnameseNames(nameA, nameB) {
  const collator = new Intl.Collator("vi", { sensitivity: "base", numeric: true });
  const a = splitVietnameseName(nameA);
  const b = splitVietnameseName(nameB);
  
  const cmpTen = collator.compare(a.ten, b.ten);
  if (cmpTen !== 0) return cmpTen;
  return collator.compare(a.hoDem, b.hoDem);
}

/**
 * Đổi kiểu chữ (Hoa, thường, viết hoa từng từ, viết hoa đầu câu)
 * @param {string} str 
 * @param {'upper'|'lower'|'title'|'sentence'} type 
 */
export function changeCase(str, type = "title") {
  if (!str || typeof str !== "string") return str;
  switch (type) {
    case "upper":
      return str.toUpperCase();
    case "lower":
      return str.toLowerCase();
    case "title": // Viết hoa chữ cái đầu mỗi từ
      return str.toLowerCase().replace(/(?:^|\s)\S/g, a => a.toUpperCase());
    case "sentence": // Viết hoa đầu câu
      return str.toLowerCase().replace(/(^|[.?!]\s+)([a-zà-ỹ])/g, (m, p1, p2) => p1 + p2.toUpperCase());
    default:
      return str;
  }
}

/**
 * Tạo câu ngày tháng chuẩn hành chính Việt Nam (Nghị định 30/2020/NĐ-CP)
 * Ví dụ: "Hà Nội, ngày 26 tháng 11 năm 2026"
 */
export function getAdminDateString(location = "Hà Nội") {
  const now = new Date();
  const d = String(now.getDate()).padStart(2, "0");
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const y = now.getFullYear();
  const loc = location ? location.trim() : "Hà Nội";
  return `${loc}, ngày ${d} tháng ${m} năm ${y}`;
}
