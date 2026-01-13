export interface Condition {
  name: string;
  effect: string;
  type: 'Positive' | 'Negative';
}

export const conditions: Condition[] = [
  // Negative Conditions
  { name: 'Stunned', effect: 'The character loses 1 action on its next turn.', type: 'Negative' },
  { name: 'Bleeding', effect: 'At the end of its turn, the character takes 1 damage per Bleed token; a heal removes 1 Bleed instead of restoring HP.', type: 'Negative' },
  { name: 'Blinded', effect: 'The next time this character deals damage, that damage is halved (round down), then Blinded ends.', type: 'Negative' },
  { name: 'Silenced', effect: 'The character cannot play Special cards on its next turn.', type: 'Negative' },
  { name: 'Immobilized', effect: 'The character cannot move of its own accord until the end of its next turn (it may still be pushed/pulled).', type: 'Negative' },
  { name: 'Vulnerable', effect: 'All damage this character takes is increased by +2 (once per attack) until its next turn ends.', type: 'Negative' },
  { name: 'Cursed', effect: 'The character cannot be healed until the end of its next turn.', type: 'Negative' },

  // Positive Conditions
  { name: 'Armor', effect: 'Reduce the next incoming damage by 3, then discard this token.', type: 'Positive' },
  { name: 'Fortified', effect: 'Reduce the next incoming damage by 2, then discard this token.', type: 'Positive' },
  { name: 'Hasted', effect: 'Each move action this turn gains +2 squares of movement.', type: 'Positive' },
  { name: 'Focused', effect: 'The character’s next attack this turn deals +2 damage.', type: 'Positive' },
  { name: 'Stealthed', effect: 'Until it attacks or takes damage, this character cannot be chosen as a target for enemy combat-card attacks.', type: 'Positive' },
  { name: 'Regenerating', effect: 'At the end of its turn, the character heals 2 HP (duration 1 round).', type: 'Positive' },
  { name: 'Empowered', effect: 'Until turn end, all attacks by this character deal +1 damage.', type: 'Positive' },
  { name: 'Phase-Shifted', effect: 'The character ignores terrain and may move through figures until its next turn starts.', type: 'Positive' },
]; 