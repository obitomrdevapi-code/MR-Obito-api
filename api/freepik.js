
// api/freepik.js
import axios from "axios";
import * as cheerio from "cheerio";

export default async function handler(req, res) {
  const { q} = req.query;

  if (!q) {
    return res.status(400).json({ error: "يرجى إرسال كلمة البحث عبر?q=..."});
}

  try {
    const searchUrl = `https://www.freepik.com/search?format=search&query=${encodeURIComponent(q)}`;

    const response = await axios.get(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Referer": "https://www.google.com/"
}
});

    const $ = cheerio.load(response.data);
    const images = [];

    $("img").each((i, el) => {
      const src = $(el).attr("src");
      if (src && src.startsWith("https://")) {
        images.push({ img: src});
}
});

    if (images.length === 0) {
      return res.status(404).json({ error: "لم يتم العثور على صور."});
}

    return res.status(200).json(images.slice(0, 10)); // أول 10 صور فقط
} catch (err) {
    return res.status(500).json({ error: `فشل الطلب: ${err.message}`});
}
}
