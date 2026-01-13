import { Box, Paper, IconButton, Tooltip } from '@mui/material';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { useGameStore } from '../store/gameStore';
import type { Position } from '../types/game';
import { styled } from '@mui/material/styles';
import { terrainColors } from '../types/maps';
import type { TerrainType } from '../types/maps';
import React, { useRef, useState } from 'react';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';

const GRID_SIZE = 64; // px, for larger grid cells

const GridContainer = styled(Paper)(({ theme }) => ({
  display: 'grid',
  gap: '2px',
  padding: '2px',
  backgroundColor: theme.palette.grey[300],
  borderRadius: theme.shape.borderRadius,
  position: 'relative',
  width: 'fit-content',
  height: 'fit-content',
}));

const GridCell = styled(Box)<{ terrain: TerrainType; isSelected?: boolean }>(
  ({ theme, terrain, isSelected }) => ({
    width: `${GRID_SIZE}px`,
    height: `${GRID_SIZE}px`,
    backgroundColor: isSelected ? theme.palette.primary.light : terrainColors[terrain],
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: isSelected ? theme.palette.primary.main : theme.palette.grey[200],
      opacity: 0.8,
    },
  })
);

const TokenContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== '$size',
})<{ $size: 'small' | 'medium' | 'large' | 'huge' | 'giant' }>(({ $size }) => {
  const sizeMap = {
    small: { width: '48px', height: '48px' },
    medium: { width: '56px', height: '56px' },
    large: { width: '72px', height: '72px' },
    huge: { width: '128px', height: '128px' }, // 2x2 grid cells (64px * 2)
    giant: { width: '256px', height: '256px' } // 4x4 grid cells (64px * 4)
  };
  return {
    position: 'absolute',
    ...sizeMap[$size],
    cursor: 'move',
    userSelect: 'none',
    zIndex: 2,
    pointerEvents: 'auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: ($size === 'huge' || $size === 'giant') ? '16px' : '50%', // More pronounced for larger tokens
    boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
    border: '2px solid white',
    background: 'white',
  };
});

