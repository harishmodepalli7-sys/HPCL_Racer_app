import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ImageBackground,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  ToastAndroid,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../services/apiClient';

const { height } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
  const [contactNumber, setContactNumber] = useState('');
  const [password, setPassword] = useState('');
  const [hidePassword, setHidePassword] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');

  // Regex to identify racer login by 10-digit number
  const isRacerLogin = /^\d{10}$/.test(contactNumber);

  useEffect(() => {
    const checkLogin = async () => {
      const loggedIn = await AsyncStorage.getItem('isLoggedIn');
      if (loggedIn === 'true') {
        navigation?.replace?.('MainTabs');
      }
    };
    checkLogin();
  }, []);

  const saveCustomerIdFromSession = async () => {
    try {
      const sessionRes = await apiClient.get('/api/session/me');
      const sapId =
        Array.isArray(sessionRes?.data?.sap_id) && sessionRes.data.sap_id.length > 0
          ? sessionRes.data.sap_id[0]
          : null;
      if (sapId) await AsyncStorage.setItem('customer_id', sapId);
    } catch (err) {
      console.warn('Failed to fetch & save customer_id:', err?.response?.data || err);
    }
  };

  const handleLogin = async () => {
    let validationErrors = {};
    if (!contactNumber.trim())
      validationErrors.contactNumber = 'Please enter your contact number or AD username';
    if (!password.trim()) validationErrors.password = 'Please enter your password';
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setLoading(true);
    setApiError('');

    try {
      const payload = { username: contactNumber, password, otp: 0 };
      const response = await apiClient.post('/api/users/login', payload);

      if (response.data.status) {
        if (isRacerLogin) {
          // OTP required - navigate to separate OTPScreen
          navigation.navigate('OTPScreen', { username: contactNumber, password });
        } else {
          // No OTP required - proceed to main app
          await AsyncStorage.setItem('isLoggedIn', 'true');
          await saveCustomerIdFromSession();
          ToastAndroid.show('Login Successful', ToastAndroid.SHORT);
          navigation.replace('MainTabs');
        }
      } else {
        setApiError(response.data.message || 'Login failed');
      }
    } catch (error) {
      setApiError(error?.response?.data?.message || error.message || 'Login error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header Section with motorcycle as full background */}
          <ImageBackground
            source={require('../../assets/bike.png')}
            style={styles.headerContainer}
            imageStyle={{ resizeMode: 'cover' }}
          >
            {/* Optional header title if needed */}
            {/* <View style={styles.headerTitleWrap}>
              <Text style={styles.headerTitle}>HP Racer Portal</Text>
            </View> */}
          </ImageBackground>

          {/* Login Form */}
          <View style={styles.formContainer}>
            <Text style={styles.loginTitle}>Login to your HP Racer Station Portal</Text>

            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Contact Number / AD Username (HPCL)*</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="call-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter contact no. or AD username"
                  placeholderTextColor="#999"
                  value={contactNumber}
                  onChangeText={setContactNumber}
                  keyboardType="default"
                  autoCapitalize="none"
                />
              </View>
              {errors.contactNumber && <Text style={styles.error}>{errors.contactNumber}</Text>}
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Password*</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="key-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter Password"
                  placeholderTextColor="#999"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={hidePassword}
                />
                <TouchableOpacity onPress={() => setHidePassword(!hidePassword)}>
                  <Ionicons
                    name={hidePassword ? 'eye-off' : 'eye'}
                    size={22}
                    color="#999"
                  />
                </TouchableOpacity>
              </View>
              {errors.password && <Text style={styles.error}>{errors.password}</Text>}
            </View>

            {apiError ? <Text style={styles.error}>{apiError}</Text> : null}

            <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={loading}>
              <Text style={styles.loginButtonText}>
                {loading ? 'Logging in...' : 'LOGIN'}
              </Text>
            </TouchableOpacity>

            <View style={styles.registrationContainer}>
              <Text style={styles.registrationText}>
                New Registration For HP Racer Station?
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Loading spinner */}
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#8B1538" />
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  keyboardAvoidingView: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  headerContainer: {
    height: height * 0.43,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  formContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 38,
    paddingBottom: 44,
    marginTop: -15,
  },
  loginTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 28,
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#FAFAFA',
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#333333',
    paddingVertical: 12,
  },
  loginButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    paddingVertical: 16,
    marginTop: 20,
    marginBottom: 16,
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.23,
    shadowRadius: 8,
    elevation: 8,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 1,
  },
  registrationContainer: {
    alignItems: 'center',
    marginTop: 18,
  },
  registrationText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  error: {
    color: '#d32f2f',
    fontSize: 14,
    marginTop: 2,
    marginBottom: 8,
    textAlign: 'left',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 30,
    backgroundColor: '#00000033',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
