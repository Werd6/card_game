import { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Container,
  Paper,
  Divider,
  Chip
} from '@mui/material';
import { useDeckStore } from '../store/deckStore';
import type { DeckConfig } from '../types/deck';
import type { Card as GameCard } from '../types/game';
import TextField from '@mui/material/TextField';

const isCombatCard = (card: GameCard): card is GameCard & { type: 'combat' } => card.type === 'combat';

interface DeckSelectionProps {
  onDeckSelected: (deckId: string) => void;
  onCancel: () => void;
}

export const DeckSelection = ({ onDeckSelected, onCancel }: DeckSelectionProps) => {
  const { decks, isLoading, error, loadDeckFromFile } = useDeckStore();
  const [selectedDeckId, setSelectedDeckId] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewDeck, setPreviewDeck] = useState<DeckConfig | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setSelectedDeckId('');
      setPreviewError(null);
      file.text().then((text) => {
        try {
          const config = JSON.parse(text);
          setPreviewDeck(config);
          setShowPreview(true);
        } catch (error: any) {
          setPreviewError(error.message || 'Failed to parse deck file');
        }
      });
    }
  };

  const handleLoadDeck = async () => {
    if (selectedFile) {
      const result = await loadDeckFromFile(selectedFile);
      if (result.success && result.deck) {
        setSelectedDeckId(result.deck.id);
        setSelectedFile(null);
        setPreviewDeck(null);
        setShowPreview(false);
        setPreviewError(null);
      } else {
        setPreviewError(result.error || 'Failed to load deck');
      }
    }
  };

  const handleConfirmSelection = () => {
    if (selectedDeckId) {
      onDeckSelected(selectedDeckId);
    }
  };

  const handleClosePreview = () => {
    setShowPreview(false);
    setPreviewDeck(null);
    setSelectedFile(null);
    setPreviewError(null);
  };

  const filteredDecks = Object.values(decks).filter(deck =>
    deck.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Container maxWidth="md" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Paper elevation={6} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 2, width: '100%', maxWidth: 700, mx: 'auto' }}>
        <Typography variant="h3" component="h1" gutterBottom align="center" sx={{ fontWeight: 'bold' }}>
          Choose Your Deck
        </Typography>
        <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 5 }}>
          Select a pre-loaded deck or upload your own to get started.
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4, alignItems: 'center', justifyContent: 'center' }}>
          {/* Left Column: Select from list */}
          <Stack spacing={2} sx={{ width: { xs: '100%', md: '45%' } }}>
            <Typography variant="h5" align="center" gutterBottom>Available Decks</Typography>
            <TextField
              label="Search decks"
              variant="outlined"
              size="small"
              value={search}
              onChange={e => setSearch(e.target.value)}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel id="deck-select-label">Choose from available decks</InputLabel>
              <Select
                labelId="deck-select-label"
                value={selectedDeckId}
                label="Choose from available decks"
                onChange={(e) => {
                  setSelectedDeckId(e.target.value);
                  setSelectedFile(null);
                }}
              >
                {filteredDecks.length === 0 ? (
                  <MenuItem disabled>No decks found</MenuItem>
                ) : (
                  filteredDecks.map((deck) => (
                    <MenuItem key={deck.id} value={deck.id}>
                      <Stack>
                        <Typography variant="body1">{deck.name}</Typography>
                        <Typography variant="caption" color="text.secondary">by {deck.author}</Typography>
                      </Stack>
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          </Stack>

          {/* Divider */}
          <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }}>
            <Chip label="OR" />
          </Divider>
          <Divider sx={{ width: '100%', my: 2, display: { xs: 'block', md: 'none' } }}>OR</Divider>
          
          {/* Right Column: Upload */}
          <Stack spacing={2} sx={{ width: { xs: '100%', md: '45%' } }}>
            <Typography variant="h5" align="center" gutterBottom>Upload Custom Deck</Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <input
                accept=".json"
                style={{ display: 'none' }}
                id="deck-file-input"
                type="file"
                onChange={handleFileSelect}
              />
              <label htmlFor="deck-file-input">
                <Button variant="outlined" component="span" size="large">
                  Choose Deck File
                </Button>
              </label>
            </Box>
            {selectedFile && (
              <Typography variant="body2" sx={{ mt: 1 }} align="center">
                Selected: <b>{selectedFile.name}</b>
              </Typography>
            )}
          </Stack>
        </Box>

        {/* Error Display & Loading */}
        <Box sx={{ my: 4, minHeight: 60, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {(error || previewError) && (
            <Alert severity="error" sx={{ width: '100%' }}>{error || previewError}</Alert>
          )}
          {isLoading && <CircularProgress />}
        </Box>

        {/* Action Buttons */}
        <Stack direction="row" spacing={2} justifyContent="center">
          <Button variant="text" onClick={onCancel} sx={{ minWidth: 150 }}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            size="large"
            onClick={handleConfirmSelection}
            disabled={!selectedDeckId}
            sx={{ minWidth: 150 }}
          >
            Confirm Selection
          </Button>
        </Stack>
      </Paper>
      
      {/* Deck Preview Dialog */}
      <Dialog open={showPreview} onClose={handleClosePreview} maxWidth="md" fullWidth>
        <DialogTitle>Deck Preview</DialogTitle>
        <DialogContent>
          {previewDeck && (
            <Stack spacing={2}>
              <Typography variant="h4">{previewDeck.name}</Typography>
              <Typography variant="subtitle1" color="text.secondary">
                by {previewDeck.author} (v{previewDeck.version})
              </Typography>
              {previewDeck.description && (
                <Typography variant="body1" sx={{ fontStyle: 'italic' }}>{previewDeck.description}</Typography>
              )}
              <Divider />
              <Typography variant="h6">
                Cards ({previewDeck.cards.length}):
              </Typography>
              <Box sx={{ maxHeight: 300, overflow: 'auto', p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                {previewDeck.cards.map((card) => (
                  <Box key={card.id} sx={{ mb: 1 }}>
                    <Typography variant="body2">
                      <b>{isCombatCard(card) ? `Combat Card #${card.id}` : card.name}:</b>
                      {isCombatCard(card) 
                        ? ` ATK: ${card.attack} / DEF: ${card.defense}`
                        : ` ${card.rulesText}`
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
            Load and Select this Deck
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}; 