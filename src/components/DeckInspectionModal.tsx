import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Paper,
  Tooltip,
} from '@mui/material';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useGameStore } from '../store/gameStore';
import type { Card } from '../types/game';
import type { RealtimeChannel } from '@supabase/supabase-js';

function SortableCard({ card }: { card: Card }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: card.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const cardPaper = (
    <Paper
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      sx={{ p: 1, mb: 1, userSelect: 'none', cursor: 'grab', flexGrow: 1 }}
    >
      {card.type === 'combat' ? `Combat ${card.attack}/${card.defense}` : card.name}
    </Paper>
  );

  if (card.type === 'special') {
    return <Tooltip title={card.rulesText} placement="right" arrow>{cardPaper}</Tooltip>;
  }
  return cardPaper;
}

interface DeckInspectionModalProps {
  gameId: string;
  channel: RealtimeChannel;
  gameInfo: any; // Consider using a more specific type
}

export function DeckInspectionModal({ gameId, channel, gameInfo }: DeckInspectionModalProps) {
  const { deckInspection, resolveDeckInspection, players } = useGameStore();
  const [cards, setCards] = useState<Card[]>([]);
  const [bottomDeck, setBottomDeck] = useState<Card[]>([]);
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (deckInspection.isOpen) {
      setCards(deckInspection.cards);
      setBottomDeck([]);
    }
  }, [deckInspection.isOpen, deckInspection.cards]);
  
  const inspectingPlayer = players.find(p => p.id === deckInspection.targetPlayerId);
  const canInteract = gameInfo?.playerId === deckInspection.inspectorId;

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setCards((items) => {
        const oldIndex = items.findIndex((c) => c.id === active.id);
        const newIndex = items.findIndex((c) => c.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const moveToBottom = (cardId: number) => {
    const cardToMove = cards.find(c => c.id === cardId);
    if (cardToMove) {
      setCards(cards.filter(c => c.id !== cardId));
      setBottomDeck([...bottomDeck, cardToMove]);
    }
  };

  const handleConfirm = () => {
    resolveDeckInspection(cards, bottomDeck, gameId, channel);
  };
  
  return (
    <Dialog open={deckInspection.isOpen} onClose={() => {}} fullWidth maxWidth="md">
      <DialogTitle>
        Deck Inspection: {inspectingPlayer?.name || 'Unknown Player'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {/* Cards on Top */}
          <Box sx={{ width: '50%' }}>
            <Typography variant="h6" align="center" gutterBottom>
              Top of Deck
            </Typography>
            <Paper sx={{ p: 2, minHeight: 200, backgroundColor: 'grey.200' }}>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={cards} strategy={verticalListSortingStrategy}>
                  {cards.map(card => (
                    <Box key={card.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <SortableCard card={card} />
                      {canInteract && (
                        <Button variant="outlined" size="small" onClick={() => moveToBottom(card.id)}>
                          To Bottom
                        </Button>
                      )}
                    </Box>
                  ))}
                </SortableContext>
              </DndContext>
            </Paper>
          </Box>
          {/* Cards on Bottom */}
          <Box sx={{ width: '50%' }}>
            <Typography variant="h6" align="center" gutterBottom>
              Bottom of Deck
            </Typography>
            <Paper sx={{ p: 2, minHeight: 200, backgroundColor: 'grey.200' }}>
              {bottomDeck.map(card => {
                const cardContent = (
                  <Paper sx={{ p: 1, mb: 1 }}>
                    {card.type === 'combat' ? `Combat ${card.attack}/${card.defense}` : card.name}
                  </Paper>
                );

                if (card.type === 'special') {
                  return (
                    <Tooltip key={card.id} title={card.rulesText} placement="right" arrow>
                      {cardContent}
                    </Tooltip>
                  );
                }
                return <Box key={card.id}>{cardContent}</Box>;
              })}
            </Paper>
          </Box>
        </Box>
      </DialogContent>
      {canInteract && (
        <DialogActions>
          <Button onClick={handleConfirm} variant="contained">
            Confirm
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
} 