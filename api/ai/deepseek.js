
import axios from 'axios';
import FormData from 'form-data';
import { v4 as uuidv4} from 'uuid';
import path from 'path';
import fs from 'fs/promises';

const aiLabs = {
  api: {
    base: 'https://text2video.aritek.app',
    endpoints: {
      generate: '/txt2videov3',
      video: '/video'
}
},
  headers: {
    'user-agent': 'NB Android/1.0.0',
    'accept-encoding': 'gzip',
    'content-type': 'application/json',
    authorization: ''
},
  state: {
    token: null
},
  setup: {
    cipher: 'hbMcgZLlzvghRlLbPcTbCpfcQKM0PcU0zhPcTlOFMxBZ1oLmruzlVp9remPgi0QWP0QW',
    shiftValue: 3,
    dec(text, shift) {
      return [...text].map(c =>
        /[a-z]/.test(c)
? String.fromCharCode((c.charCodeAt(0) - 97 - shift + 26) % 26 + 97)
: /[A-Z]/.test(c)
? String.fromCharCode((c.charCodeAt(0) - 65 - shift + 26) % 26 + 65)
: c
).join('');
},
    decrypt: async () => {
      if (aiLabs.state.token) return aiLabs.state.token;
      const input = aiLabs.setup.cipher;
      const shift = aiLabs.setup.shiftValue;
      const decrypted = aiLabs.setup.dec(input, shift);
      aiLabs.state.token = decrypted;
      aiLabs.headers.authorization = decrypted;
      return decrypted;
}
},
  deviceId() {
    return Array.from({ length: 16}, () =>
      Math.floor(Math.random() * 16).toString(16)
).join('');
},
  generateVideo: async (prompt) => {
    await aiLabs.setup.decrypt();
    const payload = {
      deviceID: aiLabs.deviceId(),
      isPremium: 1,
      prompt,
      used: [],
      versionCode: 59
};
    const url = aiLabs.api.base + aiLabs.api.endpoints.generate;
    const res = await axios.post(url, payload, { headers: aiLabs.headers});
    const { code, key} = res.data;
    if (code!== 0 ||!key) throw new Error('فشل في توليد المفتاح');
    return await aiLabs.getVideo(key);
},
  getVideo: async (key) => {
    const payload = { keys: [key]};
    const url = aiLabs.api.base + aiLabs.api.endpoints.video;
    const maxAttempts = 100;
    const delay = 2000;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const res = await axios.post(url, payload, {
        headers: aiLabs.headers,
        timeout: 15000
});
      const { code, datas} = res.data;
      if (code === 0 && datas?.[0]?.url) {
        return datas[0].url.trim();
}
      await new Promise(r => setTimeout(r, delay));
}
    throw new Error('انتهى الوقت دون الحصول على الفيديو');
}
};

export default async function handler(req, res) {
  const { txt} = req.query;

  if (req.method!== "GET") {
    return res.status(405).json({ error: "الطريقة غير مدعومة، استخدم GET مع?txt="});
}

  if (!txt ||!txt.trim()) {
    return res.status(400).json({ error: "يرجى تقديم وصف نصي بعد?txt="});
}

  try {
    const videoUrl = await aiLabs.generateVideo(txt);
    res.status(200).json({ success: true, url: videoUrl});
} catch (err) {
    console.error("خطأ في توليد الفيديو:", err.message);
    res.status(500).json({ success: false, error: err.message});
}
  }
