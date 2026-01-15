import React from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  IconButton, 
  Chip,
  Avatar,
  LinearProgress
} from '@mui/material';
import { Add as AddIcon, Remove as RemoveIcon, Style as StyleIcon, SportsMma, GpsFixed } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import type { Character } from '../types/game';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { useGameStore } from '../store/gameStore';
import { ConditionsInput } from './ConditionsInput';

const StatCard = styled(Card, {
  shouldForwardProp: (prop) => prop !== '$isSelected',
})<{ $isSelected?: boolean }>(({ theme, $isSelected }) => ({
  position: 'relative',
  minWidth: 300,
  maxWidth: 360,
  minHeight: 160,
  background: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.4)' : 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(10px)',
  border: $isSelected ? `2px solid ${theme.palette.primary.main}` : `1px solid ${theme.palette.divider}`,
  borderRadius: typeof theme.shape.borderRadius === 'number' ? theme.shape.borderRadius * 2 : theme.shape.borderRadius,
  overflow: 'hidden',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[8],
  },
}));

const CharacterBackground = styled(Box, {
  shouldForwardProp: (prop) => prop !== '$imageUrl',
})<{ $imageUrl?: string }>(({ $imageUrl }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundImage: $imageUrl ? `url(${$imageUrl})` : 'none',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  opacity: 0.1,
  zIndex: 0,
}));

const ContentOverlay = styled(Box)(({ theme }) => ({
  position: 'relative',
  zIndex: 1,
  minHeight: 160,
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  padding: theme.spacing(2),
  gap: theme.spacing(2),
  background: theme.palette.mode === 'dark' 
    ? 'linear-gradient(to right, rgba(29,29,29,0.9) 0%, rgba(35,35,35,0.95) 100%)'
    : 'linear-gradient(to right, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.95) 100%)',
}));

const HPControls = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  marginTop: theme.spacing(1),
}));

const TraitChip = styled(Chip)(({ theme }) => ({
  margin: theme.spacing(0.25),
  fontSize: '0.75rem',
  height: 24,
}));

interface CharacterStatCardProps {
  character: Character;
  gameInfo: any;
  channel: RealtimeChannel | null;
  deckTraits?: string[];
  handCount?: number;
}

export const CharacterStatCard: React.FC<CharacterStatCardProps> = ({ 
  character, 
  gameInfo, 
  channel,
  deckTraits = [],
  handCount
}) => {
  const { selectedCharacter, selectCharacter, updateCharacterConditions } = useGameStore();
  const isSelected = selectedCharacter?.id === character.id;
  const isSpectator = gameInfo?.isSpectator ?? false;

  const handleHPChange = async (delta: number) => {
    if (isSpectator || !channel || !gameInfo?.gameId) return;
    
    const newHealth = Math.max(0, Math.min(character.maxHealth, character.health + delta));
    if (newHealth === character.health) return;

    // Use the store's updateCharacterHealth function
    const { updateCharacterHealth } = useGameStore.getState();
    await updateCharacterHealth(character.id, newHealth, gameInfo.gameId, channel);
  };

  const handleConditionsChange = async (newConditions: string[]) => {
    if (isSpectator || !channel || !gameInfo?.gameId) return;
    await updateCharacterConditions(character.id, newConditions, gameInfo.gameId, channel);
  };

  const handleCardClick = () => {
    if (isSpectator) return;
    selectCharacter(isSelected ? null : character);
  };

  const healthPercentage = (character.health / character.maxHealth) * 100;
  const healthColor = healthPercentage > 60 ? 'success' : healthPercentage > 30 ? 'warning' : 'error';

  return (
    <StatCard $isSelected={isSelected} onClick={handleCardClick}>
      {/* Hand count badge in top-right */}
      {typeof handCount === 'number' && (
        <Box
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 36,
            height: 36,
            bgcolor: 'background.paper',
            border: '2px solid',
            borderColor: 'info.main',
            borderRadius: '50%',
            boxShadow: 2,
          }}
        >
          <StyleIcon sx={{ color: 'info.main', fontSize: 18, mr: 0.5 }} />
          <Typography
            variant="subtitle1"
            sx={{ color: 'info.main', fontWeight: 'bold', fontSize: '1.1rem', lineHeight: 1 }}
          >
            {handCount}
          </Typography>
        </Box>
      )}
      <CharacterBackground $imageUrl={character.imageUrl} />
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <ContentOverlay>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, minWidth: 90 }}>
            <Avatar
              src={character.imageUrl}
              sx={{
                width: 80,
                height: 80,
                border: (theme) => `3px solid ${isSelected ? theme.palette.primary.main : theme.palette.divider}`,
                bgcolor: character.imageUrl ? 'transparent' : 'primary.main',
                flexShrink: 0,
              }}
            >
              {!character.imageUrl && character.name.charAt(0)}
            </Avatar>
            {/* Ranged/Melee indicator - now directly below avatar */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 1, mb: 1, px: 1, py: 0.5, borderRadius: 2, bgcolor: character.ranged ? 'info.light' : 'error.light', boxShadow: 1 }}>
              {character.ranged ? (
                <>
                  <GpsFixed sx={{ color: 'info.main', mr: 0.5, fontSize: 20 }} />
                  <Typography variant="body2" color="info.main" sx={{ fontWeight: 'bold' }}>Ranged</Typography>
                </>
              ) : (
                <>
                  <SportsMma sx={{ color: 'error.main', mr: 0.5, fontSize: 20 }} />
                  <Typography variant="body2" color="error.main" sx={{ fontWeight: 'bold' }}>Melee</Typography>
                </>
              )}
            </Box>
          </Box>
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography
                  variant="h6"
                  component="h3"
                  sx={{
                    fontWeight: 'bold',
                    color: isSelected ? 'primary.main' : 'text.primary',
                    lineHeight: 1.2,
                  }}
                >
                  {character.name}
                </Typography>
              </Box>
              {deckTraits.length > 0 && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                  {deckTraits.slice(0, 3).map((trait, index) => (
                    <TraitChip
                      key={index}
                      label={trait}
                      size="small"
                      variant="outlined"
                      color="primary"
                    />
                  ))}
                </Box>
              )}
            </Box>

            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Typography variant="body2" color="text.secondary">
                  HP
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {character.health}/{character.maxHealth}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={healthPercentage}
                color={healthColor as any}
                sx={{ height: 8, borderRadius: 4 }}
              />
              <HPControls>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleHPChange(-1);
                  }}
                  disabled={isSpectator || character.health <= 0}
                  color="error"
                >
                  <RemoveIcon />
                </IconButton>
                <Box sx={{ flex: 1 }} />
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleHPChange(1);
                  }}
                  disabled={isSpectator || character.health >= character.maxHealth}
                  color="success"
                >
                  <AddIcon />
                </IconButton>
              </HPControls>
            </Box>
          </Box>
        </ContentOverlay>
        {!isSpectator && (
          <ConditionsInput
            conditions={character.conditions}
            onChange={handleConditionsChange}
          />
        )}
      </Box>
    </StatCard>
  );
}; 