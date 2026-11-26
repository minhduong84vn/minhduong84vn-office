// src/taskpane.js
// Logic điều khiển giao diện Taskpane, gắn kết OfficeBridge và GeminiService

import { GeminiService, DEFAULT_MODEL } from "./gemini-api.js";
import { OfficeBridge } from "./office-bridge.js";

const gemini = new GeminiService();
const bridge = new OfficeBridge();

// DOM Elements
const hostBadge = document.getElementById("hostBadge");
const quickBar = document.getElementById("quickBar");
const feedArea = document.getElementById("feedArea");
const promptInput = document.getElementById("promptInput");
const btnSend = document.getElementById("btnSend");
const btnSettings = document.getElementById("btnSettings");
const settingsPanel = document.getElementById("settingsPanel");

// Provider Switcher
const tabProviderGoogle = document.getElementById("tabProviderGoogle");
const tabProviderDeepSeek = document.getElementById("tabProviderDeepSeek");
const googleSettingsGroup = document.getElementById("googleSettingsGroup");
const deepseekSettingsGroup = document.getElementById("deepseekSettingsGroup");

// Google Elements
const apiKeyInput = document.getElementById("apiKeyInput");
const modelSelect = document.getElementById("modelSelect");
const keyCounterBadge = document.getElementById("keyCounterBadge");
const customModelGroup = document.getElementById("customModelGroup");
const customModelInput = document.getElementById("customModelInput");
const btnFetchModels = document.getElementById("btnFetchModels");

// DeepSeek Elements
const deepseekKeyInput = document.getElementById("deepseekKeyInput");
const deepseekKeyBadge = document.getElementById("deepseekKeyBadge");
const deepseekModelSelect = document.getElementById("deepseekModelSelect");
const customDeepseekModelGroup = document.getElementById("customDeepseekModelGroup");
const customDeepseekModelInput = document.getElementById("customDeepseekModelInput");
const deepseekEndpointInput = document.getElementById("deepseekEndpointInput");

const btnSaveSettings = document.getElementById("btnSaveSettings");
const btnClear = document.getElementById("btnClear");
const statusText = document.getElementById("statusText");
const modelInfo = document.getElementById("modelInfo");
const chkAttachContext = document.getElementById("chkAttachContext");

// Translation & Glossary Elements
const btnTranslation = document.getElementById("btnTranslation");
const translationPanel = document.getElementById("translationPanel");
const btnCloseTranslation = document.getElementById("btnCloseTranslation");
const selSourceLang = document.getElementById("selSourceLang");
const selTargetLang = document.getElementById("selTargetLang");
const radModeDual = document.getElementById("radModeDual");
const radModeReplace = document.getElementById("radModeReplace");
const lblModeDual = document.getElementById("lblModeDual");
const lblModeReplace = document.getElementById("lblModeReplace");
const transModeHint = document.getElementById("transModeHint");
const glossaryInput = document.getElementById("glossaryInput");
const btnLoadGarmentGlossary = document.getElementById("btnLoadGarmentGlossary");
const btnLoadContractGlossary = document.getElementById("btnLoadContractGlossary");
const btnSaveGlossary = document.getElementById("btnSaveGlossary");
const btnExecuteTranslate = document.getElementById("btnExecuteTranslate");

const STORAGE_GLOSSARY = "minhduong_translation_glossary";
const STORAGE_SRC_LANG = "minhduong_source_lang";
const STORAGE_TGT_LANG = "minhduong_target_lang";

const DEFAULT_GARMENT_GLOSSARY = `# Bảng thuật ngữ Chuyên ngành May mặc & Xuất nhập khẩu (CSV)
PO,Đơn hàng PO
FOB,Giao hàng lên tàu FOB
CIF,Giá CIF gồm cước & bảo hiểm
Fabric,Vải chính
CVC,Vải sợi pha Cotton-Polyester
T/C,Vải sợi pha TC
Spandex,Sợi co giãn Spandex
Colorway,Phối màu
Cutting,Cắt vải
Sewing,May ráp
Finishing,Hoàn thiện đóng gói
Tolerance,Dung sai cho phép
Sampling,Lấy mẫu thử
Inspection,Kiểm hóa / Giám định
C/O,Chứng nhận xuất xứ C/O
Packing List,Phiếu đóng gói
Bill of Lading,Vận đơn đường biển
面料,Vải
里料,Vải lót
纽扣,Khuy / Cúc áo
拉链,Khóa kéo Zipper
尺码,Kích cỡ Size
颜色,Màu sắc
数量,Số lượng
单价,Đơn giá`;

const DEFAULT_CONTRACT_GLOSSARY = `# Bảng thuật ngữ Hợp đồng & Pháp lý (CSV)
Party A,Bên A
Party B,Bên B
Contractor,Nhà thầu
Employer,Chủ đầu tư
Governing Law,Luật điều chỉnh
Force Majeure,Sự kiện bất khả kháng
Breach of Contract,Vi phạm hợp đồng
Indemnity,Bồi thường thiệt hại
Dispute Resolution,Giải quyết tranh chấp
Arbitration,Trọng tài thương mại
Liquidation,Thanh lý hợp đồng
Warranty Period,Thời hạn bảo hành
甲方,Bên A
乙方,Bên B
违约责任,Trách nhiệm vi phạm hợp đồng
不可抗力,Bất khả kháng
争议解决,Giải quyết tranh chấp`;

let currentProvider = "google";

function updateKeyBadge() {
  if (apiKeyInput && keyCounterBadge) {
    const count = gemini.parseKeys(apiKeyInput.value).length;
    keyCounterBadge.textContent = count > 1 ? `${count} Keys (Xoay vòng)` : (count === 1 ? "1 Key" : "0 Key");
  }

  if (deepseekKeyInput && deepseekKeyBadge) {
    const dsCount = gemini.parseKeys(deepseekKeyInput.value).length;
    deepseekKeyBadge.textContent = dsCount > 1 ? `${dsCount} Keys (Xoay vòng)` : (dsCount === 1 ? "1 Key" : "0 Key");
  }
}

function updateModelDisplay() {
  if (!modelInfo) return;
  const effModel = gemini.getActiveModelDisplay();
  const keyInfo = gemini.getActiveKeyInfo();
  modelInfo.textContent = `${effModel} · ${keyInfo}`;
}

function switchProviderTab(provider) {
  currentProvider = provider;
  if (provider === "google") {
    tabProviderGoogle?.classList.add("active");
    tabProviderDeepSeek?.classList.remove("active");
    if (googleSettingsGroup) googleSettingsGroup.style.display = "block";
    if (deepseekSettingsGroup) deepseekSettingsGroup.style.display = "none";
  } else {
    tabProviderDeepSeek?.classList.add("active");
    tabProviderGoogle?.classList.remove("active");
    if (googleSettingsGroup) googleSettingsGroup.style.display = "none";
    if (deepseekSettingsGroup) deepseekSettingsGroup.style.display = "block";
  }
}

// Khởi chạy khi tài liệu tải xong
document.addEventListener("DOMContentLoaded", async () => {
  // 1. Tải cấu hình đã lưu
  const config = gemini.getConfig();
  currentProvider = config.provider || "google";
  switchProviderTab(currentProvider);

  // Google Config
  if (apiKeyInput) {
    apiKeyInput.value = config.apiKeysRaw;
  }
  if (modelSelect) {
    modelSelect.value = config.model;
    if (config.model === "custom" && customModelGroup) {
      customModelGroup.style.display = "block";
    }
  }
  if (customModelInput) {
    customModelInput.value = config.customModel;
  }

  // DeepSeek Config
  if (deepseekKeyInput) {
    deepseekKeyInput.value = config.deepseekKeysRaw || "";
  }
  if (deepseekModelSelect) {
    deepseekModelSelect.value = config.deepseekModel || "deepseek-chat";
    if (config.deepseekModel === "custom" && customDeepseekModelGroup) {
      customDeepseekModelGroup.style.display = "block";
    }
  }
  if (customDeepseekModelInput) {
    customDeepseekModelInput.value = config.customDeepseekModel || "";
  }
  if (deepseekEndpointInput) {
    deepseekEndpointInput.value = config.deepseekEndpoint || "https://api.deepseek.com/chat/completions";
  }

  updateKeyBadge();
  updateModelDisplay();

  // 2. Khởi tạo Office.js
  const ready = await bridge.initialize();
  const host = bridge.getHostName();

  if (hostBadge) {
    hostBadge.textContent = host;
    hostBadge.className = `host-badge ${host.toLowerCase()}`;
  }

  // 3. Hiển thị thanh công cụ phù hợp theo ứng dụng (Word hoặc Excel)
  renderQuickChips(host);

  // 4. Khởi tạo giao diện Dịch thuật & Thuật ngữ
  initTranslationUI(host);

  // 5. Nếu chưa có API Key, mở bảng cài đặt để nhắc người dùng
  if (!gemini.hasApiKey()) {
    openSettings();
    appendMessageBubble("bot", "👋 Chào bạn! Vui lòng nhập API Key (<b>Google Gemini</b> hoặc <b>DeepSeek</b>) trong bảng cài đặt phía trên để kích hoạt Trợ lý MinhDuong84vn AI.");
  }

  // 6. Đăng ký sự kiện người dùng
  setupEventListeners();
});

