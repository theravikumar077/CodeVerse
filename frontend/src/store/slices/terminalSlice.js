import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  terminals: [], // array of { id, name }
  activeTerminalId: null,
};

const terminalSlice = createSlice({
  name: 'terminal',
  initialState,
  reducers: {
    addTerminal: (state, action) => {
      const newTerminal = action.payload; // { id, name }
      state.terminals.push(newTerminal);
      state.activeTerminalId = newTerminal.id;
    },
    removeTerminal: (state, action) => {
      const id = action.payload;
      const index = state.terminals.findIndex(t => t.id === id);
      state.terminals = state.terminals.filter(t => t.id !== id);

      if (state.activeTerminalId === id) {
        if (state.terminals.length > 0) {
          const nextIndex = Math.max(0, index - 1);
          state.activeTerminalId = state.terminals[nextIndex].id;
        } else {
          state.activeTerminalId = null;
        }
      }
    },
    setActiveTerminal: (state, action) => {
      state.activeTerminalId = action.payload;
    },
    clearTerminals: (state) => {
      state.terminals = [];
      state.activeTerminalId = null;
    }
  },
});

export const { addTerminal, removeTerminal, setActiveTerminal, clearTerminals } = terminalSlice.actions;
export default terminalSlice.reducer;
