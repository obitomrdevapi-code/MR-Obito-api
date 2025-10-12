
import axios from "axios";
import cheerio from "cheerio";
import qs from "qs";

export default async function handler(req, res) {
  const { url} = req.query;

  if (req.method!== "GET") {
    return res.status(405).json({ error: "Method not allowed. Use GET with?url="});
}

  if (!url ||!url.startsWith("http")) {
    return res.status(400).json({ error: "يرجى تقديم رابط صالح بعد?url="});
}

  try {
    const [baseUrl, paramsString] = url.split("?");
    const params = new URLSearchParams(paramsString);
    const igsh = params.get("igsh");

    const data = qs.stringify({
      url: baseUrl,
      igsh: igsh,
      lang: "en"
});

    const config = {
      method: "POST",
      url: "https://api.instasave.website/media",
      headers: {
        "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Mobile Safari/537.36",
        "Content-Type": "application/x-www-form-urlencoded",
        "origin": "https://instasave.website",
        "referer": "https://instasave.website/",
        "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7"
},
      data: data
};

    const response = await axios.request(config);
    const $ = cheerio.load(response.data);

    const thumbnailUrl = $("img").attr("src")?.replace(/\\"/g, "");
    const downloadUrl = $("a").attr("href")?.replace(/\\"/g, "");

    if (!thumbnailUrl ||!downloadUrl) {
      return res.status(404).json({ error: "لم يتم العثور على روابط التحميل."});
}

    return res.status(200).json({
      thumbnail: thumbnailUrl,
      downloadUrl: downloadUrl
});
} catch (err) {
    console.error("❌ خطأ أثناء جلب البيانات:", err.message);
    return res.status(500).json({ error: "فشل في استخراج روابط التحميل."});
}
}
