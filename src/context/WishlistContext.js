import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../services/apiClient'; // Your custom axios instance

const WishlistContext = createContext();

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within WishlistProvider');
  }
  return context;
};

export const WishlistProvider = ({ children }) => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [wishlistProducts, setWishlistProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch wishlist from server
  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const customerId = await AsyncStorage.getItem('customer_id');
      if (!customerId) {
        console.warn('customer_id not found in AsyncStorage');
        setWishlistItems([]);
        setWishlistProducts([]);
        return;
      }

      const response = await apiClient.post(
        '/api/wishlist/fetch_wishlist',
        {
          customer_id: customerId,
          fields: [],
        }
      );

      const data = response.data?.data || [];
      setWishlistProducts(data);
      // Extract product IDs for quick lookup
      const productIds = data.map(item => String(item.id));
      setWishlistItems(productIds);

    } catch (error) {
      console.warn('Wishlist fetch failed:', error.response?.data || error.message);
      setWishlistItems([]);
      setWishlistProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Add item to wishlist
  const addToWishlist = async (productId) => {
    try {
      const customerId = await AsyncStorage.getItem('customer_id');
      if (!customerId) {
        throw new Error('Not logged in');
      }

      await apiClient.post(
        '/api/wishlist/add_to_wishlist',
        { product_id: productId.toString(), customer_id: customerId }
      );
      setWishlistItems(prev => [...prev, String(productId)]);
      await fetchWishlist();
      return { success: true };
    } catch (error) {
      console.error('Add to wishlist error:', error.response?.data || error.message);
      return { success: false, error: error.message };
    }
  };

  // Remove item from wishlist
  const removeFromWishlist = async (productId) => {
    try {
      const customerId = await AsyncStorage.getItem('customer_id');
      await apiClient.post(
        '/api/wishlist/remove_from_wishlist',
        { product_ids: [productId.toString()], customer_id: customerId }
      );
      setWishlistItems(prev => prev.filter(id => id !== String(productId)));
      await fetchWishlist();
      return { success: true };
    } catch (error) {
      console.error('Remove from wishlist error:', error.response?.data || error.message);
      return { success: false, error: error.message };
    }
  };

  // Check if item is in wishlist
  const isInWishlist = (productId) => wishlistItems.includes(String(productId));

  // Toggle wishlist item
  const toggleWishlist = async (productId) => {
    if (isInWishlist(productId)) {
      return await removeFromWishlist(productId);
    } else {
      return await addToWishlist(productId);
    }
  };

  // Initialize wishlist on mount
  useEffect(() => {
    fetchWishlist();
  }, []);

  const value = {
    wishlistItems,
    wishlistProducts,
    loading,
    fetchWishlist,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    isInWishlist,
    refreshWishlist: fetchWishlist, // Alias for refresh (optional)
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};
