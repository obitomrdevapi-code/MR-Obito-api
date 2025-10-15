import axios from "axios";

export default async function handler(req, res) {
  try {
    // الحصول على السؤال من query parameter أو body
    let question = req.query.txt || req.body.question;

    // إذا لم يكن هناك سؤال في query أو body
    if (!question) {
      return res.status(400).json({ 
        error: 'يرجى إدخال السؤال 📝',
        usage: 'أرسل السؤال كـ ?txt=سؤال في الرابط أو في body كـ { "question": "سؤال" }'
      });
    }

    // إرسال الطلب إلى DeepSeek AI
    const { data } = await axios.post(
      "https://ai.clauodflare.workers.dev/chat",
      {
        "model": "@cf/deepseek-ai/deepseek-r1-distill-qwen-32b",
        "messages": [
          {
            "role": "user",
            "content": question
          }
        ]
      },
      {
        timeout: 30000 // 30 ثانية timeout
      }
    );

    // التحقق من نجاح الاستجابة
    if (!data.success) {
      throw new Error(JSON.stringify(data, null, 2));
    }

    // معالجة الاستجابة
    let response = data.data.response;
    
    // إذا كان هناك تفكير داخلي، نأخذ الجزء بعد </think>
    if (response.includes('</think>')) {
      response = response.split('</think>').pop().trim();
    }

    // إرجاع الإجابة الناجحة
    return res.status(200).json({
      success: true,
      question: question,
      response: response,
      model: "deepseek-r1-distill-qwen-32b",
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('DeepSeek API Error:', error);
    
    return res.status(500).json({
      error: 'حدث خطأ أثناء معالجة الطلب ❌',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}
