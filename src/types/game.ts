export interface Position {
  x: number;
  y: number;
}

export type CardType = 'combat' | 'special';

export interface BaseCard {
  id: number;
  type: CardType;
  imageUrl?: string;
  owner?: string;
}

export interface CombatCard extends BaseCard {
  type: 'combat';
  attack: number;
  defense: number;
}

export interface SpecialCard extends BaseCard {
  type: 'special';
  name: string;
  rulesText: string;
}

export type Card = CombatCard | SpecialCard;

export interface Player {
  id: string;
  name: string;
  hand: Card[];
  deck: Card[];
  discardPile: Card[];
}

export interface Character {
  id: string;
  playerId: string;
  name: string;
  imageUrl?: string;
  position: Position;
  health: number;
  maxHealth: number;
  size: 'small' | 'medium' | 'large' | 'huge' | 'giant';
  conditions: string[];
  ranged: boolean; // true = ranged, false = melee
}

export interface AttackInProgress {
  attackerId: string;
  defenderId: string;
  card: CombatCard;
}

export interface CombatResult {
  attackerId: string;
  defenderId: string;
  attackingCard: CombatCard;
  defendingCard: CombatCard | null;
}

export interface PlayLogEntry {
  playerId: string;
  playerName: string;
  card?: Card;
  message?: string;
  timestamp: number;
}

export interface DeckInspection {
  isOpen: boolean;
  inspectorId: string | null;
  targetPlayerId: string | null;
  cards: Card[];
}

export interface GameState {
  players: Player[];
  characters: Character[];
  gridSize: { width: number; height: number };
  mapId: string;
  selectedCard: Card | null;
  selectedCharacter: Character | null;
  log: PlayLogEntry[];
  attackInProgress: AttackInProgress | null;
  lastAttack: CombatResult | null;
  deckInspection: DeckInspection;
}