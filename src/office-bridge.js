// src/office-bridge.js
// Cầu nối giao tiếp hai chiều với Microsoft Word và Microsoft Excel thông qua Office.js
import {
  convertFontToUnicode,
  splitVietnameseName,
  compareVietnameseNames,
  changeCase,
  getAdminDateString
} from "./vietnamese-tools.js";

export class OfficeBridge {
  constructor() {
    this.host = "Office";
    this.isReady = false;
  }

  async initialize() {
    return new Promise((resolve) => {
      if (typeof Office === "undefined") {
        console.warn("Office.js chưa sẵn sàng hoặc đang chạy ngoài Office app.");
        resolve(false);
        return;
      }

      Office.onReady((info) => {
        if (info.host) {
          this.host = info.host === Office.HostType.Word ? "Word" : (info.host === Office.HostType.Excel ? "Excel" : String(info.host));
          this.isReady = true;
          console.log(`Office.js đã sẵn sàng trên host: ${this.host}`);
          resolve(true);
        } else {
          resolve(false);
        }
      });
    });
  }

  getHostName() {
    return this.host;
  }

  // ==========================================
  // CÁC HÀM XỬ LÝ TRÊN MICROSOFT WORD
  // ==========================================

  /**
   * Đọc văn bản từ Word (ưu tiên vùng đang bôi đen, nếu không có thì lấy toàn văn)
   */
  async getWordContext() {
    if (this.host !== "Word") return "";

    return await Word.run(async (context) => {
      const selection = context.document.getSelection();
      selection.load("text");
      await context.sync();

      if (selection.text && selection.text.trim().length > 0) {
        return selection.text;
      }

      // Nếu không bôi đen, lấy toàn bộ tài liệu
      const body = context.document.body;
      body.load("text");
      await context.sync();
      return body.text || "";
    });
  }

  /**
   * Tìm và bôi đỏ/vàng các cụm từ bị sai trên file Word
   */
  async highlightWordIssues(issues) {
    if (this.host !== "Word" || !issues || issues.length === 0) return 0;

    return await Word.run(async (context) => {
      let count = 0;
      for (const item of issues) {
        if (!item.original) continue;
        const searchResults = context.document.body.search(item.original, { matchCase: false });
        searchResults.load("items");
        await context.sync();

        for (const range of searchResults.items) {
          range.font.highlightColor = "#FEE2E2"; // Màu đỏ nhạt
          range.font.color = "#B91C1C"; // Chữ đỏ đậm
          count++;
        }
      }
      await context.sync();
      return count;
    });
  }

  /**
   * Thay thế từ sai bằng từ đúng trên Word
   */
  async applyWordFix(originalText, replacementText) {
    if (this.host !== "Word") return false;

    return await Word.run(async (context) => {
      const searchResults = context.document.body.search(originalText, { matchCase: false });
      searchResults.load("items");
      await context.sync();

      if (searchResults.items.length > 0) {
        const targetRange = searchResults.items[0];
        targetRange.insertText(replacementText, Word.InsertLocation.replace);
        // Đổi màu thành xanh nhạt để người dùng biết đã sửa
        targetRange.font.highlightColor = "#DCFCE7";
        targetRange.font.color = "#15803D";
        await context.sync();
        return true;
      }
      return false;
    });
  }

  /**
   * Thay thế đoạn văn bản đã viết lại vào vùng chọn hoặc toàn văn
   */
  async applyWordRewrite(rewrittenText) {
    if (this.host !== "Word") return false;

    return await Word.run(async (context) => {
      const selection = context.document.getSelection();
      selection.load("text");
      await context.sync();

      if (selection.text && selection.text.trim().length > 0) {
        selection.insertText(rewrittenText, Word.InsertLocation.replace);
      } else {
        // Chèn vào cuối tài liệu hoặc vị trí con trỏ
        selection.insertText(rewrittenText, Word.InsertLocation.after);
      }
      await context.sync();
      return true;
    });
  }

  /**
   * Căn lề trang in chuẩn Nghị định 30/2020/NĐ-CP trên Word
   */
  async formatWordDecree30() {
    if (this.host !== "Word") return false;

    return await Word.run(async (context) => {
      const sections = context.document.sections;
      sections.load("items");
      await context.sync();

      for (const section of sections.items) {
        const pageSetup = section.pageSetup;
        // 1 inch = 72 points = 25.4mm
        // Nghị định 30: Trên 20-25mm (~60pt), Dưới 20-25mm (~60pt), Trái 30-35mm (~85pt), Phải 15-20mm (~45pt)
        pageSetup.topMargin = 57; // ~20mm
        pageSetup.bottomMargin = 57; // ~20mm
        pageSetup.leftMargin = 85; // ~30mm
        pageSetup.rightMargin = 43; // ~15mm
      }

      // Chuẩn hóa font chữ Times New Roman cho toàn bộ tài liệu
      const body = context.document.body;
      body.font.name = "Times New Roman";
      body.font.size = 13; // 13pt hoặc 14pt chuẩn NĐ 30

      await context.sync();
      return true;
    });
  }

  // ==========================================
  // CÁC HÀM XỬ LÝ TRÊN MICROSOFT EXCEL
  // ==========================================

