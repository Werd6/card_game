# Card Game - Epic Duels

A multiplayer tactical card game built with React, TypeScript, and Supabase. Players battle with custom decks featuring characters from various franchises in strategic turn-based combat.

## 🎮 Game Overview

Epic Duels is a tactical card game where players control teams of characters on a grid-based battlefield. Each player builds a deck around major characters (heroes) and their minor sidekicks, using combat cards and special abilities to defeat opponents.

### Game Objective
Defeat every opposing major character (the hero shown on each 30-card deck). Eliminating minor sidekicks helps but does not win the game. The last player or team with at least one major character still standing wins.

### Key Features
- **Multiplayer Support**: Real-time multiplayer games via Supabase Realtime
- **Custom Decks**: Create and play with decks featuring characters from various franchises (One-Punch Man, Pokemon, Godzilla, and more)
- **Tactical Combat**: Turn-based gameplay with movement, card-based attacks, and special abilities
- **Grid-Based Battlefield**: Strategic positioning on customizable maps
- **Deck Building**: Custom deck management system with character stats and card collections

## 🎯 How to Play

### Turn Structure

Each turn consists of:

1. **Move Phase**: Roll the movement die and move figures as indicated. Movement and line-of-sight are orthogonal (no diagonal moves), but ranged attacks may trace diagonal LoS.

2. **Actions Phase** (take 2 actions): Any mix of:
   - Draw 1 extra card
   - Play a Combat card to attack (melee if adjacent, or ranged with LoS)
   - Play a Special or Power-Combat card
   - Heal 1 damage on a major by discarding a card belonging to a defeated minor

### Combat Resolution

1. Attacker selects a legal target and places an attack card face-down
2. Defender may place a defense card face-down or decline
3. Reveal both cards. Damage = attack – defense (minimum 0)
4. Apply damage to the target's health, discard the cards, and resolve any text effects

### Healing

After all of a team's minors are destroyed, any remaining minor-character cards become med-packs: spend one action, discard one such card, and heal the major 1 hit point.

### Player Counts & Team Play

- **2 players**: Head-to-head duel
- **3–6 players**: Free-for-all or fixed teams (2 v 2 or 3 v 3). A team wins when every enemy major is defeated. Eliminated players still command any surviving minors.

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- A Supabase account (for multiplayer functionality)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Werd6/card_game.git
cd card_game
```

2. Install dependencies:
```bash
npm install
```

3. Set up Supabase:
   - Create a new Supabase project
   - Run the SQL schema in `supabase_schema.sql` in your Supabase SQL Editor
   - Update `src/supabaseClient.ts` with your project URL and API key

4. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Building for Production

```bash
npm run build
npm run preview
```

## 🗂️ Project Structure

```
card_game/
├── src/
│   ├── components/       # React components (GameBoard, Hand, DeckManager, etc.)
│   ├── store/            # Zustand state management
│   ├── types/            # TypeScript type definitions
│   ├── hooks/            # Custom React hooks
│   └── supabaseClient.ts # Supabase client configuration
├── characters/           # Published character decks (JSON)
├── characters_wip/       # Work-in-progress character decks
├── public/               # Static assets (maps, images)
└── supabase_schema.sql   # Database schema for Supabase
```

## 🎴 Creating Custom Decks

Decks are JSON files with the following structure:

```json
{
  "id": "deck-id",
  "name": "Deck Name",
  "author": "Author Name",
  "version": "1.0.0",
  "description": "Deck description",
  "characters": [
    {
      "id": "character-id",
      "name": "Character Name",
      "hp": 20,
      "size": "medium",
      "ranged": false,
      "traits": ["trait1", "trait2"],
      "minionCount": 1
    }
  ],
  "cards": [
    { "id": 1, "owner": "character-id", "type": "combat", "attack": 5, "defense": 2 },
    { "id": 2, "owner": "character-id", "type": "special", "name": "Special Move", "rulesText": "Effect description" }
  ]
}
```

Place deck files in the `characters/` or `characters_wip/` directory and they will be available in the Deck Manager.

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **UI Framework**: Material-UI (MUI)
- **State Management**: Zustand
- **Backend**: Supabase (PostgreSQL + Realtime)
- **Drag & Drop**: @dnd-kit

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Add new character decks
- Report bugs
- Suggest features
- Submit pull requests

## 📄 License

This project is private and proprietary.

## 🎨 Character Decks

The game includes decks for various characters including:
- Saitama & Genos (One-Punch Man)
- Greninja & Froakie (Pokemon)
- Godzilla
- Darth Vader
- And many more in development!

Check the `characters/` and `characters_wip/` directories for available decks.

## 🐛 Known Issues

- Database schema setup required before first run
- Some edge cases in multiplayer synchronization may occur

## 📞 Support

For issues or questions, please open an issue on GitHub.
