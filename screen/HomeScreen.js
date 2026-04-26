import React, { useState, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
} from "react-native";
import { Text, Avatar, Surface, IconButton } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import { FetchWeather, getCurrentUser, BASE_URL } from "../src/api/api";
import * as Location from 'expo-location';
import { useTranslation } from "../src/context/LanguageContext";
import API from "../src/api/api";

const { width } = Dimensions.get("window");
const SLIDE_WIDTH = width * 0.88;
const GAP = 15;

const ActionTile = ({ icon, label, onPress, color }) => (
  <TouchableOpacity
    style={styles.gridItem}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <Surface style={[styles.tileSurface, { borderLeftColor: color }]}>
      <View style={[styles.iconWrapper, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={26} color={color} />
      </View>
      <Text style={styles.gridLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={14} color="#CCC" style={styles.chevron} />
    </Surface>
  </TouchableOpacity>
);

export default function HomeScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const [weatherData, setWeatherData] = useState(null);
  const [user, setUser] = useState(null);
  const [greeting, setGreeting] = useState("welcome");

  useEffect(() => {
    // Set Dynamic Greeting
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("morning");
    else if (hour < 17) setGreeting("afternoon");
    else setGreeting("evening");

    const loadData = async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        let lat = null, lon = null;

        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({});
          lat = location.coords.latitude;
          lon = location.coords.longitude;
        }

        const [userData, weather] = await Promise.all([
          getCurrentUser(),
          FetchWeather(lat, lon)
        ]);

        setUser(userData);
        setWeatherData(weather);
      } catch (err) {
        console.log("Data load error", err);
      }
    };

    loadData();
  }, []);

  let profilePic = user?.profile_pic;
  if (profilePic && !profilePic.startsWith('http')) {
     profilePic = `${BASE_URL}${profilePic.startsWith('/') ? '' : '/'}${profilePic}`;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* ── PREMIUM HEADER ────────────────────── */}
      <LinearGradient colors={["#1B5E20", "#2E7D32"]} style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greetingText}>{t(greeting)},</Text>
            <Text style={styles.usernameText}>{user?.username || t("farmer")}</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate("Settings")}>
            <Surface style={styles.avatarSurface}>
              {profilePic ? (
                <Image source={{ uri: profilePic }} style={styles.profilePic} />
              ) : (
                <Avatar.Text size={45} label={user?.username?.[0]?.toUpperCase() || "F"} style={styles.avatar} />
              )}
            </Surface>
          </TouchableOpacity>
        </View>

        {/* ── GLASS WEATHER WIDGET ──────────────── */}
        <TouchableOpacity onPress={() => navigation.navigate("WeatherMain")}>
          <Surface style={styles.glassWeather}>
            <View style={styles.weatherMain}>
              <Ionicons name="cloud-done" size={40} color="#FFF" />
              <View style={styles.tempContainer}>
                <Text style={styles.tempValue}>{weatherData?.current?.temperature || "--"}°</Text>
                <Text style={styles.weatherCondition}>{t(weatherData?.current?.condition?.toLowerCase()) || t("sunny")}</Text>
              </View>
            </View>
            <View style={styles.weatherMeta}>
              <View style={styles.metaItem}>
                <Ionicons name="location" size={14} color="#FFF" opacity={0.8} />
                <Text style={styles.metaText}>{weatherData?.location?.state || t("nigeria")}</Text>
              </View>
              <View style={styles.metaDivider} />
              <View style={styles.metaItem}>
                <Ionicons name="water" size={14} color="#FFF" opacity={0.8} />
                <Text style={styles.metaText}>{weatherData?.current?.humidity || "45"}% {t("humidity")}</Text>
              </View>
            </View>
          </Surface>
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>

        {/* ── SCAN CALL TO ACTION ───────────────── */}
        <Surface style={styles.scanBanner}>
          <LinearGradient colors={["#43A047", "#2E7D32"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.bannerGradient}>
            <View style={styles.bannerContent}>
              <Text style={styles.bannerTitle}>{t("check_health")}</Text>
              <Text style={styles.bannerSub}>{t("analyze_ai")}</Text>
              <TouchableOpacity style={styles.bannerBtn} onPress={() => navigation.navigate("Scan")}>
                <Text style={styles.bannerBtnText}>{t("start_scan")}</Text>
              </TouchableOpacity>
            </View>
            <Ionicons name="leaf" size={80} color="rgba(255,255,255,0.2)" style={styles.bannerIcon} />
          </LinearGradient>
        </Surface>

        <Text style={styles.sectionTitle}>{t("smart_services")}</Text>
        <View style={styles.grid}>
          <ActionTile icon="camera" label={t("disease_scan")} color="#2E7D32" onPress={() => navigation.navigate("Scan")} />
          <ActionTile icon="thunderstorm" label={t("forecast")} color="#1976D2" onPress={() => navigation.navigate("WeatherMain")} />
          <ActionTile icon="people" label={t("community")} color="#E64A19" onPress={() => navigation.navigate("Contacts")} />
          <ActionTile icon="chatbubble-ellipses" label={t("consult_ai")} color="#7B1FA2" onPress={() => navigation.navigate("ChatScreen")} />
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FDFDFD" },
  header: {
    paddingTop: 60, paddingHorizontal: 25, paddingBottom: 40,
    borderBottomLeftRadius: 40, borderBottomRightRadius: 40,
  },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 25 },
  greetingText: { color: "rgba(255,255,255,0.8)", fontSize: 16, fontWeight: '500' },
  usernameText: { color: "#FFF", fontSize: 26, fontWeight: "bold", letterSpacing: 0.5 },
  avatarSurface: { borderRadius: 25, elevation: 8, backgroundColor: '#FFF' },
  profilePic: { width: 45, height: 45, borderRadius: 22.5 },
  avatar: { backgroundColor: "#4CAF50" },

  glassWeather: {
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 25,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    overflow: 'hidden',
  },
  weatherMain: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  tempContainer: { marginLeft: 15 },
  tempValue: { color: '#FFF', fontSize: 32, fontWeight: 'bold' },
  weatherCondition: { color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: '600' },
  weatherMeta: { flexDirection: 'row', alignItems: 'center' },
  metaItem: { flexDirection: 'row', alignItems: 'center' },
  metaText: { color: '#FFF', fontSize: 13, marginLeft: 5, fontWeight: '500' },
  metaDivider: { width: 1, height: 12, backgroundColor: 'rgba(255,255,255,0.3)', marginHorizontal: 15 },

  scrollBody: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
  scanBanner: { borderRadius: 20, overflow: 'hidden', elevation: 4, marginBottom: 25 },
  bannerGradient: { padding: 20, flexDirection: 'row', justifyContent: 'space-between' },
  bannerContent: { flex: 1 },
  bannerTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  bannerSub: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 4, marginBottom: 15 },
  bannerBtn: { backgroundColor: '#FFF', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 10, alignSelf: 'flex-start' },
  bannerBtnText: { color: '#2E7D32', fontWeight: 'bold', fontSize: 13 },
  bannerIcon: { position: 'absolute', right: -10, bottom: -10 },

  sectionTitle: { fontSize: 18, fontWeight: "800", color: "#1A1A1A", marginBottom: 15, marginLeft: 5 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  gridItem: { width: "48%", marginBottom: 15 },
  tileSurface: {
    backgroundColor: "#FFF",
    borderRadius: 18,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    borderLeftWidth: 4,
  },
  iconWrapper: { width: 45, height: 45, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  gridLabel: { fontWeight: "700", color: "#333", fontSize: 13, flex: 1, marginLeft: 12 },
  chevron: { opacity: 0.5 },
});
