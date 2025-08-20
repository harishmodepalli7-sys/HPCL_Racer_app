// OTPScreen.js
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ToastAndroid,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { apiClient } from '../services/apiClient'; // Adjust path as needed

const { width } = Dimensions.get('window');

export default function OTPScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  // Params passed from LoginScreen
  const { username, password } = route.params || {};

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(25);
  const [canResend, setCanResend] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef([]);

  // Timer countdown
  useEffect(() => {
    if (timer > 0) {
      const countdown = setTimeout(() => setTimer(timer - 1), 1000);
      return () => clearTimeout(countdown);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  // Handle OTP input change
  const handleOtpChange = (value, index) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyPress = (key, index) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const isOtpComplete = otp.every((digit) => digit !== '');

  const handleVerify = async () => {
    const otpCode = otp.join('');
    if (!isOtpComplete) return;

    setLoading(true);
    try {
      // Call OTP verification endpoint
      const response = await apiClient.post('/api/users/login', {
        username,
        password,
        otp: parseInt(otpCode),
      });

      if (response.data.status) {
        // OTP verified, fetch sap_id
        const sessionRes = await apiClient.get('/api/session/me');
        const sapId =
          Array.isArray(sessionRes?.data?.sap_id) && sessionRes.data.sap_id.length > 0
            ? sessionRes.data.sap_id[0]
            : null;
        if (sapId) {
          await AsyncStorage.setItem('customer_id', sapId);
        }

        await AsyncStorage.setItem('isLoggedIn', 'true');
        ToastAndroid.show('OTP Verified!', ToastAndroid.SHORT);

        navigation.replace('MainTabs');
      } else {
        ToastAndroid.show(response.data.message || 'OTP verification failed', ToastAndroid.SHORT);
      }
    } catch (error) {
      ToastAndroid.show(
        error?.response?.data?.message || error.message || 'OTP verification error',
        ToastAndroid.SHORT
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setTimer(25);
    setCanResend(false);
    setOtp(['', '', '', '', '', '']);

    try {
      // Resend OTP API call
      const response = await apiClient.post('/api/users/login', {
        username,
        password,
        otp: 0,
      });

      if (response.data.status) {
        ToastAndroid.show('OTP resent successfully!', ToastAndroid.SHORT);
      } else {
        ToastAndroid.show(response.data.message || 'Failed to resend OTP', ToastAndroid.SHORT);
      }
    } catch {
      ToastAndroid.show('Resend OTP failed. Try again.', ToastAndroid.SHORT);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        {/* Header */}
        

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.title}>Verify Your Phone Number</Text>
          <Text style={styles.subtitle}>We've sent a 6 digit code to {username}</Text>

          {/* OTP Input Boxes */}
          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (inputRefs.current[index] = ref)}
                style={[styles.otpBox, digit ? styles.otpBoxFilled : styles.otpBoxEmpty]}
                value={digit}
                onChangeText={(value) => handleOtpChange(value, index)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                keyboardType="numeric"
                maxLength={1}
                textAlign="center"
                selectTextOnFocus
                editable={!loading}
              />
            ))}
          </View>

          <Text style={styles.otpInstruction}>Enter the OTP you received via SMS</Text>

          {/* Verify Button */}
          <TouchableOpacity
            style={[styles.verifyButton, isOtpComplete ? styles.verifyButtonActive : styles.verifyButtonDisabled]}
            onPress={handleVerify}
            disabled={!isOtpComplete || loading}
          >
            <Text
              style={[
                styles.verifyButtonText,
                isOtpComplete ? styles.verifyButtonTextActive : styles.verifyButtonTextDisabled,
              ]}
            >
              {loading ? 'Verifying...' : 'Verify'}
            </Text>
          </TouchableOpacity>

          {/* Resend Section */}
          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>
              Didn't receive the code?{' '}
              {canResend ? (
                <Text style={styles.resendLink} onPress={handleResend}>
                  Resend
                </Text>
              ) : (
                <Text style={styles.resendTimer}>Resend in {timer}s</Text>
              )}
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  keyboardAvoidingView: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backButton: {
    padding: 8,
    alignSelf: 'flex-start',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  otpBox: {
    width: 45,
    height: 50,
    borderRadius: 8,
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
  },
  otpBoxEmpty: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  otpBoxFilled: {
    borderWidth: 2,
    borderColor: '#2196F3',
    backgroundColor: '#FFFFFF',
  },
  otpInstruction: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 40,
  },
  verifyButton: {
    borderRadius: 8,
    paddingVertical: 16,
    marginBottom: 30,
  },
  verifyButtonActive: {
    backgroundColor: '#2196F3',
  },
  verifyButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  verifyButtonText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 1,
  },
  verifyButtonTextActive: {
    color: '#FFFFFF',
  },
  verifyButtonTextDisabled: {
    color: '#999999',
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  resendText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  resendLink: {
    color: '#2196F3',
    fontWeight: '500',
  },
  resendTimer: {
    color: '#666666',
  },
});
