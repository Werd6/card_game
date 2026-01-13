import React, { useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Box, TextField, Chip } from '@mui/material';

interface ConditionsInputProps {
  conditions: string[];
  onChange: (conditions: string[]) => void;
}

export const ConditionsInput: React.FC<ConditionsInputProps> = ({ conditions, onChange }) => {
  const [inputValue, setInputValue] = useState('');

  const handleAddCondition = () => {
    if (inputValue && !conditions.includes(inputValue)) {
      onChange([...conditions, inputValue]);
      setInputValue('');
    }
  };

  const handleDeleteCondition = (conditionToDelete: string) => {
    onChange(conditions.filter((condition) => condition !== conditionToDelete));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter') {
      handleAddCondition();
      event.preventDefault(); 
    }
  };

  return (
    <Box sx={{ p: 1, borderTop: '1px solid rgba(0, 0, 0, 0.12)' }}>
      <TextField
        fullWidth
        variant="standard"
        size="small"
        placeholder="Add condition..."
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleAddCondition}
        InputProps={{
          disableUnderline: true,
        }}
        sx={{mb: 1}}
      />
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        {conditions.map((condition) => (
          <Chip
            key={condition}
            label={condition}
            onDelete={() => handleDeleteCondition(condition)}
            size="small"
          />
        ))}
      </Box>
    </Box>
  );
}; 