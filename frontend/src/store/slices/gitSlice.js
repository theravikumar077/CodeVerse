import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  changedFiles: [], // array of { path, status } (e.g. status: 'modified', 'not_added', etc.)
  currentBranch: 'main',
  branches: [],
  history: [],
  loading: false,
  error: null,
};

const gitSlice = createSlice({
  name: 'git',
  initialState,
  reducers: {
    gitStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    gitFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    gitStatusSuccess: (state, action) => {
      state.loading = false;
      state.changedFiles = action.payload.changedFiles || [];
      state.currentBranch = action.payload.currentBranch || 'main';
      state.branches = action.payload.branches || [];
    },
    gitHistorySuccess: (state, action) => {
      state.loading = false;
      state.history = action.payload || [];
    },
    clearGitState: (state) => {
      state.changedFiles = [];
      state.currentBranch = 'main';
      state.branches = [];
      state.history = [];
      state.loading = false;
      state.error = null;
    }
  },
});

export const { gitStart, gitFailure, gitStatusSuccess, gitHistorySuccess, clearGitState } = gitSlice.actions;
export default gitSlice.reducer;
