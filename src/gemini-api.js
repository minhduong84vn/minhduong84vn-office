// src/gemini-api.js
// Client kết nối đa nhà cung cấp AI: Google Gemini & DeepSeek (OpenAI-compatible) với hỗ trợ xoay vòng đa API Key

const STORAGE_KEY_PROVIDER = "gemini_office_provider";
const STORAGE_KEY_API_KEYS = "gemini_office_api_keys";
const STORAGE_KEY_MODEL = "gemini_office_model";
const STORAGE_KEY_CUSTOM_MODEL = "gemini_office_custom_model";

// Cấu hình DeepSeek / OpenAI-compatible
const STORAGE_KEY_DEEPSEEK_KEYS = "gemini_office_deepseek_keys";
const STORAGE_KEY_DEEPSEEK_MODEL = "gemini_office_deepseek_model";
const STORAGE_KEY_DEEPSEEK_CUSTOM_MODEL = "gemini_office_deepseek_custom_model";
const STORAGE_KEY_DEEPSEEK_ENDPOINT = "gemini_office_deepseek_endpoint";

// Mặc định Gemini 3.6 Flash vì cực kỳ ổn định, tốc độ phản hồi 1-2s và không bị 503 High Demand
export const DEFAULT_MODEL = "gemini-3.6-flash";
export const DEFAULT_DEEPSEEK_MODEL = "deepseek-chat";
export const DEFAULT_DEEPSEEK_ENDPOINT = "https://api.deepseek.com/chat/completions";

export class GeminiService {
  constructor() {
    this.provider = localStorage.getItem(STORAGE_KEY_PROVIDER) || "google";

    // Google Keys & Model
    this.apiKeys = this.loadKeys();
    let storedModel = localStorage.getItem(STORAGE_KEY_MODEL) || DEFAULT_MODEL;
    // Tự động nâng cấp các model đã bị khai tử (1.5, 2.0) lên 3.6-flash ổn định
    if (storedModel.startsWith("gemini-1.5") || storedModel.startsWith("gemini-2.0") || storedModel.includes("exp")) {
      storedModel = DEFAULT_MODEL;
      localStorage.setItem(STORAGE_KEY_MODEL, DEFAULT_MODEL);
    }
    this.model = storedModel;
    this.customModel = localStorage.getItem(STORAGE_KEY_CUSTOM_MODEL) || "";
    this.currentKeyIndex = 0;

    // DeepSeek Keys & Model
    this.deepseekKeys = this.loadDeepseekKeys();
    this.deepseekModel = localStorage.getItem(STORAGE_KEY_DEEPSEEK_MODEL) || DEFAULT_DEEPSEEK_MODEL;
    this.customDeepseekModel = localStorage.getItem(STORAGE_KEY_DEEPSEEK_CUSTOM_MODEL) || "";
    this.deepseekEndpoint = localStorage.getItem(STORAGE_KEY_DEEPSEEK_ENDPOINT) || DEFAULT_DEEPSEEK_ENDPOINT;
    this.currentDeepseekKeyIndex = 0;
  }

  loadKeys() {
    const legacyKey = localStorage.getItem("gemini_office_api_key");
    const stored = localStorage.getItem(STORAGE_KEY_API_KEYS) || legacyKey || "";
    return this.parseKeys(stored);
  }

  loadDeepseekKeys() {
    const stored = localStorage.getItem(STORAGE_KEY_DEEPSEEK_KEYS) || "";
    return this.parseKeys(stored);
  }

