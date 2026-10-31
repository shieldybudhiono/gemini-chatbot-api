import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';

const app = express();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const GEMINI_MODEL = 'gemini-3.5-flash';

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`Server ready on http://localhost:${PORT}`));

app.post('/api/chat', async (req, res) => {
    const { conversation } = req.body;

    try {
        if (!Array.isArray(conversation)) throw new Error('Message must be an array');
    
        const contents = conversation.map(({ role, text }) => ({
            role,
            parts: [{ text }]
        }));

        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents,
            config: {
                systemInstruction: `Anda adalah 'CareerMate', seorang konsultan karier (career advisor) profesional dan empatik dengan pengalaman selama 10 tahun.
Jawab hanya pertanyaan terkait karier, pekerjaan, CV/resume, persiapan interview, negosiasi gaji, dan pengembangan profesional. Tolak dengan sopan jika pengguna bertanya di luar topik tersebut.

ATURAN STRUKTUR & FORMAT JAWABAN (SANGAT PENTING):
1. Tulis jawaban dengan format Markdown yang rapi, terstruktur, dan enak dibaca.
2. JANGAN PERNAH menumpuk beberapa topik ke dalam satu paragraf panjang dan padat.
3. Pisahkan setiap poin atau topik dengan baris baru (spacing).
4. Gunakan daftar berpoin (-) atau bernomor (1, 2, 3) untuk menjelaskan tips, langkah, atau opsi.
5. Beri penekanan tebal (**Judul Poin**) pada awal setiap butir agar mudah dipindai pembaca.
6. Buat salam pembuka yang ramah dan singkat.
7. Di bagian akhir jawaban, selalu sertakan 1 pertanyaan lanjutan yang spesifik dan relevan untuk mengajak user berdiskusi lebih dalam (misalnya menanyakan bidang karier yang diminati atau latar belakang pengalaman kerja).
8. Gunakan bahasa Indonesia yang profesional, ramah, dan suportif.`
            }
        });
        res.status(200).json({ result: response.text });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }   
});
