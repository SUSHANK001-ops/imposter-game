# 🕵️‍♂️ Imposter Game — Real-Time Social Deduction MVP

A real-time multiplayer "Imposter" social deduction game built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, **Socket.IO**, and **MongoDB / Mongoose**.

---

## 🌟 Game Features & Rules

1. **20-Player Max Limit & Host Multi-Category Selection**
   - Rooms support **up to 20 players** (selectable options: 4, 8, 12, 16, 20).
   - Host can select multiple categories (or toggle all) for random secret word drawing.

2. **Turn-Based Clue Submissions (20s per member)**
   - No general chat clutter. Each player gets **20 seconds** to submit a 1-word or short clue.
   - Submitted clues display directly inside each player's card box.

3. **Instant Live Voting & Vote Changing**
   - Click any player card to cast your vote instantly.
   - Change your vote as many times as you want during the voting phase countdown.

4. **Solid Red, White & Navy Design**
   - Clean, high-contrast flat colors (Navy Slate background `#070d1d`, Crimson Red, Royal Blue, Crisp White) with zero purple or gradient clutter.

---

## 🚀 Quick Start Guide

### 1. Installation
```bash
npm install
```

### 2. Running Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.
