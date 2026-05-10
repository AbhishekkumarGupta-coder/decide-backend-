import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

import {
  runFoodOrderFlow,
  runGroceryOrderFlow,
  runBookTableFlow,
  runPlanEveningFlow,
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

// ── AI agent route ──
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

// ── Swiggy MCP routes ──

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

// Recipe 1 — Food order end-to-end
app.post('/api/swiggy/order', async (req, res) => {
  try {
    const { query, budget } = req.body;
    const result = await runFoodOrderFlow(query, budget);
    res.json(result);
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Recipe 2 — Grocery order end-to-end
app.post('/api/swiggy/groceries', async (req, res) => {
  try {
    const { query, useGoToItems } = req.body;
    const result = await runGroceryOrderFlow(query, useGoToItems);
    res.json(result);
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Recipe 3 — Book a table end-to-end
app.post('/api/swiggy/book-table', async (req, res) => {
  try {
    const { query, guestCount, date } = req.body;
    const result = await runBookTableFlow(query, guestCount, date);
    res.json(result);
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Recipe 4 — Plan my evening (combined Food + Dineout)
app.post('/api/swiggy/plan-evening', async (req, res) => {
  try {
    const { query, guestCount, budget } = req.body;
    const result = await runPlanEveningFlow(query, guestCount, budget);
    res.json(result);
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.get('/', (req, res) => res.send('Decide API is running'));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));