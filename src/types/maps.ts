export type TerrainType = 'grass' | 'water' | 'mountain' | 'forest' | 'sand' | 'stone' | 'ruins';

export interface MapDefinition {
  id: string;
  name: string;
  description: string;
  grid: TerrainType[][];
  gridWidth: number;
  gridHeight: number;
}

export const terrainColors: Record<TerrainType, string> = {
  grass: '#6B8E23',   // OliveDrab
  water: '#4682B4',   // SteelBlue
  mountain: '#696969', // DimGray
  forest: '#556B2F',   // DarkOliveGreen
  sand: '#C2B280',     // SandyBrown
  stone: '#708090',    // SlateGray
  ruins: '#A9A9A9',    // DarkGray
};

// Preset maps
export const presetMaps: MapDefinition[] = [
  {
    id: 'plains',
    name: 'Plains',
    description: 'A simple map with mostly grass and some water features',
    grid: Array.from({ length: 6 }, (_, y) =>
      Array.from({ length: 8 }, (_, x) => {
        if (x === 4 || y === 3) return 'water';
        if ((x + y) % 4 === 0) return 'forest';
        return 'grass';
      })
    ),
    gridWidth: 8,
    gridHeight: 6,
  },
  {
    id: 'islands',
    name: 'Islands',
    description: 'A small, tight map with a few islands',
    grid: Array.from({ length: 6 }, (_, y) =>
      Array.from({ length: 8 }, (_, x) => {
        const centerX = 4;
        const centerY = 3;
        const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
        if (distance < 2) return 'grass';
        if (distance < 3) return 'forest';
        return 'water';
      })
    ),
    gridWidth: 8,
    gridHeight: 6,
  },
  {
    id: 'mountain_range',
    name: 'Mountain Range',
    description: 'A long, narrow mountain range',
    grid: Array.from({ length: 6 }, (_, y) =>
      Array.from({ length: 8 }, (_, x) => {
        if (x === 4) return 'mountain';
        if (x === 3 || x === 5) return 'forest';
        return 'grass';
      })
    ),
    gridWidth: 8,
    gridHeight: 6,
  },
  {
    id: 'river_crossing',
    name: 'River Crossing',
    description: 'A wide river splits the battlefield, with two bridges providing the only means of passage.',
    grid: Array.from({ length: 6 }, (_, y) =>
      Array.from({ length: 8 }, (_, x) => {
        if (y === 2 || y === 3) return 'water';
        if ((y === 2 || y === 3) && (x === 2 || x === 5)) return 'stone';
        return (x + y) % 4 === 0 ? 'forest' : 'grass';
      })
    ),
    gridWidth: 8,
    gridHeight: 6,
  },
  {
    id: 'ruined_city',
    name: 'Ruined City',
    description: 'A compact city map with lots of cover.',
    grid: Array.from({ length: 6 }, (_, y) =>
      Array.from({ length: 8 }, (_, x) => {
        if ((x % 2 === 0 || y % 2 === 0) && (x+y) % 2 !== 0) return 'ruins';
        if (Math.abs(x - 4) < 1 && Math.abs(y - 3) < 1) return 'stone';
        return (x + y) % 3 === 0 ? 'forest' : 'grass';
      })
    ),
    gridWidth: 8,
    gridHeight: 6,
  },
  {
    id: 'desert_outpost',
    name: 'Desert Outpost',
    description: 'A large, open desert with a central outpost.',
    grid: Array.from({ length: 6 }, (_, y) =>
      Array.from({ length: 8 }, (_, x) => {
        if (x > 2 && x < 5 && y > 1 && y < 4) return 'stone';
        if (x === 4 && y === 3) return 'sand';
        if (x % 2 === 0 || y % 2 === 0) return 'mountain';
        return 'sand';
      })
    ),
    gridWidth: 8,
    gridHeight: 6,
  },
  {
    id: 'forest_maze',
    name: 'Forest Maze',
    description: 'A tiny, dense forest with winding paths',
    grid: Array.from({ length: 6 }, (_, y) =>
      Array.from({ length: 8 }, (_, x) => {
        if ((x * y) % 3 === 0) return 'grass';
        if ((x + y) % 2 === 0) return 'forest';
        return 'mountain';
      })
    ),
    gridWidth: 8,
    gridHeight: 6,
  },
  {
    id: 'the_bridge',
    name: 'The Bridge',
    description: 'A narrow bridge over a deep chasm. Only a few squares wide, with no way around.',
    grid: Array.from({ length: 6 }, (_, y) =>
      Array.from({ length: 8 }, (_, x) => {
        if (x < 2 || x > 5) return 'water';
        if (y === 0 || y === 5) return 'stone';
        return 'stone';
      })
    ),
    gridWidth: 8,
    gridHeight: 6,
  },
  {
    id: 'lava_fields',
    name: 'Lava Fields',
    description: 'Treacherous lava flows with safe stone paths and a few islands.',
    grid: Array.from({ length: 6 }, (_, y) =>
      Array.from({ length: 8 }, (_, x) => {
        if ((x + y) % 4 === 0) return 'stone';
        if (x === 4 || y === 3) return 'stone';
        if ((x > 2 && x < 5) && (y > 1 && y < 4) && (x + y) % 3 === 0) return 'sand';
        return 'mountain'; // Use mountain as "lava" for now
      })
    ),
    gridWidth: 8,
    gridHeight: 6,
  },
  {
    id: 'fortress_courtyard',
    name: 'Fortress Courtyard',
    description: 'Walled fortress with a central open area and limited entrances.',
    grid: Array.from({ length: 6 }, (_, y) =>
      Array.from({ length: 8 }, (_, x) => {
        if (x === 0 || x === 7 || y === 0 || y === 5) return 'stone';
        if ((x === 4 && (y === 0 || y === 5)) || (y === 3 && (x === 0 || x === 7))) return 'sand'; // Entrances
        if (x > 0 && x < 7 && y > 0 && y < 5) return 'grass';
        return 'sand';
      })
    ),
    gridWidth: 8,
    gridHeight: 6,
  },
  {
    id: 'swamp',
    name: 'Swamp',
    description: 'Muddy, slow terrain with scattered dry land.',
    grid: Array.from({ length: 6 }, (_, y) =>
      Array.from({ length: 8 }, (_, x) => {
        if ((x + y) % 4 === 0) return 'grass';
        if ((x * y) % 5 === 0) return 'forest';
        return 'water';
      })
    ),
    gridWidth: 8,
    gridHeight: 6,
  },
  {
    id: 'frozen_lake',
    name: 'Frozen Lake',
    description: 'A slippery ice lake in the center, surrounded by snow and rocks.',
    grid: Array.from({ length: 6 }, (_, y) =>
      Array.from({ length: 8 }, (_, x) => {
        const d = Math.sqrt(Math.pow(x - 4, 2) + Math.pow(y - 3, 2));
        if (d < 2) return 'water'; // Use water as ice
        if (d < 3) return 'sand'; // Use sand as snow
        return 'mountain';
      })
    ),
    gridWidth: 8,
    gridHeight: 6,
  },
  {
    id: 'ruined_temple',
    name: 'Ruined Temple',
    description: 'Crumbling pillars and impassable ruins with open spaces for battle.',
    grid: Array.from({ length: 6 }, (_, y) =>
      Array.from({ length: 8 }, (_, x) => {
        if ((x % 2 === 0 && y % 2 === 0) || (x + y) % 5 === 0) return 'ruins';
        if ((x > 2 && x < 5) && (y > 1 && y < 4)) return 'stone';
        return 'grass';
      })
    ),
    gridWidth: 8,
    gridHeight: 6,
  },
  {
    id: 'cavern_maze',
    name: 'Cavern Maze',
    description: 'Winding stone corridors and dead ends in a dark cavern.',
    grid: Array.from({ length: 6 }, (_, y) =>
      Array.from({ length: 8 }, (_, x) => {
        if ((x + y) % 3 === 0 || (x * y) % 4 === 0) return 'stone';
        return 'mountain';
      })
    ),
    gridWidth: 8,
    gridHeight: 6,
  },
  {
    id: 'market_square',
    name: 'Market Square',
    description: 'A mid-size market with obstacles and open lanes.',
    grid: Array.from({ length: 6 }, (_, y) =>
      Array.from({ length: 8 }, (_, x) => {
        if ((x % 2 === 0 && y % 2 === 0) || (x + y) % 4 === 0) return 'stone';
        if ((x > 2 && x < 5) && (y > 1 && y < 4)) return 'sand';
        return 'grass';
      })
    ),
    gridWidth: 8,
    gridHeight: 6,
  },
]; 