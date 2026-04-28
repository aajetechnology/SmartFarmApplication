import React, { useContext, useState } from 'react';
import {
  View,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  Modal,
} from 'react-native';
import { Text, Divider, Avatar, List, Surface } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthContext } from '../src/context/AuthContext';
import { useTranslation } from '../src/context/LanguageContext';
import { useNavigation } from '@react-navigation/native';
import API, { BASE_URL } from '../src/api/api';


export default function SettingsScreen() {
  const { user, logout } = useContext(AuthContext);
  const { lang, changeLanguage, t } = useTranslation();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState(true);
  const [langModalVisible, setLangModalVisible] = useState(false);

  const handleLogout = () => {
    Alert.alert(t("logout"), t("logout_confirm"), [
      { text: t("cancel"), style: "cancel" },
      { 
        text: t("logout"), 
        style: "destructive", 
// ...
        onPress: async () => {
          try {
            await logout();
            navigation.reset({ index: 0, routes: [{ name: 'Splash' }] });
          } catch (error) {
            Alert.alert(t("logout_failed"), t("try_again"));
          }
        } 
      }
    ]);
  };

  const SettingItem = ({ icon, label, onPress, right, color = "#4CAF50" }) => (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <View style={styles.settingRow}>
        <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
          <Ionicons name={icon} size={22} color={color} />
        </View>
        <Text style={styles.settingLabel}>{label}</Text>
        {right ? right : <Ionicons name="chevron-forward" size={20} color="#CCC" />}
      </View>
    </TouchableOpacity>
  );

  let profilePic = user?.profile_pic;
  if (profilePic && !profilePic.startsWith('http')) {
     profilePic = `${BASE_URL}${profilePic.startsWith('/') ? '' : '/'}${profilePic}`;
  }

  return (
    <View style={styles.container}>
      <ScrollView bounces={false}>
        {/* HEADER SECTION */}
        <LinearGradient colors={['#2E7D32', '#4CAF50']} style={[styles.header, { paddingTop: insets.top + 20 }]}>
          <View style={styles.profileSection}>
            {profilePic ? (
              <Image
                source={{ uri: profilePic }}
                style={styles.profilePic}
              />
            ) : (
              <Avatar.Text size={80} label={user?.username?.[0]?.toUpperCase() || 'F'} style={styles.avatar} />
            )}
            <Text style={styles.profileName}>{user?.full_name || user?.username || t("farmer")}</Text>
            <Text style={styles.profileEmail}>{user?.email || 'farmer@email.com'}</Text>
            
            <TouchableOpacity 
              style={styles.editBtn} 
              onPress={() => navigation.navigate('Profile')}
            >
              <Text style={styles.editBtnText}>{t("edit_profile")}</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {/* APP PREFERENCES */}
          <Text style={styles.sectionTitle}>{t("preferences")}</Text>
          <Surface style={styles.sectionCard} elevation={1}>
            <SettingItem 
              icon="notifications" 
              label={t("notifications")} 
              right={<Switch value={notifications} onValueChange={setNotifications} color="#4CAF50" />}
            />
            <Divider />
            <SettingItem icon="moon" label={t("dark_mode")} right={<Text style={styles.comingSoon}>{t("soon")}</Text>} />
            <Divider />
            <SettingItem 
              icon="earth" 
              label={t("language")} 
              onPress={() => setLangModalVisible(true)}
              right={
                <View style={styles.langBadge}>
                  <Text style={styles.langBadgeText}>{lang === 'en' ? 'English' : lang.toUpperCase()}</Text>
                </View>
              } 
            />
          </Surface>

          {/* ACCOUNT SECTION */}
          <Text style={styles.sectionTitle}>{t("account")}</Text>
          <Surface style={styles.sectionCard} elevation={1}>
            {/* <SettingItem icon="lock-closed" label="Change Password" onPress={() => {}} />
            <Divider /> */}
            <SettingItem icon="shield-checkmark" label={t("privacy")} onPress={() => {}} />
            <Divider />
            <SettingItem icon="help-circle" label={t("help")} onPress={() => {}} />
          </Surface>

          {/* LOGOUT */}
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={22} color="#FF5252" />
            <Text style={styles.logoutText}>{t("logout")}</Text>
          </TouchableOpacity>
          
          <Text style={styles.versionText}>{t("version")} 1.0.4</Text>
        </View>
      </ScrollView>

      {/* ── LANGUAGE MODAL ──────────────── */}
      <Modal visible={langModalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t("select_language")}</Text>
            
            <TouchableOpacity style={styles.langOption} onPress={() => { changeLanguage('en'); setLangModalVisible(false); }}>
              <Text style={styles.langText}>🇺🇸 English</Text>
            </TouchableOpacity>
            <Divider style={{width: '100%'}}/>
            <TouchableOpacity style={styles.langOption} onPress={() => { changeLanguage('ha'); setLangModalVisible(false); }}>
              <Text style={styles.langText}>🇳🇬 Hausa</Text>
            </TouchableOpacity>
            <Divider style={{width: '100%'}}/>
            <TouchableOpacity style={styles.langOption} onPress={() => { changeLanguage('yo'); setLangModalVisible(false); }}>
              <Text style={styles.langText}>🇳🇬 Yoruba</Text>
            </TouchableOpacity>
            <Divider style={{width: '100%'}}/>
            <TouchableOpacity style={styles.langOption} onPress={() => { changeLanguage('ig'); setLangModalVisible(false); }}>
              <Text style={styles.langText}>🇳🇬 Igbo</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => setLangModalVisible(false)}>
              <Text style={styles.cancelText}>{t("cancel")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: {
    paddingBottom: 30,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  profileSection: { alignItems: 'center' },
  profilePic: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: '#FFF' },
  avatar: { backgroundColor: '#FFF' },
  profileName: { fontSize: 22, fontWeight: 'bold', color: '#FFF', marginTop: 10 },
  profileEmail: { fontSize: 14, color: '#E8F5E9', opacity: 0.9 },
  editBtn: {
    marginTop: 15,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  editBtnText: { color: '#FFF', fontWeight: '600' },
  content: { padding: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#888', textTransform: 'uppercase', marginLeft: 10, marginBottom: 8, marginTop: 15 },
  sectionCard: { backgroundColor: '#FFF', borderRadius: 15, overflow: 'hidden' },
  settingRow: { flexDirection: 'row', alignItems: 'center', padding: 15 },
  iconContainer: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  settingLabel: { flex: 1, fontSize: 16, color: '#333', fontWeight: '500' },
  valueText: { color: '#888', marginRight: 5 },
  langBadge: { 
    backgroundColor: '#E8F5E9', 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: '#C8E6C9' 
  },
  langBadgeText: { 
    color: '#2E7D32', 
    fontSize: 12, 
    fontWeight: 'bold' 
  },
  comingSoon: { fontSize: 10, color: '#4CAF50', backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#FFEBEE',
  },
  logoutText: { color: '#FF5252', fontWeight: 'bold', marginLeft: 10, fontSize: 16 },
  versionText: { textAlign: 'center', color: '#BBB', fontSize: 12, marginTop: 20, marginBottom: 30 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', backgroundColor: '#FFF', borderRadius: 20, padding: 20, alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#333' },
  langOption: { width: '100%', paddingVertical: 15, alignItems: 'center' },
  langText: { fontSize: 16, color: '#2E7D32', fontWeight: '600' },
  cancelBtn: { marginTop: 15, padding: 10 },
  cancelText: { color: '#FF5252', fontWeight: 'bold', fontSize: 16 },
});