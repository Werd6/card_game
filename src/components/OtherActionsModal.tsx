import React from 'react';
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, Box } from '@mui/material';

interface OtherActionsModalProps {
  open: boolean;
  onClose: () => void;
  onScry: () => void;
  onAddToken: () => void;
  onViewConditions: () => void;
  onViewRules: () => void;
  onChangeMap: () => void;
  isHost: boolean;
}

export const OtherActionsModal = ({
  open,
  onClose,
  onScry,
  onAddToken,
  onViewConditions,
  onViewRules,
  onChangeMap,
  isHost,
}: OtherActionsModalProps) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Other Actions</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <Button variant="outlined" onClick={onScry}>
            Scry
          </Button>
          <Button variant="outlined" onClick={onAddToken}>
            Add Token
          </Button>
          <Button variant="outlined" onClick={onViewConditions}>
            View Conditions
          </Button>
          <Button variant="outlined" onClick={onViewRules}>
            View Rules
          </Button>
          {isHost && (
            <Button variant="outlined" onClick={onChangeMap}>
              Change Map
            </Button>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}; 