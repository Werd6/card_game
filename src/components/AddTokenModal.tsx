import { useState } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { useGameStore } from '../store/gameStore';
import type { Character } from '../types/game';

type TokenProperties = Omit<Character, 'id'>;

interface AddTokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (token: TokenProperties) => void;
}

export function AddTokenModal({ isOpen, onClose, onConfirm }: AddTokenModalProps) {
  const { players } = useGameStore();
  const [name, setName] = useState('Token');
  const [health, setHealth] = useState(1);
  const [size, setSize] = useState<'small' | 'medium' | 'large' | 'huge' | 'giant'>('medium');
  const [ownerId, setOwnerId] = useState<string>('');
  const [ranged, setRanged] = useState(false);

  const handleConfirm = () => {
    if (ownerId && name) {
      const token: TokenProperties = {
        name,
        health,
        maxHealth: health,
        size,
        playerId: ownerId,
        imageUrl: '',
        position: { x: 50, y: 50 },
        conditions: [],
        ranged, // Add ranged property
      };
      onConfirm(token);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Add Token Character</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label="Token Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
          />
          <TextField
            label="Health"
            type="number"
            value={health}
            onChange={(e) => {
              const value = parseInt(e.target.value, 10);
              setHealth(isNaN(value) ? 1 : value);
            }}
            fullWidth
          />
          <FormControl fullWidth>
            <InputLabel>Size</InputLabel>
            <Select value={size} label="Size" onChange={(e) => setSize(e.target.value as any)}>
              <MenuItem value="small">Small</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="large">Large</MenuItem>
              <MenuItem value="huge">Huge</MenuItem>
              <MenuItem value="giant">Giant</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Owner</InputLabel>
            <Select value={ownerId} label="Owner" onChange={(e) => setOwnerId(e.target.value)}>
              {players.map((p) => (
                <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Attack Type</InputLabel>
            <Select value={ranged ? 'ranged' : 'melee'} label="Attack Type" onChange={(e) => setRanged(e.target.value === 'ranged')}>
              <MenuItem value="melee">Melee</MenuItem>
              <MenuItem value="ranged">Ranged</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleConfirm} variant="contained" disabled={!ownerId || !name}>
          Create Token
        </Button>
      </DialogActions>
    </Dialog>
  );
} 