import React, { useState, useContext } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { Text, Card, Button, Avatar } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AuthContext } from '../src/context/AuthContext';
import { useTranslation } from '../src/context/LanguageContext';
import { useNavigation } from "@react-navigation/native";

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secure, setSecure] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const { login } = useContext(AuthContext);
  const { t } = useTranslation();

  const handleLogin = async () => {
    const identifier = email.trim();
    if (!identifier || !password) {
      Alert.alert(t("missing_fields"), t("missing_fields_msg"));
      return;
    }

    setLoading(true); // Triggers the Modal Overlay
    try {
      // login() in AuthContext calls LoginUser in api.js
      await login(identifier, password);

      // Note: No need to manually navigate to 'Home' if your App.js 
      // switches stacks automatically based on the 'isAuthenticated' state.
      console.log("Login success");
    } catch (error) {
      const errorMsg = error.response?.data?.detail || t("invalid_creds");
      Alert.alert(t("login_failed"), errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#4CAF50', '#8BC34A']} style={styles.container}>
      {/* LOADING OVERLAY */}
      <Modal transparent visible={loading} animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.loaderBox}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.loaderText}>{t("signing_in")}</Text>
          </View>
        </View>
      </Modal>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Avatar.Icon size={70} icon="leaf" style={styles.avatar} color="#4CAF50" />
            <Text variant="headlineMedium" style={styles.title}>{t("welcome_back")}</Text>
            <Text style={styles.subtitle}>{t("manage_farm")}</Text>
          </View>

          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleLarge" style={styles.cardTitle}>{t("login")}</Text>

              <View style={styles.inputGroup}>
                <Ionicons name="person-outline" size={20} color="#4CAF50" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={t("email_or_username")}
                  placeholderTextColor="#888"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputGroup}>
                <Ionicons name="lock-closed-outline" size={20} color="#4CAF50" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={t("password")}
                  placeholderTextColor="#888"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={secure}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setSecure(!secure)}>
                  <Ionicons name={secure ? "eye-off-outline" : "eye-outline"} size={20} color="#888" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                <Text style={styles.forgot}>{t("forgot_password_q")}</Text>
              </TouchableOpacity>

              <Button
                mode="contained"
                onPress={handleLogin}
                disabled={loading}
                style={styles.loginButton}
                contentStyle={{ height: 48 }}
              >
                {t("sign_in")}
              </Button>
            </Card.Content>
          </Card>

          <View style={styles.footer}>
            <Text style={styles.footerText}>{t("new_to_smartfarm")}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.signup}>{t("create_account")}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  loaderBox: { backgroundColor: 'white', padding: 30, borderRadius: 15, alignItems: 'center' },
  loaderText: { marginTop: 10, color: '#4CAF50', fontWeight: 'bold' },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  header: { alignItems: 'center', marginBottom: 25 },
  avatar: { backgroundColor: '#fff', elevation: 4 },
  title: { color: '#fff', marginTop: 15, fontWeight: 'bold', textAlign: 'center' },
  subtitle: { color: '#fff', marginTop: 5, textAlign: 'center', fontSize: 16, opacity: 0.9 },
  card: { borderRadius: 20, backgroundColor: 'white', elevation: 8, paddingVertical: 10 },
  cardTitle: { color: '#333', fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  inputGroup: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 12, marginBottom: 15, paddingHorizontal: 15 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, height: 50, fontSize: 16, color: '#333' },
  forgot: { color: '#4CAF50', textAlign: 'right', fontWeight: '600', marginBottom: 20 },
  loginButton: { borderRadius: 12, backgroundColor: '#4CAF50' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 30 },
  footerText: { color: '#fff', fontSize: 16 },
  signup: { color: '#FFC107', fontWeight: 'bold', fontSize: 16 },
});