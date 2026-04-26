// navigation/DrawerNavigation.js ← FINAL 100% CLEAN (DECEMBER 2025)
import React, { useContext, useState, useEffect } from 'react';
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItemList,
} from '@react-navigation/drawer';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AuthContext } from '../src/context/AuthContext';
import { useTranslation } from '../src/context/LanguageContext';
import { useNavigation } from '@react-navigation/native';
import API from '../src/api/api';

// SCREENS — MAKE SURE THESE PATHS ARE 100% CORRECT
import HomeScreen from '../screen/HomeScreen';
import SettingsScreen from '../screen/SettingsScreen';
import WeatherScreen from '../screen/WeatherScreen';           // ← ONLY ONE
import ScanScreen from '../screen/ScanScreen';
import NotificationScreen from '../screen/NotificationScreen';
import ContactChatLeastScreen from '../screen/ContactChatLeastScreen';
import ContactChatScreen from '../screen/ContactChatScreen';
import SplashScreen from '../screen/SplashScreen';
import LoginScreen from '../screen/LoginScreen';
import RegisterScreen from '../screen/RegisterScreen';
import ChatScreen from '../screen/ChatScreen';
import ForgotPasswordScreen from '../screen/ForgotPasswordScreen'; // Make sure these are imported
import ResetPasswordScreen from '../screen/ResetPasswordScreen';




const Drawer = createDrawerNavigator();
const NotificationBadge = () => {
  const navigation = useNavigation(); // Renamed 'navigate' to 'navigation' to match usage
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = async () => {
    try {
      // Added a trailing slash to match your API structure
      const res = await API.get('/api/notify/'); 
      const { notifications } = res.data;
      if (notifications) {
        const unread = notifications.filter(n => !n.is_read).length;
        setUnreadCount(unread);
      }
    } catch (err) {
      console.log("Badge fetch error:", err);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // --- THE RETURN MUST BE HERE, OUTSIDE THE FETCH FUNCTION ---
  return (
    <TouchableOpacity 
      onPress={() => navigation.navigate('Notifications')}
      style={{ marginRight: 20 }}
    >
      <Ionicons name="notifications" size={26} color="#fff" />
      {unreadCount > 0 && (
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

function CustomDrawerContent(props) {
  const { logout } = useContext(AuthContext);
  const { t } = useTranslation();

  const handleLogout = () => {
    Alert.alert(t("logout"), t("are_you_sure"), [
      { text: t("cancel") },
      { text: t("logout"), style: "destructive", onPress: () => logout() },
    ]);
  };

  return (
    <DrawerContentScrollView {...props}>
      <View style={styles.drawerHeader}>
        <Ionicons name="leaf" size={60} color="#fff" />
        <Text style={styles.drawerTitle}>SmartFarm</Text>
      </View>

      <DrawerItemList {...props} />

      <View style={styles.logoutContainer}>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={26} color="#ff3b30" />
          <Text style={styles.logoutText}>{t("logout")}</Text>
        </TouchableOpacity>
      </View>
    </DrawerContentScrollView>
  );
}

function MainApp() {
  const { t } = useTranslation();
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: '#2E7D32' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
        drawerActiveTintColor: '#4CAF50',

        headerRight: () => <NotificationBadge/>
      }}
    >
      <Drawer.Screen
        name="Home"
        component={HomeScreen}
        options={{ drawerLabel: t("home"), drawerIcon: ({ color }) => <Ionicons name="home" size={24} color={color} /> }}
      />
      <Drawer.Screen
        name="Contacts"
        component={ContactChatLeastScreen}
        options={{ drawerLabel: t("your_contacts"), drawerIcon: ({ color }) => <Ionicons name="people" size={24} color={color} /> }}
      />
      <Drawer.Screen
        name="ChatScreen"
        component={ChatScreen}
        options={{ drawerLabel: t("farmi"), drawerIcon: ({ color }) => <Ionicons name="people" size={24} color={color} /> }}
      />
      <Drawer.Screen
        name="WeatherMain"
        component={WeatherScreen}
        options={{
          drawerLabel: t("weather"),
          drawerIcon: ({ color }) => <Ionicons name="cloud" size={24} color={color} />,
        }}
      />
      <Drawer.Screen
        name="Scan"
        component={ScanScreen}
        options={{ drawerLabel: t("scan"), drawerIcon: ({ color }) => <Ionicons name="camera" size={24} color={color} /> }}
      />
      <Drawer.Screen
        name="Notifications"
        component={NotificationScreen}
        options={{ drawerLabel: t("notifications_title"), drawerIcon: ({ color }) => <Ionicons name="notifications" size={24} color={color} /> }}
      />
      <Drawer.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ drawerLabel: t("settings"), drawerIcon: ({ color }) => <Ionicons name="settings" size={24} color={color} /> }}
      />

      {/* Hidden chat screen */}
      <Drawer.Screen
        name="ContactChatScreen"
        component={ContactChatScreen}
        options={{
          drawerItemStyle: { display: 'none' },
          title: 'Chat',
        }}
      />
    </Drawer.Navigator>
  );
}

function AuthStack() {
  return (
    <Drawer.Navigator screenOptions={{ headerShown: false }}>
      <Drawer.Screen name="Splash" component={SplashScreen} />
      <Drawer.Screen name="Login" component={LoginScreen} />
      <Drawer.Screen name="Register" component={RegisterScreen} />
      <Drawer.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Drawer.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </Drawer.Navigator>
  );
}


export default function DrawerNavigation() {
  const { isAuthenticated, loading } = useContext(AuthContext);
  const { t } = useTranslation();

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>{t("loading_app")}</Text>
      </View>
    );
  }

  return isAuthenticated ? <MainApp /> : <AuthStack />;
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  loadingText: { marginTop: 20, fontSize: 18, color: '#333' },
  drawerHeader: { padding: 25, backgroundColor: '#4CAF50', alignItems: 'center' },
  drawerTitle: { marginTop: 10, fontSize: 26, fontWeight: 'bold', color: '#fff' },
  logoutContainer: { marginTop: 'auto', borderTopWidth: 1, borderTopColor: '#eee' },
  logoutButton: { flexDirection: 'row', padding: 20, alignItems: 'center' },
  logoutText: { marginLeft: 20, fontSize: 17, color: '#ff3b30', fontWeight: 'bold' },
  forgot: { 
  color: '#4CAF50', 
  textAlign: 'right', 
  marginTop: 2, 
  marginBottom: 8,
  paddingVertical: 10, // Increased tap area
  fontWeight: '600'
},
badgeContainer: {
    position: 'absolute',
    right: -5,
    top: -2,
    backgroundColor: '#FF3B30', // Urgent Red
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#2E7D32', // Matches header to look "cut out"
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },

});