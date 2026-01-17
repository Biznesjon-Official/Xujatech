import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store/store';
import { setCustomer } from '../../store/slices/posSlice';
import { Search, User, Plus } from 'lucide-react';

const CustomerInfo: React.FC = () => {
  const dispatch = useDispatch();
  const { customer } = useSelector((state: RootState) => state.pos);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [loading, setLoading] = useState(false);

  const searchCustomers = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      if (window.electronAPI) {
        const result = await window.electronAPI.dbQuery(`
          SELECT * FROM customers 
          WHERE is_active = 1 
          AND (full_name LIKE ? OR phone LIKE ?) 
          ORDER BY full_name 
          LIMIT 10
        `, [`%${query}%`, `%${query}%`]);
        
        setSearchResults(result);
      }
    } catch (error) {
      console.error('Error searching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    searchCustomers(value);
  };

  const selectCustomer = (selectedCustomer: any) => {
    dispatch(setCustomer({
      id: selectedCustomer.id,
      fullName: selectedCustomer.full_name,
      phone: selectedCustomer.phone,
      currentDebt: selectedCustomer.current_debt,
      discountPercentage: selectedCustomer.discount_percentage
    }));
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const clearCustomer = () => {
    dispatch(setCustomer(null));
  };

  if (!showSearch && !customer) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">Walk-in Customer</p>
          <button
            onClick={() => setShowSearch(true)}
            className="btn-primary"
          >
            <Search className="w-4 h-4 mr-2" />
            Search Customer
          </button>
        </div>
      </div>
    );
  }

  if (showSearch) {
    return (
      <div className="space-y-4">
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by name or phone..."
              className="form-input pl-12"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              autoFocus
            />
          </div>
          <button
            onClick={() => {
              setShowSearch(false);
              setSearchQuery('');
              setSearchResults([]);
            }}
            className="btn-secondary"
          >
            Cancel
          </button>
        </div>

        {/* Search Results */}
        <div className="max-h-48 overflow-y-auto space-y-2">
          {loading && (
            <div className="text-center py-4">
              <div className="spinner mx-auto"></div>
            </div>
          )}
          
          {!loading && searchResults.length === 0 && searchQuery.length >= 2 && (
            <div className="text-center py-4 text-gray-500">
              <p>No customers found</p>
              <button className="btn-primary mt-2">
                <Plus className="w-4 h-4 mr-2" />
                Add New Customer
              </button>
            </div>
          )}
          
          {searchResults.map((result) => (
            <div
              key={result.id}
              onClick={() => selectCustomer(result)}
              className="p-3 border rounded-md hover:bg-gray-50 cursor-pointer"
            >
              <div className="font-medium">{result.full_name}</div>
              <div className="text-sm text-gray-500">
                {result.phone && `${result.phone} • `}
                Debt: {result.current_debt.toLocaleString()} UZS
                {result.discount_percentage > 0 && ` • ${result.discount_percentage}% discount`}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Show selected customer
  if (!customer) return null;
  
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium text-blue-900">{customer.fullName}</h3>
            {customer.phone && (
              <p className="text-sm text-blue-700">{customer.phone}</p>
            )}
          </div>
          <button
            onClick={clearCustomer}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            Change
          </button>
        </div>
        
        <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-blue-600">Current Debt:</span>
            <div className={`font-medium ${
              customer.currentDebt > 0 ? 'text-red-600' : 'text-green-600'
            }`}>
              {customer.currentDebt.toLocaleString()} UZS
            </div>
          </div>
          
          {customer.discountPercentage > 0 && (
            <div>
              <span className="text-blue-600">Discount:</span>
              <div className="font-medium text-green-600">
                {customer.discountPercentage}%
              </div>
            </div>
          )}
        </div>
      </div>
      
      <button
        onClick={() => setShowSearch(true)}
        className="w-full btn-secondary"
      >
        <Search className="w-4 h-4 mr-2" />
        Search Different Customer
      </button>
    </div>
  );
};

export default CustomerInfo;
