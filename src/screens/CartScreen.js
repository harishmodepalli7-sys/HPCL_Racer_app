// screens/CartScreen.js
import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CartScreen() {
  const { cartItems, fetchCart, removeCartItem, clearCart } = useCart();
  const insets = useSafeAreaInsets();

  // Fetch cart every time screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchCart();
    }, [fetchCart])
  );

  const getTotalQty = () => cartItems.reduce((total, item) => total + item.quantity, 0);

  const confirmDelete = (cart_id) => {
    Alert.alert('Remove Item', 'Are you sure you want to remove this item?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        onPress: () => removeCartItem(cart_id),
        style: 'destructive',
      },
    ]);
  };

  // Clear cart with single confirmation alert
  const handleClearCartPress = () => {
    Alert.alert(
      'Clear Cart',
      'Do you want to remove all items from the cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'OK',
          onPress: () => {
            clearCart();
            fetchCart();
          },
          style: 'destructive',
        },
      ]
    );
  };

  const placeOrder = async () => {
    if (cartItems.length === 0) {
      Alert.alert('Cart Empty', 'Please add items before placing an order.');
      return;
    }

    const cart_ids = cartItems
      .map((item) => item.cart_id?.toString())
      .filter(Boolean);

    if (!cart_ids.length) {
      Alert.alert('Error', 'Cart item IDs are missing.');
      return;
    }

    try {
      const response = await fetch('/api/orders/place_order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cart_ids }),
      });

      const data = await response.json();

      if (
        data?.status === true ||
        (typeof data === 'string' && data.toLowerCase().includes('success'))
      ) {
        Alert.alert('Order Placed', 'Your order has been placed successfully');
        await clearCart();
        await fetchCart();
      } else {
        Alert.alert('Failed', data?.message || 'Something went wrong');
      }
    } catch (error) {
      console.error('Order error:', error);
      Alert.alert('Error', 'Failed to place order');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>Your Shopping Cart</Text>

        {cartItems.length > 0 && (
          <TouchableOpacity
            accessibilityLabel="Clear cart"
            style={styles.clearBtn}
            onPress={handleClearCartPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-bin-outline" size={22} color="#fff" />
            <Text style={styles.clearBtnText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.subtitle}>Review items and proceed to checkout.</Text>

      {/* Cart Items */}
      {cartItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="cart-outline" size={80} color="#cbd5e1" />
          <Text style={styles.emptyText}>Your cart is empty</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
          {[...cartItems]
            .sort((a, b) => a.cart_id - b.cart_id) // Change to b.cart_id - a.cart_id for newest first
            .map((item) => (
              <View key={item.cart_id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.brand}>{item.brand_name}</Text>
                  <TouchableOpacity
                    accessibilityLabel="Remove item"
                    onPress={() => confirmDelete(item.cart_id)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="trash" size={22} color="red" />
                  </TouchableOpacity>
                </View>

                <View style={styles.cardBody}>
                  <Image
                    source={{
                      uri:
                        item.product_image_url ||
                        item.image ||
                        item.primary_image_url ||
                        'https://via.placeholder.com/80',
                    }}
                    style={styles.image}
                  />
                  <View style={styles.info}>
                    <Text style={styles.name}>{item.product_name}</Text>
                    <View style={styles.metaRow}>
                      <Text style={styles.meta}>Pack: {item.pack_size || 1}</Text>
                      <Text style={styles.dot}>•</Text>
                      <Text style={styles.meta}>UOM: {item.uom || 'Case'}</Text>
                    </View>
                    <Text style={styles.qty}>Qty: {item.quantity}</Text>
                  </View>
                </View>
              </View>
            ))}
        </ScrollView>
      )}

      {/* Footer */}
      {cartItems.length > 0 && (
        <View style={[styles.footer, { paddingBottom: insets.bottom - 50 }]}>
          <Text style={styles.totalText}>Total Items: {getTotalQty()}</Text>
          <TouchableOpacity
            accessibilityLabel="Place order"
            style={styles.placeBtn}
            onPress={placeOrder}
            activeOpacity={0.8}
          >
            <Text style={styles.placeBtnText}>Place Order</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f8fafc' },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },

  title: { fontSize: 22, fontWeight: 'bold', color: '#1e293b' },
  subtitle: { fontSize: 14, color: '#64748b', marginBottom: 20 },

  clearBtn: {
    backgroundColor: '#dc2626',
    borderRadius: 9,
    height: 42,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },

  clearBtnText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 6,
    fontSize: 14,
  },

  emptyContainer: {
    alignItems: 'center',
    marginTop: 80,
  },
  emptyText: {
    fontSize: 16,
    color: '#94a3b8',
    marginTop: 10,
    textAlign: 'center',
  },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cardBody: {
    flexDirection: 'row',
    gap: 10,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#fff',
    resizeMode: 'contain',
  },
  info: {
    flex: 1,
  },
  brand: { fontSize: 14, color: '#888', fontWeight: '500' },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  meta: { fontSize: 14, color: '#555' },
  dot: { marginHorizontal: 6, color: '#999' },
  qty: { fontSize: 14, color: '#007BFF', fontWeight: '600' },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 8,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'column',
    // Add dynamic paddingBottom in render with insets.bottom
  },
  totalText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 10,
    textAlign: 'right',
  },
  placeBtn: {
    backgroundColor: '#1e40af',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  placeBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
