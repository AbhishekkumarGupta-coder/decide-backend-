import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

import {
  runFullOrderFlow,
  getFoodOrders,
  searchRestaurants,
  getAddresses,
} from './swiggyMCP.js';

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ── existing AI agent route ──
app.post('/api/decide', async (req, res) => {
  try {
    const { systemPrompt, userPrompt } = req.body;
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
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

// ── NEW: Swiggy MCP routes ──

// Get user addresses
app.get('/api/swiggy/addresses', async (req, res) => {
  try {
    const result = await getAddresses();
    res.json(result);
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Search restaurants
app.post('/api/swiggy/restaurants', async (req, res) => {
  try {
    const { addressId, query } = req.body;
    const result = await searchRestaurants(addressId, query);
    res.json(result);
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Get order history
app.get('/api/swiggy/orders', async (req, res) => {
  try {
    const result = await getFoodOrders();
    res.json(result);
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Full order flow — used by Solo Decision agent
app.post('/api/swiggy/order', async (req, res) => {
  try {
    const { query, budget } = req.body;
    const result = await runFullOrderFlow(query, budget);
    res.json(result);
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.get('/', (req, res) => res.send('Decide API is running'));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