const Token = styled(Box, {
  shouldForwardProp: (prop) => prop !== '$isSelected' && prop !== '$size',
})<{ $isSelected?: boolean; $size: 'small' | 'medium' | 'large' | 'huge' | 'giant' }>(({ theme, $isSelected, $size }) => ({
  width: '100%',
  height: '100%',
  borderRadius: ($size === 'huge' || $size === 'giant') ? '6px' : '50%', // Square corners for huge and giant tokens
  backgroundColor: theme.palette.primary.main,
  border: `2px solid ${$isSelected ? theme.palette.secondary.main : theme.palette.primary.dark}`,
  boxShadow: $isSelected ? theme.shadows[4] : theme.shadows[1],
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

interface GameBoardProps {
  gameInfo: any; // Or a more specific type if you have one
  channel: RealtimeChannel | null;
}

export const GameBoard = ({ gameInfo, channel }: GameBoardProps) => {
  const { gridSize, characters, selectedCharacter, moveCharacter, currentMap, selectCharacter } = useGameStore();
  const boardRef = useRef<HTMLDivElement>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);

  // --- Drag Handlers for Absolute Positioning ---
  const handleDragStart = (event: React.DragEvent, characterId: string) => {
    console.log('Drag Start:', characterId);
    const character = characters.find(c => c.id === characterId);
    if (!character) {
      console.error('Character not found for drag start:', characterId);
      return;
    }

    selectCharacter(character);
    console.log('Selected Character:', character);
    setDraggedId(characterId);
    
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
    
    // Minimal data transfer for compatibility
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', characterId); 
    event.dataTransfer.setDragImage(new Image(), 0, 0);
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  const getTokenSize = (size: 'small' | 'medium' | 'large' | 'huge' | 'giant') => {
    const sizeMap = {
      small: { width: 48, height: 48 },
      medium: { width: 56, height: 56 },
      large: { width: 72, height: 72 },
      huge: { width: 128, height: 128 },
      giant: { width: 256, height: 256 }
    };
    return sizeMap[size];
  };

  const snapToGrid = (x: number, y: number, tokenSize: { width: number; height: number }, characterSize: 'small' | 'medium' | 'large' | 'huge' | 'giant') => {
    // Account for grid gap (2px) and padding (2px)
    const gridGap = 2;
    const gridPadding = 2;
    
    // Calculate grid cell coordinates, accounting for gaps
    const cellX = Math.round((x - gridPadding) / (GRID_SIZE + gridGap));
    const cellY = Math.round((y - gridPadding) / (GRID_SIZE + gridGap));
    
    // Ensure we stay within grid bounds
    const maxX = gridSize.width - Math.ceil(tokenSize.width / GRID_SIZE);
    const maxY = gridSize.height - Math.ceil(tokenSize.height / GRID_SIZE);
    
    const clampedCellX = Math.max(0, Math.min(cellX, maxX));
    const clampedCellY = Math.max(0, Math.min(cellY, maxY));
    
    let snappedX: number;
    let snappedY: number;
    
    if (characterSize === 'huge' || characterSize === 'giant') {
      // For huge and giant characters, snap to grid intersections
      // Huge: 2x2 space, Giant: 4x4 space
      snappedX = gridPadding + clampedCellX * (GRID_SIZE + gridGap);
      snappedY = gridPadding + clampedCellY * (GRID_SIZE + gridGap);
    } else {
      // For other sizes, center the token on the grid cell
      snappedX = gridPadding + clampedCellX * (GRID_SIZE + gridGap) + (GRID_SIZE - tokenSize.width) / 2;
      snappedY = gridPadding + clampedCellY * (GRID_SIZE + gridGap) + (GRID_SIZE - tokenSize.height) / 2;
    }
    
    return { x: snappedX, y: snappedY };
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    if (!draggedId || !boardRef.current || !channel) return;
    
    const character = characters.find(c => c.id === draggedId);
    if (!character) return;
    
    const boardRect = boardRef.current.getBoundingClientRect();
    const tokenSize = getTokenSize(character.size);
    
    // Calculate position based on mouse cursor position (not token center)
    const mouseX = event.clientX - boardRect.left;
    const mouseY = event.clientY - boardRect.top;
    
    // Snap to grid based on mouse position and character size
    const snappedPosition = snapToGrid(mouseX, mouseY, tokenSize, character.size);
    
    moveCharacter(draggedId, snappedPosition, gameInfo.gameId, channel);
    setDraggedId(null);
  };

  // Handle wheel zoom (ctrl/cmd+wheel or pinch)
  const handleWheel = (event: React.WheelEvent) => {
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      let newScale = scale - event.deltaY * 0.001;
      newScale = Math.max(0.5, Math.min(2.5, newScale));
      setScale(newScale);
    }
  };

  // Zoom controls for accessibility
  const handleZoomIn = () => setScale((s) => Math.min(2.5, s + 0.1));
  const handleZoomOut = () => setScale((s) => Math.max(0.5, s - 0.1));

  if (!currentMap) {
    return null;
  }

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      {/* Zoom Controls */}
      <Box sx={{ position: 'absolute', top: 16, right: 16, zIndex: 10, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Tooltip title="Zoom In"><span><IconButton onClick={handleZoomIn} size="small"><ZoomInIcon /></IconButton></span></Tooltip>
        <Tooltip title="Zoom Out"><span><IconButton onClick={handleZoomOut} size="small"><ZoomOutIcon /></IconButton></span></Tooltip>
      </Box>
      <Box
        sx={{
          transform: `scale(${scale})`,
          transformOrigin: 'center',
          transition: 'transform 0.15s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onWheel={handleWheel}
      >
        <GridContainer
          ref={boardRef}
          sx={{
            gridTemplateColumns: `repeat(${gridSize.width}, ${GRID_SIZE}px)`,
            gridTemplateRows: `repeat(${gridSize.height}, ${GRID_SIZE}px)`,
            width: `${gridSize.width * GRID_SIZE}px`,
            height: `${gridSize.height * GRID_SIZE}px`,
          }}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {/* Render grid background */}
          {currentMap.grid.map((row, y) =>
            row.map((terrain, x) => (
              <GridCell
                key={`${x}-${y}`}
                terrain={terrain}
                isSelected={false}
              />
            ))
          )}
          {/* Render tokens absolutely */}
          {characters.map((character) => (
            <TokenContainer
              key={character.id}
              draggable
              onDragStart={(e) => handleDragStart(e, character.id)}
              $size={character.size}
              style={{
                left: character.position.x,
                top: character.position.y,
              }}
            >
              <Token $isSelected={selectedCharacter?.id === character.id} $size={character.size}>
                {character.imageUrl ? (
                  <img
                    src={character.imageUrl}
                    alt={character.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: (character.size === 'huge' || character.size === 'giant') ? '4px' : '50%' }}
                  />
                ) : null}
              </Token>
            </TokenContainer>
          ))}
        </GridContainer>
      </Box>
    </Box>
  );
}; 