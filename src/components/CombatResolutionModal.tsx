import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, Paper } from '@mui/material';
import type { CombatResult, Character } from '../types/game';
import { Card } from './Card';

interface CombatResolutionModalProps {
  result: CombatResult;
  attacker: Character;
  defender: Character;
  characters: Character[];
  onClose: () => void;
}

export const CombatResolutionModal: React.FC<CombatResolutionModalProps> = ({ result, attacker, defender, characters, onClose }) => {
  return (
    <Dialog open={true} onClose={onClose} maxWidth="md">
      <DialogTitle>Combat Resolution</DialogTitle>
      <DialogContent>
        <Box display="flex" justifyContent="center" alignItems="stretch" gap={4}>
          <Paper elevation={3} sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6">{attacker.name} (Attacker)</Typography>
            <Card card={result.attackingCard} characters={characters} isSelected />
          </Paper>
          
          <Box display="flex" alignItems="center">
            <Typography variant="h4">VS</Typography>
          </Box>

          <Paper elevation={3} sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6">{defender.name} (Defender)</Typography>
            {result.defendingCard ? (
              <Card card={result.defendingCard} characters={characters} isSelected />
            ) : (
              <Box sx={{p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%'}}>
                <Typography variant="h6" color="textSecondary">Did not defend</Typography>
              </Box>
            )}
          </Paper>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained">Close</Button>
      </DialogActions>
    </Dialog>
  );
}; 