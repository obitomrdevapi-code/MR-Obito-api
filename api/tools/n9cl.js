
import axios from "axios";
import path from "path";
import fs from "fs/promises";
import { v4 as uuidv4} from "uuid";
import fetch from "node-fetch";

export default async function handler(req, res) {
  const { url, prompt = ""} = req.query;

  if (req.method!== "GET") {
    return res.status(405).json({ error: "الطريقة غير مدعومة، استخدم GET مع?url="});
}

  if (!url ||!url.startsWith("http")) {
    return res.status(400).json({ error: "يرجى تقديم رابط صورة صالح بعد?url="});
}

  const defaultPrompt = `using the model, create a 1/7 scale commercialized figurine of the characters in the picture, in a realistic style, in a real environment. the figurine is placed on a computer desk. the figurine has a round transparent acrylic base, with no text on the base. the content on the computer screen is the zbrush modeling process of the figurine. next to the computer screen is a BANDAI-style toy packaging box printed with the original artwork. the packaging features two dimensional flat illustrations.`;

  const finalPrompt = prompt? `${defaultPrompt} ${prompt}`: defaultPrompt;

  try {
    const imageRes = await fetch(url);
    if (!imageRes.ok) throw new Error("فشل تحميل الصورة من الرابط.");

    const imageBuffer = await imageRes.buffer();
    const base64Image = imageBuffer.toString("base64");

    const response = await axios.post(
      "https://api.stability.ai/v1/generation/stable-diffusion-v1-5/image-to-image",
      {
        text_prompts: [{ text: finalPrompt}],
        init_image: base64Image,
        cfg_scale: 7,
        steps: 40
},
      {
        headers: {
          Authorization: `Bearer ${process.env.STABILITY_API_KEY}`,
          "Content-Type": "application/json"
},
        responseType: "arraybuffer"
}
);

    const fileName = `${uuidv4()}.jpg`;
    const filePath = path.join("/tmp", fileName);
    await fs.writeFile(filePath, response.data);

    const outputBuffer = await fs.readFile(filePath);
    await fs.unlink(filePath);

    res.setHeader("Content-Type", "image/jpeg");
    res.send(outputBuffer);
} catch (err) {
    console.error("خطأ أثناء توليد المجسم:", err);
    return res.status(500).json({ error: "فشل في توليد الصورة", details: err.message});
}
}