  /**
   * Đọc ngữ cảnh thông minh trên Excel:
   * Nếu người dùng chọn 1 ô đơn lẻ -> tự động đọc toàn bộ bảng tính (UsedRange) của Sheet đang mở.
   * Nếu người dùng quét chọn một vùng nhiều ô -> đọc vùng được chọn kèm tiêu đề bảng.
   */
  async getExcelContext() {
    if (this.host !== "Excel") return "";

    return await Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet();
      sheet.load("name");

      const selection = context.workbook.getSelectedRange();
      selection.load(["address", "rowCount", "columnCount", "values", "text"]);

      const usedRange = sheet.getUsedRange();
      usedRange.load(["address", "rowCount", "columnCount", "values", "text"]);

      await context.sync();

      let summary = `📌 Trang tính đang mở: "${sheet.name}"\n`;
      summary += `📌 Con trỏ chuột đang ở ô: ${selection.address}\n`;

      // Kiểm tra xem nên đọc toàn bộ bảng hay vùng chọn
      const isSingleCell = selection.rowCount === 1 && selection.columnCount === 1;
      const targetRange = isSingleCell ? usedRange : selection;
      const rangeType = isSingleCell ? "Toàn bộ bảng tính trên trang (UsedRange)" : "Vùng bạn đang bôi đen (Selection)";

      summary += `📌 Phạm vi dữ liệu: ${targetRange.address} (${rangeType} gồm ${targetRange.rowCount} hàng, ${targetRange.columnCount} cột)\n\n`;

      if (targetRange.values && targetRange.values.length > 0) {
        summary += "--- BẢNG DỮ LIỆU CHI TIẾT ---\n";
        
        // Hàng đầu tiên (thường là tiêu đề cột)
        const headerRow = targetRange.values[0] || [];
        summary += "HÀNG TIÊU ĐỀ: " + headerRow.map((h, idx) => `[Cột ${idx + 1}: ${String(h || "").trim()}]`).join(" | ") + "\n";
        summary += "--------------------------------------------------------\n";

        // Đọc tối đa 150 hàng dữ liệu
        const maxRows = Math.min(targetRange.values.length, 150);
        for (let r = 1; r < maxRows; r++) {
          const rowValues = targetRange.values[r];
          summary += `[Dòng ${r + 1}] ` + rowValues.map(cell => String(cell ?? "").trim()).join(" | ") + "\n";
        }

        if (targetRange.values.length > maxRows) {
          summary += `\n... (Còn tiếp ${targetRange.values.length - maxRows} hàng dữ liệu nữa)...\n`;
        }
      } else {
        summary += "(Trang tính hiện tại chưa có dữ liệu ô nào được nhập)\n";
      }

      return summary;
    });
  }

  /**
   * Tạo một Sheet mới hoàn toàn và tự động vẽ bảng báo cáo / tổng hợp dữ liệu chuẩn
   */
  async createWorksheetWithTable({ sheetName = "Báo Cáo Gemini", title = "BÁO CÁO PHÂN TÍCH TỔNG HỢP", headers = [], rows = [], summaryRow = null }) {
    if (this.host !== "Excel") return false;

    return await Excel.run(async (context) => {
      const sheets = context.workbook.worksheets;
      sheets.load("items");
      await context.sync();

      // Xử lý trùng tên sheet
      let finalName = sheetName.replace(/[:\\/?*\[\]]/g, "_").substring(0, 31);
      let count = 1;
      const existingNames = sheets.items.map(s => s.name.toLowerCase());
      while (existingNames.includes(finalName.toLowerCase())) {
        finalName = `${sheetName.substring(0, 26)}_${count++}`;
      }

      // 1. Tạo sheet mới
      const newSheet = sheets.add(finalName);
      
      // 2. Viết tiêu đề báo cáo ở dòng 1
      const colCount = Math.max(headers.length, 1);
      const endColLetter = String.fromCharCode(65 + colCount - 1);
      
      const titleCell = newSheet.getRange("A1");
      titleCell.values = [[title]];
      titleCell.format.font.bold = true;
      titleCell.format.font.size = 14;
      titleCell.format.font.color = "#1E3A8A";

      const subTitleCell = newSheet.getRange("A2");
      subTitleCell.values = [["Được tạo tự động bởi Trợ lý AI MinhDuong84vn Office lúc " + new Date().toLocaleTimeString("vi-VN") + " ngày " + new Date().toLocaleDateString("vi-VN")]];
      subTitleCell.format.font.italic = true;
      subTitleCell.format.font.size = 9.5;
      subTitleCell.format.font.color = "#64748B";

      // 3. Viết hàng Tiêu đề (Headers) ở dòng 4
      if (headers.length > 0) {
        const headerRange = newSheet.getRange(`A4:${endColLetter}4`);
        headerRange.values = [headers];
        headerRange.format.fill.color = "#1E3A8A"; // Xanh Navy chuyên nghiệp chuẩn KCS/QS
        headerRange.format.font.color = "#FFFFFF"; // Chữ trắng
        headerRange.format.font.bold = true;
        headerRange.format.horizontalAlignment = "Center";
        headerRange.format.verticalAlignment = "Center";
        headerRange.format.wrapText = true;
        headerRange.format.rowHeight = 28;
      }

      // 4. Viết các dòng dữ liệu (Rows) bắt đầu từ dòng 5
      let currentRow = 5;
      if (rows.length > 0) {
        const startRow = currentRow;
        const endRow = startRow + rows.length - 1;
        const dataRange = newSheet.getRange(`A${startRow}:${endColLetter}${endRow}`);
        
        // Chuẩn hóa rows để khớp số lượng cột (100% Atomic cells - không merge thân bảng)
        const normalizedRows = rows.map(r => {
          const rowArr = Array.isArray(r) ? r : Object.values(r);
          while (rowArr.length < colCount) rowArr.push("");
          return rowArr.slice(0, colCount);
        });

        dataRange.values = normalizedRows;
        dataRange.format.verticalAlignment = "Center";
        dataRange.format.borders.getItem("InsideHorizontal").style = "Hairline";
        dataRange.format.borders.getItem("InsideVertical").style = "Hairline";
        dataRange.format.borders.getItem("InsideHorizontal").color = "#CBD5E1";
        dataRange.format.borders.getItem("InsideVertical").color = "#CBD5E1";

        // Định dạng từng cột: STT căn giữa, Số tiền/Khối lượng căn phải
        for (let c = 0; c < colCount; c++) {
          const colHeader = String(headers[c] || "").toLowerCase();
          const colRange = newSheet.getRangeByIndexes(startRow - 1, c, rows.length, 1);

          if (colHeader.includes("stt") || colHeader === "no" || colHeader === "#") {
            colRange.format.horizontalAlignment = "Center";
            colRange.format.columnWidth = 6.5;
          } else if (
            colHeader.includes("tiền") || 
            colHeader.includes("giá") || 
            colHeader.includes("cost") || 
            colHeader.includes("price") || 
            colHeader.includes("amount") || 
            colHeader.includes("tổng") ||
            colHeader.includes("số lượng") ||
            colHeader.includes("qty")
          ) {
            colRange.format.horizontalAlignment = "Right";
          }
        }

        currentRow = endRow + 1;
      }

      // 5. Viết dòng Tổng cộng (Summary Row) nếu có (Viền đôi bên dưới chuẩn kế toán)
      if (summaryRow && summaryRow.length > 0) {
        const sumRange = newSheet.getRange(`A${currentRow}:${endColLetter}${currentRow}`);
        while (summaryRow.length < colCount) summaryRow.push("");
        sumRange.values = [summaryRow.slice(0, colCount)];
        sumRange.format.font.bold = true;
        sumRange.format.fill.color = "#F8FAFC";
        sumRange.format.borders.getItem("EdgeTop").style = "Continuous";
        sumRange.format.borders.getItem("EdgeBottom").style = "Double"; // Viền đôi chuẩn kế toán
      }

      // 6. Định dạng viền bảng và tự động căn độ rộng cột (Auto-fit)
      const fullTableRange = newSheet.getRange(`A4:${endColLetter}${currentRow}`);
      fullTableRange.format.borders.getItem("EdgeLeft").style = "Continuous";
      fullTableRange.format.borders.getItem("EdgeRight").style = "Continuous";
      fullTableRange.format.borders.getItem("EdgeTop").style = "Continuous";
      fullTableRange.format.borders.getItem("EdgeBottom").style = "Continuous";
      fullTableRange.format.autofitColumns();

      // 7. Freeze Panes cố định dòng tiêu đề (cuộn trang không mất phương hướng)
      newSheet.freezePanes.freezeRows(4);

      // Kích hoạt sheet mới để người dùng nhìn thấy ngay
      newSheet.activate();

      await context.sync();
      return finalName;
    });
  }

  /**
   * Ghi dữ liệu trực tiếp vào một vùng ô cụ thể trên Sheet hiện tại
   */
  async writeToCurrentSheet(address, values2D) {
    if (this.host !== "Excel") return false;

    return await Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet();
      const range = sheet.getRange(address);
      range.values = values2D;
      range.format.autofitColumns();
      await context.sync();
      return true;
    });
  }

  /**
   * Chèn công thức vào ô đang chọn (Active Cell)
   */
  async insertExcelFormula(formulaString) {
    if (this.host !== "Excel") return false;

    return await Excel.run(async (context) => {
      const activeCell = context.workbook.getActiveCell();
      let cleanFormula = formulaString.trim();
      if (!cleanFormula.startsWith("=")) {
        cleanFormula = "=" + cleanFormula;
      }

      activeCell.formulas = [[cleanFormula]];
      activeCell.select();
      await context.sync();
      return true;
    });
  }

  /**
   * Chèn công thức đánh số thứ tự tự động khi lọc bằng hàm SUBTOTAL
   */
  async insertSubtotalSequence() {
    if (this.host !== "Excel") return false;

    return await Excel.run(async (context) => {
      const activeCell = context.workbook.getActiveCell();
      activeCell.load(["rowIndex", "columnIndex", "address"]);
      await context.sync();

      // Giả sử đánh STT dựa trên cột bên phải liền kề (B)
      const nextColLetter = String.fromCharCode(65 + activeCell.columnIndex + 1);
      const rowNum = activeCell.rowIndex + 1;
      const formula = `=IF(${nextColLetter}${rowNum}="","",SUBTOTAL(3,$${nextColLetter}$${rowNum}:${nextColLetter}${rowNum}))`;

      activeCell.formulas = [[formula]];
      activeCell.select();
      await context.sync();
      return formula;
    });
  }

  /**
   * Quét và phát hiện các ô bị lỗi công thức trên Sheet hiện tại
   */
  async scanExcelErrors() {
    if (this.host !== "Excel") return [];

    return await Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet();
      const usedRange = sheet.getUsedRange();
      usedRange.load(["address", "text", "values"]);
      await context.sync();

      const errorCells = [];
      const errorRegex = /^#(REF!|VALUE!|N\/A|DIV\/0!|NAME\?|NUM!|NULL!)$/i;

      if (usedRange.text) {
        for (let r = 0; r < usedRange.text.length; r++) {
          for (let c = 0; c < usedRange.text[r].length; c++) {
            const val = String(usedRange.text[r][c]).trim();
            if (errorRegex.test(val)) {
              errorCells.push({
                row: r + 1,
                col: c + 1,
                error: val
              });
            }
          }
        }
      }
      return errorCells;
    });
  }

  /**
   * Tiện ích Excel cục bộ: Tách cột Họ và Tên thành 2 cột riêng (Họ đệm và Tên)
   */
  async splitNameColumn() {
    if (this.host !== "Excel") return { success: false, message: "Chức năng chỉ hỗ trợ trên Excel" };

    return await Excel.run(async (context) => {
      const selection = context.workbook.getSelectedRange();
      selection.load(["rowCount", "columnCount", "values", "rowIndex", "columnIndex"]);
      await context.sync();

      if (selection.columnCount !== 1) {
        return { success: false, message: "Vui lòng chỉ quét chọn 1 cột danh sách Họ và Tên cần tách." };
      }

      const sheet = context.workbook.worksheets.getActiveWorksheet();
      const rowCount = selection.rowCount;
      const splitRows = [];

      for (let i = 0; i < rowCount; i++) {
        const rawName = String(selection.values[i][0] || "").trim();
        if (!rawName) {
          splitRows.push(["", ""]);
          continue;
        }
        const parts = rawName.split(/\s+/);
        if (parts.length === 1) {
          splitRows.push(["", parts[0]]);
        } else {
          const firstName = parts.pop();
          const lastName = parts.join(" ");
          splitRows.push([lastName, firstName]);
        }
      }

      // Ghi kết quả sang 2 cột bên phải ô đang chọn
      const startCol = selection.columnIndex + 1;
      const targetRange = sheet.getRangeByIndexes(selection.rowIndex, startCol, rowCount, 2);
      targetRange.values = splitRows;
      targetRange.format.autofitColumns();
      await context.sync();

      return { success: true, count: rowCount };
    });
  }

  /**
   * Tiện ích Excel cục bộ: Đổi số tiền thành chữ VND sang cột bên cạnh
   */
  async convertNumberToWordsVND() {
    if (this.host !== "Excel") return { success: false, message: "Chức năng chỉ hỗ trợ trên Excel" };

    return await Excel.run(async (context) => {
      const selection = context.workbook.getSelectedRange();
      selection.load(["rowCount", "columnCount", "values", "rowIndex", "columnIndex"]);
      await context.sync();

      if (selection.columnCount !== 1) {
        return { success: false, message: "Vui lòng chọn 1 cột chứa số tiền cần đọc thành chữ." };
      }

      const sheet = context.workbook.worksheets.getActiveWorksheet();
      const rowCount = selection.rowCount;
      const wordsRows = [];

      for (let i = 0; i < rowCount; i++) {
        const val = selection.values[i][0];
        const num = parseFloat(String(val).replace(/[,. \u00a0đVNĐ]/g, ""));
        if (!isNaN(num) && num > 0) {
          wordsRows.push([numberToVietnameseWords(num)]);
        } else {
          wordsRows.push([""]);
        }
      }

      const startCol = selection.columnIndex + 1;
      const targetRange = sheet.getRangeByIndexes(selection.rowIndex, startCol, rowCount, 1);
      targetRange.values = wordsRows;
      targetRange.format.autofitColumns();
      await context.sync();

      return { success: true, count: rowCount };
    });
  }

  /**
   * Tiện ích Excel cục bộ: Chuẩn hóa văn bản (Xóa khoảng trắng thừa, viết hoa chữ cái đầu)
   */
  async cleanTextSelection() {
    if (this.host !== "Excel") return { success: false, message: "Chức năng chỉ hỗ trợ trên Excel" };

    return await Excel.run(async (context) => {
      const selection = context.workbook.getSelectedRange();
      selection.load(["rowCount", "columnCount", "values"]);
      await context.sync();

      const cleanedValues = selection.values.map(row => {
        return row.map(cell => {
          if (typeof cell !== "string") return cell;
          let s = cell.replace(/\s+/g, " ").trim();
          // Viết hoa chữ cái đầu của mỗi từ (Proper case)
          s = s.toLowerCase().replace(/(?:^|\s)\S/g, a => a.toUpperCase());
          return s;
        });
      });

      selection.values = cleanedValues;
      await context.sync();
      return { success: true, cells: selection.rowCount * selection.columnCount };
    });
  }

  /**
   * Tiện ích Excel: Chuẩn hóa bảng tính theo chuẩn KCS / QS & Bảng dữ liệu chuyên nghiệp
   * - Tiêu đề Navy #1E3A8A, chữ trắng bold, Wrap text
   * - Cột STT căn giữa (width ~6.5)
   * - Cột số tiền / đơn giá / số lượng căn phải, định dạng #,##0
   * - Thân bảng 100% ô đơn nguyên tử (Atomic cells), viền hairline
   * - Freeze Panes cố định dòng tiêu đề
   */
  async formatTableKcsQs() {
    if (this.host !== "Excel") return { success: false, message: "Chức năng chỉ hỗ trợ trên Excel" };

    return await Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet();
      const selection = context.workbook.getSelectedRange();
      selection.load(["rowCount", "columnCount", "address"]);
      const usedRange = sheet.getUsedRange();
      usedRange.load(["rowCount", "columnCount", "address", "rowIndex", "columnIndex", "values"]);
      await context.sync();

      const isSingleCell = selection.rowCount === 1 && selection.columnCount === 1;
      const targetRange = isSingleCell ? usedRange : selection;
      targetRange.load(["rowCount", "columnCount", "rowIndex", "columnIndex", "values", "address"]);
      await context.sync();

      if (!targetRange.values || targetRange.values.length === 0) {
        return { success: false, message: "Không tìm thấy dữ liệu để định dạng." };
      }

      const totalRows = targetRange.rowCount;
      const totalCols = targetRange.columnCount;
      const startRow = targetRange.rowIndex;
      const startCol = targetRange.columnIndex;

      // 1. Định dạng dòng Header
      const headerRange = sheet.getRangeByIndexes(startRow, startCol, 1, totalCols);
      headerRange.format.fill.color = "#1E3A8A"; // Xanh Navy chuyên nghiệp
      headerRange.format.font.color = "#FFFFFF"; // Chữ trắng
      headerRange.format.font.bold = true;
      headerRange.format.font.size = 11;
      headerRange.format.horizontalAlignment = "Center";
      headerRange.format.verticalAlignment = "Center";
      headerRange.format.wrapText = true;
      headerRange.format.rowHeight = 28;

      // 2. Định dạng thân bảng
      if (totalRows > 1) {
        const bodyRange = sheet.getRangeByIndexes(startRow + 1, startCol, totalRows - 1, totalCols);
        bodyRange.format.verticalAlignment = "Center";
        bodyRange.format.borders.getItem("InsideHorizontal").style = "Hairline";
        bodyRange.format.borders.getItem("InsideVertical").style = "Hairline";
        bodyRange.format.borders.getItem("InsideHorizontal").color = "#CBD5E1";
        bodyRange.format.borders.getItem("InsideVertical").color = "#CBD5E1";

        // Định dạng cột số liệu và STT
        for (let c = 0; c < totalCols; c++) {
          const colHeader = String(targetRange.values[0][c] || "").toLowerCase();
          const colRange = sheet.getRangeByIndexes(startRow + 1, startCol + c, totalRows - 1, 1);

          if (colHeader.includes("stt") || colHeader === "no" || colHeader === "#") {
            colRange.format.horizontalAlignment = "Center";
            colRange.format.columnWidth = 6.5;
          } else if (
            colHeader.includes("tiền") || 
            colHeader.includes("giá") || 
            colHeader.includes("cost") || 
            colHeader.includes("price") || 
            colHeader.includes("amount") || 
            colHeader.includes("tổng") ||
            colHeader.includes("số lượng") ||
            colHeader.includes("qty")
          ) {
            colRange.format.horizontalAlignment = "Right";
            colRange.numberFormat = [Array(totalRows - 1).fill("#,##0")];
          }
        }
      }

      // 3. Freeze Panes dưới hàng Header
      sheet.freezePanes.freezeRows(startRow + 1);

      await context.sync();
      return { success: true, address: targetRange.address, rows: totalRows, cols: totalCols };
    });
  }

  /**
   * Tiện ích Word: Chèn trọn bộ 8 mẫu văn bản hành chính chuẩn Nghị định 30/2020/NĐ-CP
   */
  async insertWordDecree30Template(templateType) {
    if (this.host !== "Word") return false;

    const templates = {
      cong_van: {
        title: "CÔNG VĂN HÀNH CHÍNH",
        content: `CƠ QUAN CHỦ QUẢN\t\tCỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nTÊN CƠ QUAN BAN HÀNH\t\tĐộc lập - Tự do - Hạnh phúc\nSố: …/…-…\t\t\t\t…, ngày … tháng … năm 202…\n\nV/v: [Trích yếu nội dung công văn ngắn gọn]\n\nKính gửi:\n- [Tên cơ quan, đơn vị nhận];\n- [Tên cơ quan phối hợp].\n\nCăn cứ [Nêu các văn bản quy phạm pháp luật hoặc chỉ đạo có liên quan];\nNhằm mục đích [Mục đích ban hành công văn];\n\n[Tên cơ quan ban hành] có ý kiến như sau:\n\n1. [Nội dung chỉ đạo / yêu cầu thực hiện thứ nhất].\n2. [Nội dung chỉ đạo / yêu cầu thực hiện thứ hai].\n3. Giao [Đơn vị chịu trách nhiệm chính] chủ trì, phối hợp với các bên liên quan triển khai thực hiện và báo cáo trước ngày …/…/202…\n\nNơi nhận:\t\t\t\tTHỦ TRƯỞNG ĐƠN VỊ\n- Như trên;\t\t\t\t(Ký, ghi rõ họ tên và đóng dấu)\n- Lưu: VT, ….`
      },
      to_trinh: {
        title: "TỜ TRÌNH ĐỀ XUẤT",
        content: `CƠ QUAN CHỦ QUẢN\t\tCỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nTÊN CƠ QUAN ĐỀ XUẤT\t\tĐộc lập - Tự do - Hạnh phúc\nSố: …/TTr-…\t\t\t\t…, ngày … tháng … năm 202…\n\nTỜ TRÌNH\nVề việc: [Trích yếu nội dung trình phê duyệt]\n\nKính gửi: [Tên cấp có thẩm quyền phê duyệt]\n\nCăn cứ [Căn cứ pháp lý, quy chế làm việc hoặc chỉ đạo của cấp trên];\nCăn cứ tình hình thực tế tại [Tên đơn vị đề xuất];\n\n[Tên đơn vị đề xuất] kính trình [Cấp có thẩm quyền] xem xét, phê duyệt nội dung sau:\n\nI. SỰ CẦN THIẾT BAN HÀNH / ĐỀ XUẤT\n[Nêu bối cảnh, lý do, các khó khăn vướng mắc cần giải quyết].\n\nII. NỘI DUNG ĐỀ XUẤT CỤ THỂ\n1. Mục tiêu: [Mục tiêu đạt được].\n2. Kế hoạch / Phương án: [Nêu chi tiết các bước triển khai].\n3. Dự toán kinh phí / Nguồn lực: [Số liệu cụ thể].\n\nIII. KIẾN NGHỊ VÀ ĐỀ XUẤT\nKính đề nghị [Cấp có thẩm quyền] xem xét, phê duyệt để đơn vị triển khai thực hiện.\n\nNơi nhận:\t\t\t\tTHỦ TRƯỞNG ĐƠN VỊ\n- Như kính gửi;\t\t\t(Ký, ghi rõ họ tên)\n- Lưu: VT, ….`
      },
      quyet_dinh: {
        title: "QUYẾT ĐỊNH CÁ BIỆT",
        content: `CƠ QUAN CHỦ QUẢN\t\tCỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nTÊN CƠ QUAN BAN HÀNH\t\tĐộc lập - Tự do - Hạnh phúc\nSố: …/QĐ-…\t\t\t\t…, ngày … tháng … năm 202…\n\nQUYẾT ĐỊNH\nVề việc [Trích yếu nội dung quyết định]\n\nCHỨC DANH NGƯỜI ĐỨNG ĐẦU CƠ QUAN BAN HÀNH\n\nCăn cứ [Luật / Nghị định quy định chức năng, nhiệm vụ, quyền hạn];\nCăn cứ [Văn bản pháp lý liên quan trực tiếp];\nXét đề nghị của [Chức vụ người đứng đầu đơn vị tham mưu],\n\nQUYẾT ĐỊNH:\n\nĐiều 1. [Nội dung quyết định chính thức: Phê duyệt / Thành lập / Ban hành / Khen thưởng...].\n\nĐiều 2. [Quy định về thời hạn, phân công trách nhiệm hoặc nguồn kinh phí thực hiện].\n\nĐiều 3. [Các Chức danh / Đơn vị chịu trách nhiệm thi hành]. Quyết định này có hiệu lực kể từ ngày ký./.\n\nNơi nhận:\t\t\t\tTHỦ TRƯỞNG CƠ QUAN\n- Như Điều 3;\t\t\t(Ký, ghi rõ họ tên và đóng dấu)\n- Lưu: VT, ….`
      },
      bao_cao: {
        title: "BÁO CÁO CÔNG TÁC",
        content: `CƠ QUAN CHỦ QUẢN\t\tCỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nTÊN CƠ QUAN BÁO CÁO\t\tĐộc lập - Tự do - Hạnh phúc\nSố: …/BC-…\t\t\t\t…, ngày … tháng … năm 202…\n\nBÁO CÁO\nKết quả thực hiện [Nhiệm vụ / Kế hoạch] năm 202…\n\nKính gửi: [Tên cơ quan / Lãnh đạo cấp trên]\n\nI. TÌNH HÌNH CHUNG VÀ BỐI CẢNH TRIỂN KHAI\n1. Thuận lợi: [Nêu các điều kiện thuận lợi].\n2. Khó khăn, vướng mắc: [Nêu các khó khăn phát sinh].\n\nII. KẾT QUẢ THỰC HIỆN CỤ THỂ\n1. Về tiến độ và khối lượng công việc: [Số liệu cụ thể].\n2. Về quản lý tài chính / ngân sách: [Số liệu giải ngân].\n3. Đánh giá chất lượng thực hiện: [Đạt / Vượt chỉ tiêu].\n\nIII. ĐÁNH GIÁ CHUNG VÀ BÀI HỌC KINH NGHIỆM\n1. Ưu điểm nổi bật.\n2. Tồn tại, hạn chế và nguyên nhân.\n\nIV. PHƯƠNG HƯỚNG NHIỆM VỤ VÀ ĐỀ XUẤT, KIẾN NGHỊ\n1. Nhiệm vụ trọng tâm thời gian tới.\n2. Các đề xuất, kiến nghị với cấp trên./.\n\nNơi nhận:\t\t\t\tTHỦ TRƯỞNG ĐƠN VỊ\n- Như kính gửi;\t\t\t(Ký, ghi rõ họ tên)\n- Lưu: VT, ….`
      },
      bien_ban: {
        title: "BIÊN BẢN CUỘC HỌP / NGHIỆM THU",
        content: `TÊN CƠ QUAN / ĐƠN VỊ\t\tCỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\n\t\t\t\t\tĐộc lập - Tự do - Hạnh phúc\n\nBIÊN BẢN [CUỘC HỌP / LÀM VIỆC]\nVề việc: [Nội dung cuộc họp]\n\nThời gian: Vào hồi … giờ … phút, ngày … tháng … năm 202…\nĐịa điểm: Tại [Địa chỉ phòng họp / trụ sở].\n\nI. THÀNH PHẦN THAM DỰ\n1. Chủ trì: Ông/Bà [Họ tên] - [Chức vụ].\n2. Thư ký: Ông/Bà [Họ tên] - [Chức vụ].\n3. Thành viên tham gia: [Danh sách thành phần tham gia].\n\nII. NỘI DUNG CUỘC HỌP\n1. Ông/Bà [Chủ trì] trình bày mục đích, yêu cầu và nội dung cuộc họp.\n2. Ý kiến phát biểu của các thành viên tham gia:\n- Ý kiến 1: [Tóm tắt ý kiến].\n- Ý kiến 2: [Tóm tắt ý kiến].\n\nIII. KẾT LUẬN CỦA CHỦ TRÌ\n1. Thống nhất nội dung: [Các điểm đã đồng thuận].\n2. Phân công nhiệm vụ cụ thể cho từng cá nhân/phòng ban phụ trách.\n3. Thời hạn hoàn thành: Trước ngày …/…/202…\n\nBiên bản kết thúc vào hồi … giờ … phút cùng ngày, đã được đọc lại cho mọi người cùng nghe và thống nhất ký tên./.\n\nTHƯ KÝ CUỘC HỌP\t\t\tNGƯỜI CHỦ TRÌ\n(Ký, ghi rõ họ tên)\t\t(Ký, ghi rõ họ tên)`
      },
      thong_bao: {
        title: "THÔNG BÁO CHỈ ĐẠO",
        content: `CƠ QUAN CHỦ QUẢN\t\tCỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nTÊN CƠ QUAN BAN HÀNH\t\tĐộc lập - Tự do - Hạnh phúc\nSố: …/TB-…\t\t\t\t…, ngày … tháng … năm 202…\n\nTHÔNG BÁO\nKết luận của [Chức vụ Lãnh đạo] tại cuộc họp về [Nội dung]\n\nNgày …/…/202…, tại [Địa điểm], [Chức vụ / Họ tên Lãnh đạo] đã chủ trì cuộc họp về [Nội dung]. Sau khi nghe báo cáo và ý kiến của các thành viên dự họp, [Lãnh đạo] kết luận và chỉ đạo như sau:\n\n1. Về chủ trương chung: [Nêu định hướng chỉ đạo].\n2. Nhiệm vụ cụ thể giao các đơn vị:\n- Giao [Đơn vị 1]: [Nhiệm vụ cụ thể, thời hạn].\n- Giao [Đơn vị 2]: [Nhiệm vụ cụ thể, thời hạn].\n3. Chế độ báo cáo: Định kỳ báo cáo trước ngày … hàng tháng.\n\nThông báo này để các đơn vị biết và nghiêm túc triển khai thực hiện./.\n\nNơi nhận:\t\t\t\tTL. THỦ TRƯỞNG CƠ QUAN\n- Lãnh đạo cơ quan;\t\t\tCHÁNH VĂN PHÒNG\n- Các đơn vị liên quan;\t\t(Ký, ghi rõ họ tên và đóng dấu)\n- Lưu: VT, ….`
      },
      giay_moi: {
        title: "GIẤY MỜI",
        content: `CƠ QUAN CHỦ QUẢN\t\tCỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nTÊN CƠ QUAN BAN HÀNH\t\tĐộc lập - Tự do - Hạnh phúc\nSố: …/GM-…\t\t\t\t…, ngày … tháng … năm 202…\n\nGIẤY MỜI\nTham dự [Tên sự kiện / Cuộc họp]\n\nKính gửi: [Tên cơ quan / cá nhân được mời]\n\n[Tên cơ quan ban hành] trân trọng kính mời [Ông/Bà/Quý cơ quan] tới tham dự:\n\n1. Nội dung cuộc họp: [Nêu tóm tắt nội dung].\n2. Thời gian: Vào hồi … giờ … phút, ngày … tháng … năm 202…\n3. Địa điểm: Tại [Phòng họp …, Tầng …, Địa chỉ …].\n4. Chủ trì cuộc họp: [Chức vụ, Họ tên người chủ trì].\n\n(Tài liệu cuộc họp được gửi kèm theo hoặc đăng tải tại liên kết: …)\n\nRất mong sự có mặt đúng giờ của Quý đại biểu để cuộc họp đạt kết quả tốt đẹp./.\n\nNơi nhận:\t\t\t\tTHỦ TRƯỞNG CƠ QUAN\n- Như kính gửi;\t\t\t(Ký, ghi rõ họ tên và đóng dấu)\n- Lưu: VT, ….`
      },
      giay_uy_quyen: {
        title: "GIẤY ỦY QUYỀN",
        content: `CƠ QUAN CHỦ QUẢN\t\tCỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nTÊN CƠ QUAN\t\t\tĐộc lập - Tự do - Hạnh phúc\nSố: …/GUQ-…\t\t\t\t…, ngày … tháng … năm 202…\n\nGIẤY ỦY QUYỀN\n\nCăn cứ Bộ luật Dân sự nước Cộng hòa xã hội chủ nghĩa Việt Nam;\nCăn cứ [Quy chế tổ chức và hoạt động của cơ quan / đơn vị];\n\nI. BÊN ỦY QUYỀN (NGƯỜI ỦY QUYỀN):\nÔng/Bà: [Họ và tên]\nChức vụ: [Chức vụ]\nCơ quan/Đơn vị: [Tên cơ quan]\n\nII. BÊN ĐƯỢC ỦY QUYỀN (NGƯỜI ĐƯỢC ỦY QUYỀN):\nÔng/Bà: [Họ và tên]\nChức vụ: [Chức vụ]\nSố CCCD: [Số CCCD], cấp ngày: …/…/… tại: …\n\nIII. NỘI DUNG VÀ PHẠM VI ỦY QUYỀN:\nBên được ủy quyền thay mặt Bên ủy quyền thực hiện các công việc sau:\n1. [Nội dung công việc 1: Ký kết hợp đồng / giao dịch / điều hành...]\n2. [Nội dung công việc 2]\n\nIV. THỜI HẠN ỦY QUYỀN:\nGiấy ủy quyền này có hiệu lực kể từ ngày …/…/202… đến hết ngày …/…/202… (hoặc cho đến khi công việc hoàn thành)./.\n\nNGƯỜI ĐƯỢC ỦY QUYỀN\t\tNGƯỜI ỦY QUYỀN\n(Ký, ghi rõ họ tên)\t\t(Ký, ghi rõ họ tên và đóng dấu)`
      },
      ke_hoach: {
        title: "KẾ HOẠCH CÔNG TÁC",
        content: `CƠ QUAN CHỦ QUẢN\t\tCỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nTÊN CƠ QUAN BAN HÀNH\t\tĐộc lập - Tự do - Hạnh phúc\nSố: …/KH-…\t\t\t\t…, ngày … tháng … năm 202…\n\nKẾ HOẠCH\nTriển khai thực hiện [Nhiệm vụ trọng tâm] năm 202…\n\nCăn cứ [Nghị quyết / Quyết định / Chỉ đạo của cấp trên];\n[Tên cơ quan ban hành] ban hành Kế hoạch thực hiện với các nội dung sau:\n\nI. MỤC ĐÍCH, YÊU CẦU\n1. Mục đích: [Nêu các mục tiêu cần đạt được].\n2. Yêu cầu: [Yêu cầu về tiến độ, chất lượng, sự phối hợp giữa các đơn vị].\n\nII. NỘI DUNG VÀ TIẾN ĐỘ THỰC HIỆN\n1. Nhiệm vụ 1: [Mô tả nội dung, đơn vị chủ trì, đơn vị phối hợp, thời gian hoàn thành].\n2. Nhiệm vụ 2: [Mô tả nội dung, đơn vị chủ trì, đơn vị phối hợp, thời gian hoàn thành].\n\nIII. KINH PHÍ THỰC HIỆN\nTừ nguồn ngân sách nhà nước / nguồn vốn hợp pháp của đơn vị.\n\nIV. TỔ CHỨC THỰC HIỆN\n1. Đơn vị chủ trì: Chịu trách nhiệm theo dõi, đôn đốc, tổng hợp báo cáo.\n2. Các đơn vị phối hợp: Chủ động triển khai các nhiệm vụ được phân công./.\n\nNơi nhận:\t\t\t\tTHỦ TRƯỞNG CƠ QUAN\n- Lãnh đạo cơ quan;\t\t\t(Ký, ghi rõ họ tên và đóng dấu)\n- Các đơn vị thực hiện;\n- Lưu: VT, ….`
      }
    };

    const tpl = templates[templateType] || templates["cong_van"];

    return await Word.run(async (context) => {
      const selection = context.document.getSelection();
      selection.insertText(tpl.content, Word.InsertLocation.replace);
      await context.sync();
      return true;
    });
  }

  /**
   * Dịch thuật tài liệu chuyên nghiệp trên Microsoft Word (hoặc PDF mở bằng Word)
   * Kế thừa logic song ngữ & glossary từ my_translating PDF
   */
  async translateWord(geminiService, { sourceLang = "zh", targetLang = "vi", glossaryCsv = "", mode = "dual" } = {}) {
    if (this.host !== "Word") return { success: false, message: "Chức năng chỉ hỗ trợ trên Word" };

    return await Word.run(async (context) => {
      const selection = context.document.getSelection();
      selection.load("text");
      await context.sync();

      let textToTranslate = selection.text;
      let isSelection = true;

      if (!textToTranslate || textToTranslate.trim().length === 0) {
        // Nếu không bôi đen cụ thể, dịch toàn bộ nội dung tài liệu
        const body = context.document.body;
        body.load("text");
        await context.sync();
        textToTranslate = body.text;
        isSelection = false;
      }

      if (!textToTranslate || textToTranslate.trim().length === 0) {
        return { success: false, message: "Tài liệu hoặc vùng chọn hiện đang trống." };
      }

      const translated = await geminiService.translateDocument(textToTranslate, {
        sourceLang,
        targetLang,
        glossaryCsv,
        mode
      });

      if (mode === "replace") {
        if (isSelection) {
          selection.insertText(translated, Word.InsertLocation.replace);
        } else {
          context.document.body.insertText(translated, Word.InsertLocation.replace);
        }
      } else {
        // Chế độ Song ngữ đối chiếu (Dual / Bilingual): chèn đoạn dịch ngay phía dưới
        if (isSelection) {
          const inserted = selection.insertParagraph("\n" + translated, Word.InsertLocation.after);
          inserted.font.color = "#1E40AF"; // Xanh navy trang nhã, phân biệt với bản gốc
          inserted.font.italic = true;
        } else {
          const inserted = context.document.body.insertParagraph("\n" + translated, Word.InsertLocation.end);
          inserted.font.color = "#1E40AF";
          inserted.font.italic = true;
        }
      }

      await context.sync();
      return {
        success: true,
        isSelection,
        mode,
        length: textToTranslate.length,
        translated
      };
    });
  }

  /**
   * Dịch thuật dữ liệu trên Microsoft Excel (Dịch theo cột hoặc vùng chọn)
   * mode: 'adjacent' (điền vào cột liền kề bên phải) | 'replace' (thay thế trực tiếp ô)
   */
  async translateExcel(geminiService, { sourceLang = "zh", targetLang = "vi", glossaryCsv = "", mode = "adjacent" } = {}) {
    if (this.host !== "Excel") return { success: false, message: "Chức năng chỉ hỗ trợ trên Excel" };

    return await Excel.run(async (context) => {
      const selection = context.workbook.getSelectedRange();
      selection.load(["address", "rowCount", "columnCount", "values", "rowIndex", "columnIndex"]);
      await context.sync();

      if (selection.rowCount === 0 || selection.columnCount === 0) {
        return { success: false, message: "Chưa chọn vùng dữ liệu nào trên Excel." };
      }

      const rows = selection.values;
      const flatItems = [];
      const coordMap = [];

      for (let r = 0; r < selection.rowCount; r++) {
        for (let c = 0; c < selection.columnCount; c++) {
          const cellVal = rows[r][c];
          if (cellVal !== null && cellVal !== undefined) {
            const str = String(cellVal).trim();
            if (str.length > 0) {
              flatItems.push(str);
              coordMap.push({ r, c });
            }
          }
        }
      }

      if (flatItems.length === 0) {
        return { success: false, message: "Vùng ô bạn chọn không chứa văn bản nào để dịch." };
      }

      const translatedItems = await geminiService.translateBatch(flatItems, {
        sourceLang,
        targetLang,
        glossaryCsv
      });

      // Lập ma trận kết quả
      const targetMatrix = rows.map(row => [...row]);
      for (let i = 0; i < coordMap.length; i++) {
        const { r, c } = coordMap[i];
        targetMatrix[r][c] = translatedItems[i] || flatItems[i];
      }

      const sheet = context.workbook.worksheets.getActiveWorksheet();

      if (mode === "adjacent") {
        // Điền vào cột liền kề bên phải
        const startCol = selection.columnIndex + selection.columnCount;
        const targetRange = sheet.getRangeByIndexes(selection.rowIndex, startCol, selection.rowCount, selection.columnCount);
        targetRange.values = targetMatrix;
        targetRange.format.autofitColumns();
        targetRange.select();
      } else {
        // Thay thế trực tiếp
        selection.values = targetMatrix;
      }

      await context.sync();
      return {
        success: true,
        count: flatItems.length,
        address: selection.address,
        mode
      };
    });
  }

  // ==========================================
  // TIỆN ÍCH TIẾNG VIỆT THỰC CHIẾN (KẾ THỪA V3.4)
  // ==========================================

  /**
   * Chuyển mã font lỗi (TCVN3, VNI) sang Unicode chuẩn
   * Áp dụng cho cả Word và Excel
   */
  async convertSelectionFont(sourceEncoding = "auto") {
    if (this.host === "Word") {
      return await Word.run(async (context) => {
        const selection = context.document.getSelection();
        selection.load("text");
        await context.sync();

        let target = selection;
        let text = selection.text;
        if (!text || text.trim().length === 0) {
          const body = context.document.body;
          body.load("text");
          await context.sync();
          target = body;
          text = body.text;
        }

        if (!text || text.trim().length === 0) {
          return { success: false, message: "Không tìm thấy văn bản để chuyển mã font." };
        }

        const converted = convertFontToUnicode(text, sourceEncoding);
        target.insertText(converted, Word.InsertLocation.replace);
        target.font.name = "Times New Roman";
        await context.sync();

        return { success: true, count: text.length };
      });
    } else if (this.host === "Excel") {
      return await Excel.run(async (context) => {
        const selection = context.workbook.getSelectedRange();
        selection.load(["rowCount", "columnCount", "values"]);
        await context.sync();

        if (selection.rowCount === 0 || selection.columnCount === 0) {
          return { success: false, message: "Chưa chọn vùng dữ liệu nào trên Excel." };
        }

        let convertedCount = 0;
        const newValues = selection.values.map(row => {
          return row.map(cell => {
            if (typeof cell === "string" && cell.length > 0) {
              const res = convertFontToUnicode(cell, sourceEncoding);
              if (res !== cell) convertedCount++;
              return res;
            }
            return cell;
          });
        });

        selection.values = newValues;
        selection.format.font.name = "Times New Roman";
        await context.sync();

        return { success: true, count: convertedCount };
      });
    }
  }

  /**
   * Đổi kiểu chữ (Hoa, Thường, Viết Hoa Đầu Từ, Viết hoa đầu câu)
   */
  async changeSelectionCase(caseType = "title") {
    if (this.host === "Word") {
      return await Word.run(async (context) => {
        const selection = context.document.getSelection();
        selection.load("text");
        await context.sync();

        if (!selection.text || selection.text.trim().length === 0) {
          return { success: false, message: "Vui lòng bôi đen đoạn văn bản cần đổi kiểu chữ." };
        }

        const changed = changeCase(selection.text, caseType);
        selection.insertText(changed, Word.InsertLocation.replace);
        await context.sync();
        return { success: true, text: changed };
      });
    } else if (this.host === "Excel") {
      return await Excel.run(async (context) => {
        const selection = context.workbook.getSelectedRange();
        selection.load(["rowCount", "columnCount", "values"]);
        await context.sync();

        let modified = 0;
        const newValues = selection.values.map(row => {
          return row.map(cell => {
            if (typeof cell === "string" && cell.length > 0) {
              modified++;
              return changeCase(cell, caseType);
            }
            return cell;
          });
        });

        selection.values = newValues;
        await context.sync();
        return { success: true, count: modified };
      });
    }
  }

  /**
   * Chèn câu địa danh ngày tháng hành chính chuẩn Nghị định 30 (Word)
   */
  async insertAdminDateWord(location = "Hà Nội") {
    if (this.host !== "Word") return { success: false, message: "Chức năng chỉ hỗ trợ trên Word" };

    return await Word.run(async (context) => {
      const dateStr = getAdminDateString(location);
      const selection = context.document.getSelection();
      const para = selection.insertParagraph(dateStr, Word.InsertLocation.after);
      para.font.name = "Times New Roman";
      para.font.size = 13;
      para.font.italic = true;
      para.alignment = Word.Alignment.right;
      await context.sync();
      return { success: true, text: dateStr };
    });
  }

  /**
   * Sắp xếp danh sách tiếng Việt chuẩn A-Z (theo Tên trước, Họ đệm sau) trên Excel
   */
  async sortVietnameseColumnExcel() {
    if (this.host !== "Excel") return { success: false, message: "Chức năng chỉ hỗ trợ trên Excel" };

    return await Excel.run(async (context) => {
      const selection = context.workbook.getSelectedRange();
      selection.load(["rowCount", "columnCount", "values"]);
      await context.sync();

      if (selection.rowCount <= 1) {
        return { success: false, message: "Vui lòng chọn vùng bảng hoặc cột họ tên có từ 2 hàng trở lên." };
      }

      const rows = selection.values;
      const sortedRows = [...rows].sort((rowA, rowB) => {
        const nameA = String(rowA[0] || "");
        const nameB = String(rowB[0] || "");
        return compareVietnameseNames(nameA, nameB);
      });

      selection.values = sortedRows;
      await context.sync();
      return { success: true, rowCount: rows.length };
    });
  }

  /**
   * Quét và dọn sạch các Name rác, Name bị lỗi #REF!, Name ẩn trên Excel
   */
  async cleanExcelNames() {
    if (this.host !== "Excel") return { success: false, message: "Chức năng chỉ hỗ trợ trên Excel" };

    return await Excel.run(async (context) => {
      const names = context.workbook.names;
      names.load(["items", "name", "value", "visible"]);
      await context.sync();

      let deletedCount = 0;
      const total = names.items.length;

      for (let i = names.items.length - 1; i >= 0; i--) {
        const item = names.items[i];
        const val = String(item.value || "");
        if (val.includes("#REF!") || !item.visible) {
          item.delete();
          deletedCount++;
        }
      }

      await context.sync();
      return {
        success: true,
        total,
        deleted: deletedCount,
        remaining: total - deletedCount
      };
    });
  }

  /**
   * Xóa tất cả các hàng trắng (hàng không có dữ liệu) trong vùng chọn hoặc bảng tính
   */
  async deleteEmptyRowsExcel() {
    if (this.host !== "Excel") return { success: false, message: "Chức năng chỉ hỗ trợ trên Excel" };

    return await Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet();
      const selection = context.workbook.getSelectedRange();
      selection.load(["rowCount", "columnCount", "values", "rowIndex", "columnIndex"]);
      await context.sync();

      const isSingleCell = selection.rowCount === 1 && selection.columnCount === 1;
      const targetRange = isSingleCell ? sheet.getUsedRange() : selection;
      targetRange.load(["rowCount", "columnCount", "values", "rowIndex", "columnIndex"]);
      await context.sync();

      const rows = targetRange.values;
      let deleted = 0;

      for (let r = rows.length - 1; r >= 0; r--) {
        const isRowEmpty = rows[r].every(c => c === null || c === undefined || String(c).trim() === "");
        if (isRowEmpty) {
          const actualRowIdx = targetRange.rowIndex + r;
          const rowRange = sheet.getRangeByIndexes(actualRowIdx, targetRange.columnIndex, 1, targetRange.columnCount);
          rowRange.delete(Excel.DeleteShiftDirection.up);
          deleted++;
        }
      }

      await context.sync();
      return { success: true, deletedCount: deleted };
    });
  }

  /**
   * Tô màu xen kẽ các hàng (Zebra Striping)
   */
  async applyZebraStripingExcel(evenColor = "#F1F5F9", oddColor = "#FFFFFF") {
    if (this.host !== "Excel") return { success: false, message: "Chức năng chỉ hỗ trợ trên Excel" };

    return await Excel.run(async (context) => {
      const selection = context.workbook.getSelectedRange();
      selection.load(["rowCount", "columnCount", "rowIndex", "columnIndex"]);
      await context.sync();

      const sheet = context.workbook.worksheets.getActiveWorksheet();
      for (let r = 0; r < selection.rowCount; r++) {
        const actualRowIdx = selection.rowIndex + r;
        const rowRange = sheet.getRangeByIndexes(actualRowIdx, selection.columnIndex, 1, selection.columnCount);
        rowRange.format.fill.color = r % 2 === 0 ? oddColor : evenColor;
      }

      await context.sync();
      return { success: true, rowCount: selection.rowCount };
    });
  }
}

