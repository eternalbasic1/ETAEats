import { useRef } from 'react';
import { Modal, View, StyleSheet, SafeAreaView, Pressable, Text } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

export interface RazorpayOptions {
  key_id: string;
  razorpay_order_id: string;
  amount: number;
  currency: string;
  name?: string;
  description?: string;
  prefill?: {
    contact?: string;
    email?: string;
  };
}

export interface RazorpaySuccess {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface Props {
  visible: boolean;
  options: RazorpayOptions;
  onSuccess: (data: RazorpaySuccess) => void;
  onDismiss: (reason: string) => void;
}

function buildCheckoutHTML(options: RazorpayOptions): string {
  const opts = JSON.stringify({
    key: options.key_id,
    amount: options.amount,
    currency: options.currency || 'INR',
    name: options.name || 'ETA Eats',
    description: options.description || 'Food order payment',
    order_id: options.razorpay_order_id,
    prefill: options.prefill || {},
    handler: '__HANDLER__',
    modal: { ondismiss: '__DISMISS__' },
    theme: { color: '#2C2C2C' },
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <style>
    body { margin:0; padding:0; background:#F5F5F2; display:flex; align-items:center; justify-content:center; height:100vh; font-family:system-ui; }
    .loading { text-align:center; color:#666; }
    .loading p { margin-top:12px; font-size:14px; }
    .spinner { width:32px; height:32px; border:3px solid #ddd; border-top-color:#2C2C2C; border-radius:50%; animation:spin .8s linear infinite; margin:0 auto; }
    @keyframes spin { to { transform:rotate(360deg); } }
  </style>
</head>
<body>
  <div class="loading">
    <div class="spinner"></div>
    <p>Opening Razorpay…</p>
  </div>
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
  <script>
    var options = ${opts};
    options.handler = function(response) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'SUCCESS',
        data: response
      }));
    };
    options.modal = {
      ondismiss: function() {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'DISMISSED',
          reason: 'User closed the payment dialog'
        }));
      }
    };
    try {
      var rzp = new Razorpay(options);
      rzp.on('payment.failed', function(response) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'FAILED',
          reason: response.error ? response.error.description : 'Payment failed'
        }));
      });
      rzp.open();
    } catch(e) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'ERROR',
        reason: e.message || 'Failed to initialize Razorpay'
      }));
    }
  </script>
</body>
</html>`;
}

export default function RazorpayCheckout({ visible, options, onSuccess, onDismiss }: Props) {
  const webViewRef = useRef<WebView>(null);

  function handleMessage(event: WebViewMessageEvent) {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'SUCCESS') {
        onSuccess(msg.data as RazorpaySuccess);
      } else {
        onDismiss(msg.reason || 'Payment cancelled');
      }
    } catch {
      onDismiss('Unexpected error');
    }
  }

  if (!visible) return null;

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={() => onDismiss('User cancelled')}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => onDismiss('User cancelled')} hitSlop={12}>
            <Text style={styles.cancel}>Cancel</Text>
          </Pressable>
          <Text style={styles.title}>Payment</Text>
          <View style={{ width: 60 }} />
        </View>
        <WebView
          ref={webViewRef}
          source={{ html: buildCheckoutHTML(options) }}
          onMessage={handleMessage}
          javaScriptEnabled
          domStorageEnabled
          originWhitelist={['*']}
          style={styles.webview}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F2' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E5E5E5',
  },
  cancel: { fontSize: 15, color: '#B91C1C', fontWeight: '500' },
  title: { fontSize: 16, fontWeight: '600', color: '#2C2C2C' },
  webview: { flex: 1 },
});
