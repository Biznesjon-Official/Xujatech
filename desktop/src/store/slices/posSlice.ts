import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  name: string;
  barcode?: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  totalPrice: number;
  maxStock?: number; // Ombordagi maksimal miqdor
}

interface Customer {
  id: string;
  fullName: string;
  phone?: string;
  currentDebt: number;
  discountPercentage: number;
}

interface POSState {
  cart: CartItem[];
  customer: Customer | null;
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  currentSale: any | null;
  loading: boolean;
  error: string | null;
}

const initialState: POSState = {
  cart: [],
  customer: null,
  subtotal: 0,
  discountAmount: 0,
  totalAmount: 0,
  currentSale: null,
  loading: false,
  error: null,
};

const posSlice = createSlice({
  name: 'pos',
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<Omit<CartItem, 'totalPrice'>>) => {
      const item = action.payload;
      const existingItem = state.cart.find(
        (cartItem) => 
          cartItem.productId === item.productId && 
          cartItem.variantId === item.variantId
      );

      if (existingItem) {
        existingItem.quantity += item.quantity;
        existingItem.totalPrice = (existingItem.unitPrice * existingItem.quantity) - existingItem.discountAmount;
      } else {
        const newItem: CartItem = {
          ...item,
          totalPrice: (item.unitPrice * item.quantity) - item.discountAmount,
        };
        state.cart.push(newItem);
      }

      posSlice.caseReducers.calculateTotals(state);
    },
    
    removeFromCart: (state, action: PayloadAction<string>) => {
      state.cart = state.cart.filter(item => item.id !== action.payload);
      posSlice.caseReducers.calculateTotals(state);
    },
    
    updateCartItemQuantity: (state, action: PayloadAction<{ id: string; quantity: number }>) => {
      const { id, quantity } = action.payload;
      const item = state.cart.find(cartItem => cartItem.id === id);
      
      if (item) {
        item.quantity = quantity;
        item.totalPrice = (item.unitPrice * item.quantity) - item.discountAmount;
        posSlice.caseReducers.calculateTotals(state);
      }
    },
    
    updateCartItemPrice: (state, action: PayloadAction<{ id: string; unitPrice: number }>) => {
      const { id, unitPrice } = action.payload;
      const item = state.cart.find(cartItem => cartItem.id === id);
      
      if (item) {
        item.unitPrice = unitPrice;
        item.totalPrice = (item.unitPrice * item.quantity) - item.discountAmount;
        posSlice.caseReducers.calculateTotals(state);
      }
    },
    
    updateCartItemDiscount: (state, action: PayloadAction<{ id: string; discountAmount: number }>) => {
      const { id, discountAmount } = action.payload;
      const item = state.cart.find(cartItem => cartItem.id === id);
      
      if (item) {
        item.discountAmount = discountAmount;
        item.totalPrice = (item.unitPrice * item.quantity) - item.discountAmount;
        posSlice.caseReducers.calculateTotals(state);
      }
    },
    
    setCustomer: (state, action: PayloadAction<Customer | null>) => {
      state.customer = action.payload;
    },
    
    setDiscountAmount: (state, action: PayloadAction<number>) => {
      state.discountAmount = action.payload;
      posSlice.caseReducers.calculateTotals(state);
    },
    
    calculateTotals: (state) => {
      state.subtotal = state.cart.reduce((sum, item) => sum + item.totalPrice, 0);
      state.totalAmount = state.subtotal - state.discountAmount;
    },
    
    clearCart: (state) => {
      state.cart = [];
      state.customer = null;
      state.subtotal = 0;
      state.discountAmount = 0;
      state.totalAmount = 0;
      state.currentSale = null;
    },
    
    setSaleLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    
    setSaleError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    
    setSaleSuccess: (state, action: PayloadAction<any>) => {
      state.currentSale = action.payload;
      state.loading = false;
      state.error = null;
    },
  },
});

export const {
  addToCart,
  removeFromCart,
  updateCartItemQuantity,
  updateCartItemPrice,
  updateCartItemDiscount,
  setCustomer,
  setDiscountAmount,
  clearCart,
  setSaleLoading,
  setSaleError,
  setSaleSuccess,
} = posSlice.actions;

export default posSlice.reducer;
