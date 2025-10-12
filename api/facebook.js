
import axios from "axios";
import cheerio from "cheerio";
import { v4 as uuidv4} from "uuid";

export default async function handler(req, res) {
  const { url} = req.query;

  if (req.method!== "GET") {
    return res.status(405).json({ error: "Method not allowed. Use GET with?url="});
}

  if (!url ||!url.startsWith("http")) {
    return res.status(400).json({ error: "يرجى تقديم رابط صالح بعد?url="});
}

  try {
    const fetchUrl = `https://fsaver.net/download/?url=${encodeURIComponent(url)}`;
    const headers = {
      "Upgrade-Insecure-Requests": "1",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
      "sec-ch-ua": '"Chromium";v="130", "Google Chrome";v="130", "Not?A_Brand";v="99"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"'
};

    const response = await axios.get(fetchUrl, { headers});
    const html = response.data;
    const $ = cheerio.load(html);
    const videoSrc = $(".video__item").attr("src");

    if (!videoSrc) {
      return res.status(404).json({ error: "لم يتم العثور على رابط الفيديو."});
}

    const directUrl = `https://fsaver.net${videoSrc}`;

    return res.status(200).json({
      id: uuidv4(),
      source: "fsaver.net",
      url: directUrl,
      status: "success"
});
} catch (err) {
    console.error("❌ خطأ أثناء جلب الرابط:", err);
    return res.status(500).json({
      id: uuidv4(),
      source: "fsaver.net",
      status: "error",
      message: err.message
});
}
}
