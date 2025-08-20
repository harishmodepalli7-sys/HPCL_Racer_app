import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  Image,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ToastMessage from '../components/ToastMessage';

export default function WishlistScreen() {
  const navigation = useNavigation();
  const { addToCart } = useCart();

  const [expandedProductIds, setExpandedProductIds] = useState([]);
  const [quantityByProduct, setQuantityByProduct] = useState({});
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  const {
    wishlistProducts,
    loading,
    refreshWishlist,
    removeFromWishlist,
  } = useWishlist();

  useFocusEffect(
    React.useCallback(() => {
      refreshWishlist();
    }, [])
  );

  const handleAddToCart = async (item, quantity = '1') => {
    try {
      await addToCart({
        product_id: item.id.toString(),
        quantity: Number(quantity),
      });

      setToastMessage('Added to Cart');
      setShowToast(true);
    } catch (err) {
      console.error('Add to cart error:', err);
      setToastMessage('Failed to add to cart');
      setShowToast(true);
    }
  };

  const handleRemoveFromWishlist = async (productId) => {
    try {
      const result = await removeFromWishlist(productId);
      if (result.success) {
        setToastMessage('Removed from Wishlist');
        setShowToast(true);
      } else {
        setToastMessage(result.error || 'Failed to remove from wishlist');
        setShowToast(true);
      }
    } catch (err) {
      console.error('Remove from wishlist error:', err);
      setToastMessage('Failed to remove from wishlist');
      setShowToast(true);
    }
  };

  const renderItem = ({ item }) => {
    const displayPrice =
      item.selling_price > 0
        ? item.selling_price
        : item.base_price > 0
        ? item.base_price
        : item.mrp > 0
        ? item.mrp
        : 0;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          navigation.navigate('ProductDetail', {
            product: item,
            price: displayPrice,
          })
        }
      >
        <View style={{ position: 'relative' }}>
          <Image
            source={{ uri: item.primary_image_url || 'https://via.placeholder.com/150' }}
            style={styles.image}
          />
          <TouchableOpacity
            onPress={() => handleRemoveFromWishlist(item.id)}
            style={styles.heartIcon}
          >
            <Ionicons name="heart" size={22} color="red" />
          </TouchableOpacity>
        </View>

        <View style={styles.details}>
          <Text style={styles.productName} numberOfLines={2}>
            {item.product_name}
          </Text>
          <Text style={styles.brand}>Brand: {item.brand_name || 'N/A'}</Text>
          <Text style={styles.price}>₹{displayPrice.toFixed(2)}</Text>
          <Text style={styles.metaText}>Type: {item.product_type || 'N/A'}</Text>

          {expandedProductIds.includes(item.id) ? (
            <View style={{ marginTop: 10 }}>
              <View style={styles.qtyContainer}>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => {
                    const currentQty = parseInt(quantityByProduct[item.id]) || 1;
                    const qty = Math.max(currentQty - 1, 1);
                    setQuantityByProduct((prev) => ({ ...prev, [item.id]: qty.toString() }));
                  }}
                >
                  <Text style={styles.qtyText}>-</Text>
                </TouchableOpacity>

                <TextInput
                  keyboardType="numeric"
                  style={styles.qtyInput}
                  value={quantityByProduct[item.id]?.toString() ?? ''}
                  onChangeText={(text) =>
                    setQuantityByProduct((prev) => ({ ...prev, [item.id]: text }))
                  }
                />

                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => {
                    const currentQty = parseInt(quantityByProduct[item.id]) || 1;
                    const qty = currentQty + 1;
                    setQuantityByProduct((prev) => ({ ...prev, [item.id]: qty.toString() }));
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
                  setExpandedProductIds((prev) => prev.filter((id) => id !== item.id));
                }}
              >
                <Text style={styles.confirmText}>Add to Cart</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() =>
                  setExpandedProductIds((prev) => prev.filter((id) => id !== item.id))
                }
              >
                <Text style={styles.cancelTextLink}>Cancel</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                setExpandedProductIds((prev) => [...prev, item.id]);
                setQuantityByProduct((prev) => ({ ...prev, [item.id]: '1' }));
              }}
            >
              <Text style={styles.addButtonText}>Add to Cart</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>Loading wishlist...</Text>
        </View>
      ) : wishlistProducts.length > 0 ? (
        <FlatList
          data={wishlistProducts}
          numColumns={2}
          keyExtractor={(item, index) =>
            item?.id ? item.id.toString() : index.toString()
          }
          renderItem={renderItem}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={refreshWishlist} />
          }
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.noItemsText}>No items in wishlist</Text>
          <Text style={styles.noItemsSubText}>
            Add products to your wishlist to see them here
          </Text>
        </View>
      )}

      <ToastMessage
        message={toastMessage}
        visible={showToast}
        onHide={() => setShowToast(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 16, color: '#666' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  card: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    width: '48%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  image: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    backgroundColor: '#fff',
    resizeMode: 'contain',
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
  productName: { fontSize: 15, fontWeight: 'bold', color: '#1e293b', lineHeight: 20 },
  brand: { fontSize: 13, color: '#475569', fontWeight: '500' },
  price: { fontSize: 16, fontWeight: 'bold', color: '#007bff' },
  metaText: { fontSize: 11, color: '#64748b', lineHeight: 16 },
  noItemsText: { textAlign: 'center', fontSize: 18, color: '#64748b', fontWeight: '500' },
  noItemsSubText: { textAlign: 'center', fontSize: 14, color: '#94a3b8', marginTop: 4 },

  qtyContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  qtyBtn: { backgroundColor: '#ccc', padding: 6, borderRadius: 4 },
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
    marginTop: 6,
  },
  confirmText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  addButton: {
    marginTop: 10,
    backgroundColor: '#007bff',
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  addButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  cancelTextLink: {
    marginTop: 6,
    textAlign: 'center',
    textDecorationLine: 'underline',
    color: 'red',
    fontSize: 13,
    fontWeight: '500',
  },
});
