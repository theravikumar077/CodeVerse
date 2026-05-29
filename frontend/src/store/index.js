import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import editorReducer from './slices/editorSlice';
import terminalReducer from './slices/terminalSlice';
import gitReducer from './slices/gitSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    editor: editorReducer,
    terminal: terminalReducer,
    git: gitReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Turn off serializability check for socket objects or editor nodes if needed
    }),
});
export default store;
