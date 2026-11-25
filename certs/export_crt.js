import fs from "fs";
import crypto from "crypto";

// Read PFX and export cert
const pfx = fs.readFileSync("D:/projects/gemini-office-addin/certs/localhost.pfx");
// In node, we can also use forge or powershell. Let's create export_crt.ps1 and run it.