  parseKeys(rawString) {
    if (!rawString) return [];
    const lines = rawString.split(/[\n,;]+/);
    const cleaned = [];

    for (const line of lines) {
      if (!line) continue;
      // Trích xuất Google API key (AIza..., AQ....) hoặc DeepSeek/OpenAI key (sk-...)
      const match = line.match(/(?:AIza|AQ\.|sk-)[0-9A-Za-z_.-]{25,65}/);
      if (match) {
        cleaned.push(match[0].trim());
      } else {
        // Fallback: nếu key có định dạng khác, loại bỏ dấu ngoặc, dấu nháy và khoảng trắng
        const clean = line.replace(/["'()\[\]]/g, "").trim().split(/\s+/)[0];
        if (clean && clean.length > 15) {
          cleaned.push(clean);
        }
      }
    }

    return [...new Set(cleaned)];
  }

  saveConfig({ provider = "google", rawKeys = "", model = "", customModel = "", deepseekRawKeys = "", deepseekModel = "", customDeepseekModel = "", deepseekEndpoint = "" }) {
    this.provider = provider || "google";
    localStorage.setItem(STORAGE_KEY_PROVIDER, this.provider);

    // Lưu cấu hình Google
    this.apiKeys = this.parseKeys(rawKeys);
    this.model = model || DEFAULT_MODEL;
    this.customModel = customModel ? customModel.trim() : "";
    this.currentKeyIndex = 0;

    localStorage.setItem(STORAGE_KEY_API_KEYS, this.apiKeys.join("\n"));
    localStorage.setItem(STORAGE_KEY_MODEL, this.model);
    localStorage.setItem(STORAGE_KEY_CUSTOM_MODEL, this.customModel);

    // Lưu cấu hình DeepSeek
    this.deepseekKeys = this.parseKeys(deepseekRawKeys);
    this.deepseekModel = deepseekModel || DEFAULT_DEEPSEEK_MODEL;
    this.customDeepseekModel = customDeepseekModel ? customDeepseekModel.trim() : "";
    this.deepseekEndpoint = deepseekEndpoint ? deepseekEndpoint.trim() : DEFAULT_DEEPSEEK_ENDPOINT;
    this.currentDeepseekKeyIndex = 0;

    localStorage.setItem(STORAGE_KEY_DEEPSEEK_KEYS, this.deepseekKeys.join("\n"));
    localStorage.setItem(STORAGE_KEY_DEEPSEEK_MODEL, this.deepseekModel);
    localStorage.setItem(STORAGE_KEY_DEEPSEEK_CUSTOM_MODEL, this.customDeepseekModel);
    localStorage.setItem(STORAGE_KEY_DEEPSEEK_ENDPOINT, this.deepseekEndpoint);
  }

  getConfig() {
    return {
      provider: this.provider,
      apiKeys: this.apiKeys,
      apiKeysRaw: this.apiKeys.join("\n"),
      model: this.model,
      customModel: this.customModel,
      activeModel: this.getEffectiveModel(),
      deepseekKeys: this.deepseekKeys,
      deepseekKeysRaw: this.deepseekKeys.join("\n"),
      deepseekModel: this.deepseekModel,
      customDeepseekModel: this.customDeepseekModel,
      deepseekEndpoint: this.deepseekEndpoint,
      activeDeepseekModel: this.getEffectiveDeepseekModel()
    };
  }

  getEffectiveModel() {
    if (this.model === "custom" && this.customModel) {
      return this.customModel;
    }
    return this.model;
  }

  getEffectiveDeepseekModel() {
    if (this.deepseekModel === "custom" && this.customDeepseekModel) {
      return this.customDeepseekModel;
    }
    return this.deepseekModel;
  }

  hasApiKey() {
    if (this.provider === "deepseek") {
      return this.deepseekKeys.length > 0;
    }
    return this.apiKeys.length > 0;
  }

  getKeyCount() {
    if (this.provider === "deepseek") {
      return this.deepseekKeys.length;
    }
    return this.apiKeys.length;
  }

  getActiveKeyInfo() {
    if (this.provider === "deepseek") {
      if (this.deepseekKeys.length === 0) return "Chưa có Key DeepSeek";
      const total = this.deepseekKeys.length;
      const current = (this.currentDeepseekKeyIndex % total) + 1;
      return total > 1 ? `DeepSeek · Key ${current}/${total} (Xoay vòng)` : `DeepSeek · 1 Key`;
    }

    if (this.apiKeys.length === 0) return "Chưa có Key Gemini";
    const total = this.apiKeys.length;
    const current = (this.currentKeyIndex % total) + 1;
    return total > 1 ? `Gemini · Key ${current}/${total} (Xoay vòng)` : `Gemini · 1 Key`;
  }

  getActiveModelDisplay() {
    if (this.provider === "deepseek") {
      return this.getEffectiveDeepseekModel();
    }
    return this.getEffectiveModel();
  }

  /**
   * Truy vấn danh sách mô hình khả dụng từ Google
   */
  async fetchAvailableModels(testKey = null) {
    const key = testKey || (this.apiKeys.length > 0 ? this.apiKeys[0] : null);
    if (!key) throw new Error("Chưa có API Key để tải danh sách mô hình từ Google.");

    const endpoints = [
      `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`,
      `https://generativelanguage.googleapis.com/v1/models?key=${encodeURIComponent(key)}`
    ];

    let lastErrMsg = "";
    for (const endpoint of endpoints) {
      try {
        const res = await fetch(endpoint, {
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": key
          }
        });

        if (res.ok) {
          const data = await res.json();
          const models = (data.models || [])
            .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent"))
            .map(m => {
              const id = m.name.replace(/^models\//, "");
              return {
                id: id,
                displayName: m.displayName ? `${m.displayName} (${id})` : id,
                description: m.description || ""
              };
            });

          if (models.length > 0) return models;
        } else {
          const errJson = await res.json().catch(() => ({}));
          lastErrMsg = errJson.error?.message || `HTTP ${res.status} ${res.statusText}`;
        }
      } catch (e) {
        lastErrMsg = e.message;
      }
    }

    throw new Error(lastErrMsg || "Không thể tải danh sách mô hình.");
  }

  /**
   * Gọi DeepSeek / OpenAI-compatible REST API (Hỗ trợ xoay vòng nhiều key)
   */
  async callDeepSeek(contents, systemInstruction = null, responseMimeType = "text/plain") {
    if (this.deepseekKeys.length === 0) {
      throw new Error("Chưa cấu hình DeepSeek API Key. Vui lòng bấm ⚙️ Cài đặt -> chọn 'DeepSeek / Mô hình mở' và nhập API Key.");
    }

    const totalKeys = this.deepseekKeys.length;
    let attempts = 0;
    const errorsList = [];
    const effectiveModel = this.getEffectiveDeepseekModel();
    const endpoint = this.deepseekEndpoint || DEFAULT_DEEPSEEK_ENDPOINT;

    // Chuyển đổi nội dung sang chuẩn messages của OpenAI/DeepSeek
    const messages = [];
    if (systemInstruction) {
      messages.push({ role: "system", content: systemInstruction });
    }
    for (const item of contents) {
      const text = item.parts ? item.parts.map(p => p.text).join("\n") : (item.content || "");
      messages.push({
        role: item.role === "model" ? "assistant" : "user",
        content: text
      });
    }

    while (attempts < totalKeys) {
      const activeKey = this.deepseekKeys[this.currentDeepseekKeyIndex % totalKeys];
      const keyDisplay = `DeepSeek Key #${(this.currentDeepseekKeyIndex % totalKeys) + 1}`;

      const requestBody = {
        model: effectiveModel,
        messages: messages,
        temperature: 0.2
      };

      if (responseMimeType === "application/json") {
        requestBody.response_format = { type: "json_object" };
      }

      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${activeKey}`
          },
          body: JSON.stringify(requestBody)
        });

        if (response.ok) {
          const data = await response.json();
          const content = data.choices?.[0]?.message?.content;
          if (!content) throw new Error("Không nhận được nội dung trả lời từ DeepSeek.");

          this.currentDeepseekKeyIndex = (this.currentDeepseekKeyIndex + 1) % totalKeys;
          return content;
        }

        const errJson = await response.json().catch(() => ({}));
        const errorMsg = errJson.error?.message || `HTTP ${response.status} ${response.statusText}`;
        console.warn(`[DeepSeek Rotator] ${keyDisplay} thất bại: ${errorMsg}`);
        errorsList.push(`${keyDisplay}: ${errorMsg}`);
        this.currentDeepseekKeyIndex = (this.currentDeepseekKeyIndex + 1) % totalKeys;
        attempts++;
      } catch (e) {
        errorsList.push(`${keyDisplay}: ${e.message}`);
        this.currentDeepseekKeyIndex = (this.currentDeepseekKeyIndex + 1) % totalKeys;
        attempts++;
      }
    }

    throw new Error(`Đã thử toàn bộ ${totalKeys} DeepSeek API Key nhưng đều thất bại:\n• ${errorsList.join("\n• ")}`);
  }

  /**
   * Gọi Google Gemini REST API (Hỗ trợ xoay vòng nhiều key & tự động fallback 503)
   */
  async callGemini(contents, systemInstruction = null, responseMimeType = "text/plain") {
    if (this.apiKeys.length === 0) {
      throw new Error("Chưa cấu hình Gemini API Key. Vui lòng bấm biểu tượng bánh răng ⚙️ ở góc trên để nhập ít nhất 1 Google Gemini API Key.");
    }

    const totalKeys = this.apiKeys.length;
    let attempts = 0;
    const errorsList = [];

    let targetModel = this.getEffectiveModel();

    while (attempts < totalKeys) {
      const activeKey = this.apiKeys[this.currentKeyIndex % totalKeys];
      const keyDisplay = `Key #${(this.currentKeyIndex % totalKeys) + 1}`;

      const requestBody = {
        contents: contents,
        generationConfig: {
          temperature: 0.2,
          responseMimeType: responseMimeType
        }
      };

      if (systemInstruction) {
        requestBody.systemInstruction = {
          parts: [{ text: systemInstruction }]
        };
      }

      const apiVersions = ["v1beta", "v1"];
      let lastCallError = null;
      let is503 = false;

      for (const ver of apiVersions) {
        const endpoint = `https://generativelanguage.googleapis.com/${ver}/models/${encodeURIComponent(targetModel)}:generateContent?key=${encodeURIComponent(activeKey)}`;

        try {
          const response = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": activeKey
            },
            body: JSON.stringify(requestBody)
          });

          if (response.ok) {
            const data = await response.json();
            const candidate = data.candidates?.[0];
            const textPart = candidate?.content?.parts?.[0]?.text;

            if (!textPart) {
              throw new Error("Không nhận được nội dung trả lời từ mô hình.");
            }

            this.currentKeyIndex = (this.currentKeyIndex + 1) % totalKeys;
            return textPart;
          }

          const errJson = await response.json().catch(() => ({}));
          const googleMsg = errJson.error?.message || `HTTP ${response.status} ${response.statusText}`;
          const errCode = errJson.error?.code || response.status;
          
          lastCallError = `${googleMsg} (HTTP ${errCode})`;

          if (response.status === 503 || googleMsg.includes("high demand") || googleMsg.includes("spikes in demand")) {
            is503 = true;
          }

          if (response.status === 404 && ver === "v1beta") {
            continue;
          }

          break;
        } catch (networkErr) {
          lastCallError = networkErr.message;
          break;
        }
      }

      // Tự động Fallback thông minh: Nếu mô hình 3.8 bị quá tải (503 High Demand), tự động chuyển sang 3.6-flash mượt mà
      if (is503 && targetModel.includes("3.8") && targetModel !== "gemini-3.6-flash") {
        console.warn(`[Gemini Rotator] ${targetModel} đang bị quá tải (503 High Demand). Tự động chuyển hướng sang gemini-3.6-flash mượt mà...`);
        targetModel = "gemini-3.6-flash";
        continue;
      }

      console.warn(`[Gemini Rotator] ${keyDisplay} thất bại: ${lastCallError}. Đang tự động đổi sang key tiếp theo...`);
      errorsList.push(`${keyDisplay}: ${lastCallError}`);
      this.currentKeyIndex = (this.currentKeyIndex + 1) % totalKeys;
      attempts++;
    }

