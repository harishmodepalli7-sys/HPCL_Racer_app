import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { apiClient } from '../services/apiClient';

export default function OrderListScreen() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const fetchOrders = async () => {
    try {
      const response = await apiClient.post(
        'https://demo.racer.algofusiontech.com/api/orders/fetch_all_orders',
        {
          fields: [
            'order_number',
            'customer_id',
            'station_name',
            'customer_number',
            'contact_no',
            'created_at',
            'order_status',
            'updated_at',
            'sales_area',
            'region',
            'distributor',
            'state',
            'city',
            'primary_image_url',
          ],
        }
      );

      if (response.data?.status) {
        setOrders(response.data.data);
      }
    } catch (error) {
      console.error('Order fetch error:', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchOrders();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return '#f39c12'; // Orange
      case 'confirmed':
        return '#007bff'; // Blue
      case 'partial_confirmed':
        return '#6c5ce7'; // Purple
      case 'dispatched':
      case 'partial_dispatched':
        return '#00b894'; // Teal
      case 'delivered':
        return '#2ecc71'; // Green
      case 'partial_delivered':
        return '#27ae60'; // Dark Green
      default:
        return '#95a5a6'; // Grey
    }
  };

  const formatStatus = (status) => {
    return status?.replace(/_/g, ' ') ?? 'Pending';
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📦 Order List</Text>

      <FlatList
        data={orders}
        keyExtractor={(item, index) => item.order_number + index}
        contentContainerStyle={{ paddingBottom: insets.bottom + 0 }}
        ListEmptyComponent={<Text style={styles.empty}>No orders found.</Text>}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('OrderDetails', { order: item })
            }>
            <View style={styles.card}>
              <View style={styles.itemRow}>
                <Image
                  source={{
                    uri:
                      item.primary_image_url ||
                      'https://via.placeholder.com/60x60.png?text=Image',
                  }}
                  style={styles.image}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>#{item.order_number}</Text>
                  <Text style={styles.smallText}>Customer ID: {item.customer_id}</Text>
                  <Text style={styles.smallText}>Station: {item.station_name || 'N/A'}</Text>
                  <Text style={styles.smallText}>Distributor: {item.distributor}</Text>
                  <Text style={styles.smallText}>Region: {item.region}</Text>

                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(item.order_status) },
                    ]}
                  >
                    <Text style={styles.statusText}>
                      {formatStatus(item.order_status)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f4f9ff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#2b5d9d',
  },
  empty: {
    textAlign: 'center',
    fontStyle: 'italic',
    color: '#777',
    marginTop: 40,
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 10,
    marginBottom: 14,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 6,
    backgroundColor: '#eee',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  smallText: {
    fontSize: 13,
    color: '#555',
    marginTop: 2,
  },
  statusBadge: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
});
