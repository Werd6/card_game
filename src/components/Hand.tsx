import { Box, Button, Dialog, DialogContent, DialogActions, Typography, Paper } from '@mui/material';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { Card } from './Card';
import { useGameStore } from '../store/gameStore';
import type { Card as GameCard, CombatCard, Character } from '../types/game';
import { useState } from 'react';
import { ScryOptionsModal } from './ScryOptionsModal';
import { AddTokenModal } from './AddTokenModal';
import { OtherActionsModal } from './OtherActionsModal';
import { ConditionsListModal } from './ConditionsListModal';
import { RulesReferenceModal } from './RulesReferenceModal';
import { MapSelectionModal } from './MapSelectionModal';

interface HandProps {
  gameInfo: any;
  channel: RealtimeChannel | null;
}

export const Hand = ({ gameInfo, channel }: HandProps) => {
  const { players, characters, selectedCard, selectedCharacter, selectCard, playCard, drawCard, discardCard, log, beginAttack, inspectDeck, addTokenCharacter, rollDice, changeMap, mapId } = useGameStore();
  const [enlargedCard, setEnlargedCard] = useState<GameCard | null>(null);
  const [enlargedFromLog, setEnlargedFromLog] = useState(false);
  const [scryModalOpen, setScryModalOpen] = useState(false);
  const [addTokenModalOpen, setAddTokenModalOpen] = useState(false);
  const [otherActionsModalOpen, setOtherActionsModalOpen] = useState(false);
  const [conditionsModalOpen, setConditionsModalOpen] = useState(false);
  const [rulesModalOpen, setRulesModalOpen] = useState(false);
  const [mapModalOpen, setMapModalOpen] = useState(false);

  const currentPlayer = players.find(p => p.id === gameInfo.playerId);
  const isHost = gameInfo?.isHost ?? false;

  if (!currentPlayer) return null;

  const handleCardClick = (card: GameCard) => {
    setEnlargedCard(card);
    setEnlargedFromLog(false);
  };

  const handleCardPlay = (card: GameCard) => {
    if (!channel) {
      console.error("Cannot play card, channel is not available.");
      return;
    }
    playCard(currentPlayer.id, card.id, gameInfo.gameId, channel);
    setEnlargedCard(null);
    setEnlargedFromLog(false);
  };

  const handleDrawCard = async () => {
    if (!channel) {
      console.error("Cannot draw card, channel is not available.");
      return;
    }
    if (!selectedCharacter) {
      console.error("Cannot draw card, no character selected.");
      return;
    }
    await drawCard(currentPlayer.id, gameInfo.gameId, channel, selectedCharacter.id);
  };

  const handleDiscardCard = async (card: GameCard) => {
    if (!channel) {
      console.error("Cannot discard card, channel is not available.");
      return;
    }
    await discardCard(currentPlayer.id, card.id, gameInfo.gameId, channel);
    setEnlargedCard(null);
    setEnlargedFromLog(false);
  };

  const handleCloseDialog = () => {
    setEnlargedCard(null);
    setEnlargedFromLog(false);
  };

  const handleBeginAttack = (defenderId: string) => {
    console.log('handleBeginAttack called:', { 
      channel: !!channel, 
      enlargedCard: enlargedCard?.id, 
      cardType: enlargedCard?.type, 
      selectedCharacter: selectedCharacter?.id,
      defenderId 
    });
    
    if (!channel || !enlargedCard || enlargedCard.type !== 'combat' || !selectedCharacter) {
      console.error("Cannot begin attack:", { 
        channel: !!channel, 
        enlargedCard: !!enlargedCard, 
        cardType: enlargedCard?.type, 
        selectedCharacter: !!selectedCharacter 
      });
      return;
    }
    
    console.log('Calling beginAttack with:', {
      attackerId: selectedCharacter.id,
      defenderId,
      card: enlargedCard,
      gameId: gameInfo.gameId
    });
    
    beginAttack(selectedCharacter.id, defenderId, enlargedCard as CombatCard, gameInfo.gameId, channel);
    handleCloseDialog();
  };

  const handleLogEntryClick = (card: GameCard) => {
    setEnlargedCard(card);
    setEnlargedFromLog(true);
  };

  const renderLogEntry = (entry: any) => {
    if (entry.message) {
      return entry.message;
    }
    if (entry.card) {
      if (entry.card.type === 'combat') {
        return `played Combat Card #${entry.card.id}`;
      }
      if (entry.card.type === 'special') {
        return `played ${entry.card.name}`;
      }
    }
    return 'did an unknown action';
  };

  const handleScryConfirm = (targetPlayerId: string, count: number) => {
    if (gameInfo && channel && currentPlayer) {
      inspectDeck(currentPlayer.id, targetPlayerId, count, gameInfo.gameId, channel);
    }
  };

  const handleAddTokenConfirm = (token: Omit<Character, 'id'>) => {
    if (gameInfo && channel) {
      addTokenCharacter(token, gameInfo.gameId, channel);
    }
  };

  const handleRollDice = () => {
    if (gameInfo && channel && currentPlayer) {
      // Roll a 6-sided die for movement
      rollDice(currentPlayer.id, 6, gameInfo.gameId, channel);
    }
  };

  const handleMapChange = (newMapId: string) => {
    if (gameInfo && channel) {
      changeMap(newMapId, gameInfo.gameId, channel);
    }
  };

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          gap: 2,
          padding: 2,
          backgroundColor: 'background.paper',
          borderRadius: 1,
          boxShadow: 1,
          minHeight: '220px',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: 900,
          maxWidth: 900,
          width: 900,
          margin: '0 auto',
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Button
            variant="contained"
            onClick={handleDrawCard}
            disabled={currentPlayer.hand.length >= 10}
          >
            Draw Card
          </Button>
          <Button variant="outlined" onClick={() => setOtherActionsModalOpen(true)}>
            Other Actions
          </Button>
          <Button variant="outlined" onClick={handleRollDice}>
            Move Dice
          </Button>
        </Box>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            gap: 2,
            overflowX: 'auto',
            minWidth: 600,
            maxWidth: 750,
            flex: 1,
            scrollbarWidth: 'thin',
            '&::-webkit-scrollbar': {
              height: 8,
            },
            '&::-webkit-scrollbar-thumb': {
              background: '#ccc',
              borderRadius: 4,
            },
          }}
        >
          {currentPlayer.hand.map((card) => (
            <Card
              key={card.id}
              card={card}
              characters={characters}
              isSelected={selectedCard?.id === card.id}
              onClick={() => handleCardClick(card)}
            />
          ))}
        </Box>
        <Dialog open={!!enlargedCard} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 3 }}>
            {enlargedCard && (
              <Card card={enlargedCard} isSelected $large characters={characters} />
            )}
          </DialogContent>
          <DialogActions sx={{ justifyContent: 'center', pb: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
            {!enlargedFromLog && enlargedCard && (
              <>
                {enlargedCard.type === 'combat' ? (
                  characters
                    .filter((c) => c.playerId !== currentPlayer.id)
                    .map((c) => {
                      // Simplified logic: just check if we have a selected character
                      const isDisabled = !selectedCharacter || selectedCharacter.playerId !== currentPlayer.id;
                      
                      return (
                        <Button
                          key={c.id}
                          variant="contained"
                          color="error"
                          onClick={() => {
                            console.log('Attack button clicked:', { 
                              selectedCharacter: selectedCharacter?.id, 
                              cardOwner: enlargedCard.owner,
                              defenderId: c.id 
                            });
                            handleBeginAttack(c.id);
                          }}
                          disabled={isDisabled}
                        >
                          Attack {c.name}
                        </Button>
                      );
                    })
                ) : (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => enlargedCard && handleCardPlay(enlargedCard)}
                    disabled={
                      enlargedCard.type !== 'special' &&
                      (!selectedCharacter || 
                      selectedCharacter.playerId !== currentPlayer.id)
                    }
                  >
                    Play Card
                  </Button>
                )}
                {/* Discard Button */}
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={() => enlargedCard && handleDiscardCard(enlargedCard)}
                >
                  Discard
                </Button>
              </>
            )}
            <Button onClick={handleCloseDialog}>Close</Button>
          </DialogActions>
        </Dialog>
      </Box>
      <OtherActionsModal
        open={otherActionsModalOpen}
        onClose={() => setOtherActionsModalOpen(false)}
        onScry={() => {
          setScryModalOpen(true);
          setOtherActionsModalOpen(false);
        }}
        onAddToken={() => {
          setAddTokenModalOpen(true);
          setOtherActionsModalOpen(false);
        }}
        onViewConditions={() => {
          setConditionsModalOpen(true);
          setOtherActionsModalOpen(false);
        }}
        onViewRules={() => {
          setRulesModalOpen(true);
          setOtherActionsModalOpen(false);
        }}
        onChangeMap={() => {
          setMapModalOpen(true);
          setOtherActionsModalOpen(false);
        }}
        isHost={true}
      />
      {/* Play Log */}
      <Paper
        elevation={2}
        sx={{
          mt: 2,
          maxWidth: '900px',
          margin: '0 auto',
          p: 2,
          maxHeight: 180,
          overflowY: 'auto',
          backgroundColor: 'background.paper',
        }}
      >
        <Typography variant="h6" sx={{ mb: 1 }}>
          Play Log
        </Typography>
        {log.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No cards have been played yet.
          </Typography>
        ) : (
          log.slice(-20).reverse().map((entry, idx) => (
            <Box
              key={entry.timestamp + '-' + idx}
              sx={{ 
                mb: 1, 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1, 
                cursor: entry.card ? 'pointer' : 'default', 
                p: 0.5,
                borderRadius: 1,
                '&:hover': { 
                  backgroundColor: 'action.hover' 
                } 
              }}
              onClick={() => entry.card && handleLogEntryClick(entry.card)}
            >
              <Typography variant="subtitle2" sx={{ minWidth: 90 }}>
                {entry.playerName}
              </Typography>
              <Typography variant="body2">
                {renderLogEntry(entry)}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                {new Date(entry.timestamp).toLocaleTimeString()}
              </Typography>
            </Box>
          ))
        )}
      </Paper>
      {/* Scry Modal */}
      <ScryOptionsModal
        isOpen={scryModalOpen}
        onClose={() => setScryModalOpen(false)}
        onConfirm={handleScryConfirm}
      />
      <AddTokenModal
        isOpen={addTokenModalOpen}
        onClose={() => setAddTokenModalOpen(false)}
        onConfirm={handleAddTokenConfirm}
      />
      <ConditionsListModal
        open={conditionsModalOpen}
        onClose={() => setConditionsModalOpen(false)}
      />
      <RulesReferenceModal
        open={rulesModalOpen}
        onClose={() => setRulesModalOpen(false)}
      />
      <MapSelectionModal
        open={mapModalOpen}
        onClose={() => setMapModalOpen(false)}
        onConfirm={handleMapChange}
        currentMapId={mapId}
      />
    </Box>
  );
}; 