    const firstErr = errorsList[0] || "Lỗi không xác định";
    let helpfulTip = "";
    if (firstErr.includes("503") || firstErr.includes("high demand")) {
      helpfulTip = `\n\n💡 Nguyên nhân 503: Mô hình này đang bị quá tải tạm thời trên máy chủ Google (High Demand). Hãy chọn "Gemini 3.6 Flash" trong ⚙️ Cài đặt để hoạt động mượt mà không bị nghẽn!`;
    } else if (firstErr.includes("no longer available") || firstErr.includes("404")) {
      helpfulTip = `\n\n💡 Nguyên nhân: Mô hình đã bị Google đóng cổng. Hãy chọn "Gemini 3.6 Flash" trong ⚙️ Cài đặt.`;
    }

    throw new Error(`Đã thử toàn bộ ${totalKeys} API Key nhưng đều thất bại:\n• ${errorsList.join("\n• ")}${helpfulTip}`);
  }

  /**
   * Router điều phối gọi AI theo Provider đã chọn (Google hoặc DeepSeek)
   */
  async callAI(contents, systemInstruction = null, responseMimeType = "text/plain") {
    if (this.provider === "deepseek") {
      return await this.callDeepSeek(contents, systemInstruction, responseMimeType);
    }
    return await this.callGemini(contents, systemInstruction, responseMimeType);
  }

  /**
   * Soát lỗi chính tả, câu từ và thể thức (trả về JSON cấu trúc)
   */
  async reviewText(textToReview, hostName = "Word") {
    const systemPrompt = `Bạn là Chuyên gia ngôn ngữ và Thể thức văn bản hành chính Việt Nam (chuẩn Nghị định 30/2020/NĐ-CP).
Nhiệm vụ của bạn là đọc kỹ văn bản được cung cấp và tìm các lỗi:
1. Lỗi chính tả tiếng Việt, lỗi gõ dấu thanh, dính chữ, lặp từ.
2. Lỗi câu văn lủng củng, thiếu chủ vị hoặc dùng từ không phù hợp văn phong hành chính.
3. Lỗi căn cứ pháp lý, tên cơ quan hoặc thể thức (nếu có).

YÊU CẦU BẮT BUỘC: Bạn phải xuất kết quả theo định dạng JSON chuẩn như sau (không dùng markdown khác):
{
  "type": "review",
  "summary": "Tóm tắt ngắn gọn tình trạng văn bản (1-2 câu)",
  "issues": [
    {
      "original": "cụm từ gốc bị sai trong văn bản (phải khớp chính xác từng chữ để tìm kiếm)",
      "replacement": "cụm từ đúng đề xuất thay thế",
      "reason": "Giải thích ngắn gọn lỗi gì và tại sao sửa"
    }
  ]
}
Nếu văn bản hoàn toàn chuẩn xác không có lỗi, hãy để mảng "issues" rỗng [].`;

    const userPrompt = `Hãy rà soát kỹ văn bản trên ${hostName} sau đây:\n\n${textToReview}`;
    const rawResult = await this.callAI(
      [{ role: "user", parts: [{ text: userPrompt }] }],
      systemPrompt,
      "application/json"
    );

    try {
      return JSON.parse(rawResult);
    } catch (e) {
      return {
        type: "review",
        summary: rawResult,
        issues: []
      };
    }
  }

  /**
   * Viết lại văn bản theo văn phong hành chính chuyên nghiệp
   */
  async rewriteText(originalText) {
    const systemPrompt = `Bạn là chuyên gia biên tập văn bản hành chính công vụ và văn phòng chuyên nghiệp.
Nhiệm vụ: Viết lại đoạn văn bản được cung cấp để trở nên chuẩn xác, súc tích, trang trọng theo thể thức hành chính nhưng giữ nguyên 100% ý định và các số liệu gốc.
Trả về định dạng JSON:
{
  "type": "rewrite",
  "summary": "Những cải tiến chính đã thực hiện",
  "rewrittenText": "Toàn bộ đoạn văn bản mới đã được viết lại hoàn chỉnh"
}`;

    const userPrompt = `Đoạn văn bản cần viết lại:\n\n${originalText}`;
    const rawResult = await this.callAI(
      [{ role: "user", parts: [{ text: userPrompt }] }],
      systemPrompt,
      "application/json"
    );

    try {
      return JSON.parse(rawResult);
    } catch (e) {
      return {
        type: "rewrite",
        summary: "Đã viết lại văn bản",
        rewrittenText: rawResult
      };
    }
  }

  /**
   * Tóm tắt văn bản Word thành các gạch đầu dòng súc tích
   */
  async summarizeText(originalText) {
    const systemPrompt = `Bạn là Trợ lý Tổng hợp cho Lãnh đạo.
Nhiệm vụ: Tóm tắt văn bản được cung cấp thành tối đa 5 gạch đầu dòng súc tích:
1. Trích yếu / Mục đích chính
2. Cơ quan chủ trì / Đầu mối phối hợp
3. Nội dung & Số liệu trọng tâm
4. Đề xuất / Kiến nghị
5. Thời hạn thực hiện (nếu có)`;

    return await this.callAI(
      [{ role: "user", parts: [{ text: originalText }] }],
      systemPrompt,
      "text/plain"
    );
  }

  /**
   * Gợi ý & Chèn công thức Excel thông minh
   */
  async generateFormula(userRequirement, tableContext = "") {
    const systemPrompt = `Bạn là Chuyên gia Excel cao cấp.
Nhiệm vụ: Dựa vào yêu cầu của người dùng và ngữ cảnh bảng tính (nếu có), hãy đề xuất công thức Excel chuẩn xác nhất.
YÊU CẦU: Trả về JSON theo cấu trúc:
{
  "type": "formula",
  "formula": "=TÊN_HÀM(...)",
  "explanation": "Giải thích ngắn gọn cách hoạt động của công thức",
  "usageTip": "Hướng dẫn cách kéo copy công thức cho các hàng còn lại"
}
Lưu ý: "formula" phải bắt đầu bằng dấu "=" và có thể dùng trực tiếp trong Excel.`;

    const userPrompt = `Yêu cầu công thức: ${userRequirement}\n\nNgữ cảnh bảng/ô đang chọn:\n${tableContext || "Chưa có thông tin bảng chi tiết"}`;
    const rawResult = await this.callAI(
      [{ role: "user", parts: [{ text: userPrompt }] }],
      systemPrompt,
      "application/json"
    );

    try {
      return JSON.parse(rawResult);
    } catch (e) {
      return {
        type: "formula",
        formula: "",
        explanation: rawResult,
        usageTip: ""
      };
    }
  }

  /**
   * Chat thông minh kèm toàn bộ ngữ cảnh tài liệu và khả năng điều khiển tạo bảng/tạo sheet tự động
   */
  async chatWithContext(userPrompt, docContext = "", host = "Excel") {
    let fullPrompt = userPrompt;
    if (docContext) {
      fullPrompt = `${userPrompt}\n\n--- DỮ LIỆU ĐANG MỞ TRÊN ${host.toUpperCase()} ---\n${docContext}`;
    }

    const systemPrompt = `Bạn là Trợ lý AI cao cấp tích hợp trực tiếp bên trong Microsoft ${host}.
Bạn có khả năng đọc hiểu dữ liệu và ĐIỀU KHIỂN TỰ ĐỘNG tài liệu/bảng tính cho người dùng!

QUY TẮC PHÂN TÍCH VÀ TƯƠNG TÁC:
1. ĐỌC VÀ HIỂU BẢNG TÍNH:
- Trong phần "DỮ LIỆU ĐANG MỞ TRÊN ${host.toUpperCase()}", bạn ĐÃ CÓ TOÀN BỘ thông tin bảng tính (Tên sheet, phạm vi UsedRange, danh sách hàng tiêu đề, các cột như C Country, Handle person, REMARK... và dữ liệu các dòng).
- Khi người dùng hỏi bạn có đọc được bảng không hoặc hỏi về số liệu, HÃY TRẢ LỜI NGAY: xác nhận bạn đọc được, nêu rõ tên Sheet, kích thước bảng, danh sách các cột chính và tóm lược vài dòng dữ liệu cụ thể để người dùng an tâm.

2. TỰ ĐỘNG TẠO SHEET MỚI VÀ LẬP BẢNG BÁO CÁO (CHUẨN CHUYÊN GIA KCS / QS & TÀI CHÍNH):
Khi người dùng yêu cầu "tạo sheet mới", "lập bảng báo cáo", "tổng hợp số liệu", "trích xuất danh sách":
Ngoài lời giải thích phân tích bằng tiếng Việt thông thường, bạn BẮT BUỘC phải chèn một khối lệnh JSON trong thẻ <EXCEL_CREATE_SHEET> để Add-in tự động tạo Sheet và vẽ bảng trực tiếp vào Excel cho người dùng.

QUY CHUẨN THIẾT KẾ BẢNG (CHUẨN XLSX CHUYÊN GIA):
- Cột đầu tiên nên là "STT" (đánh số 1, 2, 3...).
- Đơn vị tính đặt gọn trong tiêu đề cột (ví dụ: "(VNĐ)", "(%)", "(Tấn)", "(Kiện)"), không lặp lại đơn vị ở từng ô thân bảng.
- 100% ô trong thân bảng là ô đơn nguyên tử (Atomic cells - tuyệt đối không merge thân bảng để đảm bảo bộ lọc và tính toán).
- Cột số liệu chỉ điền số thuần (raw numbers), Add-in sẽ tự động định dạng phân cách hàng nghìn #,##0 và căn phải.
- Dòng tổng cộng "summaryRow" tính toán chuẩn xác cho các cột định lượng.

<EXCEL_CREATE_SHEET>
{
  "sheetName": "Tên_Sheet_Viết_Gọn",
  "title": "TIÊU ĐỀ BÁO CÁO RÕ RÀNG",
  "headers": ["STT", "Chỉ tiêu / Tên danh mục", "Số lượng", "Đơn giá (VNĐ)", "Thành tiền (VNĐ)"],
  "rows": [
    [1, "Hạng mục A", 10, 1500000, 15000000],
    [2, "Hạng mục B", 5, 2000000, 10000000]
  ],
  "summaryRow": ["TỔNG CỘNG", "", 15, "", 25000000]
}
</EXCEL_CREATE_SHEET>

3. CÔNG THỨC EXCEL:
Nếu người dùng hỏi công thức, hãy đặt công thức trong dấu backtick \`=TÊN_HÀM(...)\` để người dùng bấm chèn ngay vào ô.`;

    return await this.callAI(
      [{ role: "user", parts: [{ text: fullPrompt }] }],
      systemPrompt
    );
  }

  /**
   * Phân tích nội dung Glossary CSV thành danh sách các cặp [từ_gốc, từ_dịch]
   * Lấy cảm hứng từ cơ chế ép thuật ngữ của my_translating PDF
   */
  parseGlossary(csvText) {
    if (!csvText) return [];
    const lines = csvText.split(/[\r\n]+/);
    const terms = [];
    for (const line of lines) {
      if (!line || line.startsWith("#") || line.startsWith("//")) continue;
      const parts = line.split(/[,;\t|]+/);
      if (parts.length >= 2) {
        const src = parts[0].trim();
        const tgt = parts.slice(1).join(",").trim();
        if (src && tgt) {
          terms.push({ source: src, target: tgt });
        }
      }
    }
    return terms;
  }

  /**
   * Tạo chỉ dẫn ép buộc tuân thủ bảng thuật ngữ (Zero Deviation)
   */
  buildGlossaryInstruction(glossaryCsv) {
    const terms = this.parseGlossary(glossaryCsv);
    if (terms.length === 0) return "";

    let text = "\nBẢNG THUẬT NGỮ CHUYÊN NGÀNH BẮT BUỘC (GLOSSARY ENFORCEMENT - ZERO HALLUCINATION):\n";
    text += "Khi gặp các từ/cụm từ sau trong văn bản gốc, BẮT BUỘC phải dịch chính xác theo thuật ngữ đích đã định nghĩa:\n";
    for (const t of terms) {
      text += `- "${t.source}" => "${t.target}"\n`;
    }
    text += "TUYỆT ĐỐI KHÔNG được tự ý dịch thoát nghĩa hoặc thay thế bằng từ đồng nghĩa khác cho các thuật ngữ này.\n";
    return text;
  }

  /**
   * Dịch văn bản dài / tài liệu Word / PDF Reflow
   * Hỗ trợ Song ngữ đối chiếu hoặc Thay thế trực tiếp
   */
  async translateDocument(text, { sourceLang = "zh", targetLang = "vi", glossaryCsv = "", mode = "dual" } = {}) {
    const langNames = {
      zh: "Tiếng Trung Quốc (Giản thể / Phồn thể)",
      en: "Tiếng Anh (English)",
      vi: "Tiếng Việt",
      ko: "Tiếng Hàn (Korean)",
      ja: "Tiếng Nhật (Japanese)",
      auto: "Ngôn ngữ nguồn (Tự động nhận diện)"
    };

    const sName = langNames[sourceLang] || sourceLang;
    const tName = langNames[targetLang] || targetLang;
    const glossaryInst = this.buildGlossaryInstruction(glossaryCsv);

    const isDual = mode === "dual";
    const systemPrompt = `Bạn là Chuyên gia Dịch thuật Cao cấp của Trợ lý MinhDuong84vn AI, chuyên xử lý tài liệu kỹ thuật, thương mại, hồ sơ xuất nhập khẩu và hợp đồng PDF/Word.
Nhiệm vụ: Dịch văn bản từ ${sName} sang ${tName}.

QUY TẮC DỊCH THUẬT:
1. Chuẩn hóa thuật ngữ thương mại, kỹ thuật, xuất nhập khẩu, pháp lý và hành chính. Giữ văn phong trang trọng, mượt mà, chính xác.
2. Bảo toàn tuyệt đối các mã số, số hiệu PO, quy cách SKU, đơn giá, ngày tháng, mã tiền tệ (USD, VND, RMB) và các từ viết tắt chuyên ngành.
${glossaryInst}
${isDual ? `3. ĐỊNH DẠNG XUẤT SONG NGỮ ĐỐI CHIẾU (BILINGUAL PARALLEL):
Với từng đoạn văn bản hoặc câu, hãy xuất bản dịch song ngữ:
[Câu gốc]
[Bản dịch tiếng Việt]
(Ngắt dòng rõ ràng để dễ dàng đối chiếu song song giữa bản gốc và bản dịch).` : `3. ĐỊNH DẠNG XUẤT THAY THẾ (DIRECT REPLACEMENT):
Chỉ trả về bản dịch hoàn chỉnh bằng ${tName}, giữ nguyên cấu trúc phân đoạn và thụt đầu dòng của văn bản gốc.`}`;

    return await this.callAI(
      [{ role: "user", parts: [{ text }] }],
      systemPrompt,
      "text/plain"
    );
  }

  /**
   * Dịch mảng các ô dữ liệu Excel theo lô (Batch Column Translation)
   */
  async translateBatch(items, { sourceLang = "zh", targetLang = "vi", glossaryCsv = "" } = {}) {
    if (!items || items.length === 0) return [];

    const langNames = {
      zh: "Tiếng Trung Quốc",
      en: "Tiếng Anh",
      vi: "Tiếng Việt",
      ko: "Tiếng Hàn",
      ja: "Tiếng Nhật",
      auto: "Tự động phát hiện"
    };

    const sName = langNames[sourceLang] || sourceLang;
    const tName = langNames[targetLang] || targetLang;
    const glossaryInst = this.buildGlossaryInstruction(glossaryCsv);

    const systemPrompt = `Bạn là Chuyên gia Dịch thuật Bảng tính Excel của Trợ lý MinhDuong84vn AI.
Nhiệm vụ: Dịch mảng chuỗi văn bản bảng tính sau từ ${sName} sang ${tName}.
${glossaryInst}
YÊU CẦU BẮT BUỘC VỀ ĐẦU RA:
- Đầu vào là một mảng JSON các chuỗi: ["chuỗi 1", "chuỗi 2", ...].
- Đầu ra BẮT BUỘC là một JSON Array đúng bằng số lượng phần tử của mảng đầu vào và giữ nguyên thứ tự:
["bản dịch 1", "bản dịch 2", ...]
- Chỉ trả về chuỗi JSON thuần túy, không bọc trong thẻ markdown và không có văn bản giải thích.`;

    const inputJson = JSON.stringify(items);
    const rawResult = await this.callAI(
      [{ role: "user", parts: [{ text: inputJson }] }],
      systemPrompt,
      "application/json"
    );

    try {
      let cleaned = rawResult.trim();
      if (cleaned.startsWith("```json")) {
        cleaned = cleaned.replace(/^```json\s*/, "").replace(/\s*```$/, "");
      } else if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
      }
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed)) {
        return parsed;
      }
      return items;
    } catch (e) {
      console.warn("Lỗi parse JSON kết quả dịch batch Excel, fallback dòng:", e);
      const fallbackLines = rawResult.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
      if (fallbackLines.length === items.length) {
        return fallbackLines;
      }
      return items;
    }
  }
}
