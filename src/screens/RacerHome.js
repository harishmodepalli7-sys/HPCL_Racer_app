import React, { useEffect, useState, useCallback, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  TextInput,
  SafeAreaView,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Dimensions,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../services/apiClient';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedGestureHandler,
  useSharedValue,
  withTiming,
  runOnJS,
  useAnimatedStyle,
  interpolate,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');
const cardWidth = (width - 60) / 2;

const CardWishlistToggle = memo(({ productId, isInWishlist, toggleWishlist, disabled }) => {
  const [loading, setLoading] = useState(false);
  const handleToggle = async () => {
    if (disabled) return;
    setLoading(true);
    try {
      await toggleWishlist(productId);
    } catch {
      Alert.alert('Error', 'Failed to update wishlist');
    } finally {
      setLoading(false);
    }
  };
  return (
    <TouchableOpacity
      onPress={handleToggle}
      style={styles.cardWishlistIcon}
      activeOpacity={0.7}
      disabled={loading || disabled}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#e11d48" />
      ) : (
        <Ionicons
          name={isInWishlist(productId) ? 'heart' : 'heart-outline'}
          size={22}
          color={isInWishlist(productId) ? '#e11d48' : '#999'}
        />
      )}
    </TouchableOpacity>
  );
});

const ProductCard = memo(({ item, isInWishlist, toggleWishlist, addToCart, onSelect }) => {
  const [quantity, setQuantity] = useState(1);
  const [showQuantityControls, setShowQuantityControls] = useState(false);
  const maxReorderLimit = 1000;

  const increment = () => {
    if (quantity < maxReorderLimit) setQuantity(quantity + 1);
  };

  const decrement = () => {
    if (quantity > 1) setQuantity(quantity - 1);
    else {
      setShowQuantityControls(false);
      setQuantity(1);
    }
  };

  const handleInitialAddPress = () => setShowQuantityControls(true);

  const handleConfirmAddToCart = () => {
    addToCart({ product_id: item.product_id, quantity });
    Alert.alert('Added to Cart', `${item.name} (x${quantity})`);
    setQuantity(1);
    setShowQuantityControls(false);
  };

  const getStockColor = (stock) => {
    if (stock === 0) return '#FF5722';
    if (stock > 0 && stock < 5) return '#FF9800';
    return '#4CAF50';
  };

  return (
    <TouchableOpacity onPress={() => onSelect(item)} activeOpacity={0.8} style={{ position: 'relative' }}>
      <View style={styles.card}>
        <CardWishlistToggle productId={item.product_id} isInWishlist={isInWishlist} toggleWishlist={toggleWishlist} disabled={false} />
        <View style={styles.productImageContainer}>
          <Image source={{ uri: item.image }} style={styles.productImage} />
        </View>
        <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
        <View style={styles.productFooter}>
          {showQuantityControls ? (
            <View style={{ width: '100%', alignItems: 'center' }}>
              <View style={styles.quantityControlContainer}>
                <TouchableOpacity onPress={decrement} style={styles.qtyButton}>
                  <Text style={styles.qtyButtonText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.quantityNumber}>{quantity}</Text>
                <TouchableOpacity onPress={increment} style={styles.qtyButton}>
                  <Text style={styles.qtyButtonText}>+</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={[styles.addButton, { marginTop: 10, paddingHorizontal: 40 }]} onPress={handleConfirmAddToCart}>
                <Text style={styles.addButtonText}>ADD</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.footerRow}>
              <Text style={[styles.quantityNumber, { color: getStockColor(item.stock) }]}>{item.stock} Left</Text>
              <TouchableOpacity style={styles.addButton} onPress={handleInitialAddPress}>
                <Text style={styles.addButtonText}>ADD</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
});

export default function InventoryScreen() {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist, wishlistItems } = useWishlist();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [search, setSearch] = useState('');
  const [inventoryData, setInventoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customerId, setCustomerId] = useState(null);
  const [storageLoaded, setStorageLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [optionsVisible, setOptionsVisible] = useState(false);

  const headerMarginTop = insets.top + (Platform.OS === 'ios' ? 20 : 12);

  const translateY = useSharedValue(0);
  const modalOpacity = useSharedValue(1);

  useEffect(() => {
    const loadStorage = async () => {
      try {
        const custId = await AsyncStorage.getItem('customer_id');
        setCustomerId(custId);
      } catch (e) {
        console.error('[AsyncStorage] Failed to load customer_id', e);
      } finally {
        setStorageLoaded(true);
      }
    };
    loadStorage();
  }, []);

  useEffect(() => {
    if (storageLoaded) fetchInventory(customerId);
  }, [storageLoaded, customerId]);

  const fetchInventory = async (custId) => {
    setLoading(true);
    try {
      if (!custId) {
        Alert.alert('Session Expired', 'Please login again.', [
          { text: 'OK', onPress: () => navigation.replace('LoginScreen') },
        ]);
        setLoading(false);
        return;
      }
      const response = await apiClient.post('/api/inventory/fetch_inventory', { customer_id: custId, fields: [] });
      if (response.data?.status && Array.isArray(response.data.data)) {
        const cleanedData = response.data.data.map((item) => ({
          product_id: item.product_id,
          name: item.product_name,
          stock: item.total_quantity || 0,
          price: item.selling_price || item.base_price || 0,
          image: item.primary_image_url || 'https://via.placeholder.com/150',
          partNo: item.product_code,
          brand: item.brand_name,
          lastPurchaseDate: item.last_purchase_date ? new Date(item.last_purchase_date).toLocaleDateString() : 'N/A',
          sku: item.sku,
          packSize: item.pack_size,
          uom: item.uom,
          reorderQty: item.reorder_quantity,
          updated: item.updated_at ? new Date(item.updated_at).toLocaleDateString() : 'N/A',
        }));
        setInventoryData(cleanedData);
      } else {
        Alert.alert('Error', 'No inventory data received.');
      }
    } catch (error) {
      console.error('Error fetching inventory:', error.message);
      if (!(error.response && error.response.status === 401)) {
        Alert.alert('Error', 'Failed to fetch inventory. Please login again.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filteredData = inventoryData.filter((item) => item.name.toLowerCase().includes(search.toLowerCase()));

  const onRefresh = () => {
    setRefreshing(true);
    fetchInventory(customerId);
  };

  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, context) => {
      context.startY = translateY.value;
    },
    onActive: (event, context) => {
      translateY.value = context.startY + event.translationY;
      modalOpacity.value = interpolate(translateY.value, [0, height], [1, 0], 'clamp');
    },
    onEnd: () => {
      if (translateY.value > height / 4) {
        modalOpacity.value = withTiming(0);
        translateY.value = withTiming(height, {}, () => runOnJS(closeModal)());
      } else {
        translateY.value = withTiming(0);
        modalOpacity.value = withTiming(1);
      }
    },
  });

  const animatedStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    transform: [{ translateY: translateY.value }],
    opacity: modalOpacity.value,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    zIndex: 1000,
  }));

  const closeModal = useCallback(() => {
    setModalVisible(false);
    setSelectedProduct(null);
    translateY.value = 0;
    modalOpacity.value = 1;
  }, []);

  const renderCard = ({ item }) => (
    <ProductCard
      item={item}
      isInWishlist={isInWishlist}
      toggleWishlist={toggleWishlist}
      addToCart={addToCart}
      onSelect={(product) => {
        setSelectedProduct(product);
        setModalVisible(true);
      }}
    />
  );

  const ProductModal = () => {
    if (!selectedProduct) return null;

    const [quantity, setQuantity] = useState(1);
    const [showQuantityControls, setShowQuantityControls] = useState(false);

    const maxReorderLimit = 1000;
    const currentStock = selectedProduct.stock ?? 0;

    const increment = () => {
      if (quantity < maxReorderLimit) setQuantity(quantity + 1);
    };

    const decrement = () => {
      if (quantity > 1) setQuantity(quantity - 1);
      else {
        setShowQuantityControls(false);
        setQuantity(1);
      }
    };

    const getStockColor = (stock) => {
      if (stock === 0) return '#FF5722';
      if (stock > 0 && stock < 5) return '#FF9800';
      return '#4CAF50';
    };

    const confirmAddToCart = () => {
      addToCart({ product_id: selectedProduct.product_id, quantity });
      Alert.alert('Added to Cart', `${selectedProduct.name} (x${quantity})`);
      setQuantity(1);
      setShowQuantityControls(false);
      closeModal();
    };

    return (
      <Modal animationType="slide" transparent visible={modalVisible} onRequestClose={closeModal} presentationStyle="overFullScreen" statusBarTranslucent>
        <PanGestureHandler onGestureEvent={gestureHandler}>
          <Animated.View style={animatedStyle}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              <View style={styles.modalImageSection}>
                <Image source={{ uri: selectedProduct.image }} style={styles.modalProductImage} />
              </View>

              <View style={styles.modalInfoSection}>
                <Text style={styles.modalProductName}>{selectedProduct.name}</Text>
                <Text style={styles.lastPurchasedText}>Last Purchased: {selectedProduct.lastPurchaseDate || 'N/A'}</Text>

                <View style={styles.modalQuantityRow}>
                  <Text style={[styles.modalQuantityText, { color: getStockColor(currentStock) }]}>{currentStock} Left</Text>

                  {showQuantityControls ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <TouchableOpacity onPress={decrement} style={styles.qtyButton}>
                        <Text style={styles.qtyButtonText}>-</Text>
                      </TouchableOpacity>

                      <Text style={[styles.quantityNumber, { marginHorizontal: 12 }]}>{quantity}</Text>

                      <TouchableOpacity onPress={increment} style={styles.qtyButton}>
                        <Text style={styles.qtyButtonText}>+</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={[styles.addButton, { marginLeft: 16, paddingHorizontal: 20 }]} onPress={confirmAddToCart}>
                        <Text style={styles.addButtonText}>ADD</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity style={styles.modalAddButton} onPress={() => setShowQuantityControls(true)}>
                      <Text style={styles.modalAddButtonText}>ADD</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.specificationsHeader}>
                  <MaterialIcons name="inventory" size={20} color="#666" style={{ marginRight: 8 }} />
                  <Text style={styles.specificationsTitle}>Product Specifications</Text>
                </View>
                <View style={styles.separatorLine} />
                <View style={styles.specRow}>
                  <Text style={styles.specLabel}>Pack Size:</Text>
                  <Text style={styles.specValue}>{selectedProduct.packSize || 'N/A'}</Text>
                </View>
                <View style={styles.specRow}>
                  <Text style={styles.specLabel}>Brand:</Text>
                  <Text style={styles.specValue}>{selectedProduct.brand || 'N/A'}</Text>
                </View>
                <View style={styles.specRow}>
                  <Text style={styles.specLabel}>SKU:</Text>
                  <Text style={styles.specValue}>{selectedProduct.sku || 'N/A'}</Text>
                </View>
                <View style={styles.specRow}>
                  <Text style={styles.specLabel}>Last Updated:</Text>
                  <Text style={styles.specValue}>{selectedProduct.updated || 'N/A'}</Text>
                </View>
              </View>
            </View>
          </Animated.View>
        </PanGestureHandler>
      </Modal>
    );
  };

  const OptionsMenu = () => (
    <Modal transparent visible={optionsVisible} animationType="fade" onRequestClose={() => setOptionsVisible(false)}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPressOut={() => setOptionsVisible(false)}>
        <View style={styles.optionsMenu}>
          <TouchableOpacity
            style={styles.optionItem}
            onPress={() => {
              setOptionsVisible(false);
              navigation.navigate('OrderScreen');
            }}
          >
            <Ionicons name="receipt-outline" size={20} color="#333" style={styles.optionIcon} />
            <Text style={styles.optionText}>Orders</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionItem}
            onPress={() => {
              setOptionsVisible(false);
              navigation.navigate('ProfileScreen');
            }}
          >
            <Ionicons name="person-circle-outline" size={20} color="#333" style={styles.optionIcon} />
            <Text style={styles.optionText}>Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.optionItem, { borderBottomWidth: 0 }]}
            onPress={async () => {
              setOptionsVisible(false);
              try {
                await AsyncStorage.clear();
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Login' }],
                });
              } catch (e) {
                console.error('Logout failed:', e);
                Alert.alert('Error', 'Failed to logout. Please try again.');
              }
            }}
          >
            <Ionicons name="log-out-outline" size={20} color="red" style={styles.optionIcon} />
            <Text style={[styles.optionText, { color: 'red' }]}>Logout</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flex: 1 }} pointerEvents={modalVisible ? 'none' : 'auto'}>
        <LinearGradient colors={['#ada0a0ff', '#0c0c0cff']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.gradientBackground}>
          {loading ? (
            <ActivityIndicator size="large" color="#007bff" style={{ marginTop: 100 }} />
          ) : (
            <>
              <View style={[styles.headerRow, { marginTop: headerMarginTop }]}>
                <View style={styles.searchContainer}>
                  <Ionicons name="search" size={20} color="#888" style={{ marginRight: 8 }} />
                  <TextInput
                    placeholder="Search products..."
                    value={search}
                    onChangeText={setSearch}
                    style={styles.searchInput}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="search"
                  />
                </View>

                <TouchableOpacity style={styles.circularIcon} onPress={() => navigation.navigate('WishList')}>
                  <Ionicons name="heart-outline" size={22} color="#e11d48" />
                  {wishlistItems?.length > 0 && (
                    <View style={styles.wishlistBadge}>
                      <Text style={styles.wishlistBadgeText}>{wishlistItems.length}</Text>
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity style={styles.circularIcon} onPress={() => setOptionsVisible(true)}>
                  <Ionicons name="ellipsis-horizontal" size={22} color="#444" />
                </TouchableOpacity>
              </View>

              <FlatList
                data={filteredData}
                numColumns={2}
                keyExtractor={(item) => item.product_id?.toString() || Math.random().toString()}
                columnWrapperStyle={styles.columnWrapper}
                renderItem={renderCard}
                contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 45 }]}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 30 }}>No items found.</Text>}
              />
            </>
          )}
        </LinearGradient>
      </View>

      <ProductModal />
      <OptionsMenu />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  gradientBackground: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: { flex: 1, fontSize: 15, color: '#333' },
  circularIcon: {
    marginLeft: 12,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  wishlistBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#e11d48',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: '#fff',
  },
  wishlistBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  columnWrapper: { justifyContent: 'space-between' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    margin: 6,
    marginBottom: 16,
    width: cardWidth,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 4,
    alignItems: 'center',
  },
  cardWishlistIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 6,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 3,
  },
  productImageContainer: {
    alignItems: 'center',
    marginBottom: 12,
    width: 90,
    height: 120,
  },
  productImage: { width: 90, height: 120, resizeMode: 'contain' },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 18,
  },
  productFooter: {
    width: '100%',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  quantityControlContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qtyButton: {
    backgroundColor: '#ddd',
    borderRadius: 12,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 6,
  },
  qtyButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  quantityNumber: {
    fontSize: 18,
    fontWeight: '700',
  },
  addButton: {
    backgroundColor: '#2196F3',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '82%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 10,
  },
  closeButton: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#f1f1f1',
  },
  modalImageSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalProductImage: {
    width: 160,
    height: 220,
    resizeMode: 'contain',
  },
  modalProductName: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
    color: '#111',
  },
  lastPurchasedText: {
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalQuantityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalQuantityText: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalAddButton: {
    backgroundColor: '#2196F3',
    borderRadius: 25,
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  modalAddButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  specificationsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  specificationsTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#222',
  },
  separatorLine: {
    height: 1,
    backgroundColor: '#eee',
    marginBottom: 16,
    marginTop: 4,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  specLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
  },
  specValue: {
    fontSize: 14,
    color: '#222',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  optionsMenu: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 6,
    marginTop: 60,
    marginRight: 14,
    width: 170,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 6,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f1f1',
  },
  optionIcon: { marginRight: 12 },
  optionText: { fontSize: 15, color: '#333', fontWeight: '500' },
});
