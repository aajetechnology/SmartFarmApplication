import React, { useState } from 'react';
import { View, StyleSheet, Alert, TouchableOpacity, ScrollView } from 'react-native';
import { TextInput, Button, Text, Card, HelperText } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import API from '../src/api/api';

export default function ResetPasswordScreen({ navigation, route }) {
  // We expect the email to be passed from the ForgotPassword screen
  const email = route.params?.email || "";

  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [secure, setSecure] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    // 1. Frontend Validation
    if (!code || code.length < 6) {
      return Alert.alert("Required", "Please enter the 6-digit code sent to your email.");
    }
    if (newPassword.length < 6) {
      return Alert.alert("Weak Password", "Password must be at least 6 characters.");
    }
    if (newPassword !== confirmPassword) {
      return Alert.alert("Mismatch", "Passwords do not match.");
    }

    setLoading(true);
    try {
      // 2. Prepare JSON payload
      const payload = {
        email: email.trim().toLowerCase(),
        code: code.trim(),
        new_password: newPassword
      };

      // Matches your @router.post("/reset-password")
      await API.post('/api/auth/reset-password', payload);

      Alert.alert(
        "Success!", 
        "Your password has been updated. You can now log in with your new password.", 
        [{ text: "Go to Login", onPress: () => navigation.navigate('Login') }]
      );
    } catch (err) {
      const errorMsg = err.response?.data?.detail || "Invalid code or request. Please try again.";
      Alert.alert("Reset Failed", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#F5F7FA', '#B8D0EB']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.title}>New Password</Text>
            <Text style={styles.subtitle}>
              We sent a code to <Text style={styles.emailText}>{email}</Text>
            </Text>

            <TextInput
              label="6-Digit Reset Code"
              placeholder="123456"
              value={code}
              onChangeText={setCode}
              mode="outlined"
              keyboardType="number-pad"
              maxLength={6}
              style={styles.input}
              outlineColor="#388E3C"
              activeOutlineColor="#2E7D32"
            />

            <TextInput
              label="New Password"
              value={newPassword}
              onChangeText={setNewPassword}
              mode="outlined"
              secureTextEntry={secure}
              style={styles.input}
              right={<TextInput.Icon icon={secure ? "eye" : "eye-off"} onPress={() => setSecure(!secure)} />}
              outlineColor="#388E3C"
              activeOutlineColor="#2E7D32"
            />

            <TextInput
              label="Confirm New Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              mode="outlined"
              secureTextEntry={secure}
              style={styles.input}
              outlineColor="#388E3C"
              activeOutlineColor="#2E7D32"
            />

            <Button 
              mode="contained" 
              onPress={handleReset} 
              loading={loading}
              disabled={loading}
              style={styles.button}
              labelStyle={styles.buttonLabel}
            >
              Update Password
            </Button>

            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backText}>Wait, I need to check the email again</Text>
            </TouchableOpacity>
          </Card.Content>
        </Card>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  card: { borderRadius: 15, elevation: 4, paddingVertical: 10 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#1B5E20', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 25, textAlign: 'center', marginTop: 5 },
  emailText: { fontWeight: 'bold', color: '#2E7D32' },
  input: { marginBottom: 15 },
  button: { marginTop: 15, backgroundColor: '#388E3C', borderRadius: 8, paddingVertical: 5 },
  buttonLabel: { fontSize: 16, fontWeight: 'bold' },
  backButton: { marginTop: 20, alignItems: 'center' },
  backText: { color: '#666', textDecorationLine: 'underline' }
});