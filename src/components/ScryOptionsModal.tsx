import { useState } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Box,
} from '@mui/material';
import { useGameStore } from '../store/gameStore';

interface ScryOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (playerId: string, count: number) => void;
}

export function ScryOptionsModal({ isOpen, onClose, onConfirm }: ScryOptionsModalProps) {
  const { players } = useGameStore();
  const [targetPlayerId, setTargetPlayerId] = useState<string>('');
  const [scryCount, setScryCount] = useState<number>(3);

  const handleConfirm = () => {
    if (targetPlayerId && scryCount > 0) {
      onConfirm(targetPlayerId, scryCount);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Scry Options</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <FormControl fullWidth>
            <InputLabel id="player-select-label">Select Player</InputLabel>
            <Select
              labelId="player-select-label"
              value={targetPlayerId}
              label="Select Player"
              onChange={(e) => setTargetPlayerId(e.target.value)}
            >
              {players.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            type="number"
            label="Number of Cards"
            value={scryCount}
            onChange={(e) => setScryCount(parseInt(e.target.value, 10))}
            inputProps={{ min: 1 }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleConfirm} variant="contained" disabled={!targetPlayerId || scryCount <= 0}>
          Inspect Deck
        </Button>
      </DialogActions>
    </Dialog>
  );
} 