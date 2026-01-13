import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box } from '@mui/material';
import type { AttackInProgress, Card as GameCard, Player, CombatCard, Character } from '../types/game';
import { Card } from './Card';
import { useGameStore } from '../store/gameStore';
import { Paper } from '@mui/material';

// A simple component to represent the back of a card
const HiddenCard = () => (
  <Paper 
    elevation={3} 
    sx={{ 
      width: 150, 
      height: 210, 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'repeating-linear-gradient(45deg, #ccc, #ccc 10px, #ddd 10px, #ddd 20px)',
      border: '3px solid black'
    }}
  >
    <Typography variant="h2" color="text.secondary" sx={{ fontWeight: 'bold' }}>??</Typography>
  </Paper>
);

interface DefendModalProps {
  attack: AttackInProgress;
  attacker: Character;
  defender: Player;
  defenderCharacterId: string;
  characters: Character[];
  onDefend: (defendingCard: CombatCard | null) => void;
}

export const DefendModal: React.FC<DefendModalProps> = ({ attack, attacker, defender, defenderCharacterId, characters, onDefend }) => {
  const [selectedCard, setSelectedCard] = useState<CombatCard | null>(null);

  const handleCardSelect = (card: CombatCard) => {
    setSelectedCard(card);
  };

  // Only allow combat cards that belong to the defending character (base or full id)
  const defendersCombatCards = defender.hand.filter(
    c => c.type === 'combat' && c.owner && defenderCharacterId.endsWith(c.owner)
  ) as CombatCard[];

  return (
    <Dialog open={true} maxWidth="md">
      <DialogTitle>You are being attacked by {attacker.name}!</DialogTitle>
      <DialogContent>
        <Box display="flex" gap={4}>
          <Box>
            <Typography variant="h6">Attacking Card</Typography>
            <HiddenCard />
          </Box>
          <Box>
            <Typography variant="h6">Your Hand</Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Choose a combat card to defend with.
            </Typography>
            <Box display="flex" gap={1} overflow="auto" padding={1}>
              {defendersCombatCards.length > 0 ? (
                defendersCombatCards.map(card => (
                  <Card 
                    key={card.id} 
                    card={card} 
                    characters={characters}
                    isSelected={selectedCard?.id === card.id}
                    onClick={() => handleCardSelect(card)}
                  />
                ))
              ) : (
                <Typography>You have no combat cards to defend with.</Typography>
              )}
            </Box>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onDefend(null)} color="secondary">
          Don't Block
        </Button>
        <Button 
          onClick={() => onDefend(selectedCard)} 
          disabled={!selectedCard}
          variant="contained"
        >
          Defend
        </Button>
      </DialogActions>
    </Dialog>
  );
}; 