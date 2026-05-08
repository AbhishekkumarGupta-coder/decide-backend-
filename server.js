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
        // removed responseMimeType — gemma doesn't support it
      },
    });

    let text = result.response.text();

    // strip markdown fences
    text = text.replace(/```json/gi, '').replace(/```/g, '').trim();

    // extract JSON object only
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) text = jsonMatch[0];

    res.json({ success: true, text });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.get('/', (req, res) => res.send('Decide API is running'));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
