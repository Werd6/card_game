import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
  Box,
} from '@mui/material';

interface RulesReferenceModalProps {
  open: boolean;
  onClose: () => void;
}

export const RulesReferenceModal: React.FC<RulesReferenceModalProps> = ({ open, onClose }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Rules Reference</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ maxHeight: 500, overflowY: 'auto' }}>
          <Typography variant="h6" gutterBottom>Goal</Typography>
          <Typography variant="body2" paragraph>
            Defeat every opposing major character (the hero shown on each 30-card deck). Eliminating minor sidekicks helps but does not win the game. The last player or team with at least one major still standing wins.
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" gutterBottom>Turn Structure</Typography>
          <List dense>
            <ListItem>
              <ListItemText 
                primary="A. Move" 
                secondary="Roll the movement die and move figures as indicated. Movement and line-of-sight are orthogonal; no diagonal moves, but ranged attacks may trace diagonal LoS." 
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="B. Actions (take 2)" 
                secondary="Any mix of: Draw 1 extra card, Play a Combat card to attack (melee if adjacent, or ranged with LoS), Play a Special or Power-Combat card, Heal 1 damage on a major by discarding a card belonging to a defeated minor" 
              />
            </ListItem>
          </List>
          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" gutterBottom>Combat Resolution</Typography>
          <Typography variant="body2" paragraph>
            • Attacker selects a legal target and places an attack card face-down.
          </Typography>
          <Typography variant="body2" paragraph>
            • Defender may place a defense card face-down or decline.
          </Typography>
          <Typography variant="body2" paragraph>
            • Reveal both cards. Damage = attack – defense (minimum 0). Apply damage to the target's health dial, discard the cards, and resolve any text effects.
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" gutterBottom>Healing Details</Typography>
          <Typography variant="body2" paragraph>
            After all of a team's minors are destroyed, any remaining minor-character cards become med-packs: spend one action, discard one such card, and heal the major 1 hit point.
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" gutterBottom>Deck Exhaustion</Typography>
          <Typography variant="body2" paragraph>
            If your draw pile empties, shuffle your discard pile to form a new deck. When both piles are gone, play continues with only the cards remaining in hand; there is no fatigue damage.
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" gutterBottom>Player Counts & Team Play</Typography>
          <Typography variant="body2" paragraph>
            • 2 players – head-to-head duel.
          </Typography>
          <Typography variant="body2" paragraph>
            • 3–6 players – free-for-all or fixed teams (2 v 2 or 3 v 3). A team wins when every enemy major is defeated. Eliminated players still command any surviving minors.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">Close</Button>
      </DialogActions>
    </Dialog>
  );
}; 