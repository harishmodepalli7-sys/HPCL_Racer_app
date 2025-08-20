// OrderDetailsScreen.js

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Image,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import axios from 'axios';
import Modal from 'react-native-modal';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../services/apiClient';

export default function OrderDetailsScreen({ route }) {
  const { order } = route.params;
  const [orderDetailsList, setOrderDetailsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    fetchOrderDetails();
  }, []);

  const fetchOrderDetails = async () => {
    setLoading(true);
    try {
      const response = await apiClient.post(
        'https://demo.racer.algofusiontech.com/api/orders/get_order_detail',
        {
          order_number: order.order_number,
          fields: [
            'order_id',
            'order_status',
            'order_number',
            'ordered_quantity',
            'received_quantity',
            'cancelled_quantity',
            'customer_id',
            'customer_number',
            'product_name',
            'brand_name',
            'sku',
            'uom',
            'product_type',
            'pack_size',
            'unit_per_case',
            'created_at',
            'updated_at',
            'address',
            'zone',
            'region',
            'sales_area',
            'city',
            'state',
            'contact_no',
            'email',
            'service_available',
            'primary_image_url',
          ],
        }
      );
      if (response.data?.status && Array.isArray(response.data.data)) {
        setOrderDetailsList(response.data.data);
      }
    } catch (error) {
      console.error('Order details error:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (item) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  const closeModal = () => {
    setSelectedItem(null);
    setModalVisible(false);
  };

  const getIconForStage = (stage) => {
    switch (stage) {
      case 'pending':
        return 'time-outline';
      case 'confirmed':
        return 'checkmark-done-outline';
      case 'dispatched':
        return 'car-outline';
      case 'delivered':
        return 'home-outline';
      case 'cancelled':
        return 'close-circle-outline';
      default:
        return 'help-circle-outline';
    }
  };

  const renderVerticalTimeline = (status) => {
    const lowerStatus = status.toLowerCase();
    const isCancelled = lowerStatus === 'cancelled';

    const stages = [
      { stage: 'pending', label: 'Order Placed', desc: 'Confirmed by System' },
      {
        stage: 'confirmed',
        label: 'Order Confirmed',
        desc: 'Order acknowledged',
      },
      {
        stage: 'dispatched',
        label: 'Order Dispatched',
        desc: 'Shipped to address',
      },
      {
        stage: isCancelled ? 'cancelled' : 'delivered',
        label: isCancelled ? 'Order Cancelled' : 'Order Delivered',
        desc: isCancelled ? 'Order was cancelled' : 'Delivered successfully',
      },
    ];

    const currentIndex = stages.findIndex((s) => s.stage === lowerStatus);

    return (
      <View style={styles.verticalTimeline}>
        {stages.map((step, index) => {
          const isActive = index <= currentIndex;
          const color = isActive
            ? step.stage === 'cancelled'
              ? '#ef4444'
              : '#22c55e'
            : '#ccc';

          return (
            <Animated.View
              key={step.stage}
              entering={FadeInDown.duration(500 + index * 150)}
              style={styles.verticalStep}>
              <View style={styles.dotWithLine}>
                <View style={[styles.verticalDot, { backgroundColor: color }]}>
                  <Ionicons
                    name={getIconForStage(step.stage)}
                    size={14}
                    color="#fff"
                  />
                </View>
                {index !== stages.length - 1 && (
                  <View
                    style={[styles.verticalLine, { backgroundColor: color }]}
                  />
                )}
              </View>
              <View style={styles.verticalContent}>
                <Text style={[styles.verticalLabel, { color }]}>
                  {step.label}
                </Text>
                {isActive && (
                  <>
                    <Text style={styles.verticalTime}>26 Jun, 7:09 AM</Text>
                    <Text style={styles.verticalDesc}>{step.desc}</Text>
                  </>
                )}
              </View>
            </Animated.View>
          );
        })}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}>
      <Text style={styles.pageTitle}>Order #{order.order_number}</Text>

      {orderDetailsList.map((item) => {
        const statusColor =
          item.order_status.toLowerCase() === 'delivered'
            ? '#22c55e'
            : item.order_status.toLowerCase() === 'cancelled'
            ? '#ef4444'
            : item.order_status.toLowerCase() === 'pending'
            ? '#f59e0b'
            : '#3b82f6';

        return (
          <TouchableOpacity key={item.order_id} onPress={() => openModal(item)}>
            <View style={styles.card}>
              <View style={styles.row}>
                <View style={styles.leftColumn}>
                  <Text style={styles.orderNumber}>
                    Order ID: {item.order_id}
                  </Text>
                  <Text style={styles.productName}>{item.product_name}</Text>
                  <Text style={styles.label}>
                    Brand: <Text style={styles.value}>{item.brand_name}</Text>
                  </Text>
                  <Text style={styles.label}>
                    Ordered Qty:{' '}
                    <Text style={styles.value}>{item.ordered_quantity}</Text>
                  </Text>
                  <Text style={styles.label}>
                    Received Qty:{' '}
                    <Text style={styles.value}>{item.received_quantity}</Text>
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: statusColor },
                    ]}>
                    <Text style={styles.statusText}>
                      {item.order_status.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Image
                  source={{
                    uri:
                      item.primary_image_url ||
                      'https://via.placeholder.com/100',
                  }}
                  style={styles.image}
                />
              </View>
            </View>
          </TouchableOpacity>
        );
      })}

      <Modal
        isVisible={modalVisible}
        onBackdropPress={closeModal}
        onSwipeComplete={closeModal}
        swipeDirection={['down']}
        style={styles.modalWrapper}
        animationIn="slideInUp"
        animationOut="slideOutDown"
        backdropTransitionOutTiming={0}>
        <View style={[styles.modalContainer, { flex: 1 }]}>
          {selectedItem && (
            <>
              <TouchableOpacity
                style={styles.closeIconTop}
                onPress={closeModal}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>

              <View style={styles.modalGrabber} />

              <ScrollView
                showsVerticalScrollIndicator={true}
                persistentScrollbar={true}
                contentContainerStyle={{
                  paddingBottom: 100,
                  paddingTop: 10,
                  flexGrow: 1,
                }}>
                <Text style={styles.modalTitle}>Tracking Timeline</Text>
                {renderVerticalTimeline(selectedItem.order_status)}

                {/*<View style={styles.infoSection}>
                  <Text style={styles.sectionHeader}>Contact & Customer Information</Text>
                  <Text style={styles.sectionText}><Text style={styles.infoLabel}>Customer ID:</Text> {selectedItem.customer_id}</Text>
                  <Text style={styles.sectionText}><Text style={styles.infoLabel}>Brand:</Text> {selectedItem.brand_name}</Text>
                  <Text style={styles.sectionText}><Text style={styles.infoLabel}>Zone:</Text> {selectedItem.zone || 'N/A'}</Text>
                  <Text style={styles.sectionText}><Text style={styles.infoLabel}>Phone:</Text> {selectedItem.contact_no || 'N/A'}</Text>
                </View>*/}

                <View style={styles.infoSection}>
                  <Text style={styles.sectionHeader}>
                    Customer & Shipping Details
                  </Text>
                  <Text style={styles.sectionText}>
                    <Text style={styles.infoLabel}>ID:</Text>{' '}
                    {selectedItem.customer_id}
                  </Text>
                  <Text style={styles.sectionText}>
                    <Text style={styles.infoLabel}>Brand:</Text>{' '}
                    {selectedItem.brand_name}
                  </Text>
                  <Text style={styles.sectionText}>
                    <Text style={styles.infoLabel}>Zone:</Text>{' '}
                    {selectedItem.zone || 'N/A'}
                  </Text>
                  <Text style={styles.sectionText}>
                    <Text style={styles.infoLabel}>Region:</Text>{' '}
                    {selectedItem.region}
                  </Text>
                  <Text style={styles.sectionText}>
                    <Text style={styles.infoLabel}>Address:</Text>{' '}
                    {selectedItem.address}
                  </Text>
                  <Text style={styles.sectionText}>
                    <Text style={styles.infoLabel}>City:</Text>{' '}
                    {selectedItem.city}, {selectedItem.state}
                  </Text>
                  <Text style={styles.sectionText}>
                    <Text style={styles.infoLabel}>Sales Area:</Text>{' '}
                    {selectedItem.sales_area || 'N/A'}
                  </Text>
                </View>
              </ScrollView>
            </>
          )}
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#f9f9f9' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  pageTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  card: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
    elevation: 2,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  leftColumn: { flex: 1, paddingRight: 10 },
  image: { width: 100, height: 100, borderRadius: 8, resizeMode: 'contain' },
  orderNumber: { color: 'blue', paddingBottom: 15, fontSize: 15 },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#111',
  },
  label: { fontSize: 13, color: '#444', marginBottom: 4 },
  value: { fontWeight: '600', color: '#222' },
  statusBadge: {
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  statusText: { fontSize: 12, fontWeight: 'bold', color: '#fff' },

  modalWrapper: { justifyContent: 'flex-end', margin: 0 },
  modalContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    position: 'relative',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#111',
  },
  sectionHeader: {
    marginTop: 20,
    fontWeight: 'bold',
    fontSize: 16,
    color: '#007bff',
    marginBottom: 6,
  },
  sectionText: { fontSize: 14, color: '#444', marginBottom: 3 },
  infoSection: { marginTop: 10 },

  verticalTimeline: { marginTop: 10, paddingLeft: 10 },
  verticalStep: { flexDirection: 'row', marginBottom: 20 },
  dotWithLine: { alignItems: 'center', marginRight: 10 },
  verticalDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verticalLine: { width: 2, height: 30, backgroundColor: '#ccc' },
  verticalContent: { flex: 1 },
  verticalLabel: { fontSize: 14, fontWeight: '600' },
  verticalTime: { fontSize: 12, color: '#999', marginTop: 2 },
  verticalDesc: { fontSize: 12, color: '#666' },

  closeIconTop: {
    position: 'absolute',
    top: 12,
    right: 15,
    zIndex: 99,
    padding: 4,
  },
  modalGrabber: {
    width: 40,
    height: 5,
    backgroundColor: '#ccc',
    borderRadius: 5,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  infoLabel: {
    fontWeight: 'bold',
    color: '#007bff',
  },
});