function renderQuickChips(host) {
  if (!quickBar) return;
  quickBar.innerHTML = "";

  const chips = host === "Excel" ? [
    { label: "🔤 Chuyển mã Font", action: "excel_convert_font" },
    { label: "🔤 Sắp xếp A-Z (Tên)", action: "excel_sort_vietnamese" },
    { label: "🧹 Xóa Name rác #REF", action: "excel_clean_names" },
    { label: "🎨 Tô màu xen kẽ", action: "excel_zebra" },
    { label: "🗑️ Xóa hàng trắng", action: "excel_delete_empty_rows" },
    { label: "🔠 Đổi HOA/thường", action: "excel_change_case" },
    { label: "🌐 Dịch cột dữ liệu", action: "excel_translate" },
    { label: "ƒx Gợi ý công thức", action: "excel_formula" },
    { label: "📐 Chuẩn hóa bảng KCS/QS", action: "excel_format_kcs_qs" },
    { label: "🔢 STT khi lọc (SUBTOTAL)", action: "excel_subtotal" },
    { label: "✂️ Tách Họ & Tên", action: "excel_split_name" },
    { label: "💵 Đổi số thành chữ VND", action: "excel_num_to_words" },
    { label: "🧹 Chuẩn hóa văn bản", action: "excel_clean_text" },
    { label: "🔎 Quét ô lỗi công thức", action: "excel_scan_errors" },
    { label: "📊 Viết báo cáo từ bảng", action: "excel_report" }
  ] : [
    { label: "🔤 Chuyển mã Font", action: "word_convert_font" },
    { label: "📅 Chèn ngày tháng", action: "word_insert_admin_date" },
    { label: "🔠 Đổi HOA/thường", action: "word_change_case" },
    { label: "📐 Căn lề chuẩn NĐ 30", action: "word_format_nd30" },
    { label: "📑 Mẫu văn bản NĐ 30", action: "word_templates" },
    { label: "🌐 Dịch thuật / Song ngữ", action: "word_translate" },
    { label: "🔴 Soát lỗi & Bôi màu", action: "word_review" },
    { label: "✍️ Viết lại trang trọng", action: "word_rewrite" },
    { label: "💡 Tóm tắt văn bản", action: "word_summarize" }
  ];

  chips.forEach(c => {
    const btn = document.createElement("button");
    btn.className = "chip";
    btn.textContent = c.label;
    btn.onclick = () => handleQuickAction(c.action);
    quickBar.appendChild(btn);
  });
}

function setupEventListeners() {
  btnSettings?.addEventListener("click", () => {
    settingsPanel.classList.toggle("open");
  });

  tabProviderGoogle?.addEventListener("click", () => switchProviderTab("google"));
  tabProviderDeepSeek?.addEventListener("click", () => switchProviderTab("deepseek"));

  apiKeyInput?.addEventListener("input", () => {
    updateKeyBadge();
  });

  deepseekKeyInput?.addEventListener("input", () => {
    updateKeyBadge();
  });

  modelSelect?.addEventListener("change", () => {
    if (customModelGroup) {
      customModelGroup.style.display = modelSelect.value === "custom" ? "block" : "none";
    }
  });

  deepseekModelSelect?.addEventListener("change", () => {
    if (customDeepseekModelGroup) {
      customDeepseekModelGroup.style.display = deepseekModelSelect.value === "custom" ? "block" : "none";
    }
  });

  const btnFetchModels = document.getElementById("btnFetchModels");
  btnFetchModels?.addEventListener("click", async () => {
    const rawKeys = apiKeyInput?.value || "";
    const parsed = gemini.parseKeys(rawKeys);
    if (parsed.length === 0) {
      alert("Vui lòng nhập ít nhất 1 API Key vào ô trên trước khi bấm tải danh sách mô hình.");
      return;
    }

    btnFetchModels.disabled = true;
    btnFetchModels.textContent = "⏳ Đang kết nối Google...";

    let models = null;
    let successfulKeyIndex = -1;
    const errors = [];

    // Thử lần lượt từng API Key trong danh sách để tìm key hoạt động tốt
    for (let i = 0; i < parsed.length; i++) {
      try {
        const list = await gemini.fetchAvailableModels(parsed[i]);
        if (list && list.length > 0) {
          models = list;
          successfulKeyIndex = i + 1;
          break;
        }
      } catch (err) {
        errors.push(`Key #${i + 1}: ${err.message}`);
      }
    }

    if (models && models.length > 0 && modelSelect) {
      modelSelect.innerHTML = "";
      models.forEach(m => {
        const opt = document.createElement("option");
        opt.value = m.id;
        opt.textContent = m.displayName;
        modelSelect.appendChild(opt);
      });

      const optCustom = document.createElement("option");
      optCustom.value = "custom";
      optCustom.textContent = "✏️ Nhập mã mô hình khác thủ công...";
      modelSelect.appendChild(optCustom);

      // Ưu tiên chọn Gemini 3.6 Flash (ổn định nhất, không bị 503) hoặc 3.8
      const preferred = models.find(m => m.id === "gemini-3.6-flash") ||
                        models.find(m => m.id.includes("3.6-flash")) ||
                        models.find(m => m.id === "gemini-3.8-flash") ||
                        models.find(m => m.id.includes("flash")) ||
                        models[0];
      if (preferred) {
        modelSelect.value = preferred.id;
      }

      btnFetchModels.textContent = `✓ Đã tải ${models.length} model`;
      alert(`✅ Kết nối Google thành công (thông qua Key #${successfulKeyIndex})!\n\nĐã tải được ${models.length} mô hình AI khả dụng cho tài khoản của bạn. Đã tự động chọn mô hình tối ưu nhất: "${modelSelect.value}".\n\nHãy bấm nút "Lưu cấu hình" bên dưới để áp dụng.`);
      setTimeout(() => {
        btnFetchModels.textContent = "🔄 Lấy danh sách từ Google";
        btnFetchModels.disabled = false;
      }, 4000);
    } else {
      alert(`❌ Không thể lấy danh sách mô hình từ Google:\n\n${errors.join("\n")}\n\n💡 Hướng dẫn:\n1. Hãy đảm bảo API Key được tạo từ https://aistudio.google.com/app/apikey (Google AI Studio).\n2. Nếu tạo trên Google Cloud Console, hãy đảm bảo đã BẬT "Generative Language API" trong phần APIs & Services.`);
      btnFetchModels.textContent = "🔄 Thử lại";
      btnFetchModels.disabled = false;
    }
  });

  btnSaveSettings?.addEventListener("click", () => {
    gemini.saveConfig({
      provider: currentProvider,
      rawKeys: apiKeyInput?.value || "",
      model: modelSelect?.value || "",
      customModel: customModelInput ? customModelInput.value : "",
      deepseekRawKeys: deepseekKeyInput?.value || "",
      deepseekModel: deepseekModelSelect?.value || "",
      customDeepseekModel: customDeepseekModelInput ? customDeepseekModelInput.value : "",
      deepseekEndpoint: deepseekEndpointInput ? deepseekEndpointInput.value : ""
    });
    
    updateKeyBadge();
    updateModelDisplay();
    
    settingsPanel.classList.remove("open");
    const effModel = gemini.getActiveModelDisplay();
    const count = gemini.getKeyCount();
    const provName = currentProvider === "deepseek" ? "DeepSeek / Mô hình mở" : "Google Gemini";
    setStatus("✅ Đã lưu cấu hình!");
    appendMessageBubble("bot", `✅ Cấu hình thành công! Đang sử dụng <b>${provName}</b> (Mô hình: <b>${effModel}</b>) với <b>${count} API Key</b> sẵn sàng.`);
  });

  btnClear?.addEventListener("click", () => {
    if (feedArea) feedArea.innerHTML = "";
    setStatus("✦ Đã dọn sạch hội thoại");
  });

  btnSend?.addEventListener("click", () => handleUserSend());

  promptInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleUserSend();
    }
  });

  // Translation & Glossary Listeners
  btnTranslation?.addEventListener("click", () => {
    if (translationPanel) {
      const isVisible = translationPanel.style.display !== "none" && translationPanel.classList.contains("open");
      if (isVisible) {
        translationPanel.style.display = "none";
        translationPanel.classList.remove("open");
      } else {
        translationPanel.style.display = "block";
        translationPanel.classList.add("open");
      }
    }
  });

  btnCloseTranslation?.addEventListener("click", () => {
    if (translationPanel) {
      translationPanel.style.display = "none";
      translationPanel.classList.remove("open");
    }
  });

  btnLoadGarmentGlossary?.addEventListener("click", () => {
    if (glossaryInput) glossaryInput.value = DEFAULT_GARMENT_GLOSSARY;
  });

  btnLoadContractGlossary?.addEventListener("click", () => {
    if (glossaryInput) glossaryInput.value = DEFAULT_CONTRACT_GLOSSARY;
  });

  btnSaveGlossary?.addEventListener("click", () => {
    if (glossaryInput) localStorage.setItem(STORAGE_GLOSSARY, glossaryInput.value);
    if (selSourceLang) localStorage.setItem(STORAGE_SRC_LANG, selSourceLang.value);
    if (selTargetLang) localStorage.setItem(STORAGE_TGT_LANG, selTargetLang.value);
    setStatus("✅ Đã lưu từ điển!");
    appendMessageBubble("bot", "💾 <b>Đã lưu bộ từ điển thuật ngữ CSV thành công!</b> AI sẽ luôn tuân thủ các thuật ngữ này khi dịch.");
  });

  lblModeDual?.addEventListener("click", () => {
    const radio = document.getElementById("radModeDual");
    if (radio) radio.checked = true;
    lblModeDual.classList.add("active");
    if (lblModeReplace) lblModeReplace.classList.remove("active");
    updateTransModeHint();
  });

  lblModeReplace?.addEventListener("click", () => {
    const radio = document.getElementById("radModeReplace");
    if (radio) radio.checked = true;
    lblModeReplace.classList.add("active");
    if (lblModeDual) lblModeDual.classList.remove("active");
    updateTransModeHint();
  });

  btnExecuteTranslate?.addEventListener("click", () => {
    executeTranslation();
  });
}

