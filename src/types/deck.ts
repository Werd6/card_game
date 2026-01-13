import type { Card } from './game';

export interface Character {
  id: string;
  name: string;
  imageUrl?: string;
  hp: number; // Default: 20
  size: 'small' | 'medium' | 'large' | 'huge' | 'giant'; // Default: 'medium'
  traits: string[];
  minionCount?: number; // Number of instances of this character (default: 1)
  ranged: boolean; // true = ranged, false = melee
}

export interface DeckConfig {
  id: string;
  name: string;
  author: string;
  version: string;
  description?: string;
  
  // Characters array is now mandatory for all decks
  characters: Character[];

  cards: Card[];
  artAssets?: {
    [cardId: string]: {
      cardArt: string;  // URL or base64 image data
      thumbnail?: string;  // Optional smaller version for previews
    };
  };
}

export interface DeckMetadata {
  id: string;
  name: string;
  description: string;
  author: string;
  version: string;
  cardCount: number;
  lastModified: string;
}

export interface DeckCollection {
  [deckId: string]: DeckConfig;
}

export interface DeckLoadResult {
  success: boolean;
  deck?: DeckConfig;
  error?: string;
} 