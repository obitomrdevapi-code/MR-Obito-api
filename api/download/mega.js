
import { File } from "megajs";
import path from "path";
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';

export default async function handler(req, res) {
  const { url } = req.query;

  if (req.method !== "GET") {
    return res.status(405).json({ error: "الطريقة غير مدعومة، استخدم GET مع ?url=" });
  }

  if (!url || !url.startsWith("https://mega.nz/")) {
    return res.status(400).json({ error: "يرجى تقديم رابط صالح من mega.nz بعد ?url=" });
  }

  try {
    const file = File.fromURL(url);
    await file.loadAttributes();

    if (file.size >= 300 * 1024 * 1024) {
      return res.status(413).json({ error: "❌ الملف أكبر من 300 ميجا، لا يمكن تحميله عبر هذه الواجهة." });
    }

    // تحميل الملف إلى buffer
    const data = await file.downloadBuffer();

    // حفظ مؤقت في /tmp
    const fileName = `${uuidv4()}_${file.name}`;
    const filePath = path.join("/tmp", fileName);
    await fs.writeFile(filePath, data);

    // قراءة الملف وإرساله
    const fileBuffer = await fs.readFile(filePath);
    await fs.unlink(filePath); // حذف الملف المؤقت

    const fileExtension = path.extname(file.name).toLowerCase();
    const mimeTypes = {
      ".mp4": "video/mp4",
      ".pdf": "application/pdf",
      ".zip": "application/zip",
      ".rar": "application/x-rar-compressed",
      ".7z": "application/x-7z-compressed",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
    };

    const mimetype = mimeTypes[fileExtension] || "application/octet-stream";

    res.setHeader("Content-Disposition", `attachment; filename="${file.name}"`);
    res.setHeader("Content-Type", mimetype);
    res.send(fileBuffer);

  } catch (error) {
    console.error("❌ خطأ أثناء تحميل ملف Mega:", error);
    res.status(500).json({ error: "حدث خطأ أثناء تحميل الملف من Mega.nz" });
  }
}
