// pages/api/maroc-frame.js
import Jimp from "jimp";
import { v4 as uuidv4} from "uuid";
import path from "path";
import fs from "fs/promises";

export default async function handler(req, res) {
  const { url} = req.query;

  if (req.method!== "GET") {
    return res.status(405).json({ error: "Method not allowed. Use GET with?url="});
}

  if (!url ||!url.startsWith("http")) {
    return res.status(400).json({ error: "يرجى إرسال رابط صورة صالح عبر?url="});
}

  try {
    const userImage = await Jimp.read(url);
    const background = await Jimp.read("https://files.catbox.moe/l0893d.jpg");

    const circleSize = Math.floor(Math.min(background.bitmap.width, background.bitmap.height) * 0.9);
    userImage.cover(circleSize, circleSize);
    userImage.circle();

    const posX = Math.floor((background.bitmap.width - circleSize) / 2);
    const posY = Math.floor((background.bitmap.height - circleSize) / 2);

    background.composite(userImage, posX, posY);

    const fileName = `${uuidv4()}.png`;
    const filePath = path.join("/tmp", fileName);
    await background.writeAsync(filePath);

    const imageBuffer = await fs.readFile(filePath);
    await fs.unlink(filePath);

    res.setHeader("Content-Type", "image/png");
    res.send(imageBuffer);
} catch (err) {
    console.error("❌ خطأ في معالجة الصورة:", err);
    return res.status(500).json({ error: "فشل في معالجة الصورة"});
}
}
