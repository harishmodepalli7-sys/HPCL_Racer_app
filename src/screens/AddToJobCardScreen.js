// screens/CreateJobCardScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Modal,
  Image,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import { useNavigation } from '@react-navigation/native';
import { apiClient } from '../services/apiClient';

export default function CreateJobCardScreen() { 
  const [jobCardNo, setJobCardNo] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerContact, setCustomerContact] = useState('');
  const [vehicleDetails, setVehicleDetails] = useState({
    type: '',
    regNo: '',      // Vehicle Registration Number (mapped to vehicle_number)
    make: '',
    model: '',
  });

  const [inventory, setInventory] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [search, setSearch] = useState('');
  const [customerId, setCustomerId] = useState(''); 

  const navigation = useNavigation();

  // Predefined job tasks initially empty product selections
  const [jobList, setJobList] = useState(
    [
      'Engine Oil',
      'Oil Filter',
      'Air Filter',
      'Fuel Filter',
      'Coolant',
      'Gear Oil',
      'Brake Fluid',
      'Brake Cleaning',
      'Clutch Overhauling',
      'Tyre Rotation',
      'Wheel Alignment',
      'Wheel Balancing',
      'Washing',
    ].map((desc, i) => ({
      id: (i + 1).toString(),
      description: desc,
      product: null,
      product_id: '',
      packSize: '',
      qty: 0,
      rate: 0,
      image: '',
    }))
  );

  // Load customer_id on mount
  useEffect(() => {
    const loadCustomerId = async () => {
      try {
        const id = await AsyncStorage.getItem('customer_id');
        setCustomerId(id || '');
      } catch (e) {
        console.error('Failed to load customer_id', e);
      }
    };
    loadCustomerId();
  }, []);

  // Fetch inventory when customerId available
  useEffect(() => {
    if (customerId) fetchInventory();
  }, [customerId]);

  // Fetch inventory from API
  const fetchInventory = async () => {
    try {
      const res = await apiClient.post(
        '/api/inventory/fetch_inventory',
        { customer_id: customerId }
      );
      if (res.data.status) setInventory(res.data.data);
      else Alert.alert('Error', res.data.message || 'Failed to fetch inventory');
    } catch (e) {
      Alert.alert('Error', 'Failed to fetch inventory.');
      console.error(e);
    }
  };

  // Open product selection modal for job item at index
  const openModal = (idx) => {
    setSelectedIndex(idx);
    setSearch('');
    setModalVisible(true);
  };

  // Select product from modal and update job item
  const selectProduct = (prod) => {
    const updated = [...jobList];
    updated[selectedIndex] = {
      ...updated[selectedIndex],
      product: prod.product_name,
      product_id: prod.product_id,
      packSize: prod.pack_size?.toString() || '',
      qty: 1,
      rate: prod.selling_price || 0,
      image: prod.primary_image_url || '',
    };
    setJobList(updated);
    setModalVisible(false);
  };

  // Cancel selected product for job item
  const cancelProduct = (idx) => {
    const updated = [...jobList];
    updated[idx] = {
      ...updated[idx],
      product: null,
      product_id: '',
      packSize: '',
      qty: 0,
      rate: 0,
      image: '',
    };
    setJobList(updated);
  };

  // Update qty or rate in job item
  const updateValue = (idx, field, val) => {
    const updated = [...jobList];
    if (field === 'qty') updated[idx][field] = parseInt(val, 10) || 0;
    else if (field === 'rate') updated[idx][field] = parseFloat(val) || 0;
    setJobList(updated);
  };

  // Calculate grand total
  const grandTotal = jobList.reduce((sum, j) => sum + j.qty * j.rate, 0);

  // Filter inventory for 'lubes' and matching search
  const filtered = inventory
    .filter((i) => i.product_type === 'lubes')
    .filter((i) => i.product_name?.toLowerCase().includes(search.toLowerCase()));

  // Build API payload with correct vehicle_number mapping
  const buildPayload = () => {
    const payload = {
      job_detail: {
        customer_name: customerName.trim(),
        address: customerAddress.trim(),
        contact_no: customerContact.trim(),
        vehicle_type: vehicleDetails.type.trim(),
        vehicle_number: vehicleDetails.regNo.trim(),  // <-- Correct field mapping
        vehicle_make: vehicleDetails.make.trim(),
        vehicle_model: vehicleDetails.model.trim(),
      },
    };

    jobList.forEach((job) => {
      if (!job.product_id) return;
      const key = job.description.toLowerCase().replace(/\s+/g, '_');
      payload.job_detail[key] = [
        { product_id: job.product_id, quantity: job.qty.toString() },
      ];
    });

    return payload;
  };

  // Save job card API call
  const handleSave = async () => {
    try {
      const res = await apiClient.post(
        '/api/jobcard/save_job_card',
        buildPayload()
      );
      if (res.data.status) {
        Alert.alert('Success', 'Job Card saved ✔️');
        navigation.navigate('OrderHistory')
      } else {
        Alert.alert('Error', res.data.message || 'Failed to save job card');
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to save job card. Please try again.');
    }
  };

  // Print job card HTML
  const handlePrint = async () => {
    const html = `
      <html>
      <body>
        <h1>Job Card</h1>
        <p>Job Card No: ${jobCardNo || '-'}</p>
        <p>Date: ${date.toLocaleDateString()}</p>
        <p>Customer: ${customerName || '-'}, ${customerContact || '-'}</p>
        <p>Vehicle: ${vehicleDetails.make || '-'} ${vehicleDetails.model || '-'} (${vehicleDetails.regNo || '-'})</p>
        <hr />
        <ul>
          ${jobList
            .filter((j) => j.product)
            .map(
              (j) =>
                `<li>${j.description}: ${j.product} x ${j.qty} @ ₹${j.rate.toFixed(2)} = ₹${(j.qty * j.rate).toFixed(2)}</li>`
            )
            .join('')}
        </ul>
        <h3>Total: ₹${grandTotal.toFixed(2)}</h3>
      </body>
      </html>
    `;
    try {
      await Print.printAsync({ html });
    } catch (e) {
      Alert.alert('Print Error', 'Failed to print the job card.');
      console.error(e);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      {/* <Text style={styles.title}>Create Job Card</Text> */}

      <TextInput
        placeholder="Job Card No."
        style={styles.input}
        value={jobCardNo}
        onChangeText={setJobCardNo}
      />

      <View style={styles.dateRow}>
        <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateIcon}>
          <Ionicons name="calendar-outline" size={24} color="#1e3a8a" />
        </TouchableOpacity>
        <Text style={styles.dateText}>Date: {date.toLocaleDateString()}</Text>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) setDate(selectedDate);
          }}
        />
      )}

      <Text style={styles.subTitle}>CUSTOMER</Text>
      <TextInput
        placeholder="Name"
        style={styles.input}
        value={customerName}
        onChangeText={setCustomerName}
      />
      <TextInput
        placeholder="Address"
        style={styles.input}
        value={customerAddress}
        onChangeText={setCustomerAddress}
      />
      <TextInput
        placeholder="Contact"
        style={styles.input}
        value={customerContact}
        onChangeText={setCustomerContact}
        keyboardType="phone-pad"
      />

      <Text style={styles.subTitle}>VEHICLE</Text>
      <TextInput
        placeholder="Type"
        style={styles.input}
        value={vehicleDetails.type}
        onChangeText={(t) => setVehicleDetails({ ...vehicleDetails, type: t })}
      />
      <TextInput
        placeholder="Reg No"
        style={styles.input}
        value={vehicleDetails.regNo}
        onChangeText={(t) => setVehicleDetails({ ...vehicleDetails, regNo: t })}
        autoCapitalize="characters"
      />
      <TextInput
        placeholder="Make"
        style={styles.input}
        value={vehicleDetails.make}
        onChangeText={(t) => setVehicleDetails({ ...vehicleDetails, make: t })}
      />
      <TextInput
        placeholder="Model"
        style={styles.input}
        value={vehicleDetails.model}
        onChangeText={(t) => setVehicleDetails({ ...vehicleDetails, model: t })}
      />

      <Text style={styles.subTitle}>WORK CARRIED OUT</Text>
      {jobList.map((item, idx) => (
        <View key={item.id} style={styles.cardItem}>
          <Text style={styles.cardTitle}>{item.description}</Text>
          <TouchableOpacity onPress={() => openModal(idx)} style={styles.cardButton}>
            <Text style={styles.cardButtonText}>{item.product || 'Select Product'}</Text>
          </TouchableOpacity>
          <Text>Pack Size: {item.packSize || '-'}</Text>
          <TextInput
            style={styles.cardInput}
            keyboardType="numeric"
            value={item.qty?.toString() || '0'}
            onChangeText={(t) => updateValue(idx, 'qty', t)}
            editable={!!item.product}
            placeholder="Qty"
          />
          <Text>Rate: ₹{item.rate ? item.rate.toFixed(2) : '-'}</Text>
          <Text>Amount: ₹{item.product ? (item.qty * item.rate).toFixed(2) : '-'}</Text>
          {item.product && (
            <TouchableOpacity onPress={() => cancelProduct(idx)} style={styles.cardRemove}>
              <Text style={{ color: 'red' }}>Remove</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}

      <Text style={styles.totalText}>Grand Total: ₹{grandTotal.toFixed(2)}</Text>

      <TextInput placeholder="Service Advisor Name" style={styles.input} />

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.printButton} onPress={handlePrint}>
          <Text style={styles.printButtonText}>Print</Text>
        </TouchableOpacity>
      </View>

      {/* Product Selection Modal */}
      <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modal}>
          <TextInput
            placeholder="Search product..."
            style={styles.search}
            value={search}
            onChangeText={setSearch}
            autoFocus
          />
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.product_id}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.prodCard} onPress={() => selectProduct(item)}>
                {item.primary_image_url ? (
                  <Image source={{ uri: item.primary_image_url }} style={styles.prodImage} />
                ) : (
                  <View style={styles.prodImagePlaceholder}>
                    <Text>No Image</Text>
                  </View>
                )}
                <View style={styles.prodDetails}>
                  <Text style={styles.prodName}>{item.product_name}</Text>
                  <Text>Pack: {item.pack_size || '-'}</Text>
                  <Text>₹{item.selling_price != null ? item.selling_price.toFixed(2) : '-'}</Text>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20 }}>No products found.</Text>}
            keyboardShouldPersistTaps="handled"
          />
          <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
            <Text style={styles.close}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f8fafc' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 12, color: '#1e293b' },
  subTitle: { fontSize: 16, fontWeight: '600', marginTop: 16, marginBottom: 6, color: '#475569' },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
    fontSize: 16,
    color: '#1e293b',
  },
  cardItem: {
    marginBottom: 12,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 6, color: '#1e293b' },
  cardButton: {
    backgroundColor: '#eef2ff',
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  cardButtonText: { color: '#1e3a8a', fontSize: 15 },
  cardInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    borderRadius: 6,
    marginBottom: 6,
    fontSize: 16,
    color: '#1e293b',
  },
  cardRemove: { marginTop: 8 },
  totalText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'right',
    marginVertical: 12,
    color: '#1e40af',
  },
  dateRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  dateIcon: { marginRight: 8 },
  dateText: { fontSize: 14, color: '#1e3a8a', fontWeight: '600' },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
    marginBottom: 70,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#1e3a8a',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  printButton: {
    flex: 1,
    backgroundColor: '#059669',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  printButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  modal: { flex: 1, padding: 16, backgroundColor: '#fff' },
  search: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 8,
    borderRadius: 4,
    marginBottom: 12,
    fontSize: 16,
  },
  closeButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  close: { color: 'blue', textAlign: 'center', fontSize: 16 },
  prodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#f9fafb',
  },
  prodImage: {
    width: 60,
    height: 60,
    borderRadius: 6,
    marginRight: 12,
    resizeMode: 'contain',
    backgroundColor: '#fff',
  },
  prodImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 6,
    marginRight: 12,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  prodDetails: { flex: 1 },
  prodName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
});
