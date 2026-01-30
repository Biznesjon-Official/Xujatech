import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SyncState {
  isOnline: boolean;
  lastSync: Date | null;
  pendingOperations: number;
  syncInProgress: boolean;
  error: string | null;
}

const initialState: SyncState = {
  isOnline: navigator.onLine, // Brauzer holatidan boshlash
  lastSync: null,
  pendingOperations: 0,
  syncInProgress: false,
  error: null,
};

const syncSlice = createSlice({
  name: 'sync',
  initialState,
  reducers: {
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
    },
    
    setSyncStatus: (state, action: PayloadAction<{
      lastSync: Date | null;
      pendingOperations: number;
      syncInProgress: boolean;
    }>) => {
      state.lastSync = action.payload.lastSync;
      state.pendingOperations = action.payload.pendingOperations;
      state.syncInProgress = action.payload.syncInProgress;
    },
    
    setSyncInProgress: (state, action: PayloadAction<boolean>) => {
      state.syncInProgress = action.payload;
    },
    
    setSyncError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    
    incrementPendingOperations: (state) => {
      state.pendingOperations += 1;
    },
    
    decrementPendingOperations: (state) => {
      if (state.pendingOperations > 0) {
        state.pendingOperations -= 1;
      }
    },
    
    updateLastSync: (state) => {
      state.lastSync = new Date();
    },
  },
});

export const {
  setOnlineStatus,
  setSyncStatus,
  setSyncInProgress,
  setSyncError,
  incrementPendingOperations,
  decrementPendingOperations,
  updateLastSync,
} = syncSlice.actions;

export default syncSlice.reducer;
