import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/api/decide', async (req, res) => {
  try {
    const { systemPrompt, userPrompt } = req.body;
    const model = genAI.getGenerativeModel({ model: 'gemma-4-31b-it' });
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: {
        temperature: 0.9,
        maxOutputTokens: 1024,
        responseMimeType: 'application/json',
      },
    });
    const text = result.response.text();
    res.json({ success: true, text });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.get('/', (req, res) => res.send('Decide API is running'));

app.listen(3001, () => console.log('Server running on port 3001'));