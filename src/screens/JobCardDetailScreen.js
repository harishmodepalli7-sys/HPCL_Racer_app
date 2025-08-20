import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Platform,
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export default function JobCardDetailScreen({ route }) {
  const { jobCard } = route.params;

  const jobFields = [
    { label: 'Engine Oil', key: 'engine_oil' },
    { label: 'Oil Filter', key: 'oil_filter' },
    { label: 'Air Filter', key: 'air_filter' },
    { label: 'Fuel Filter', key: 'fuel_filter' },
    { label: 'Coolant', key: 'coolant' },
    { label: 'Gear Oil', key: 'gear_oil' },
    { label: 'Brake Fluid', key: 'brake_fluid' },
    { label: 'Brake Cleaning', key: 'brake_cleaning' },
    { label: 'Clutch Overhauling', key: 'clutch_overhauling' },
    { label: 'Tyre Rotation', key: 'tyre_rotation' },
    { label: 'Wheel Alignment', key: 'wheel_alignment' },
    { label: 'Wheel Balancing', key: 'wheel_balancing' },
    { label: 'Washing', key: 'washing' },
  ];

  const handleShare = async () => {
    try {
      let content = `Job Card: ${jobCard.id}\nDate: ${new Date(
        jobCard.created_at
      ).toDateString()}\nCustomer: ${jobCard.customer_name}\nVehicle: ${jobCard.vehicle_number}\n\nItems:\n`;

      jobFields.forEach(({ label, key }) => {
        const items = jobCard[key];
        if (Array.isArray(items) && items.length > 0) {
          items.forEach((item) => {
            const qty = item.quantity || 0;
            const price = item.price || 0;
            const total = price * qty;
            content += `${label} (${item.sku}): ${qty} x ₹${price} = ₹${total.toFixed(
              2
            )}\n`;
          });
        }
      });

      const fileName = `JobCard_${jobCard.id}.txt`;
      const fileUri = FileSystem.documentDirectory + fileName;
      await FileSystem.writeAsStringAsync(fileUri, content);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert('Sharing not supported');
      }
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('Error', 'Failed to share job card.');
    }
  };

  let serial = 1;
  let totalAmount = 0;

  const renderJobItems = () => {
    return jobFields.flatMap(({ label, key }) => {
      const items = jobCard[key];
      if (Array.isArray(items) && items.length > 0) {
        return items.map((item, index) => {
          const qty = parseFloat(item.quantity || 0);
          const price = parseFloat(item.price || 0);
          const total = qty * price;
          totalAmount += total;

          return (
            <View key={`${key}-${index}`} style={styles.tableRow}>
              <Text style={styles.tableCol1}>{serial++}</Text>
              <Text style={styles.tableCol2}>{label}</Text>
              <Text style={styles.tableCol}>{qty}</Text>
              <Text style={styles.tableCol}>{price.toFixed(2)}</Text>
              <Text style={styles.tableCol}>{total.toFixed(2)}</Text>
            </View>
          );
        });
      }
      return [];
    });
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 70 }}>
        

        <View style={styles.sectionBox}>
          <Text style={styles.sectionHeader}>Customer Details</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Name:</Text>
            <Text style={styles.value}>{jobCard.customer_name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Contact:</Text>
            <Text style={styles.value}>{jobCard.contact_no}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Date:</Text>
            <Text style={styles.value}>
              {new Date(jobCard.created_at).toDateString()}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Vehicle No:</Text>
            <Text style={styles.value}>{jobCard.vehicle_number}</Text>
          </View>
        </View>

        <View style={styles.sectionBox}>
          <Text style={styles.sectionHeader}>Job Details</Text>
          <View style={styles.tableHeader}>
            <Text style={styles.tableCol1}>S.No</Text>
            <Text style={styles.tableCol2}>Description</Text>
            <Text style={styles.tableCol}>Qty</Text>
            <Text style={styles.tableCol}>Rate</Text>
            <Text style={styles.tableCol}>Amount</Text>
          </View>
          {renderJobItems()}
        </View>

        <View style={styles.totalBox}>
          <Text style={styles.totalLabel}>Grand Total (Rs.):</Text>
          <Text style={styles.totalValue}>₹{totalAmount.toFixed(2)}</Text>
        </View>
      </ScrollView>

      <View style={styles.bottomButtons}>
        <TouchableOpacity style={styles.footerButton} onPress={handleShare}>
          <Text style={styles.footerButtonText}>📤 Share</Text>
        </TouchableOpacity>
        
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f8fafc' },
  heading: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, color: '#1e293b' },
  sectionBox: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    elevation: 2,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#334155',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: { fontSize: 14, color: '#64748b' },
  value: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingBottom: 6,
    borderColor: '#cbd5e1',
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderColor: '#e2e8f0',
  },
  tableCol1: { width: '10%', fontSize: 13, color: '#1e293b' },
  tableCol2: { width: '40%', fontSize: 13, color: '#1e293b' },
  tableCol: { width: '16%', fontSize: 13, textAlign: 'right', color: '#1e293b' },
  totalBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingHorizontal: 12,
  },
  totalLabel: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  totalValue: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  bottomButtons: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderColor: '#e2e8f0',
    paddingBottom: Platform.OS === 'ios' ? 30 : 72,
  },
  footerButton: {
    backgroundColor: '#0f172a',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8, 
  
  },
  footerButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
