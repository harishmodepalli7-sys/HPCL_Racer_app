import React, { createContext, useContext, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../services/apiClient'; // use your configured axios instance

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

  // Fetch all cart items
  const fetchCart = async () => {
    try {
      const customer_id = await AsyncStorage.getItem('customer_id');
      const response = await apiClient.post('/api/cart/fetch_cart_data', { customer_id });
      if (response.data?.status) {
        setCartItems(response.data.data || []);
      } else {
        setCartItems([]);
        console.warn('Cart is empty or fetch failed:', response.data.message);
      }
    } catch (error) {
      console.error('Error fetching cart:', error.response?.data || error.message);
    }
  };

  // Add to cart
  const addToCart = async ({ product_id, quantity }) => {
    try {
      const customer_id = await AsyncStorage.getItem('customer_id');
      const res = await apiClient.post(
        '/api/cart/add_to_cart',
        { product_id: product_id.toString(), quantity, customer_id }
      );
      if (res.data?.status) {
        await fetchCart();
        return res.data;
      }
    } catch (error) {
      console.error('Add to cart error:', error.response?.data || error.message);
      throw error;
    }
  };

  // Remove a specific item from cart
  const removeCartItem = async (cart_id) => {
    try {
      if (!cart_id) {
        console.warn('Missing cart_id');
        return;
      }
      const cartIdStr = cart_id.toString();
      const response = await apiClient.delete(`/api/cart/${cartIdStr}`);
      if (response.status === 200 && typeof response.data === 'string') {
        setCartItems((prev) => prev.filter(item => item.cart_id.toString() !== cartIdStr));
      } else {
        console.warn('Delete failed:', response.data || 'Unexpected response');
        fetchCart();
      }
    } catch (error) {
      if (error.response?.status === 422) {
        console.error('Validation error:', error.response.data);
      } else {
        console.error('Failed to remove item:', error.response?.data || error.message);
      }
    }
  };

  // Update quantity
  const updateCartItemQuantity = async (cart_id, quantity) => {
    try {
      const response = await apiClient.post('/api/cart/update_cart', {
        cart_id: cart_id.toString(),
        quantity,
        product_section: false,
      });

      if (Array.isArray(response.data) && response.data[0] === true) {
        fetchCart();
      } else {
        console.warn('Update failed:', response.data[1] || 'Unknown error');
      }
    } catch (error) {
      console.error('Error updating quantity:', error.response?.data || error.message);
    }
  };

  // Place Order
  const placeOrder = async () => {
    try {
      const cart_ids = cartItems
        .map(item => item.cart_id?.toString())
        .filter(Boolean);

      if (cart_ids.length === 0) {
        console.warn('No cart IDs found to place order');
        return;
      }

      const response = await apiClient.post('/api/orders/place_order', { cart_ids });

      if (response.status === 200 && typeof response.data === 'string') {
        setCartItems([]); // clear cart
        return response.data;
      } else {
        console.warn('Unexpected response:', response.data);
      }
    } catch (error) {
      if (error.response?.status === 422) {
        console.error('Validation Error:', error.response.data);
      } else {
        console.error('Place order error:', error.response?.data || error.message);
      }
      throw error;
    }
  };

  // Clear all cart items
  const clearCart = async () => {
    try {
      const product_ids = cartItems
        .map(item => item.product_id?.toString())
        .filter(Boolean);

      if (product_ids.length === 0) {
        console.warn('No product IDs to clear.');
        return;
      }

      const res = await apiClient.post('/api/cart/clear_cart', { product_ids });

      if (res.data?.status === true) {
        setCartItems([]);
      } else {
        console.warn('Clear cart failed:', res.data?.message || 'Unexpected response');
      }
    } catch (error) {
      console.error('Clear cart error:', error.response?.data || error.message);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        fetchCart,
        removeCartItem,
        clearCart,
        addToCart,
        updateCartItemQuantity,
        placeOrder,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
