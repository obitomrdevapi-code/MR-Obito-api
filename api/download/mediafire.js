
import axios from "axios";
import cheerio from "cheerio";
import fs from "fs/promises";
import path from "path";

const DEFAULT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};

const mediafireDl = async (url) => {
  let res;
  try {
    res = await axios.get(url, { headers: DEFAULT_HEADERS});
} catch {
    const translateUrl = `https://www-mediafire-com.translate.goog/${url.replace("https://www.mediafire.com/", "")}?_x_tr_sl=en&_x_tr_tl=fr&_x_tr_hl=en&_x_tr_pto=wapp`;
    res = await axios.get(translateUrl, { headers: DEFAULT_HEADERS});
}

  const $ = cheerio.load(res.data);

  const size = $("#downloadButton").text()
.replace("Download", "")
.replace("(", "")
.replace(")", "")
.replace(/\n/g, "")
.trim();

  let link = $("#downloadButton").attr("href");

  if (!link || link.includes("javascript:void(0)")) {
    const match = res.data.match(/"(https:\/\/download\d+\.mediafire\.com[^\"]+)"/i);
    if (match) link = match[1];
}

  if ((!link || link.includes("javascript:void(0)"))) {
    const scrambled = $("#downloadButton").attr("data-scrambled-url");
    if (scrambled) {
      try {
        link = Buffer.from(scrambled, "base64").toString("utf-8");
} catch {}
}
}

  let nama = "file";
  let mime = "bin";
  if (link && link.startsWith("https")) {
    const parts = link.split("/");
    nama = decodeURIComponent(parts.pop().split("?")[0]);
    mime = nama.includes(".")? nama.split(".").pop(): "bin";
}

  return { nama, mime, size, link};
};

export default async function handler(req, res) {
  const { url} = req.query;

  if (req.method!== "GET") {
    return res.status(405).json({ error: "الطريقة غير مدعومة، استخدم GET مع?url="});
}

  if (!url ||!url.startsWith("http")) {
    return res.status(400).json({ error: "يرجى تقديم رابط Mediafire صالح بعد?url="});
}

  try {
    const result = await mediafireDl(url);
    const filePath = path.join("/tmp", result.nama);

    const response = await axios.get(result.link, { responseType: "arraybuffer"});
    await fs.writeFile(filePath, response.data);

    const fileBuffer = await fs.readFile(filePath);
    await fs.unlink(filePath);

    res.setHeader("Content-Disposition", `attachment; filename="${result.nama}"`);
    res.setHeader("Content-Type", `application/${result.mime}`);
    res.send(fileBuffer);
} catch (e) {
    console.error("❌ خطأ أثناء تحميل الملف:", e);
    res.status(500).json({ error: "حدث خطأ أثناء تحميل أو إرسال الملف."});
}
}
