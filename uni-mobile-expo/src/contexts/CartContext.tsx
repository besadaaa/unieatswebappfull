import React, { createContext, useContext, useReducer, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  cafeteria_id: string;
  description: string | null;
  category: string | null;
  is_available: boolean;
}

interface CartItem {
  id: string;
  menuItem: MenuItem;
  quantity: number;
  specialInstructions?: string;
}

interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
  cafeteriaId: string | null;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: { menuItem: MenuItem; quantity: number; specialInstructions?: string } }
  | { type: 'REMOVE_ITEM'; payload: { itemId: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { itemId: string; quantity: number } }
  | { type: 'UPDATE_INSTRUCTIONS'; payload: { itemId: string; specialInstructions: string } }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; payload: CartState };

const initialState: CartState = {
  items: [],
  total: 0,
  itemCount: 0,
  cafeteriaId: null,
};

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { menuItem, quantity, specialInstructions } = action.payload;
      
      // Check if adding from different cafeteria
      if (state.cafeteriaId && state.cafeteriaId !== menuItem.cafeteria_id) {
        // Clear cart and add new item
        const newItem: CartItem = {
          id: `${menuItem.id}-${Date.now()}`,
          menuItem,
          quantity,
          specialInstructions,
        };
        
        return {
          items: [newItem],
          total: menuItem.price * quantity,
          itemCount: quantity,
          cafeteriaId: menuItem.cafeteria_id,
        };
      }
      
      // Check if item already exists
      const existingItemIndex = state.items.findIndex(
        item => item.menuItem.id === menuItem.id && item.specialInstructions === specialInstructions
      );
      
      if (existingItemIndex >= 0) {
        // Update existing item
        const updatedItems = [...state.items];
        updatedItems[existingItemIndex].quantity += quantity;
        
        return {
          ...state,
          items: updatedItems,
          total: updatedItems.reduce((sum, item) => sum + (item.menuItem.price * item.quantity), 0),
          itemCount: updatedItems.reduce((sum, item) => sum + item.quantity, 0),
        };
      } else {
        // Add new item
        const newItem: CartItem = {
          id: `${menuItem.id}-${Date.now()}`,
          menuItem,
          quantity,
          specialInstructions,
        };
        
        const updatedItems = [...state.items, newItem];
        
        return {
          ...state,
          items: updatedItems,
          total: updatedItems.reduce((sum, item) => sum + (item.menuItem.price * item.quantity), 0),
          itemCount: updatedItems.reduce((sum, item) => sum + item.quantity, 0),
          cafeteriaId: menuItem.cafeteria_id,
        };
      }
    }
    
    case 'REMOVE_ITEM': {
      const updatedItems = state.items.filter(item => item.id !== action.payload.itemId);
      
      return {
        ...state,
        items: updatedItems,
        total: updatedItems.reduce((sum, item) => sum + (item.menuItem.price * item.quantity), 0),
        itemCount: updatedItems.reduce((sum, item) => sum + item.quantity, 0),
        cafeteriaId: updatedItems.length > 0 ? state.cafeteriaId : null,
      };
    }
    
    case 'UPDATE_QUANTITY': {
      const { itemId, quantity } = action.payload;
      
      if (quantity <= 0) {
        return cartReducer(state, { type: 'REMOVE_ITEM', payload: { itemId } });
      }
      
      const updatedItems = state.items.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      );
      
      return {
        ...state,
        items: updatedItems,
        total: updatedItems.reduce((sum, item) => sum + (item.menuItem.price * item.quantity), 0),
        itemCount: updatedItems.reduce((sum, item) => sum + item.quantity, 0),
      };
    }
    
    case 'UPDATE_INSTRUCTIONS': {
      const { itemId, specialInstructions } = action.payload;
      
      const updatedItems = state.items.map(item =>
        item.id === itemId ? { ...item, specialInstructions } : item
      );
      
      return {
        ...state,
        items: updatedItems,
      };
    }
    
    case 'CLEAR_CART':
      return initialState;
    
    case 'LOAD_CART':
      return action.payload;
    
    default:
      return state;
  }
}

interface CartContextType {
  state: CartState;
  addItem: (menuItem: MenuItem, quantity: number, specialInstructions?: string) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  updateInstructions: (itemId: string, specialInstructions: string) => void;
  clearCart: () => void;
  getItemQuantity: (menuItemId: string) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = '@unieats_cart';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Load cart from storage on app start
  useEffect(() => {
    loadCart();
  }, []);

  // Save cart to storage whenever it changes
  useEffect(() => {
    saveCart();
  }, [state]);

  const loadCart = async () => {
    try {
      const savedCart = await SecureStore.getItemAsync(CART_STORAGE_KEY);
      if (savedCart) {
        const cartData = JSON.parse(savedCart);
        dispatch({ type: 'LOAD_CART', payload: cartData });
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    }
  };

  const saveCart = async () => {
    try {
      await SecureStore.setItemAsync(CART_STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Error saving cart:', error);
    }
  };

  const addItem = (menuItem: MenuItem, quantity: number, specialInstructions?: string) => {
    dispatch({
      type: 'ADD_ITEM',
      payload: { menuItem, quantity, specialInstructions },
    });
  };

  const removeItem = (itemId: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { itemId } });
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { itemId, quantity } });
  };

  const updateInstructions = (itemId: string, specialInstructions: string) => {
    dispatch({ type: 'UPDATE_INSTRUCTIONS', payload: { itemId, specialInstructions } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const getItemQuantity = (menuItemId: string) => {
    return state.items
      .filter(item => item.menuItem.id === menuItemId)
      .reduce((total, item) => total + item.quantity, 0);
  };

  const value = {
    state,
    addItem,
    removeItem,
    updateQuantity,
    updateInstructions,
    clearCart,
    getItemQuantity,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
