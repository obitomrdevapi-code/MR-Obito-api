import axios from 'axios';
import Jimp from 'jimp';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';

export default async function handler(req, res) {
  const { url } = req.query;

  if (req.method !== "GET") {
    return res.status(405).json({ error: "الطريقة غير مدعومة، استخدم GET مع ?url=" });
  }

  if (!url || !url.startsWith("http")) {
    return res.status(400).json({ error: "يرجى تقديم رابط صورة صالح بعد ?url=" });
  }

  try {
    // تحميل الصورة الأصلية
    const baseRes = await axios.get(url, { 
      responseType: 'arraybuffer',
      timeout: 30000
    });
    const baseImage = await Jimp.read(Buffer.from(baseRes.data));
    const { width: baseWidth, height: baseHeight } = baseImage.bitmap;

    // تحميل الإطار
    const overlayRes = await axios.get("https://files.catbox.moe/rhdgdx.jpg", { 
      responseType: 'arraybuffer',
      timeout: 30000
    });
    const overlayImage = await Jimp.read(Buffer.from(overlayRes.data));
    const { width: overlayWidth, height: overlayHeight } = overlayImage.bitmap;

    // اقتصاص الإطار ليناسب الصورة
    const cropX = Math.floor((overlayWidth - baseWidth) / 2);
    const cropY = Math.floor((overlayHeight - baseHeight) / 2);
    const croppedOverlay = overlayImage.clone().crop(cropX, cropY, baseWidth, baseHeight).opacity(0.5);

    // دمج الإطار مع الصورة
    baseImage.composite(croppedOverlay, 0, 0);

    // حفظ مؤقت وإرسال الصورة
    const fileName = `${uuidv4()}.png`;
    const filePath = path.join("/tmp", fileName);
    await baseImage.writeAsync(filePath);

    const imageBuffer = await fs.readFile(filePath);
    await fs.unlink(filePath);

    res.setHeader("Content-Type", "image/png");
    res.send(imageBuffer);

  } catch (error) {
    console.error("❌ خطأ أثناء معالجة الصورة:", error);
    
    let errorMessage = "حدث خطأ أثناء معالجة الصورة. تأكد من صحة الرابط أو نوع الصورة.";
    
    if (error.message.includes("timeout")) {
      errorMessage = "انتهت مهلة تحميل الصورة. حاول برابط آخر.";
    } else if (error.message.includes("Unsupported MIME type")) {
      errorMessage = "نوع الصورة غير مدعوم. يرجى استخدام صيغ JPG, PNG, GIF.";
    }
    
    return res.status(500).json({ error: errorMessage });
  }
}
