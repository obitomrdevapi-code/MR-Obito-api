
import axios from "axios";
import Jimp from "jimp";

export default async function handler(req, res) {
  const { url } = req.query;

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed. Use GET with ?url=" });
  }

  if (!url || !url.startsWith("http")) {
    return res.status(400).json({ error: "يرجى تقديم رابط صالح بعد ?url=" });
  }

  try {
    // تحميل الصورة الأصلية باستخدام axios
    const baseRes = await axios.get(url, { responseType: 'arraybuffer' });
    const baseImage = await Jimp.read(Buffer.from(baseRes.data));

    // تحميل الإطار
    const overlayRes = await axios.get("https://files.catbox.moe/rhdgdx.jpg", { 
      responseType: 'arraybuffer' 
    });
    const overlayImage = await Jimp.read(Buffer.from(overlayRes.data));

    // ضبط حجم الإطار وشفافيته
    overlayImage.resize(baseImage.bitmap.width, baseImage.bitmap.height).opacity(0.5);

    // دمج الإطار فوق الصورة
    baseImage.composite(overlayImage, 0, 0);

    // تحويل الصورة إلى buffer وإرسالها
    const imageBuffer = await baseImage.getBufferAsync(Jimp.MIME_PNG);

    res.setHeader("Content-Type", "image/png");
    res.setHeader("Content-Disposition", "attachment; filename=framed-image.png");
    res.send(imageBuffer);

  } catch (error) {
    console.error("❌ خطأ أثناء معالجة الصورة:", error);
    return res.status(500).json({ 
      error: "حدث خطأ أثناء معالجة الصورة. قد تكون الصيغة غير مدعومة أو هناك مشكلة في التحميل." 
    });
  }
}