/**
 * Hàm đọc số tiền thành chữ tiếng Việt chuẩn văn bản tài chính
 */
export function numberToVietnameseWords(n) {
  if (n === null || n === undefined || isNaN(n)) return "";
  let num = Math.round(Math.abs(Number(n)));
  if (num === 0) return "Không đồng chẵn.";

  const digits = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
  const scales = ["", "nghìn", "triệu", "tỷ", "nghìn tỷ", "triệu tỷ"];

  function readGroup(g, isHighest) {
    let tr = Math.floor(g / 100);
    let ch = Math.floor((g % 100) / 10);
    let dv = g % 10;
    let res = "";

    if (tr > 0 || !isHighest) {
      res += digits[tr] + " trăm ";
    }
    if (ch > 1) {
      res += digits[ch] + " mươi ";
      if (dv === 1) res += "mốt ";
      else if (dv === 4) res += "tư ";
      else if (dv === 5) res += "lăm ";
      else if (dv > 0) res += digits[dv] + " ";
    } else if (ch === 1) {
      res += "mười ";
      if (dv === 1) res += "một ";
      else if (dv === 5) res += "lăm ";
      else if (dv > 0) res += digits[dv] + " ";
    } else if (ch === 0 && dv > 0) {
      if (tr > 0 || !isHighest) res += "linh ";
      res += digits[dv] + " ";
    }
    return res.trim();
  }

  const groups = [];
  while (num > 0) {
    groups.push(num % 1000);
    num = Math.floor(num / 1000);
  }

  const words = [];
  for (let i = groups.length - 1; i >= 0; i--) {
    const g = groups[i];
    if (g > 0) {
      const gText = readGroup(g, i === groups.length - 1);
      words.push(gText + (scales[i] ? " " + scales[i] : ""));
    }
  }

  let result = words.join(" ").trim();
  result = result.charAt(0).toUpperCase() + result.slice(1) + " đồng chẵn.";
  return result;
}
