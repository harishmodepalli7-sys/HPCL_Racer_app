import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Linking,
  Image,
  SafeAreaView,
  TextInput,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../services/apiClient';

export default function ProfileScreen() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileImage, setProfileImage] = useState(null);
  const [imageKey, setImageKey] = useState(0);
  
  // ✅ Edit mode states
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState({});

  const defaultProfileImage = 'https://tse3.mm.bing.net/th/id/OIP.7it9SGhxOSmyg3tMy2BrjQHaHa?pid=Api&P=0&h=180';

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load saved profile image
        const savedImage = await AsyncStorage.getItem('profile_image');
        
        const response = await apiClient.post('/api/users/get_profile', {});
        
        if (response.data?.status) {
          setProfile(response.data.data);
          setEditedProfile(response.data.data); // ✅ Initialize edited data
          
          const imageToUse = savedImage || response.data.data.owner_profile_image || defaultProfileImage;
          setProfileImage(imageToUse);
        } else {
          if (savedImage) {
            setProfileImage(savedImage);
          } else {
            setProfileImage(defaultProfileImage);
          }
          Alert.alert('Error', 'Failed to fetch profile data.');
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        try {
          const savedImage = await AsyncStorage.getItem('profile_image');
          setProfileImage(savedImage || defaultProfileImage);
        } catch (storageError) {
          setProfileImage(defaultProfileImage);
        }
        Alert.alert('Error', 'Network or server error.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // ✅ Save image to AsyncStorage
  const saveImageToStorage = async (imageUri) => {
    try {
      await AsyncStorage.setItem('profile_image', imageUri);
      console.log('Image saved to storage:', imageUri);
    } catch (error) {
      console.error('Error saving image:', error);
    }
  };

  // ✅ Handle field changes
  const handleFieldChange = (field, value) => {
    setEditedProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // ✅ Save profile changes
  const saveProfile = async () => {
    try {
      // Here you would normally send the updated profile to your API
      // const response = await apiClient.post('/api/users/update_profile', editedProfile);
      
      // For now, just update local state
      setProfile(editedProfile);
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile changes.');
    }
  };

  // ✅ Cancel editing
  const cancelEdit = () => {
    setEditedProfile(profile); // Reset to original data
    setIsEditing(false);
  };

  const handleImagePicker = () => {
    Alert.alert(
      'Select Profile Photo',
      'Choose an option to update your profile picture',
      [
        { text: 'Camera', onPress: openCamera },
        { text: 'Gallery', onPress: openGallery },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const openCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera permission is required to take photos');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0];
        if (selectedAsset && selectedAsset.uri) {
          setProfileImage(selectedAsset.uri);
          setImageKey(prev => prev + 1);
          await saveImageToStorage(selectedAsset.uri);
          Alert.alert('Success', 'Profile photo updated!');
        }
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to open camera');
    }
  };

  const openGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Gallery permission is required to select photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0];
        if (selectedAsset && selectedAsset.uri) {
          setProfileImage(selectedAsset.uri);
          setImageKey(prev => prev + 1);
          await saveImageToStorage(selectedAsset.uri);
          Alert.alert('Success', 'Profile photo updated!');
        }
      }
    } catch (error) {
      console.error('Gallery error:', error);
      Alert.alert('Error', 'Failed to open gallery');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={{ marginTop: 10 }}>Loading profile...</Text>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={{ fontSize: 16 }}>No profile data available.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Profile Photo Section */}
        <View style={styles.profileImageContainer}>
          <TouchableOpacity onPress={handleImagePicker} activeOpacity={0.8}>
            <Image 
              key={imageKey}
              source={{ uri: profileImage }} 
              style={styles.profileImage}
              onError={() => setProfileImage(defaultProfileImage)}
              onLoad={() => console.log('Image loaded successfully')}
            />
            <View style={styles.cameraIcon}>
              <Text style={styles.cameraText}>📷</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.tapToChangeText}>Tap to change photo</Text>
        </View>

        {/* Header Section */}
        <Text style={styles.stationName}>{profile.station_name}</Text>
        <Text style={styles.ownerName}>{profile.station_owner_name}</Text>
        <Text
          style={styles.email}
          onPress={() => Linking.openURL(`mailto:${profile.email}`)}
        >
          {profile.email}
        </Text>

        {/* ✅ Edit/Save/Cancel Buttons */}
        {!isEditing ? (
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setIsEditing(true)}
          >
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.editButtonsContainer}>
            <TouchableOpacity
              style={[styles.editButton, styles.saveButton]}
              onPress={saveProfile}
            >
              <Text style={styles.editButtonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.editButton, styles.cancelButton]}
              onPress={cancelEdit}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Basic Information */}
        <Text style={styles.sectionTitle}>Basic Information</Text>
        
        {/* First Name */}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>First Name</Text>
          {isEditing ? (
            <TextInput
              style={styles.editInput}
              value={editedProfile.station_owner_name || ''}
              onChangeText={(value) => handleFieldChange('station_owner_name', value)}
              placeholder="Enter first name"
            />
          ) : (
            <Text style={styles.infoValue}>{profile.station_owner_name || '*Not specified*'}</Text>
          )}
        </View>

        {/* Last Name - New field for editing */}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Last Name</Text>
          {isEditing ? (
            <TextInput
              style={styles.editInput}
              value={editedProfile.last_name || ''}
              onChangeText={(value) => handleFieldChange('last_name', value)}
              placeholder="Enter last name"
            />
          ) : (
            <Text style={styles.infoValue}>{profile.last_name || '*Not specified*'}</Text>
          )}
        </View>

        {/* Email */}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email</Text>
          {isEditing ? (
            <TextInput
              style={styles.editInput}
              value={editedProfile.email || ''}
              onChangeText={(value) => handleFieldChange('email', value)}
              keyboardType="email-address"
              placeholder="Enter email"
            />
          ) : (
            <Text style={styles.infoValue}>{profile.email}</Text>
          )}
        </View>

        {/* Contact Number */}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Contact Number</Text>
          {isEditing ? (
            <TextInput
              style={styles.editInput}
              value={editedProfile.contact_no || ''}
              onChangeText={(value) => handleFieldChange('contact_no', value)}
              keyboardType="phone-pad"
              placeholder="Enter contact number"
            />
          ) : (
            <Text style={styles.infoValue}>{profile.contact_no}</Text>
          )}
        </View>

        {/* Work Information */}
        <Text style={styles.sectionTitle}>Work Information</Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Employee Number</Text>
          {isEditing ? (
            <TextInput
              style={styles.editInput}
              value={editedProfile.employee_number || ''}
              onChangeText={(value) => handleFieldChange('employee_number', value)}
              placeholder="Enter employee number"
            />
          ) : (
            <Text style={styles.infoValue}>{profile.employee_number || '*Not specified*'}</Text>
          )}
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Sap Id</Text>
          {isEditing ? (
            <TextInput
              style={styles.editInput}
              value={editedProfile.sap_id || ''}
              onChangeText={(value) => handleFieldChange('sap_id', value)}
              placeholder="Enter SAP ID"
            />
          ) : (
            <Text style={styles.infoValue}>{profile.sap_id || '*Not specified*'}</Text>
          )}
        </View>

        {/* Location & Distribution - Read Only */}
        <Text style={styles.sectionTitle}>Location & Distribution</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Region</Text>
          <Text style={styles.infoValue}>{profile.region}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>State</Text>
          <Text style={styles.infoValue}>{profile.state}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Zone</Text>
          <Text style={styles.infoValue}>{profile.zone}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Sales Area</Text>
          <Text style={styles.infoValue}>{profile.sales_area}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Distributor</Text>
          <Text style={styles.infoValue}>{profile.distributor}</Text>
        </View>

        {/* Station Images */}
        <Text style={styles.sectionTitle}>Racer Station Images</Text>
        {profile.station_images && profile.station_images.length > 0 ? (
          profile.station_images.map((imgUrl, index) => (
            <Image key={index} source={{ uri: imgUrl }} style={styles.stationImage} />
          ))
        ) : (
          <Text style={styles.infoValue}>No station images available.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
    marginBottom:20,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  
  // Profile Image Styles
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#007bff',
    backgroundColor: '#f0f0f0',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#007bff',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  cameraText: {
    fontSize: 12,
    color: '#fff',
  },
  tapToChangeText: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },

  stationName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#222',
    textAlign: 'center',
  },
  ownerName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
    color: '#444',
    textAlign: 'center',
  },
  email: {
    fontSize: 16,
    color: '#007bff',
    marginBottom: 10,
    textDecorationLine: 'underline',
    textAlign: 'center',
  },

  // ✅ Button Styles
  editButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 10,
    borderRadius: 6,
    marginBottom: 20,
    width: 120,
    alignItems: 'center',
    alignSelf: 'center',
  },
  editButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  editButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 15,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButton: {
    backgroundColor: '#f44336',
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
    marginTop: 15,
    color: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#eee',
  },
  infoLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#555',
    flex: 1,
  },
  infoValue: {
    fontSize: 15,
    color: '#333',
    flex: 1,
    textAlign: 'right', 
    
  },
  
  // ✅ Edit Input Style
  editInput: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    textAlign: 'right',
    borderBottomWidth: 1,
    borderBottomColor: '#2196F3',
    paddingVertical: 2,
    paddingHorizontal: 5,
  },

  stationImage: {
    width: '100%',
    height: 200,
    marginBottom: 12,
    borderRadius: 10,
    resizeMode: 'cover',
  },
});
