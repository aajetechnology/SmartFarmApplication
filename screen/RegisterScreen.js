import React, { useState, useContext } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  Platform,
  Modal,
  ActivityIndicator,
  StatusBar
} from 'react-native';
import { Picker } from '@react-native-picker/picker'; // Ensure this is installed
import { Text, Surface, Button, Avatar } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { RegisterUser } from '../src/api/api';
import { AuthContext } from '../src/context/AuthContext';
import { useTranslation } from '../src/context/LanguageContext';
import { useNavigation } from "@react-navigation/native";

export default function RegisterScreen() {
  const [profilePic, setProfilePic] = useState(null);
  const [full_name, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('en'); // Defaults to English
  const [loading, setLoading] = useState(false);
  const [secure, setSecure] = useState(true);

  const navigation = useNavigation();
  const { login } = useContext(AuthContext);
  const { t } = useTranslation();

  const handleProfilePic = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t('permission_required'), t('gallery_permission_msg'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setProfilePic(result.assets[0].uri);
    }
  };

  const handleRegister = async () => {
    // 1. Validation
    if (!email || !username || !password || !confirmPassword) {
      Alert.alert(t('incomplete_form'), t('fill_all_fields'));
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert(t('password_mismatch'), t('passwords_not_match'));
      return;
    }

    setLoading(true);

    // 2. Prepare Form Data (Required for Backend Image Upload)
    const formData = new FormData();
    formData.append('email', email.trim().toLowerCase());
    formData.append('username', username.trim().toLowerCase());
    formData.append('password', password);
    formData.append('confirm_password', confirmPassword);
    formData.append('full_name', full_name.trim());
    formData.append('preferred_language', preferredLanguage); // 'ha', 'yo', 'ig', 'en'

    if (profilePic) {
      const fileName = profilePic.split('/').pop();
      const match = /\.(\w+)$/.exec(fileName);
      const type = match ? `image/${match[1] === 'png' ? 'png' : 'jpeg'}` : 'image/jpeg';

      formData.append('profile_pic', {
        uri: Platform.OS === 'ios' ? profilePic.replace('file://', '') : profilePic,
        name: fileName,
        type,
      });
    }

    try {
      // 3. Register & Auto-Login
      await RegisterUser(formData);
      await login(username.trim().toLowerCase(), password);
      // Navigation is handled automatically by AuthContext state change
    } catch (error) {
      const msg = error.response?.data?.detail || t("register_failed_msg");
      Alert.alert(t('register_failed'), msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#1B5E20', '#2E7D32']} style={styles.topSection}>
        <Text style={styles.brand}>SmartFarm</Text>
        <Text style={styles.title}>{t("create_account")}</Text>
        <Text style={styles.subtitle}>{t("start_journey")}</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Surface style={styles.card}>
          {/* Profile Picture Picker */}
          <TouchableOpacity onPress={handleProfilePic} style={styles.avatarPicker}>
            <View style={styles.avatarWrapper}>
              {profilePic ? (
                <Image source={{ uri: profilePic }} style={styles.profilePrev} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="camera" size={30} color="#2E7D32" />
                </View>
              )}
            </View>
            <Text style={styles.pickText}>Add Profile Picture</Text>
          </TouchableOpacity>

          {/* Input Fields */}
          <View style={styles.inputBox}>
            <Ionicons name="person-outline" size={20} color="#2E7D32" style={styles.icon} />
            <TextInput style={styles.input} placeholder={t("full_name")} value={full_name} onChangeText={setFullName} />
          </View>

          <View style={styles.inputBox}>
            <Ionicons name="at-outline" size={20} color="#2E7D32" style={styles.icon} />
            <TextInput style={styles.input} placeholder={t("username")} value={username} onChangeText={setUsername} autoCapitalize="none" />
          </View>

          <View style={styles.inputBox}>
            <Ionicons name="mail-outline" size={20} color="#2E7D32" style={styles.icon} />
            <TextInput style={styles.input} placeholder={t("email")} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          </View>

          <View style={styles.inputBox}>
            <Ionicons name="lock-closed-outline" size={20} color="#2E7D32" style={styles.icon} />
            <TextInput style={styles.input} placeholder={t("password")} value={password} onChangeText={setPassword} secureTextEntry={secure} />
            <TouchableOpacity onPress={() => setSecure(!secure)}>
              <Ionicons name={secure ? "eye-outline" : "eye-off-outline"} size={20} color="#AAA" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputBox}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#2E7D32" style={styles.icon} />
            <TextInput style={styles.input} placeholder={t("confirm_password")} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={secure} />
          </View>

          {/* Language Picker */}
          <Text style={styles.label}>Preferred Language</Text>
          <Surface style={styles.pickerSurface}>
            <Picker
              selectedValue={preferredLanguage}
              onValueChange={(val) => setPreferredLanguage(val)}
              style={styles.picker}
            >
              <Picker.Item label="English" value="en" />
              <Picker.Item label="Hausa" value="ha" />
              <Picker.Item label="Yoruba" value="yo" />
              <Picker.Item label="Igbo" value="ig" />
            </Picker>
          </Surface>

          <Button mode="contained" onPress={handleRegister} loading={loading} style={styles.btn} contentStyle={{ height: 55 }}>
            Join SmartFarm
          </Button>
        </Surface>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{t("already_member")}</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
            <Text style={styles.loginLink}>{t("sign_in")}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  topSection: { padding: 40, paddingTop: 60, borderBottomLeftRadius: 40, borderBottomRightRadius: 40 },
  brand: { color: 'rgba(255,255,255,0.6)', fontWeight: '800', letterSpacing: 2, fontSize: 12, marginBottom: 10 },
  title: { color: '#FFF', fontSize: 32, fontWeight: 'bold' },
  subtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 5 },

  scrollContainer: { paddingHorizontal: 25, paddingBottom: 40, marginTop: -30 },
  card: { backgroundColor: '#FFF', borderRadius: 25, padding: 25, elevation: 10 },

  avatarPicker: { alignItems: 'center', marginBottom: 25 },
  avatarWrapper: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', borderWidth: 2, borderColor: '#2E7D32' },
  profilePrev: { width: '100%', height: '100%' },
  avatarPlaceholder: { opacity: 0.5 },
  pickText: { color: '#2E7D32', fontWeight: 'bold', marginTop: 10, fontSize: 13 },

  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F2F5', borderRadius: 15, paddingHorizontal: 15, marginBottom: 15 },
  icon: { marginRight: 10 },
  input: { flex: 1, height: 50, color: '#333', fontSize: 15 },

  label: { fontSize: 14, fontWeight: 'bold', color: '#666', marginBottom: 8, marginLeft: 5 },
  pickerSurface: { backgroundColor: '#F0F2F5', borderRadius: 15, overflow: 'hidden', marginBottom: 25 },
  picker: { height: 50, width: '100%' },

  btn: { borderRadius: 15, backgroundColor: '#2E7D32', marginTop: 10, elevation: 5 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 25 },
  footerText: { color: '#666' },
  loginLink: { color: '#2E7D32', fontWeight: 'bold' }
});
