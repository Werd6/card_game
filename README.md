# Card Game - Epic Duels

A multiplayer tactical card game built with React, TypeScript, and Supabase. Players battle with custom decks featuring characters from various franchises in strategic turn-based combat.

## 🎮 Game Overview

Epic Duels is a tactical card game where players control teams of characters on a grid-based battlefield. Each player builds a deck around major characters (heroes) and their minor sidekicks, using combat cards and special abilities to defeat opponents.

### Game Objective
Defeat every opposing major character (the hero shown on each 30-card deck). Eliminating minor sidekicks helps but does not win the game. The last player or team with at least one major character still standing wins.

### Key Features
- **Multiplayer Support**: Real-time multiplayer games via Supabase Realtime
- **Custom Decks**: Create and play with decks featuring characters from various franchises utilizing AI Prompts that can turn any character or team into a deck.
- **Tactical Combat**: Turn-based gameplay with movement, card-based attacks, and special abilities
- **Grid-Based Battlefield**: Strategic positioning on customizable maps

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

### 🚀 Getting Started

## Playing

- Here is the link for the vercel deployed game, ready for multiplayer
   - https://card-game-y1vf.vercel.app
 
## Deck Building
- On the home page you will find a link to the prompts used for deck generation
- Use the character categorization prompt to cataegorize your character(s)
- Use the formatted output from the categorization prompt with the appropriate deck building prompt
- Download/Copy the JSON output
- *Optional*: Add links to character images instead of the placeholder images contained by default.
- After joining or creating a lobby select and upload your new custom deck.
- Congratulations, you are now ready to play as your favorite character.
  
## 📄 License

This project is private and proprietary.


## 📞 Support

For issues or questions, please open an issue on GitHub.
