import React, { useState, useEffect } from 'react';
import { Search, Package } from 'lucide-react';

interface Product {
  id: string;
  barcode?: string;
  name: string;
  sellingPrice: number;
  currentStock: number;
  categoryName?: string;
}

interface ProductSearchProps {
  onProductSelect: (product: Product) => void;
}

const ProductSearch: React.FC<ProductSearchProps> = ({ onProductSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, []);

  // Search products when query changes
  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchProducts();
    } else {
      setProducts([]);
    }
  }, [searchQuery, selectedCategory]);

  const loadCategories = async () => {
    try {
      if (window.electronAPI) {
        const result = await window.electronAPI.dbQuery(
          'SELECT * FROM categories WHERE is_active = 1 ORDER BY name'
        );
        setCategories(result);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const searchProducts = async () => {
    setLoading(true);
    try {
      if (window.electronAPI) {
        let query = `
          SELECT p.*, c.name as category_name 
          FROM products p 
          LEFT JOIN categories c ON p.category_id = c.id 
          WHERE p.is_active = 1 
          AND (p.name LIKE ? OR p.barcode LIKE ?)
        `;
        
        const params = [`%${searchQuery}%`, `%${searchQuery}%`];
        
        if (selectedCategory) {
          query += ' AND p.category_id = ?';
          params.push(selectedCategory);
        }
        
        query += ' ORDER BY p.name LIMIT 20';
        
        const result = await window.electronAPI.dbQuery(query, params);
        
        const formattedProducts = result.map((p: any) => ({
          id: p.id,
          barcode: p.barcode,
          name: p.name,
          sellingPrice: p.selling_price,
          currentStock: p.current_stock,
          categoryName: p.category_name
        }));
        
        setProducts(formattedProducts);
      }
    } catch (error) {
      console.error('Error searching products:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Search products..."
          className="form-input pl-12"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Category Filter */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setSelectedCategory('')}
          className={`px-3 py-2 text-sm rounded-md transition-colors ${
            selectedCategory === '' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-3 py-2 text-sm rounded-md transition-colors ${
              selectedCategory === category.id 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* Product Results */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {loading && (
          <div className="text-center py-4">
            <div className="spinner mx-auto"></div>
          </div>
        )}
        
        {!loading && products.length === 0 && searchQuery.length >= 2 && (
          <div className="text-center py-4 text-gray-500">
            No products found
          </div>
        )}
        
        {products.map((product) => (
          <div
            key={product.id}
            onClick={() => onProductSelect(product)}
            className="p-3 border rounded-md hover:bg-gray-50 cursor-pointer transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Package className="w-4 h-4 text-gray-400 mr-2" />
                <div>
                  <div className="font-medium text-sm">{product.name}</div>
                  <div className="text-xs text-gray-500">
                    {product.barcode && `${product.barcode} • `}
                    {product.categoryName}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium text-sm">
                  {product.sellingPrice.toLocaleString()} UZS
                </div>
                <div className={`text-xs ${
                  product.currentStock > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  Stock: {product.currentStock}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductSearch;
