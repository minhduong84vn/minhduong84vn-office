// dev-server.mjs
// Máy chủ phát triển HTTPS tĩnh cho Gemini Office Add-in

import https from "https";
import http from "http";
import fs from "fs";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const PFX_PATH = path.join(__dirname, "certs", "localhost.pfx");
const PFX_PASSWORD = "gemini123";

// Kiểm tra xem có chứng chỉ chuẩn của office-addin-dev-certs hay không
const devCertDir = path.join(os.homedir(), ".office-addin-dev-certs");
const devCertCrt = path.join(devCertDir, "localhost.crt");
const devCertKey = path.join(devCertDir, "localhost.key");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

function handleRequest(req, res) {
  // CORS Headers bắt buộc cho Office Add-in
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  let reqUrl = req.url.split("?")[0];
  if (reqUrl === "/" || reqUrl === "") {
    reqUrl = "/src/taskpane.html";
  }

  const filePath = path.join(__dirname, reqUrl);

  // Ngăn Directory Traversal
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end(`404 Not Found: ${reqUrl}`);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    res.writeHead(200, { "Content-Type": contentType });
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
}

// Lựa chọn chứng chỉ SSL
let httpsOptions = null;
if (fs.existsSync(devCertCrt) && fs.existsSync(devCertKey)) {
  console.log(`🔐 Đang sử dụng chứng chỉ chuẩn Microsoft từ: ${devCertDir}`);
  httpsOptions = {
    key: fs.readFileSync(devCertKey),
    cert: fs.readFileSync(devCertCrt)
  };
} else if (fs.existsSync(PFX_PATH)) {
  console.log(`🔐 Đang sử dụng chứng chỉ nội bộ PFX: ${PFX_PATH}`);
  httpsOptions = {
    pfx: fs.readFileSync(PFX_PATH),
    passphrase: PFX_PASSWORD
  };
}

if (httpsOptions) {
  const server = https.createServer(httpsOptions, handleRequest);

  server.listen(PORT, "localhost", () => {
    console.log(`\n======================================================`);
    console.log(`🚀 Gemini Office Add-in Server đang chạy trên HTTPS!`);
    console.log(`👉 Taskpane URL:  https://localhost:${PORT}/src/taskpane.html`);
    console.log(`👉 Manifest URL:  https://localhost:${PORT}/manifest.xml`);
    console.log(`======================================================\n`);
  });
} else {
  console.error(`❌ Không tìm thấy chứng chỉ SSL.`);
  console.log(`Vui lòng chạy script trong thư mục certs/ trước.`);
}
