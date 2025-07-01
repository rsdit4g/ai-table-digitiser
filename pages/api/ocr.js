export const config = {
  api: {
    bodyParser: false,
  },
};

import { IncomingForm } from "formidable";
import fs from "fs";

export default async function handler(req, res) {
  console.log("➡️ Incoming request to /api/ocr");

  if (req.method !== "POST") {
    console.log("❌ Method not allowed");
    return res.status(405).end();
  }

  const form = new IncomingForm({ keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    console.log("📦 Parsing form...");

    if (err) {
      console.error("❌ Form parse error:", err);
      return res.status(500).json({ error: "File upload error" });
    }

    try {
      const filePath = files.file.filepath;
      const fileData = fs.readFileSync(filePath);
      const base64Image = fileData.toString("base64");

      console.log("🧠 Sending image to OpenAI...");

      const openaiRes = await fetch("https://api.openai.com/v1/images/vision/analyze", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: base64Image,
          features: [{ type: "TEXT_DETECTION" }],
        }),
      });

      const result = await openaiRes.json();

      console.log("✅ OpenAI response:", result);

      const extractedRows = result?.data?.rows || [];

      res.status(200).json({ data: extractedRows });
    } catch (e) {
      console.error("❌ OCR processing failed:", e);
      res.status(500).json({ error: "OCR processing failed" });
    }
  });
}
