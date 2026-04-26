import React, { useState } from 'react';
import { View, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { TextInput, Button, Text, Avatar } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import API from '../src/api/api'; 

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestLink = async () => {
    if (!email.includes('@')) {
      return Alert.alert("Invalid Email", "Please enter a valid email address.");
    }

    setLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      // 1. Backend call to trigger the reset email using JSON
      await API.post('/api/auth/forgot-password', { email: cleanEmail });

      Alert.alert(
        "Code Sent",
        "If that email is registered, you will receive a 6-digit reset code shortly.",
        [
          { 
            text: "Enter Code", 
            // 2. CRITICAL: Pass the email to the next screen
            onPress: () => navigation.navigate('ResetPassword', { email: cleanEmail }) 
          }
        ]
      );
    } catch (err) {
      // Logic for handling server errors
      const msg = err.response?.data?.detail || "Could not connect to server.";
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#1B5E20', '#388E3C']} style={styles.container}>
      <View style={styles.card}>
        <Avatar.Icon size={60} icon="lock-reset" style={styles.icon} color="#4CAF50" />
        <Text style={styles.title}>Forgot Password?</Text>
        <Text style={styles.subtitle}>
          Enter your email and we'll send you a 6-digit code to reset your account.
        </Text>

        <TextInput
          label="Email Address"
          value={email}
          onChangeText={setEmail}
          mode="outlined"
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
          outlineColor="#388E3C"
          activeOutlineColor="#1B5E20"
        />

        <Button 
          mode="contained" 
          onPress={handleRequestLink} 
          loading={loading}
          disabled={loading}
          style={styles.button}
        >
          Send Reset Code
        </Button>

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backLink}>Return to Login</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  card: { backgroundColor: 'white', padding: 25, borderRadius: 20, elevation: 8, alignItems: 'center' },
  icon: { backgroundColor: '#E8F5E9', marginBottom: 15 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1B5E20' },
  subtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginVertical: 15, lineHeight: 20 },
  input: { width: '100%', marginBottom: 20 },
  button: { width: '100%', borderRadius: 10, backgroundColor: '#388E3C', paddingVertical: 5 },
  backLink: { marginTop: 20, color: '#388E3C', fontWeight: 'bold' }
});