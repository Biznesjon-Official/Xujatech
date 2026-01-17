import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store/store';
import { 
  removeFromCart, 
  updateCartItemQuantity, 
  updateCartItemDiscount 
} from '../../store/slices/posSlice';
import { Trash2, Plus, Minus } from 'lucide-react';

const ShoppingCart: React.FC = () => {
  const dispatch = useDispatch();
  const { cart, subtotal, discountAmount, totalAmount } = useSelector(
    (state: RootState) => state.pos
  );

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      dispatch(removeFromCart(itemId));
    } else {
      dispatch(updateCartItemQuantity({ id: itemId, quantity: newQuantity }));
    }
  };

  const handleDiscountChange = (itemId: string, discountAmount: number) => {
    dispatch(updateCartItemDiscount({ id: itemId, discountAmount }));
  };

  if (cart.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-4xl mb-2">🛒</div>
        <p>No items in cart</p>
        <p className="text-sm">Scan or search for products to add</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto space-y-2 mb-4">
        {cart.map((item) => (
          <div key={item.id} className="border rounded-md p-3 bg-gray-50">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <h4 className="font-medium text-sm">{item.name}</h4>
                {item.barcode && (
                  <p className="text-xs text-gray-500">{item.barcode}</p>
                )}
              </div>
              <button
                onClick={() => dispatch(removeFromCart(item.id))}
                className="text-red-500 hover:text-red-700 p-1"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            
            {/* Quantity Controls */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                  className="w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-8 text-center font-medium">{item.quantity}</span>
                <button
                  onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                  className="w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
              
              <div className="text-right">
                <div className="text-sm font-medium">
                  {item.totalPrice.toLocaleString()} UZS
                </div>
                <div className="text-xs text-gray-500">
                  {item.unitPrice.toLocaleString()} × {item.quantity}
                </div>
              </div>
            </div>
            
            {/* Discount Input */}
            <div className="flex items-center space-x-2">
              <label className="text-xs text-gray-600">Discount:</label>
              <input
                type="number"
                min="0"
                max={item.unitPrice * item.quantity}
                value={item.discountAmount}
                onChange={(e) => handleDiscountChange(item.id, Number(e.target.value))}
                className="w-20 px-2 py-1 text-xs border rounded"
                placeholder="0"
              />
              <span className="text-xs text-gray-500">UZS</span>
            </div>
          </div>
        ))}
      </div>
      
      {/* Cart Summary */}
      <div className="border-t pt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span>Subtotal:</span>
          <span>{subtotal.toLocaleString()} UZS</span>
        </div>
        
        {discountAmount > 0 && (
          <div className="flex justify-between text-sm text-red-600">
            <span>Discount:</span>
            <span>-{discountAmount.toLocaleString()} UZS</span>
          </div>
        )}
        
        <div className="flex justify-between text-lg font-bold border-t pt-2">
          <span>Total:</span>
          <span>{totalAmount.toLocaleString()} UZS</span>
        </div>
        
        <div className="text-xs text-gray-500 text-center">
          {cart.length} item{cart.length !== 1 ? 's' : ''} in cart
        </div>
      </div>
    </div>
  );
};

export default ShoppingCart;
