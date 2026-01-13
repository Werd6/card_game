import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
  Typography,
} from '@mui/material';
import { conditions } from '../types/conditions';

interface ConditionsListModalProps {
  open: boolean;
  onClose: () => void;
}

export const ConditionsListModal: React.FC<ConditionsListModalProps> = ({ open, onClose }) => {
  const positiveConditions = conditions.filter(c => c.type === 'Positive');
  const negativeConditions = conditions.filter(c => c.type === 'Negative');

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Conditions and Effects</DialogTitle>
      <DialogContent dividers>
        <Typography variant="h6" color="success.main" sx={{ mt: 1, mb: 1 }}>Positive Conditions</Typography>
        <List dense>
          {positiveConditions.map((condition, index) => (
            <React.Fragment key={condition.name}>
              <ListItem>
                <ListItemText
                  primary={<Typography variant="subtitle1" fontWeight="bold">{condition.name}</Typography>}
                  secondary={condition.effect}
                />
              </ListItem>
              {index < positiveConditions.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
        <Divider sx={{ my: 2 }} />
        <Typography variant="h6" color="error.main" sx={{ mt: 2, mb: 1 }}>Negative Conditions</Typography>
        <List dense>
          {negativeConditions.map((condition, index) => (
            <React.Fragment key={condition.name}>
              <ListItem>
                <ListItemText
                  primary={<Typography variant="subtitle1" fontWeight="bold">{condition.name}</Typography>}
                  secondary={condition.effect}
                />
              </ListItem>
              {index < negativeConditions.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}; 