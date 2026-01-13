import { useState } from 'react';
import {
  Box,
  Button,
  Card as MuiCard,
  CardContent,
  CardActions,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Stack,
  Chip,
} from '@mui/material';
import { useDeckStore } from '../store/deckStore';
import type { DeckConfig } from '../types/deck';
import type { Card as GameCard } from '../types/game';

const isCombatCard = (card: GameCard): card is GameCard & { type: 'combat' } => card.type === 'combat';

export const DeckManager = () => {
  const { decks, activeDeckId, isLoading, error, loadDeckFromFile, setActiveDeck, removeDeck } = useDeckStore();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewDeck, setPreviewDeck] = useState<DeckConfig | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewError(null);
      // Preview the deck before loading
      file.text().then((text) => {
        try {
          const config = JSON.parse(text);
          // Basic validation before showing preview
          if (!config.id || !config.name || !config.author || !config.version || !Array.isArray(config.cards)) {
            throw new Error('Invalid deck format: missing required fields');
          }
          if (config.cards.length !== 30) {
            throw new Error('Invalid deck: must contain exactly 30 cards');
          }
          setPreviewDeck(config);
          setShowPreview(true);
        } catch (error) {
          console.error('Failed to parse deck file:', error);
          setPreviewError(error instanceof Error ? error.message : 'Failed to parse deck file');
        }
      });
    }
  };

  const handleLoadDeck = async () => {
    if (selectedFile) {
      const result = await loadDeckFromFile(selectedFile);
      if (result.success) {
        setSelectedFile(null);
        setPreviewDeck(null);
        setShowPreview(false);
        setPreviewError(null);
      } else {
        setPreviewError(result.error || 'Failed to load deck');
      }
    }
  };

  const handleClosePreview = () => {
    setShowPreview(false);
    setPreviewDeck(null);
    setSelectedFile(null);
    setPreviewError(null);
  };

  return (
    <Box sx={{ p: 2 }}>
      <Stack spacing={2}>
        <Box>
          <input
            accept=".json"
            style={{ display: 'none' }}
            id="deck-file-input"
            type="file"
            onChange={handleFileSelect}
          />
          <label htmlFor="deck-file-input">
            <Button variant="contained" component="span">
              Load Deck
            </Button>
          </label>
        </Box>

        {(error || previewError) && (
          <Alert severity="error" onClose={() => {}}>
            {error || previewError}
          </Alert>
        )}

        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <CircularProgress />
          </Box>
        )}

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {Object.values(decks).map((deck) => (
            <MuiCard
              key={deck.id}
              sx={{
                width: 300,
                bgcolor: activeDeckId === deck.id ? 'action.selected' : 'background.paper',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <CardContent sx={{ position: 'relative', zIndex: 2, pt: 2 }}>
                <Typography variant="h6" gutterBottom>
                  {deck.name}
                </Typography>
                {deck.description && (
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {deck.description}
                  </Typography>
                )}
                <Typography variant="caption" display="block">
                  Author: {deck.author}
                </Typography>
                <Typography variant="caption" display="block">
                  Cards: {deck.cards.length}
                </Typography>
                <Typography variant="caption" display="block">
                  Characters: {deck.characters.length}
                </Typography>
                <Typography variant="caption" display="block">
                  Version: {deck.version}
                </Typography>
              </CardContent>
              <CardActions sx={{ position: 'relative', zIndex: 2 }}>
                <Button
                  size="small"
                  onClick={() => setActiveDeck(deck.id)}
                  disabled={activeDeckId === deck.id}
                >
                  {activeDeckId === deck.id ? 'Active' : 'Activate'}
                </Button>
                <Button
                  size="small"
                  color="error"
                  onClick={() => removeDeck(deck.id)}
                >
                  Remove
                </Button>
              </CardActions>
            </MuiCard>
          ))}
        </Box>
      </Stack>

      <Dialog open={showPreview} onClose={handleClosePreview} maxWidth="md" fullWidth>
        <DialogTitle>Preview Deck</DialogTitle>
        <DialogContent>
          {previewDeck && (
            <Stack spacing={2}>
              <Typography variant="h6">{previewDeck.name}</Typography>
              {previewDeck.description && (
                <Typography variant="body2">{previewDeck.description}</Typography>
              )}
              <Typography variant="caption">
                Author: {previewDeck.author} | Version: {previewDeck.version}
              </Typography>
              <Typography variant="subtitle2">
                Cards ({previewDeck.cards.length}):
              </Typography>
              <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                {previewDeck.cards.map((card) => (
                  <Box key={card.id} sx={{ mb: 1 }}>
                    <Typography variant="body2">
                      {isCombatCard(card) 
                        ? `Card ${card.id} (Combat) - ATK: ${card.attack} DEF: ${card.defense}`
                        : `${card.name} (Special) - ${card.rulesText}`
                      }
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePreview}>Cancel</Button>
          <Button onClick={handleLoadDeck} variant="contained" disabled={!!previewError}>
            Load Deck
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}; 