function openSettings() {
  if (settingsPanel) settingsPanel.classList.add("open");
}

function setStatus(text) {
  if (statusText) statusText.textContent = text;
}

// Xử lý gửi tin nhắn tự do từ ô nhập
async function handleUserSend() {
  const text = promptInput?.value?.trim();
  if (!text) return;

  promptInput.value = "";
  appendMessageBubble("user", text);
  const provName = gemini.provider === "deepseek" ? "DeepSeek" : "Gemini";
  setStatus(`⏳ Đang đọc dữ liệu & hỏi ${provName}...`);

  try {
    let docContext = "";
    const host = bridge.getHostName();
    if (chkAttachContext?.checked) {
      docContext = host === "Excel" 
        ? await bridge.getExcelContext()
        : await bridge.getWordContext();
    }

    const reply = await gemini.chatWithContext(text, docContext, host);
    renderBotReplyWithActions(reply);
    setStatus("✦ Sẵn sàng");
    updateModelDisplay();
  } catch (err) {
    appendMessageBubble("bot", `❌ ${err.message}`);
    setStatus("❌ Có lỗi xảy ra");
    updateModelDisplay();
  }
}

// Xử lý các nút bấm hành động nhanh
async function handleQuickAction(actionCode) {
  const localActions = [
    "word_format_nd30", "excel_subtotal", "excel_split_name", "excel_num_to_words",
    "excel_clean_text", "excel_scan_errors", "word_templates",
    "excel_convert_font", "word_convert_font", "excel_sort_vietnamese",
    "excel_clean_names", "excel_delete_empty_rows", "excel_zebra",
    "word_insert_admin_date", "word_change_case", "excel_change_case"
  ];

  if (!gemini.hasApiKey() && !localActions.includes(actionCode)) {
    openSettings();
    appendMessageBubble("bot", "⚠️ Vui lòng cấu hình API Key trong bảng cài đặt phía trên trước khi sử dụng tính năng AI.");
    return;
  }

  const host = bridge.getHostName();

  // ==========================================
  // TIỆN ÍCH VĂN PHÒNG VIỆT NAM (KẾ THỪA V3.4 - CHẠY OFFLINE 100%)
  // ==========================================

  // 1. Chuyển đổi mã font (TCVN3, VNI ➔ Unicode chuẩn)
  if (actionCode === "excel_convert_font" || actionCode === "word_convert_font") {
    const isWord = actionCode === "word_convert_font";
    const bubble = appendMessageBubble("bot", `
      <b>🔤 CHUYỂN ĐỔI MÃ FONT TIẾNG VIỆT TOÀN DIỆN</b><br/>
      <small style="color: #64748b;">(Tích hợp từ Tiện ích văn phòng v3.4 - Khắc phục triệt để lỗi gõ font cũ)</small><br/>
      • Nhận diện hoặc ép mã nguồn: <b>TCVN3 (.VnTime, .VnArial)</b>, <b>VNI-Windows (VNI-Times)</b>.<br/>
      • Đích chuyển đổi: <b>Unicode dựng sẵn (Times New Roman)</b>.<br/>
      <div style="margin-top: 8px; display: flex; flex-direction: column; gap: 6px;">
        <div style="display: flex; gap: 6px; align-items: center;">
          <label style="font-size: 11px; font-weight: 600;">Mã nguồn:</label>
          <select class="select-input font-src-select" style="font-size: 11px; padding: 3px 6px; flex: 1;">
            <option value="auto">🌐 Tự động nhận diện (Khuyên dùng)</option>
            <option value="tcvn3">TCVN3 / ABC (.VnTime, .VnArial...)</option>
            <option value="vni">VNI-Windows (VNI-Times...)</option>
          </select>
        </div>
        <button type="button" class="btn-primary btn-do-convert-font" style="padding: 6px 12px; font-size: 12px;">
          ⚡ Bắt đầu chuyển mã ${isWord ? 'vùng chọn (hoặc toàn tài liệu)' : 'vùng ô đang chọn'}
        </button>
      </div>
    `);

    const sel = bubble.querySelector(".font-src-select");
    const btn = bubble.querySelector(".btn-do-convert-font");
    btn.onclick = async () => {
      btn.disabled = true;
      btn.textContent = "⏳ Đang chuyển đổi mã font...";
      setStatus("⏳ Đang chuyển đổi mã font...");
      try {
        const sourceEncoding = sel.value;
        const res = await bridge.convertSelectionFont(sourceEncoding);
        if (res.success) {
          const targetName = isWord ? `${res.count} ký tự` : `${res.count} ô`;
          btn.textContent = `✓ Đã chuyển đổi thành công ${targetName}!`;
          setStatus(`✓ Đã đổi ${targetName} sang Unicode`);
          appendMessageBubble("bot", `✅ <b>Chuyển mã thành công!</b> Đã xử lý ${targetName} sang Unicode dựng sẵn (Font Times New Roman).`);
        } else {
          btn.disabled = false;
          btn.textContent = "⚡ Thử lại";
          appendMessageBubble("bot", `⚠️ ${res.message || "Không thể chuyển mã."}`);
          setStatus("✦ Hướng dẫn");
        }
      } catch (err) {
        btn.disabled = false;
        btn.textContent = "⚡ Thử lại";
        appendMessageBubble("bot", `❌ Lỗi: ${err.message}`);
        setStatus("❌ Lỗi chuyển font");
      }
    };
    return;
  }

  // 2. Sắp xếp danh sách tiếng Việt chuẩn A-Z (Tên trước, Họ sau) trên Excel
  if (actionCode === "excel_sort_vietnamese") {
    setStatus("⏳ Đang sắp xếp danh sách tiếng Việt...");
    try {
      const res = await bridge.sortVietnameseColumnExcel();
      if (res.success) {
        appendMessageBubble("bot", `✅ <b>Đã sắp xếp danh sách tiếng Việt A-Z thành công cho ${res.rowCount} hàng!</b><br/><small style="color: #64748b;">(Tên đứng trước để xếp theo vần A-Z, Họ đệm xét thứ hai - Chuẩn bảng điểm & danh sách nhân sự Việt Nam).</small>`);
        setStatus(`✓ Đã xếp ${res.rowCount} hàng A-Z`);
      } else {
        appendMessageBubble("bot", `⚠️ ${res.message}`);
        setStatus("✦ Hướng dẫn");
      }
    } catch (err) {
      appendMessageBubble("bot", `❌ Lỗi: ${err.message}`);
      setStatus("❌ Lỗi sắp xếp");
    }
    return;
  }

  // 3. Quét & dọn sạch Defined Names rác, Name lỗi #REF! trên Excel
  if (actionCode === "excel_clean_names") {
    setStatus("⏳ Đang quét và dọn sạch Defined Names rác...");
    try {
      const res = await bridge.cleanExcelNames();
      if (res.success) {
        appendMessageBubble("bot", `🧹 <b>Đã dọn dẹp Defined Names rác trên Workbook!</b><br/>• Tổng số Name: <b>${res.total}</b><br/>• Đã xóa Name rác / lỗi #REF! / Name ẩn: <b style="color: #b91c1c;">${res.deleted}</b><br/>• Name hợp lệ còn lại: <b style="color: #15803d;">${res.remaining}</b><br/><small style="color: #64748b;">Giúp file Excel nhẹ hơn và không còn cảnh báo lỗi liên kết Name khi mở file.</small>`);
        setStatus(`✓ Đã dọn ${res.deleted} name rác`);
      } else {
        appendMessageBubble("bot", `⚠️ ${res.message}`);
        setStatus("✦ Hướng dẫn");
      }
    } catch (err) {
      appendMessageBubble("bot", `❌ Lỗi: ${err.message}`);
      setStatus("❌ Lỗi dọn name");
    }
    return;
  }

  // 4. Xóa hàng trắng không có dữ liệu trên Excel
  if (actionCode === "excel_delete_empty_rows") {
    setStatus("⏳ Đang tìm và xóa các hàng trắng...");
    try {
      const res = await bridge.deleteEmptyRowsExcel();
      if (res.success) {
        appendMessageBubble("bot", `🗑️ <b>Đã xóa thành công ${res.deletedCount} hàng trắng!</b><br/><small style="color: #64748b;">Bảng tính đã được co gọn lại, loại bỏ các khoảng trống thừa.</small>`);
        setStatus(`✓ Đã xóa ${res.deletedCount} hàng trắng`);
      } else {
        appendMessageBubble("bot", `⚠️ ${res.message}`);
        setStatus("✦ Hướng dẫn");
      }
    } catch (err) {
      appendMessageBubble("bot", `❌ Lỗi: ${err.message}`);
      setStatus("❌ Lỗi xóa hàng");
    }
    return;
  }

  // 5. Tô màu xen kẽ các hàng (Zebra Striping) trên Excel
  if (actionCode === "excel_zebra") {
    setStatus("⏳ Đang tô màu xen kẽ các hàng...");
    try {
      const res = await bridge.applyZebraStripingExcel("#F8FAFC", "#FFFFFF");
      if (res.success) {
        appendMessageBubble("bot", `🎨 <b>Đã tô màu xen kẽ (Zebra Striping) thành công cho ${res.rowCount} hàng!</b><br/><small style="color: #64748b;">Bảng tính trông chuyên nghiệp và dễ dò dòng dữ liệu hơn.</small>`);
        setStatus(`✓ Đã tô màu ${res.rowCount} hàng`);
      } else {
        appendMessageBubble("bot", `⚠️ ${res.message}`);
        setStatus("✦ Hướng dẫn");
      }
    } catch (err) {
      appendMessageBubble("bot", `❌ Lỗi: ${err.message}`);
      setStatus("❌ Lỗi tô màu");
    }
    return;
  }

  // 6. Chèn câu địa danh ngày tháng hành chính trên Word
  if (actionCode === "word_insert_admin_date") {
    const bubble = appendMessageBubble("bot", `
      <b>📅 CHÈN ĐỊA DANH NGÀY THÁNG CHUẨN NGHỊ ĐỊNH 30</b><br/>
      <small style="color: #64748b;">Chèn câu ngày tháng thể thức văn bản hành chính Việt Nam (in nghiêng, căn phải, Times New Roman 13pt):</small>
      <div style="margin-top: 8px; display: flex; flex-direction: column; gap: 6px;">
        <div style="display: flex; gap: 4px; flex-wrap: wrap;">
          <button class="btn-act date-loc-btn" data-loc="Hà Nội">Hà Nội</button>
          <button class="btn-act date-loc-btn" data-loc="TP. Hồ Chí Minh">TP. Hồ Chí Minh</button>
          <button class="btn-act date-loc-btn" data-loc="Đà Nẵng">Đà Nẵng</button>
          <button class="btn-act date-loc-btn" data-loc="Hải Phòng">Hải Phòng</button>
          <button class="btn-act date-loc-btn" data-loc="Cần Thơ">Cần Thơ</button>
        </div>
        <div style="display: flex; gap: 6px; align-items: center;">
          <input type="text" class="input-text custom-loc-input" placeholder="Hoặc gõ Tỉnh/Thành khác..." style="font-size: 11px;" value="Hà Nội" />
          <button type="button" class="btn-primary btn-do-insert-date" style="padding: 4px 10px; font-size: 11px; white-space: nowrap;">Chèn ngay ✍️</button>
        </div>
      </div>
    `);

    const locInp = bubble.querySelector(".custom-loc-input");
    const insertBtn = bubble.querySelector(".btn-do-insert-date");

    bubble.querySelectorAll(".date-loc-btn").forEach(b => {
      b.onclick = () => {
        if (locInp) locInp.value = b.getAttribute("data-loc");
        insertBtn.click();
      };
    });

    insertBtn.onclick = async () => {
      const loc = locInp.value.trim() || "Hà Nội";
      insertBtn.disabled = true;
      insertBtn.textContent = "⏳ Đang chèn...";
      setStatus("⏳ Đang chèn địa danh ngày tháng...");
      try {
        const res = await bridge.insertAdminDateWord(loc);
        if (res.success) {
          appendMessageBubble("bot", `✅ <b>Đã chèn thành công:</b> <i>"${res.text}"</i>`);
          setStatus("✓ Đã chèn ngày tháng");
        } else {
          appendMessageBubble("bot", `⚠️ ${res.message}`);
          setStatus("✦ Hướng dẫn");
        }
      } catch (err) {
        appendMessageBubble("bot", `❌ Lỗi: ${err.message}`);
        setStatus("❌ Lỗi");
      }
    };
    return;
  }

  // 7. Chuyển đổi kiểu chữ (Hoa / Thường / Tiêu đề / Đầu câu) cho Word & Excel
  if (actionCode === "word_change_case" || actionCode === "excel_change_case") {
    const isWord = actionCode === "word_change_case";
    const bubble = appendMessageBubble("bot", `
      <b>🔠 CHUYỂN ĐỔI KIỂU CHỮ (HOA / THƯỜNG / TIÊU ĐỀ)</b><br/>
      <small style="color: #64748b;">(Tương tự tiện ích Change Case v3.4 - Hỗ trợ đầy đủ tiếng Việt có dấu):</small>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-top: 8px;">
        <button class="btn-act apply case-btn" data-case="upper" style="padding: 6px 8px; text-align: center;">🔠 CHỮ HOA TOÀN BỘ</button>
        <button class="btn-act apply case-btn" data-case="lower" style="padding: 6px 8px; text-align: center;">🔡 chữ thường toàn bộ</button>
        <button class="btn-act apply case-btn" data-case="title" style="padding: 6px 8px; text-align: center;">🔤 Viết Hoa Đầu Từ</button>
        <button class="btn-act apply case-btn" data-case="sentence" style="padding: 6px 8px; text-align: center;">📝 Viết hoa đầu câu</button>
      </div>
    `);

    bubble.querySelectorAll(".case-btn").forEach(btn => {
      btn.onclick = async () => {
        const caseType = btn.getAttribute("data-case");
        btn.disabled = true;
        btn.textContent = "⏳ Đang đổi...";
        setStatus("⏳ Đang chuyển đổi kiểu chữ...");
        try {
          const res = await bridge.changeSelectionCase(caseType);
          if (res.success) {
            const detail = isWord ? `văn bản đã chọn` : `${res.count} ô`;
            appendMessageBubble("bot", `✅ <b>Đã đổi kiểu chữ thành công cho ${detail}!</b>`);
            setStatus("✓ Đã đổi kiểu chữ");
          } else {
            appendMessageBubble("bot", `⚠️ ${res.message}`);
            setStatus("✦ Hướng dẫn");
          }
        } catch (err) {
          appendMessageBubble("bot", `❌ Lỗi: ${err.message}`);
          setStatus("❌ Lỗi đổi chữ");
        }
      };
    });
    return;
  }

  // 0. Mở bảng Dịch thuật & Thuật ngữ
  if (actionCode === "word_translate" || actionCode === "excel_translate") {
    if (translationPanel) {
      translationPanel.style.display = "block";
      translationPanel.classList.add("open");
    }
    const isWord = actionCode === "word_translate";
    appendMessageBubble("bot", isWord 
      ? `🌐 <b>Bảng điều khiển Dịch thuật & Song ngữ (Word/PDF) đã mở!</b><br/>
• Mặc định cặp ngôn ngữ: <b>🇨🇳 Tiếng Trung ➔ 🇻🇳 Tiếng Việt</b> (hoặc Anh, Hàn, Nhật).<br/>
• Chế độ: <b>📖 Song ngữ đối chiếu</b> (khuyên dùng khi đọc tài liệu PDF/Hợp đồng) hoặc Thay thế.<br/>
• Đã nạp sẵn bộ <b>Từ điển thuật ngữ ép chuẩn CSV</b> (May mặc / XNK / Hợp đồng).<br/>
• Bấm nút <b>🚀 Bắt đầu dịch ngay</b> ở bảng trên để xử lý vùng bôi đen (hoặc toàn bài).`
      : `🌐 <b>Bảng điều khiển Dịch dữ liệu bảng tính Excel đã mở!</b><br/>
• Quét chọn cột chứa văn bản tiếng Trung hoặc tiếng Anh cần dịch.<br/>
• Chế độ mặc định: <b>➡️ Điền sang cột bên cạnh</b> (giữ nguyên dữ liệu gốc).<br/>
• Đã tích hợp bộ <b>Từ điển thuật ngữ ép chuẩn CSV</b> để không dịch sai thuật ngữ ngành.<br/>
• Bấm <b>🚀 Bắt đầu dịch ngay</b> ở bảng trên để AI dịch và tự động điền kết quả.`);
    return;
  }

  // 1. Căn lề Nghị định 30 (chạy trực tiếp không cần gọi AI)
  if (actionCode === "word_format_nd30") {
    setStatus("⏳ Đang định dạng trang in...");
    const ok = await bridge.formatWordDecree30();
    if (ok) {
      appendMessageBubble("bot", "✅ <b>Đã căn lề trang in chuẩn Nghị định 30/2020/NĐ-CP thành công!</b><br/>• Lề trên: 20mm<br/>• Lề dưới: 20mm<br/>• Lề trái: 30mm<br/>• Lề phải: 15mm<br/>• Font: Times New Roman 13pt.");
      setStatus("✦ Đã hoàn tất căn lề");
    }
    return;
  }

  // 2. Chèn công thức SUBTOTAL khi lọc Excel (chạy trực tiếp)
  if (actionCode === "excel_subtotal") {
    setStatus("⏳ Đang chèn công thức SUBTOTAL...");
    const formula = await bridge.insertSubtotalSequence();
    if (formula) {
      appendMessageBubble("bot", `✅ Đã chèn công thức đánh STT tự động vào ô đang chọn:<br/><div class="formula-box">${formula}</div>Kéo ô này xuống các hàng dưới để đánh số tự động.`);
      setStatus("✦ Đã chèn công thức");
    }
    return;
  }

  // 3. Quét ô lỗi công thức trên Excel
  if (actionCode === "excel_scan_errors") {
    setStatus("⏳ Đang quét bảng tính...");
    const errors = await bridge.scanExcelErrors();
    if (errors.length === 0) {
      appendMessageBubble("bot", "🟢 Tuyệt vời! Không phát hiện ô nào bị lỗi công thức (#REF!, #DIV/0!, #N/A...) trong vùng sử dụng.");
    } else {
      let msg = `⚠️ <b>Phát hiện ${errors.length} ô bị lỗi công thức:</b><br/>`;
      errors.forEach(e => {
        msg += `• Hàng ${e.row}, Cột ${e.col}: <b style="color:red">${e.error}</b><br/>`;
      });
      appendMessageBubble("bot", msg);
    }
    setStatus("✦ Quét hoàn tất");
    return;
  }

  // 4. Tiện ích Tách Họ và Tên (chạy trực tiếp không cần AI)
  if (actionCode === "excel_split_name") {
    setStatus("⏳ Đang tách Họ và Tên...");
    const res = await bridge.splitNameColumn();
    if (res.success) {
      appendMessageBubble("bot", `✅ <b>Đã tách thành công Họ và Tên cho ${res.count} dòng!</b><br/><small style="color: #64748b;">Kết quả đã được điền tự động vào 2 cột liền kề bên phải (Cột Họ đệm & Cột Tên).</small>`);
      setStatus(`✓ Đã tách ${res.count} dòng`);
    } else {
      appendMessageBubble("bot", `⚠️ ${res.message}`);
      setStatus("✦ Hướng dẫn");
    }
    return;
  }

  // 5. Tiện ích Đổi số tiền thành chữ VND (chạy trực tiếp)
  if (actionCode === "excel_num_to_words") {
    setStatus("⏳ Đang đọc số tiền thành chữ VND...");
    const res = await bridge.convertNumberToWordsVND();
    if (res.success) {
      appendMessageBubble("bot", `✅ <b>Đã đổi thành chữ cho ${res.count} ô số tiền!</b><br/><small style="color: #64748b;">Kết quả đã được ghi vào cột bên cạnh theo chuẩn văn bản tài chính tiếng Việt.</small>`);
      setStatus(`✓ Đã đọc ${res.count} ô tiền`);
    } else {
      appendMessageBubble("bot", `⚠️ ${res.message}`);
      setStatus("✦ Hướng dẫn");
    }
    return;
  }

  // 6. Tiện ích Chuẩn hóa văn bản Excel (chạy trực tiếp)
  if (actionCode === "excel_clean_text") {
    setStatus("⏳ Đang chuẩn hóa văn bản...");
    const res = await bridge.cleanTextSelection();
    if (res.success) {
      appendMessageBubble("bot", `✅ <b>Đã chuẩn hóa ${res.cells} ô văn bản!</b><br/><small style="color: #64748b;">Đã xóa khoảng trắng thừa ở đầu/giữa/cuối và viết hoa chữ cái đầu danh từ chuẩn xác.</small>`);
      setStatus("✓ Đã chuẩn hóa văn bản");
    }
    return;
  }

  // 7. Tiện ích Chuẩn hóa bảng KCS / QS (chạy trực tiếp không cần AI)
  if (actionCode === "excel_format_kcs_qs") {
    setStatus("⏳ Đang chuẩn hóa bảng KCS/QS...");
    const res = await bridge.formatTableKcsQs();
    if (res.success) {
      appendMessageBubble("bot", `✅ <b>Đã chuẩn hóa bảng dữ liệu chuẩn KCS/QS thành công!</b> (${res.address}: ${res.rows} hàng, ${res.cols} cột)<br/>• Header: Xanh Navy #1E3A8A, chữ trắng bold, wrap text.<br/>• Cố định Freeze Panes ngay dưới hàng tiêu đề.<br/>• Tự động căn lề: Cột STT căn giữa, Cột số/tiền căn phải, Cột chữ căn trái.<br/>• Viền Hairline thanh thoát chống rối mắt.`);
      setStatus("✓ Đã chuẩn hóa bảng KCS/QS");
    } else {
      appendMessageBubble("bot", `⚠️ ${res.message}`);
      setStatus("✦ Hướng dẫn");
    }
    return;
  }

  // 8. Kho mẫu văn bản chuẩn Nghị định 30 trên Word (Trọn bộ 9 mẫu từ Skill Xử Lý Văn Phòng)
  if (actionCode === "word_templates") {
    const bubble = appendMessageBubble("bot", `
      <b>📑 KHO VĂN BẢN MẪU CHUẨN NGHỊ ĐỊNH 30/2020/NĐ-CP:</b><br/>
      <small style="color: #64748b;">(Tích hợp từ Skill Xử Lý Văn Phòng Chuyên Gia) Bấm chọn để chèn trực tiếp khung sườn chuẩn:</small>
      <div style="display: grid; grid-template-columns: 1fr; gap: 5px; margin-top: 8px;">
        <button class="btn-act apply" data-tpl="cong_van" style="text-align: left; padding: 5px 8px;">📄 1. Công văn hành chính chỉ đạo</button>
        <button class="btn-act apply" data-tpl="to_trinh" style="text-align: left; padding: 5px 8px;">📑 2. Tờ trình đề xuất phê duyệt</button>
        <button class="btn-act apply" data-tpl="quyet_dinh" style="text-align: left; padding: 5px 8px;">⚖️ 3. Quyết định cá biệt</button>
        <button class="btn-act apply" data-tpl="bao_cao" style="text-align: left; padding: 5px 8px;">📊 4. Báo cáo định kỳ / tổng kết công tác</button>
        <button class="btn-act apply" data-tpl="bien_ban" style="text-align: left; padding: 5px 8px;">📝 5. Biên bản cuộc họp / làm việc</button>
        <button class="btn-act apply" data-tpl="thong_bao" style="text-align: left; padding: 5px 8px;">📢 6. Thông báo chỉ đạo / kết luận</button>
        <button class="btn-act apply" data-tpl="giay_moi" style="text-align: left; padding: 5px 8px;">✉️ 7. Giấy mời họp</button>
        <button class="btn-act apply" data-tpl="giay_uy_quyen" style="text-align: left; padding: 5px 8px;">🤝 8. Giấy ủy quyền công tác</button>
        <button class="btn-act apply" data-tpl="ke_hoach" style="text-align: left; padding: 5px 8px;">📅 9. Kế hoạch công tác</button>
      </div>
    `);

    bubble.querySelectorAll("button[data-tpl]").forEach(btn => {
      btn.onclick = async () => {
        const tplType = btn.getAttribute("data-tpl");
        btn.disabled = true;
        btn.textContent = "⏳ Đang chèn mẫu...";
        setStatus("⏳ Đang chèn mẫu chuẩn NĐ 30...");
        await bridge.insertWordDecree30Template(tplType);
        btn.textContent = "✓ Đã chèn thành công vào Word!";
        setStatus("✓ Đã chèn mẫu");
      };
    });
    return;
  }

  // CÁC TÁC VỤ GỌI GEMINI / DEEPSEEK AI:
  setStatus("⏳ Đang đọc văn bản & gọi AI...");

  if (actionCode === "word_review") {
    appendMessageBubble("user", "🔴 Soát lỗi chính tả & thể thức văn bản");
    const docText = await bridge.getWordContext();
    if (!docText || docText.trim().length === 0) {
      appendMessageBubble("bot", "⚠️ Tài liệu đang mở chưa có nội dung văn bản để rà soát.");
      setStatus("✦ Hoàn tất");
      return;
    }

    try {
      const result = await gemini.reviewText(docText, host);
      renderReviewResults(result);
      // Tự động tô màu đỏ/vàng trên file Word
      if (result.issues && result.issues.length > 0) {
        const highlightedCount = await bridge.highlightWordIssues(result.issues);
        setStatus(`🔴 Đã bôi màu ${highlightedCount} vị trí trên Word`);
      } else {
        setStatus("🟢 Văn bản chuẩn xác");
      }
    } catch (err) {
      appendMessageBubble("bot", `❌ Lỗi: ${err.message}`);
      setStatus("❌ Lỗi AI");
    }
    return;
  }

  if (actionCode === "word_rewrite") {
    appendMessageBubble("user", "✍️ Viết lại câu văn theo chuẩn hành chính");
    const docText = await bridge.getWordContext();
    if (!docText || docText.trim().length === 0) {
      appendMessageBubble("bot", "⚠️ Vui lòng bôi đen đoạn văn bản cần viết lại.");
      setStatus("✦ Hoàn tất");
      return;
    }

    try {
      const result = await gemini.rewriteText(docText);
      renderRewriteResult(result);
      setStatus("✦ Đã viết lại");
    } catch (err) {
      appendMessageBubble("bot", `❌ Lỗi: ${err.message}`);
      setStatus("❌ Lỗi AI");
    }
    return;
  }

  if (actionCode === "word_summarize") {
    appendMessageBubble("user", "💡 Tóm tắt văn bản cho lãnh đạo");
    const docText = await bridge.getWordContext();
    if (!docText) return;

    try {
      const summary = await gemini.summarizeText(docText);
      appendMessageBubble("bot", `<b>TÓM TẮT VĂN BẢN (5 Ý CHÍNH):</b><br/><br/>${summary.replace(/\n/g, '<br/>')}`);
      setStatus("✦ Đã tóm tắt");
    } catch (err) {
      appendMessageBubble("bot", `❌ Lỗi: ${err.message}`);
      setStatus("❌ Lỗi AI");
    }
    return;
  }

  if (actionCode === "excel_formula") {
    const existingInput = promptInput?.value?.trim();

    // Nếu người dùng đã gõ sẵn nội dung trong ô nhập chat
    if (existingInput) {
      promptInput.value = "";
      appendMessageBubble("user", `ƒx Gợi ý công thức: ${existingInput}`);
      setStatus("⏳ Đang phân tích bảng tính & sinh công thức...");
      try {
        const context = await bridge.getExcelContext();
        const res = await gemini.generateFormula(existingInput, context);
        renderFormulaResult(res);
        setStatus("✦ Đã đề xuất công thức");
      } catch (err) {
        appendMessageBubble("bot", `❌ Lỗi: ${err.message}`);
        setStatus("❌ Lỗi AI");
      }
      return;
    }

    // Nếu chưa gõ nội dung, hiển thị hộp thoại tương tác trực tiếp trong khung chat (không dùng window.prompt)
    appendMessageBubble("user", "ƒx Gợi ý công thức Excel");
    setStatus("✦ Nhập yêu cầu công thức...");
    const card = document.createElement("div");
    card.className = "msg-bubble bot";
    card.innerHTML = `
      <b>ƒx GỢI Ý CÔNG THỨC EXCEL THÔNG MINH</b><br/>
      <small style="color: #64748b;">Nhập phép tính hoặc yêu cầu bạn cần tính toán cho bảng tính:</small>
      <div style="display: flex; gap: 6px; margin-top: 8px;">
        <input type="text" class="input-text inline-formula-txt" placeholder="Ví dụ: Tính tổng cột L nếu cột K là IN, hoặc đếm mã PO..." style="font-size: 11.5px;" />
        <button class="btn-primary btn-calc-formula" style="white-space: nowrap; padding: 4px 10px; font-size: 11.5px;">Gợi ý ⚡</button>
      </div>
    `;
    feedArea.appendChild(card);
    feedArea.scrollTop = feedArea.scrollHeight;

    const inp = card.querySelector(".inline-formula-txt");
    const btn = card.querySelector(".btn-calc-formula");
    inp?.focus();

    const doGenerate = async () => {
      const q = inp.value.trim();
      if (!q) return;
      btn.disabled = true;
      btn.textContent = "⏳ Đang tạo...";
      setStatus("⏳ Đang phân tích bảng & tạo công thức...");
      try {
        const ctx = await bridge.getExcelContext();
        const res = await gemini.generateFormula(q, ctx);
        renderFormulaResult(res);
        setStatus("✦ Đã đề xuất công thức");
      } catch (e) {
        appendMessageBubble("bot", `❌ Lỗi: ${e.message}`);
        setStatus("❌ Lỗi AI");
      }
    };

    btn.onclick = doGenerate;
    inp.onkeydown = (e) => {
      if (e.key === "Enter") doGenerate();
    };
    return;
  }

  if (actionCode === "excel_report") {
    appendMessageBubble("user", "📊 Viết báo cáo phân tích & Đề xuất bảng tổng hợp");
    setStatus("⏳ Đang đọc toàn bộ bảng tính & lập báo cáo...");
    const context = await bridge.getExcelContext();
    try {
      const prompt = "Hãy đọc và phân tích kỹ toàn bộ bảng số liệu Excel đang mở (đầy đủ các cột, các nhóm, tổng số dòng). Viết 1 báo cáo phân tích chi tiết súc tích, ĐỒNG THỜI tạo một bảng báo cáo tổng hợp hoàn chỉnh bằng khối <EXCEL_CREATE_SHEET> để người dùng bấm tạo Sheet mới trực tiếp trên Excel.";
      const rep = await gemini.chatWithContext(prompt, context, "Excel");
      renderBotReplyWithActions(rep);
      setStatus("✦ Đã phân tích xong");
    } catch (err) {
      appendMessageBubble("bot", `❌ Lỗi: ${err.message}`);
      setStatus("❌ Lỗi AI");
    }
    return;
  }
}

