import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Platform,
  BackHandler,
} from 'react-native';

interface ForceUpdateScreenProps {
  message: string;
  androidStoreUrl: string;
  iosStoreUrl: string;
}

export default function ForceUpdateScreen({
  message,
  androidStoreUrl,
  iosStoreUrl,
}: ForceUpdateScreenProps) {
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => subscription.remove();
  }, []);

  const handleUpdate = () => {
    const url = Platform.OS === 'android' ? androidStoreUrl : iosStoreUrl;
    Linking.openURL(url);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.message}>{message}</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={handleUpdate}
        accessibilityLabel="Update Now"
        accessibilityRole="button"
      >
        <Text style={styles.buttonText}>Update Now</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 24,
  },
  message: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 32,
    color: '#111827',
  },
  button: {
    backgroundColor: '#F97316',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
