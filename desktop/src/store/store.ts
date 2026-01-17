import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import posSlice from './slices/posSlice';
import inventorySlice from './slices/inventorySlice';
import syncSlice from './slices/syncSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    pos: posSlice,
    inventory: inventorySlice,
    sync: syncSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