// Xử lý và hiển thị câu trả lời bot kèm các thẻ hành động tương tác (Tạo Sheet, Lập Bảng)
function renderBotReplyWithActions(rawReply) {
  let text = String(rawReply || "");

  // Kiểm tra xem có khối tạo sheet <EXCEL_CREATE_SHEET>...</EXCEL_CREATE_SHEET> không
  const sheetMatch = text.match(/<EXCEL_CREATE_SHEET>([\s\S]*?)<\/EXCEL_CREATE_SHEET>/i);
  let sheetData = null;

  if (sheetMatch) {
    try {
      sheetData = JSON.parse(sheetMatch[1].trim());
      // Xóa khối thẻ ra khỏi phần text hiển thị để khung chat sạch đẹp
      text = text.replace(sheetMatch[0], "").trim();
    } catch (e) {
      console.warn("Không parse được JSON trong EXCEL_CREATE_SHEET:", e);
    }
  }

  // Format văn bản: bold, code, xuống dòng
  const formattedHtml = formatMarkdownSimple(text);
  const bubble = appendMessageBubble("bot", formattedHtml);

  // Nếu có dữ liệu tạo sheet, gắn thẻ hành động tương tác trực tiếp
  if (sheetData && sheetData.headers && sheetData.rows) {
    const card = document.createElement("div");
    card.className = "excel-card";

    const previewRows = sheetData.rows.slice(0, 3);
    let tableHtml = `<table class="excel-preview-table"><thead><tr>`;
    sheetData.headers.forEach(h => tableHtml += `<th>${escapeHtml(h)}</th>`);
    tableHtml += `</tr></thead><tbody>`;
    previewRows.forEach(r => {
      const arr = Array.isArray(r) ? r : Object.values(r);
      tableHtml += `<tr>`;
      arr.slice(0, sheetData.headers.length).forEach(c => tableHtml += `<td>${escapeHtml(String(c))}</td>`);
      tableHtml += `</tr>`;
    });
    if (sheetData.rows.length > 3) {
      tableHtml += `<tr><td colspan="${sheetData.headers.length}" style="text-align:center; color:#64748b; font-style:italic;">... và ${sheetData.rows.length - 3} dòng khác ...</td></tr>`;
    }
    tableHtml += `</tbody></table>`;

    card.innerHTML = `
      <div class="excel-card-header">
        <span>📊</span> <span>Đề xuất Tạo Sheet Mới: "${escapeHtml(sheetData.sheetName || 'Bao_Cao')}"</span>
      </div>
      <div class="excel-card-meta">
        ${escapeHtml(sheetData.title || 'Báo cáo tổng hợp')} · Gồm <b>${sheetData.headers.length} cột</b>, <b>${sheetData.rows.length} dòng</b>
      </div>
      ${tableHtml}
      <button type="button" class="btn-create-sheet">
        ⚡ Tạo Sheet & Lập Bảng Trực Tiếp Trên Excel
      </button>
    `;

    const btnCreate = card.querySelector(".btn-create-sheet");
    btnCreate.onclick = async () => {
      btnCreate.disabled = true;
      btnCreate.textContent = "⏳ Đang tạo Sheet và điền dữ liệu...";
      try {
        const createdName = await bridge.createWorksheetWithTable(sheetData);
        btnCreate.className = "btn-create-sheet done";
        btnCreate.textContent = `✓ Đã tạo thành công Sheet "${createdName}" trên Excel!`;
        setStatus(`✓ Đã tạo Sheet "${createdName}"`);
      } catch (err) {
        alert("Lỗi khi tạo sheet: " + err.message);
        btnCreate.disabled = false;
        btnCreate.textContent = "⚡ Thử tạo lại";
      }
    };

    bubble.appendChild(card);
    if (feedArea) feedArea.scrollTop = feedArea.scrollHeight;
  }
}

