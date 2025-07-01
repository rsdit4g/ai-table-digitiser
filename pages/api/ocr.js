export const config = {
  api: {
    bodyParser: false,
  },
};

import { IncomingForm } from "formidable";
import fs from "fs";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const form = new IncomingForm({ keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: "Upload error" });

    const filePath = files.file.filepath;
    const fileData = fs.readFileSync(filePath);
    const base64Image = fileData.toString("base64");

    try {
      const openaiRes = await fetch("https://api.openai.com/v1/images/vision/analyze", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          image: base64Image,
          features: [{ type: "TEXT_DETECTION" }]
        })
      });

      const result = await openaiRes.json();

      // Example placeholder response
      const extractedRows = result?.data?.rows || [];

      res.status(200).json({ data: extractedRows });
    } catch (e) {
      res.status(500).json({ error: "Processing failed" });
    }
  });
}
