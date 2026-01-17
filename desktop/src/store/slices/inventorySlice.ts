import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Product {
  id: string;
  barcode?: string;
  name: string;
  description?: string;
  categoryId?: string;
  categoryName?: string;
  supplierId?: string;
  supplierName?: string;
  costPrice: number;
  sellingPrice: number;
  warrantyMonths: number;
  minimumStock: number;
  currentStock: number;
  unit: string;
  isActive: boolean;
}

interface InventoryState {
  products: Product[];
  categories: any[];
  suppliers: any[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  selectedCategory: string | null;
  lowStockOnly: boolean;
}

const initialState: InventoryState = {
  products: [],
  categories: [],
  suppliers: [],
  loading: false,
  error: null,
  searchQuery: '',
  selectedCategory: null,
  lowStockOnly: false,
};

const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    
    setProducts: (state, action: PayloadAction<Product[]>) => {
      state.products = action.payload;
      state.loading = false;
      state.error = null;
    },
    
    setCategories: (state, action: PayloadAction<any[]>) => {
      state.categories = action.payload;
    },
    
    setSuppliers: (state, action: PayloadAction<any[]>) => {
      state.suppliers = action.payload;
    },
    
    addProduct: (state, action: PayloadAction<Product>) => {
      state.products.push(action.payload);
    },
    
    updateProduct: (state, action: PayloadAction<Product>) => {
      const index = state.products.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.products[index] = action.payload;
      }
    },
    
    removeProduct: (state, action: PayloadAction<string>) => {
      state.products = state.products.filter(p => p.id !== action.payload);
    },
    
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    
    setSelectedCategory: (state, action: PayloadAction<string | null>) => {
      state.selectedCategory = action.payload;
    },
    
    setLowStockOnly: (state, action: PayloadAction<boolean>) => {
      state.lowStockOnly = action.payload;
    },
    
    updateProductStock: (state, action: PayloadAction<{ productId: string; newStock: number }>) => {
      const { productId, newStock } = action.payload;
      const product = state.products.find(p => p.id === productId);
      if (product) {
        product.currentStock = newStock;
      }
    },
  },
});

export const {
  setLoading,
  setError,
  setProducts,
  setCategories,
  setSuppliers,
  addProduct,
  updateProduct,
  removeProduct,
  setSearchQuery,
  setSelectedCategory,
  setLowStockOnly,
  updateProductStock,
} = inventorySlice.actions;

export default inventorySlice.reducer;
