# 🕵️‍♂️ Imposter Game — Real-Time Social Deduction MVP

A real-time multiplayer "Imposter" social deduction game built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, **Socket.IO**, and **MongoDB / Mongoose**.

Players join a room via a 6-character room code, receive secret words, and try to identify the Imposter while the Imposter tries to blend in!

---

## 🌟 Key Features

1. **Word & Category System**
   - **Pre-Seeded Data**: 1280+ words across 16 categories (*Animals, Food & Drinks, Movies, Countries, Sports, Professions, Vehicles, Nature & Geography, Technology & Gadgets, Music & Instruments, Clothing & Accessories, Household Items, Famous People, Video Games, Science & Space, Superheroes & Fiction*).
   - **Admin Word Management**: Room host can add custom words and custom categories in real-time from the lobby word bank modal.
   - **Random Selection**: Automatic random category and secret word selection per round.

2. **Room & Lobby System**
   - **Create Room**: Host enters display name → gets unique 6-character room code (e.g. `X7K2P9`).
   - **Join Room**: Players enter display name + room code.
   - **Reconnection Persistence**: Identity saved in `localStorage` (`playerId` + `roomId`). Refreshing the browser or reconnecting automatically restores player session, score, and secret role.
   - **Host Controls**: Adjust discussion timer (1m - 5m), max players (4-12), toggle Imposter Hint / Decoy word mode, kick players, and start game.
   - **24-Hour Persistence**: MongoDB TTL index automatically cleans up inactive rooms after 24 hours.

3. **Game Flow & Imposter Hint Feature**
   - **Role Reveal**: Crew sees category + real secret word; Imposter sees `???` (or optional decoy hint word if host enabled Imposter Hint mode).
   - **Screen Privacy Peek**: Players can toggle `Hide Secret / Peek Word` to prevent adjacent players in real life from seeing their role.
   - **Discussion Phase**: Synchronized countdown timer with live room chat.
   - **Interactive Voting Phase**: Clickable player cards grid to select suspect and cast votes.
   - **Results & Confetti**: Confetti burst celebration, vote breakdown, secret word reveal, and scoreboard.
   - **Play Again**: Host clicks "Play Again" to reset the game back to the lobby with the same room code and same player list preserved.

4. **Fail-Safe In-Memory Fallback Engine**
   - The app includes full MongoDB / Mongoose support + an **in-memory fallback store**. It works out of the box even before `MONGODB_URI` is provided!

---

## 🚀 Quick Start Guide

### 1. Installation
Clone or navigate to the project directory and install dependencies:
```bash
npm install
```

### 2. Environment Configuration
Create a `.env.local` file in the root directory (optional - works in-memory without MongoDB URI too):
```env
MONGODB_URI=mongodb://localhost:27017/imposter-game
PORT=3000
```

### 3. Data Seeding (1000+ Words)
To seed your local MongoDB database with the 1280+ pre-packaged words:
```bash
npm run seed
```

### 4. Running the Development Server
Run the unified Next.js + Socket.IO server:
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
- `game:vote` `{ roomCode, targetPlayerId, voterPlayerId }`
- `word:add` `{ roomCode, word, category }`
- `room:settingsUpdate` `{ roomCode, settings }`
- `room:kick` `{ roomCode, targetPlayerId }`
- `game:playAgain` `{ roomCode }`
- `chat:message` `{ roomCode, sender, message }`

### Server → Client Events
- `room:updated` `{ code, players, status, settings, currentGame }`
- `game:started` `{ role, category, word, imposterHint }`
- `game:timerTick` `{ phase, timeLeft }`
- `game:phaseChanged` `{ phase, timer }`
- `game:results` `{ winner, winnerText, realWord, imposterPlayerIds, votes }`
- `chat:message` `{ sender, message, isSystem, timestamp }`

---

## 📁 Project Structure

```
imposter-game/
├── server.ts                  # Express + Socket.IO + Next.js HTTP server wrapper
├── scripts/
│   └── seed.ts               # Seed script for 1000+ words in MongoDB
├── src/
│   ├── app/
│   │   ├── globals.css       # Dark glassmorphism & neon styling
│   │   ├── layout.tsx        # Root layout with dark theme fonts & metadata
│   │   ├── page.tsx          # Landing page (Create / Join room)
│   │   └── room/[code]/
│   │       └── page.tsx      # Room Controller (Lobby / Game / Results)
│   ├── components/
│   │   ├── Chat.tsx          # Real-time chat box & system event logs
│   │   ├── PlayerCard.tsx    # Player card (Lobby & Voting grid)
│   │   ├── SettingsModal.tsx # Host settings modal (timer, max players, hints)
│   │   └── WordBankModal.tsx # Host custom word bank manager
│   ├── data/
│   │   └── seedData.ts       # 1280+ words dataset across 16 categories
│   ├── lib/
│   │   ├── gameManager.ts    # Game state machine & memory/DB sync
│   │   ├── mongodb.ts        # Mongoose connection client
│   │   ├── playerIdentity.ts # LocalStorage player identity manager
│   │   └── socket.ts         # Socket.IO client singleton
│   └── models/
│       ├── Category.ts       # Category Mongoose schema
│       ├── Room.ts           # Room & GameSession Mongoose schema
│       └── Word.ts           # Word Mongoose schema
```
