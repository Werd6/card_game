import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
} from '@mui/material';
import { presetMaps } from '../types/maps';

interface MapSelectionModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (mapId: string) => void;
  currentMapId: string;
}

export const MapSelectionModal: React.FC<MapSelectionModalProps> = ({ 
  open, 
  onClose, 
  onConfirm, 
  currentMapId 
}) => {
  const [selectedMapId, setSelectedMapId] = useState(currentMapId);

  const handleConfirm = () => {
    onConfirm(selectedMapId);
    onClose();
  };

  const selectedMap = presetMaps.find(m => m.id === selectedMapId);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Change Map</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <FormControl fullWidth>
            <InputLabel>Select Map</InputLabel>
            <Select
              value={selectedMapId}
              label="Select Map"
              onChange={(e) => setSelectedMapId(e.target.value)}
            >
              {presetMaps.map((map) => (
                <MenuItem key={map.id} value={map.id}>
                  {map.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          {selectedMap && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedMap.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedMap.description}
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleConfirm} 
          variant="contained" 
          disabled={selectedMapId === currentMapId}
        >
          Change Map
        </Button>
      </DialogActions>
    </Dialog>
  );
}; 