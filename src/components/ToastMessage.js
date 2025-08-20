
import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';

const ToastMessage = ({ message, visible, onHide }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setTimeout(() => {
          Animated.parallel([
            Animated.timing(opacity, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(translateY, {
              toValue: 30,
              duration: 300,
              useNativeDriver: true,
            }),
          ]).start(onHide);
        }, 2000);
      });
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.toast,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
toast: {
  position: 'absolute',
  bottom: 150,
  alignSelf: 'center',
  backgroundColor: '#333',
  paddingHorizontal: 20,
  paddingVertical: 12,
  borderRadius: 25,
  maxWidth: '80%',
  alignItems: 'center',
  zIndex: 9999,
},

  text: {
    color: '#fff',
    fontSize: 14,
  },
});

export default ToastMessage; 