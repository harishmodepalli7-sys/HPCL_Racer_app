import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import Ionicons from 'react-native-vector-icons/Ionicons';

import LoginScreen from './src/screens/LoginScreen';
import RacerHome from './src/screens/RacerHome';
import Products from './src/screens/ProductsScreen';
import ProductDetailScreen from './src/screens/ProductDetailScreen';
import OTPScreen from './src/screens/OTPScreen';
import WishList from './src/screens/WishList';
import CartScreen from './src/screens/CartScreen'; 
import JobCardSalesScreen from './src/screens/JobCardScreen'; 
import AddToJobCard from './src/screens/AddToJobCardScreen'; 
import JobCardDetailScreen from './src/screens/JobCardDetailScreen' 
import OrderScreen from './src/screens/OrderScreen' 
import ProfileScreen from './src/screens/ProfileScreen'; 
import OrderDetails from './src/screens/OrderDetailScreen'

import { CartProvider, useCart } from './src/context/CartContext';
import { WishlistProvider } from './src/context/WishlistContext';
import { navigationRef } from './src/navigation/RootNavigation';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Custom Cart Icon with Badge Component
function CartIconWithBadge({ color, size }) {
  const { cartItems } = useCart();

  const cartCount = cartItems.length;

  return (
    <View style={{ width: size, height: size }}>
      <Ionicons name="cart-outline" size={size} color={color} />
      {cartCount > 0 && (
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>{cartCount > 99 ? '99+' : cartCount}</Text>
        </View>
      )}
    </View>
  );
}

// Bottom Tab Navigator with updated icon for Inventory and Job Card
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          if (route.name === 'RacerHome') {
            return <Ionicons name="storefront-outline" size={size} color={color} />; // Changed to shop icon
          } else if (route.name === 'Products') {
            return <Ionicons name="cube-outline" size={size} color={color} />;
          } else if (route.name === 'Cart') {
            return <CartIconWithBadge color={color} size={size} />;
          } else if (route.name === 'Job Card') {
            return <Ionicons name="document-text-outline" size={size} color={color} />; // Job Card icon
          }
          return null;
        },
      })}
    >
      <Tab.Screen
        name="RacerHome"
        component={RacerHome}
        options={{ headerShown: false, title: 'Inventory' }}
      />
      <Tab.Screen
        name="Products"
        component={Products}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{ headerShown: true }}
      />
      <Tab.Screen
        name="Job Card"
        component={JobCardSalesScreen}
        options={{ headerShown: false }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <CartProvider>
      <WishlistProvider>
        <NavigationContainer ref={navigationRef}>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen
              name="OTPScreen"
              component={OTPScreen}
              options={{ headerShown: true, title: '' }}
            />
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen
              name="ProductDetail"
              component={ProductDetailScreen}
              options={{ headerShown: true, title: 'Product Details' }}
            />
            <Stack.Screen
              name="WishList"
              component={WishList}
              options={{ headerShown: true, title: 'WishList' }}
            />  
            <Stack.Screen 
              name='AddToJobCard' 
              component={AddToJobCard} 
              options={{ headerShown: true, title: 'Create Job Card' }}
            /> 
            <Stack.Screen 
              name='JobCardDetailScreen' 
              component={JobCardDetailScreen} 
              options={{ headerShown: true, title: 'Job Card Details' }}
            />  
            <Stack.Screen 
              name='OrderScreen' 
              component={OrderScreen} 
              options={{ headerShown: true, title: 'My Orders' }}
            /> 
            <Stack.Screen 
              name='ProfileScreen' 
              component={ProfileScreen} 
              options={{ headerShown: true, title: 'My Profile' }}
            /> 
             <Stack.Screen 
              name='OrderDetails' 
              component={OrderDetails} 
              options={{ headerShown: true, title: 'Order Details' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </WishlistProvider>
    </CartProvider>
  );
}

const styles = StyleSheet.create({
  badgeContainer: {
    position: 'absolute',
    right: -6,
    top: -3,
    backgroundColor: '#e11d48',
    borderRadius: 8,
    paddingHorizontal: 5,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'white',
    zIndex: 10,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
