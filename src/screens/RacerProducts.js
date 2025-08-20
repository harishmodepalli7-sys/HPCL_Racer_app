import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import Toast from 'react-native-toast-message';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { apiClient } from '../services/apiClient';

export default function ProductListScreen() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [addingProductId, setAddingProductId] = useState(null);
  const [quantityByProduct, setQuantityByProduct] = useState({});
  const [expandedProductIds, setExpandedProductIds] = useState([]);
  const [wishlistLoadingId, setWishlistLoadingId] = useState(null);

  const navigation = useNavigation();
  const { addToCart } = useCart();

  const {
    isInWishlist,
    toggleWishlist,
    refreshWishlist
  } = useWishlist();

  useEffect(() => {
    fetchProducts();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      refreshWishlist();
    }, [])
  );

  const fetchProducts = async (query = '') => {
    setLoading(true);
    try {
      const response = await apiClient.get('/api/products', {
        params: {
          search_text: query,
          limit: 10000,
        },
      });

      const allProducts = response.data?.data || [];

      // Filter to exclude 'spareparts'
      const filtered = allProducts.filter(
        (item) => item.product_type?.toLowerCase() !== 'spareparts'
      );

      setProducts(filtered);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      Alert.alert('Error', 'Failed to load products from server.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    fetchProducts(text);
  };

  const handleAddToCart = async (item, quantityRaw = '1') => {
    try {
      setAddingProductId(item.id);
      const quantity = parseInt(quantityRaw) || 1;
      const customerId = await AsyncStorage.getItem('customer_id');
      if (!customerId) {
        Toast.show({
          type: 'error',
          text1: 'Customer not found',
          text2: 'Please login again',
        });
        return;
      }

      await addToCart({
        product_id: item.id.toString(),
        quantity,
      });

      Toast.show({
        type: 'success',
        text1: 'Added to Cart',
        text2: `${item.product_name} x${quantity}`,
      });

      setExpandedProductIds((prev) => prev.filter((pid) => pid !== item.id));
    } catch (err) {
      console.error('Add to cart error:', err);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to add to cart',
      });
    } finally {
      setAddingProductId(null);
    }
  };

  const handleAddToWishlist = async (productId) => {
    try {
      setWishlistLoadingId(productId);
      const customerId = await AsyncStorage.getItem('customer_id');
      if (!customerId) {
        Toast.show({
          type: 'error',
          text1: 'Not Logged In',
          text2: 'Please log in to manage wishlist.',
        });
        return;
      }

      const result = await toggleWishlist(productId);

      if (result.success) {
        const wasInWishlist = isInWishlist(productId);
        Toast.show({
          type: wasInWishlist ? 'info' : 'success',
          text1: wasInWishlist ? 'Removed from Wishlist' : 'Added to Wishlist',
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Wishlist Error',
          text2: result.error || 'Something went wrong!',
        });
      }
    } catch (err) {
      console.error('Wishlist toggle error:', err);
      Toast.show({
        type: 'error',
        text1: 'Wishlist Error',
        text2: 'Something went wrong!',
      });
    } finally {
      setWishlistLoadingId(null);
    }
  };

  const filteredProducts = products.filter((item) =>
    item.product_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        navigation.navigate('ProductDetail', {
          product: item,
          price: item.selling_price,
        })
      }
    >
      <View style={{ position: 'relative' }}>
        <Image
          source={{
            uri: item.primary_image_url || 'https://via.placeholder.com/150',
          }}
          style={styles.image}
        />
        <TouchableOpacity
          onPress={() => handleAddToWishlist(item.id)}
          style={styles.heartIcon}
        >
          {wishlistLoadingId === item.id ? (
            <ActivityIndicator size="small" color="red" />
          ) : (
            <Ionicons
              name={isInWishlist(item.id) ? 'heart' : 'heart-outline'}
              size={22}
              color="red"
            />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.details}>
        <Text style={styles.name} numberOfLines={2}>{item.product_name}</Text>
        <Text style={styles.info}>Brand: {item.brand_name || 'N/A'}</Text>
        <Text style={styles.info}>Price: ₹{item.selling_price ?? 'N/A'}</Text>
        <Text style={styles.info}>Type: {item.product_type || '-'}</Text>

        {expandedProductIds.includes(item.id) ? (
          <View style={{ marginTop: 10 }}>
            <View style={styles.qtyContainer}>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => {
                  const currentQty = parseInt(quantityByProduct[item.id]) || 1;
                  if (currentQty === 1) {
                    // Collapse quantity controls on pressing "-" at 1
                    setExpandedProductIds((prev) => prev.filter((pid) => pid !== item.id));
                  } else {
                    const qty = currentQty - 1;
                    setQuantityByProduct(prev => ({ ...prev, [item.id]: qty.toString() }));
                  }
                }}
              >
                <Text style={styles.qtyText}>-</Text>
              </TouchableOpacity>

              <TextInput
                keyboardType="numeric"
                style={styles.qtyInput}
                value={quantityByProduct[item.id]?.toString() ?? ''}
                onChangeText={(text) => {
                  setQuantityByProduct(prev => ({ ...prev, [item.id]: text }));
                }}
              />

              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => {
                  const currentQty = parseInt(quantityByProduct[item.id]) || 1;
                  const qty = currentQty + 1;
                  setQuantityByProduct(prev => ({ ...prev, [item.id]: qty.toString() }));
                }}
              >
                <Text style={styles.qtyText}>+</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.confirmAddBtn}
              onPress={() => {
                const qty = quantityByProduct[item.id] || '1';
                handleAddToCart(item, qty);
              }}
            >
              <Text style={styles.confirmText}>Add to Cart</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => {
                setExpandedProductIds((prev) => prev.filter((pid) => pid !== item.id));
              }}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.addButton}
            onPress={(e) => {
              e.stopPropagation?.();
              setExpandedProductIds(prev => [...prev, item.id]);
              setQuantityByProduct(prev => ({ ...prev, [item.id]: '1' }));
            }}
          >
            <Text style={styles.addButtonText}>Add to Cart</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Search Products..."
        value={searchQuery}
        onChangeText={handleSearch}
        style={styles.searchInput}
      />
      {loading ? (
        <ActivityIndicator size="large" color="#007bff" style={{ marginTop: 30 }} />
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        />
      )}
      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#386b8eff', padding: 10 },
  searchInput: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 16,
    borderColor: '#ddd',
    borderWidth: 1,
  },
  row: { justifyContent: 'space-between', marginBottom: 14 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    width: '48%',
    elevation: 2,
  },
  image: {
    width: '100%',
    height: 100,
    borderRadius: 6,
    backgroundColor: '#fff',
    resizeMode: 'contain',
    marginBottom: 10,
  },
  heartIcon: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 20,
    padding: 4,
    zIndex: 1,
  },
  details: { justifyContent: 'space-between' },
  name: { fontSize: 15, fontWeight: 'bold', color: '#1e293b' },
  info: { fontSize: 13, color: '#475569', marginTop: 2 },
  addButton: {
    marginTop: 10,
    backgroundColor: '#007bff',
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  addButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  qtyBtn: {
    backgroundColor: '#ccc',
    padding: 6,
    borderRadius: 4,
  },
  qtyText: { fontSize: 18, fontWeight: 'bold', paddingHorizontal: 6 },
  qtyInput: {
    width: 50,
    height: 36,
    textAlign: 'center',
    fontSize: 16,
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    paddingHorizontal: 6,
    backgroundColor: '#fff',
    color: '#000',
    paddingVertical: 2,
  },
  confirmAddBtn: {
    backgroundColor: '#007bff',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  confirmText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  cancelBtn: {
    marginTop: 8,
    alignItems: 'center',
  },
  cancelText: {
    color: '#007bff',
    fontWeight: 'bold',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});
