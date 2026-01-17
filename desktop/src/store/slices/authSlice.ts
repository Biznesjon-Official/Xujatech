import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface User {
  id: string;
  username: string;
  fullName: string;
  role: 'admin' | 'manager' | 'cashier';
  email?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

// LocalStorage dan foydalanuvchi ma'lumotlarini olish
const loadUserFromStorage = (): { user: User | null; isAuthenticated: boolean } => {
  try {
    const savedUser = localStorage.getItem('authUser');
    const accessToken = localStorage.getItem('accessToken');
    if (savedUser && accessToken) {
      return {
        user: JSON.parse(savedUser),
        isAuthenticated: true,
      };
    }
  } catch (error) {
    console.error('Error loading user from storage:', error);
  }
  return { user: null, isAuthenticated: false };
};

const storedAuth = loadUserFromStorage();

const initialState: AuthState = {
  user: storedAuth.user,
  isAuthenticated: storedAuth.isAuthenticated,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action: PayloadAction<User>) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.user = action.payload;
      state.error = null;
      // LocalStorage ga saqlash
      localStorage.setItem('authUser', JSON.stringify(action.payload));
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.error = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
      // LocalStorage dan o'chirish
      localStorage.removeItem('authUser');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('selectedCashier');
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const { loginStart, loginSuccess, loginFailure, logout, clearError } = authSlice.actions;
export default authSlice.reducer;