function formatMarkdownSimple(text) {
  if (!text) return "";
  let s = escapeHtml(text);
  // Bold: **text** -> <b>text</b>
  s = s.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");
  // Italic: *text* -> <i>text</i>
  s = s.replace(/\*(.*?)\*/g, "<i>$1</i>");
  // Backtick code / formula: `text` -> <code>text</code>
  s = s.replace(/`([^`]+)`/g, '<code style="background:#f1f5f9; padding:1px 4px; border-radius:3px; color:#0369a1; font-weight:600;">$1</code>');
  // Newlines -> <br/>
  s = s.replace(/\n/g, "<br/>");
  return s;
}

// Hiển thị bong bóng chat
function appendMessageBubble(sender, htmlContent) {
  if (!feedArea) return;
  const bubble = document.createElement("div");
  bubble.className = `msg-bubble ${sender}`;
  bubble.innerHTML = htmlContent;
  feedArea.appendChild(bubble);
  feedArea.scrollTop = feedArea.scrollHeight;
  return bubble;
}

// Hiển thị danh sách lỗi chính tả & nút sửa 1 chạm
function renderReviewResults(result) {
  let content = `<b>KẾT QUẢ RÀ SOÁT:</b><br/>${result.summary || "Đã kiểm tra xong"}`;

  if (!result.issues || result.issues.length === 0) {
    content += "<br/><br/>🟢 Không phát hiện lỗi chính tả hoặc thể thức.";
    appendMessageBubble("bot", content);
    return;
  }

  content += `<br/><small style="color: #64748b;">Tìm thấy ${result.issues.length} lỗi. Bấm [Sửa trên Word] để tự động sửa trực tiếp trên file:</small>`;
  const bubble = appendMessageBubble("bot", content);

  result.issues.forEach(item => {
    const card = document.createElement("div");
    card.className = "issue-card";

    card.innerHTML = `
      <div class="issue-diff">
        <span class="diff-wrong">${escapeHtml(item.original)}</span>
        <span>→</span>
        <span class="diff-fix">${escapeHtml(item.replacement)}</span>
      </div>
      <div class="issue-reason">${escapeHtml(item.reason || "")}</div>
      <div class="card-actions">
        <button class="btn-act apply">⚡ Sửa trên Word</button>
        <button class="btn-act dismiss">Bỏ qua</button>
      </div>
    `;

    const btnApply = card.querySelector(".btn-act.apply");
    const btnDismiss = card.querySelector(".btn-act.dismiss");

    btnApply.onclick = async () => {
      btnApply.disabled = true;
      btnApply.textContent = "Đang sửa...";
      const ok = await bridge.applyWordFix(item.original, item.replacement);
      if (ok) {
        card.classList.add("resolved");
        btnApply.textContent = "✓ Đã sửa";
        btnDismiss.style.display = "none";
      } else {
        btnApply.textContent = "Không tìm thấy";
      }
    };

    btnDismiss.onclick = () => {
      card.remove();
    };

    bubble.appendChild(card);
  });

  feedArea.scrollTop = feedArea.scrollHeight;
}

// Hiển thị kết quả viết lại văn bản
function renderRewriteResult(res) {
  const bubble = appendMessageBubble("bot", `
    <b>VĂN BẢN ĐÃ ĐƯỢC VIẾT LẠI:</b><br/>
    <small style="color: #64748b;">${res.summary || ""}</small>
    <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px; margin: 8px 0; font-size: 12.5px; white-space: pre-wrap;">${escapeHtml(res.rewrittenText)}</div>
    <button class="btn-act apply" id="btnApplyRewrite">⚡ Thay thế vào văn bản Word</button>
  `);

  const btnApply = bubble.querySelector("#btnApplyRewrite");
  btnApply.onclick = async () => {
    btnApply.disabled = true;
    btnApply.textContent = "Đang chèn...";
    await bridge.applyWordRewrite(res.rewrittenText);
    btnApply.textContent = "✓ Đã thay thế thành công";
  };
}

// Hiển thị kết quả gợi ý công thức Excel
function renderFormulaResult(res) {
  const bubble = appendMessageBubble("bot", `
    <b>CÔNG THỨC ĐỀ XUẤT:</b>
    <div class="formula-box">${escapeHtml(res.formula)}</div>
    <div style="font-size: 11.5px; color: #475569; margin-bottom: 6px;">${escapeHtml(res.explanation || "")}</div>
    <button class="btn-act apply" id="btnApplyFormula">⚡ Chèn vào ô đang chọn trên Excel</button>
  `);

  const btnApply = bubble.querySelector("#btnApplyFormula");
  btnApply.onclick = async () => {
    btnApply.disabled = true;
    btnApply.textContent = "Đang chèn...";
    await bridge.insertExcelFormula(res.formula);
    btnApply.textContent = "✓ Đã chèn vào ô";
  };
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ==========================================
// TÍNH NĂNG DỊCH THUẬT & GLOSSARY (MINHDUONG84VN)
// ==========================================

function initTranslationUI(host) {
  const savedSrc = localStorage.getItem(STORAGE_SRC_LANG);
  if (savedSrc && selSourceLang) selSourceLang.value = savedSrc;

  const savedTgt = localStorage.getItem(STORAGE_TGT_LANG);
  if (savedTgt && selTargetLang) selTargetLang.value = savedTgt;

  const savedGlossary = localStorage.getItem(STORAGE_GLOSSARY);
  if (glossaryInput) {
    glossaryInput.value = savedGlossary !== null ? savedGlossary : DEFAULT_GARMENT_GLOSSARY;
  }

  if (host === "Excel") {
    if (lblModeDual) {
      lblModeDual.innerHTML = '<input type="radio" name="transMode" id="radModeDual" value="dual" checked style="display: none;" /> ➡️ Điền cột bên cạnh';
    }
    if (lblModeReplace) {
      lblModeReplace.innerHTML = '<input type="radio" name="transMode" id="radModeReplace" value="replace" style="display: none;" /> 🔄 Thay thế trực tiếp ô';
    }
  }
  updateTransModeHint();
}

function updateTransModeHint() {
  const host = bridge.getHostName();
  const radDual = document.getElementById("radModeDual");
  const isDual = radDual ? radDual.checked : true;

  if (host === "Excel") {
    if (isDual) {
      if (transModeHint) transModeHint.textContent = "Giữ nguyên cột dữ liệu gốc và tự động điền bản dịch sang cột liền kề bên phải.";
    } else {
      if (transModeHint) transModeHint.textContent = "Ghi đè trực tiếp nội dung dịch vào các ô đang chọn trên Excel.";
    }
  } else {
    if (isDual) {
      if (transModeHint) transModeHint.textContent = "Chèn đoạn dịch màu xanh navy ngay dưới đoạn gốc để kiểm tra, đối chiếu hợp đồng/PDF.";
    } else {
      if (transModeHint) transModeHint.textContent = "Thay thế trực tiếp đoạn văn bản gốc bằng bản dịch mới.";
    }
  }
}

async function executeTranslation() {
  if (!gemini.hasApiKey()) {
    openSettings();
    appendMessageBubble("bot", "⚠️ Vui lòng cấu hình API Key trước khi sử dụng tính năng Dịch thuật AI.");
    return;
  }

  const host = bridge.getHostName();
  const sourceLang = selSourceLang ? selSourceLang.value : "zh";
  const targetLang = selTargetLang ? selTargetLang.value : "vi";
  const glossaryCsv = glossaryInput ? glossaryInput.value : "";
  const radDual = document.getElementById("radModeDual");
  const isDual = radDual ? radDual.checked : true;

  const srcText = selSourceLang ? selSourceLang.options[selSourceLang.selectedIndex].text : sourceLang;
  const tgtText = selTargetLang ? selTargetLang.options[selTargetLang.selectedIndex].text : targetLang;

  setStatus("⏳ Đang dịch thuật chuyên ngành với AI...");

  try {
    if (host === "Word") {
      const mode = isDual ? "dual" : "replace";
      const res = await bridge.translateWord(gemini, {
        sourceLang,
        targetLang,
        glossaryCsv,
        mode
      });

      if (!res.success) {
        appendMessageBubble("bot", `⚠️ ${res.message}`);
        setStatus("✦ Sẵn sàng");
        return;
      }

      const modeTitle = mode === "dual" ? "Song ngữ đối chiếu" : "Thay thế trực tiếp";
      appendMessageBubble("bot", `✅ <b>Đã dịch thuật tài liệu thành công (${modeTitle}):</b><br/>
