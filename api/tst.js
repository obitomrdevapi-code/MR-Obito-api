
// api/tst.js
import axios from "axios";

export default async function handler(req, res) {
  const { txt} = req.query;

  if (!txt || txt.trim() === "") {
    return res.status(400).json({ error: "يرجى إدخال السؤال في المعامل txt 📝"});
}

  try {
    const { data} = await axios.post("https://ai.clauodflare.workers.dev/chat", {
      model: "@cf/deepseek-ai/deepseek-r1-distill-qwen-32b",
      messages: [{
        role: "user",
        content: txt
}]
});

    if (!data.success) {
      return res.status(500).json({ error: "فشل في الحصول على الرد", details: data});
}

    const response = data.data.response.split("</think>").pop().trim();

    return res.status(200).json({
      question: txt,
      answer: response
});
} catch (error) {
    return res.status(500).json({ error: "حدث خطأ أثناء معالجة الطلب ❌", details: error.message});
}
}
