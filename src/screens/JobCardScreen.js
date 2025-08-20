import React, { useEffect, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Text,
  TextInput,
  Alert,
  View,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { apiClient } from '../services/apiClient';

export default function JobCardSalesScreen() {
  const [jobCards, setJobCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const isFocused = useIsFocused();
  const navigation = useNavigation();

  useEffect(() => {
    if (isFocused) {
      const fetchAndCheckSuccess = async () => {
        const currentRoute = navigation.getState().routes.find(
          (r) => r.name === 'JobCardSales'
        );
        const success = currentRoute?.params?.success;

        await fetchJobCards();

        if (success) {
          Alert.alert('Success', 'Job Card added successfully!');
          navigation.setParams({ success: false });
        }
      };

      fetchAndCheckSuccess();
    }
  }, [isFocused]);

  const fetchJobCards = async () => {
    setLoading(true);
    try {
      const response = await apiClient.post('api/jobcard/fetch_sale', { fields: [] });
      if (response.data?.status) {
        setJobCards(response.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching job cards:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCards = jobCards.filter(
    (item) =>
      item.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.vehicle_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.contact_no?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Job Card / Sales Management</Text>
        <Text style={styles.subHeader}>Manage and track your sales and job cards.</Text>
      </View>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('AddToJobCard')}
        accessibilityLabel="Add job card"
      >
        <Text style={styles.addButtonText}>+ Add Job Card</Text>
      </TouchableOpacity>

      <TextInput
        placeholder="Search by Customer Name, Vehicle No., or Contact..."
        style={styles.searchInput}
        value={searchQuery}
        onChangeText={setSearchQuery}
        returnKeyType="search"
      />

      {loading ? (
        <ActivityIndicator size="large" color="#007bff" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={filteredCards}
          keyExtractor={(item) => item.id.toString()}
          keyboardShouldPersistTaps="handled"
          contentInsetAdjustmentBehavior="never"
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: 0,
          }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.label}>Customer: {item.customer_name ?? ''}</Text>
              <Text style={styles.label}>Vehicle No: {item.vehicle_number ?? ''}</Text>
              <Text style={styles.label}>Created: {formatDate(item.created_at ?? '')}</Text>
              <Text style={styles.label}>Distributor: {item.distributor ?? 'N/A'}</Text>
              <Text style={styles.price}>₹{(item.grand_total ?? 0).toFixed(2)}</Text>
              <TouchableOpacity
                style={styles.viewButton}
                onPress={() => navigation.navigate('JobCardDetailScreen', { jobCard: item })}
              >
                <Text style={styles.viewButtonText}>View</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
  },
  headerContainer: {
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    paddingBottom: 2,
  },
  subHeader: {
    fontSize: 14,
    color: '#555',
  },
  addButton: {
    backgroundColor: '#007bff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginLeft: 'auto',
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  searchInput: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 10,
    fontSize: 16,
  },
  card: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 2 },
  },
  label: {
    fontSize: 14,
    marginBottom: 2,
    color: '#222',
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
    color: '#000',
  },
  viewButton: {
    backgroundColor: '#007bff',
    padding: 8,
    borderRadius: 6,
    marginTop: 10,
    alignItems: 'center',
  },
  viewButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
