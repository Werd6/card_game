import React from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';
import { styled } from '@mui/material/styles';
import { CharacterStatCard } from './CharacterStatCard';
import { useGameStore } from '../store/gameStore';
import { useDeckStore } from '../store/deckStore';
import { supabase } from '../supabaseClient';
import type { RealtimeChannel } from '@supabase/supabase-js';

const StatsPanel = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  height: 'fit-content',
  maxHeight: 'calc(100vh - 100px)',
  overflowY: 'auto',
  background: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.25)' : 'rgba(255, 255, 255, 0.9)',
  backdropFilter: 'blur(10px)',
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  width: 360,
}));

const CharacterGrid = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
  minWidth: 250,
}));

interface CharacterStatsPanelProps {
  gameInfo: any;
  channel: RealtimeChannel | null;
}

export const CharacterStatsPanel = ({ gameInfo, channel }: CharacterStatsPanelProps) => {
  const { players, characters } = useGameStore();
  const { decks } = useDeckStore();

  if (characters.length === 0) {
    return (
      <StatsPanel>
        <Typography variant="h6" color="text.secondary" textAlign="center">
          No characters in game
        </Typography>
      </StatsPanel>
    );
  }

  return (
    <StatsPanel>
      <Typography variant="h6" sx={{ mb: 2, textAlign: 'center', fontWeight: 'bold' }}>
        Character Stats
      </Typography>
      <CharacterGrid>
        {players.map((player, index) => (
          <Box key={player.id} sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold', color: 'primary.main' }}>
              {player.name}'s Characters
            </Typography>
            {characters
              .filter(c => c.playerId === player.id)
              .map((character) => {
                // For multi-character decks, traits are on the character object.
                // For single-character decks, they are on the deck object.
                const parentDeck = Object.values(decks).find(deck =>
                  deck.characters?.some(c => character.id.endsWith(c.id))
                );
                const deckCharacter = parentDeck?.characters?.find(c => character.id.endsWith(c.id));
                const characterTraits = deckCharacter?.traits || [];

                // Find the player for this character and get hand count
                const playerForCharacter = players.find(p => p.id === character.playerId);
                const handCount = playerForCharacter ? playerForCharacter.hand.length : 0;

                return (
                  <CharacterStatCard
                    key={character.id}
                    character={character}
                    gameInfo={gameInfo}
                    channel={channel}
                    deckTraits={characterTraits}
                    handCount={handCount}
                  />
                );
              })}
          </Box>
        ))}
      </CharacterGrid>
    </StatsPanel>
  );
}; 