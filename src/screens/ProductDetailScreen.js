import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { useCart } from '../context/CartContext';

export default function ProductDetailScreen({ route }) {
  const { product } = route.params;
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);

  const screenWidth = Dimensions.get('window').width;
  const price = product.selling_price ?? 0;

  const handleAddToCart = async () => {
    try {
      await addToCart({
        product_id: product.id,
        quantity: quantity,
      });
      Alert.alert('Success', `${product.product_name} added to cart`);
    } catch (error) {
      Alert.alert('Error', 'Failed to add item to cart');
      console.error('Add to cart error:', error);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f1f5f9' }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <ScrollView contentContainerStyle={[styles.container, { flexGrow: 1 }]}>
          <Image
            source={{
              uri: product.primary_image_url || 'https://via.placeholder.com/150',
            }}
            style={[styles.image, { width: screenWidth - 32 }]}
          />

          <Text style={styles.name}>{product.product_name}</Text>
          <Text style={styles.brand}>{product.brand_name || 'Brand Info Unavailable'}</Text>

          <View style={styles.section}>
            <Text style={styles.label}>Product Details</Text>
            <Text style={styles.detail}>Price: ₹{price}</Text>
            <Text style={styles.detail}>SKU: {product.sku || 'N/A'}</Text>
            <Text style={styles.detail}>Type: {product.product_type || 'N/A'}</Text>
            <Text style={styles.detail}>UOM: {product.uom || 'N/A'}</Text>
            <Text style={styles.detail}>Pack Size: {product.pack_size || 'N/A'}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Shipping & Returns</Text>
            <Text style={styles.detail}>Shippable: Yes</Text>
            <Text style={styles.detail}>Returnable: Yes</Text>
            <Text style={styles.detail}>Return Period: 15 days</Text>
          </View>

          <View style={styles.priceSection}>
            <Text style={styles.price}>₹{price}</Text>

            <View style={styles.quantityControl}>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Text style={styles.qtyBtnText}>-</Text>
              </TouchableOpacity>

              <TextInput
                style={styles.qtyInput}
                keyboardType="numeric"
                value={quantity.toString()}
                onChangeText={(text) => {
                  const num = parseInt(text);
                  if (!isNaN(num) && num >= 1) {
                    setQuantity(num);
                  } else if (text === '') {
                    setQuantity('');
                  }
                }}
                onBlur={() => {
                  if (quantity === '' || isNaN(quantity)) {
                    setQuantity(1);
                  }
                }}
              />

              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => setQuantity(quantity + 1)}
              >
                <Text style={styles.qtyBtnText}>+</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.qtyNote}>Min: 1 | Max: ∞</Text>
          </View>

          <TouchableOpacity style={styles.cartButton} onPress={handleAddToCart}>
            <Text style={styles.cartButtonText}>Add to Cart</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f1f5f9',
  },
  image: {
    height: 250,
    resizeMode: 'contain',
    marginBottom: 20,
    alignSelf: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  brand: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 16,
  },
  section: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#0f172a',
  },
  detail: {
    fontSize: 14,
    color: '#334155',
    marginBottom: 4,
  },
  priceSection: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  price: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#007bff',
    marginBottom: 10,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  qtyBtn: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  qtyBtnText: {
    fontSize: 18,
    color: '#1e40af',
  },
  qtyInput: {
    width: 50,
    height: 36,
    borderColor: '#cbd5e1',
    borderWidth: 1,
    borderRadius: 4,
    textAlign: 'center',
    fontSize: 16,
    marginHorizontal: 8,
    color: '#0f172a',
    paddingVertical: 4,
    paddingHorizontal: 6,
    backgroundColor: '#fff',
  },
  qtyNote: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  cartButton: {
    backgroundColor: '#007bff',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  cartButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
