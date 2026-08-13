# 🕵️‍♂️ Imposter Game — Real-Time Social Deduction MVP

A real-time multiplayer "Imposter" social deduction game built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, **Socket.IO**, and **MongoDB / Mongoose**.

---

## 🌟 Enhanced Game Rules & Features

1. **Turn-Based Clue Submissions (20s per member)**
   - **No General Chat**: Open chat has been replaced with turn-based clue rounds!
   - Each player gets **20 seconds** (configurable by host: 10s, 15s, 20s, 30s) during their turn to type a 1-word or short clue describing the secret word.
   - When a player submits their word or their 20s timer expires, the turn automatically advances to the next player.

2. **Clue Display Box in Player Cards**
   - Each member's submitted word/clue appears directly inside their card box on the player grid.

3. **Instant Live Voting & Vote Changing**
   - **No Confirmation Button**: Tapping/clicking any player card immediately casts a vote.
   - **Vote Changing**: Players can change their vote as many times as they want during the voting countdown window.

4. **Room Requirements & Host Controls**
   - **3+ Player Minimum**: Minimum 3 players required to start a game round.
   - **Admin Settings**: Host can customize turn timer duration, max players (4-12), and Imposter Hint mode.
   - **Imposter Hint Mode**: Host can enable decoy words/hints for the Imposter.

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

---

## 🛠️ Socket.IO Event Reference

### Client → Server Events
- `room:create` `{ name, playerId }`
- `room:join` `{ roomCode, name, playerId }`
- `player:reconnect` `{ roomCode, playerId, name }`
- `game:start` `{ roomCode }`
- `clue:submit` `{ roomCode, playerId, text }`
- `game:vote` `{ roomCode, targetPlayerId, voterPlayerId }`
- `word:add` `{ roomCode, word, category }`
- `room:settingsUpdate` `{ roomCode, settings }`
- `room:kick` `{ roomCode, targetPlayerId }`
- `game:playAgain` `{ roomCode }`

### Server → Client Events
- `room:updated` `{ code, players, status, settings, currentGame }`
- `game:started` `{ role, category, word, imposterHint }`
- `game:timerTick` `{ phase, turnTimeLeft, currentTurnPlayerId }`
- `game:phaseChanged` `{ phase, timer }`
- `game:results` `{ winner, winnerText, realWord, imposterPlayerIds, votes }`