• Cặp ngôn ngữ: <b>${srcText}</b> ➔ <b>${tgtText}</b><br/>
• Phạm vi: <b>${res.isSelection ? "Vùng văn bản được bôi đen" : "Toàn bộ nội dung tài liệu"}</b> (${res.length} ký tự)<br/>
• Chế độ: <b>${modeTitle}</b><br/>
<div class="formula-box" style="white-space: pre-wrap; max-height: 160px; overflow-y: auto; font-family: inherit; font-size: 12px; margin-top: 6px;">${escapeHtml(res.translated.substring(0, 400))}${res.translated.length > 400 ? "..." : ""}</div>`);
      setStatus("✦ Hoàn tất dịch thuật");
      updateModelDisplay();
    } else {
      // Excel
      const mode = isDual ? "adjacent" : "replace";
      const res = await bridge.translateExcel(gemini, {
        sourceLang,
        targetLang,
        glossaryCsv,
        mode
      });

      if (!res.success) {
        appendMessageBubble("bot", `⚠️ ${res.message}`);
        setStatus("✦ Sẵn sàng");
        return;
      }

      const modeText = mode === "adjacent" ? "Đã điền sang cột liền kề bên phải (giữ nguyên cột gốc)" : "Đã thay thế trực tiếp vào các ô";
      appendMessageBubble("bot", `✅ <b>Đã dịch ${res.count} ô dữ liệu trên Excel thành công!</b><br/>
• Phạm vi ô: <code>${res.address}</code><br/>
• Thao tác: <b>${modeText}</b><br/>
• Cặp ngôn ngữ: <b>${srcText}</b> ➔ <b>${tgtText}</b>.`);
      setStatus("✦ Hoàn tất dịch dữ liệu");
      updateModelDisplay();
    }
  } catch (err) {
    console.error("Lỗi dịch thuật:", err);
    appendMessageBubble("bot", `❌ <b>Có lỗi xảy ra khi dịch thuật:</b><br/>${err.message}`);
    setStatus("❌ Lỗi dịch thuật");
    updateModelDisplay();
  }
}
