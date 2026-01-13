import { Card as MuiCard, CardContent, Typography, Box, Chip, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';
import type { Card as GameCard, CombatCard, SpecialCard, Character } from '../types/game';

interface CardContainerProps {
  '$data-is-selected': boolean;
}

const CardContainer = styled(Paper, {
  shouldForwardProp: (prop) => prop !== '$isSelected' && prop !== '$large',
})< { $isSelected: boolean; $large?: boolean } >(({ theme, $isSelected, $large }) => ({
  width: $large ? 300 : 150,
  height: $large ? 420 : 210,
  padding: theme.spacing($large ? 2 : 1),
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  border: `3px solid ${$isSelected ? theme.palette.primary.main : 'transparent'}`,
  boxShadow: $isSelected ? theme.shadows[4] : theme.shadows[1],
  transition: 'all 0.2s ease-in-out',
  cursor: 'pointer',
  '&:hover': {
    transform: 'scale(1.05)',
    boxShadow: theme.shadows[8],
  },
  userSelect: 'none',
}));

const CardImage = styled(Box)<{ $large?: boolean }>(({ theme, $large }) => ({
  height: $large ? '180px' : '100px',
  backgroundColor: theme.palette.grey[200],
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: theme.spacing(1),
}));

const StatsBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  gap: theme.spacing(1),
  marginTop: theme.spacing(1),
}));

const StatChip = styled(Chip)<{ $statType: 'attack' | 'defense' }>(({ theme, $statType }) => ({
  backgroundColor: $statType === 'attack' ? theme.palette.error.light : theme.palette.info.light,
  color: theme.palette.getContrastText(
    $statType === 'attack' ? theme.palette.error.light : theme.palette.info.light
  ),
  fontWeight: 'bold',
}));

interface CardProps {
  card: GameCard;
  isSelected?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
  $large?: boolean;
  characters?: Character[];
}

const isCombatCard = (card: GameCard): card is CombatCard => card.type === 'combat';

export const Card = ({ card, isSelected = false, onClick, style, $large = false, characters = [] }: CardProps) => {
  // For minions, find any character with the base character ID matching the card owner
  const ownerCharacter = card.owner ? characters.find(c => {
    const baseCharacterId = c.id.split('-').slice(0, -1).join('-');
    return baseCharacterId.endsWith(card.owner!) || c.id.endsWith(card.owner!);
  }) : undefined;
  const imageUrl = ownerCharacter?.imageUrl ?? card.imageUrl;
  
  return (
    <CardContainer $isSelected={isSelected} onClick={onClick} style={style} $large={$large}>
      <CardImage $large={$large}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={isCombatCard(card) ? `Card ${card.id}` : card.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <Typography variant={$large ? "h2" : "h6"} color="text.secondary">
            {isCombatCard(card) ? card.id : card.name[0]}
          </Typography>
        )}
      </CardImage>
      <CardContent sx={{ p: 1, flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5, minHeight: '36px' }}>
          <Typography variant={$large ? "h5" : "subtitle1"} noWrap>
            {isCombatCard(card) ? ($large ? `Card ${card.id}` : '') : card.name}
          </Typography>
        </Box>

        {isCombatCard(card) ? (
          <StatsBox sx={{ justifyContent: $large ? 'space-between' : 'center' }}>
            <StatChip
              label={`ATK ${card.attack}`}
              size="small"
              $statType="attack"
            />
            <StatChip
              label={`DEF ${card.defense}`}
              size="small"
              $statType="defense"
            />
          </StatsBox>
        ) : (
          <>
            {$large &&
              <Typography
                variant={"body1"}
                color="text.secondary"
                sx={{
                  fontSize: '1rem',
                  fontStyle: 'italic',
                  mb: 1,
                  maxHeight: '100px',
                  overflow: 'auto',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 5,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {card.rulesText}
              </Typography>
            }
            <Chip
              label="Special"
              size="small"
              sx={{
                backgroundColor: 'secondary.main',
                color: 'white',
              }}
            />
          </>
        )}
      </CardContent>
    </CardContainer>
  );
}; 