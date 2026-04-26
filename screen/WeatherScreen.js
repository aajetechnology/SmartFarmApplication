import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Text, Card, Surface } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { FetchWeather } from '../src/api/api';
import * as Location from 'expo-location'
import { useTranslation } from '../src/context/LanguageContext';
const { width } = Dimensions.get('window');

export default function WeatherScreen() {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { t } = useTranslation();

  const fetchWeatherData = async () => {
    try {
      // 1. Start loading/refreshing state
      setLoading(weatherData ? false : true);

      // 2. Request Location Permissions
      let { status } = await Location.requestForegroundPermissionsAsync();
      
      let lat = null;
      let lon = null;

      // 3. Get GPS coordinates if permission granted
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        lat = location.coords.latitude;
        lon = location.coords.longitude;
        console.log(`WeatherScreen fetching for GPS: ${lat}, ${lon}`);
      } else {
        console.warn("Location permission denied. Backend will use IP or default.");
      }

      // 4. Call the API with the coordinates
      const data = await FetchWeather(lat, lon);
      
      // 5. Update state with the specific location data returned from backend
      setWeatherData({
        current: data.current,
        forecast: formatDailyForecast(data.daily),
        tomatoAdvice: data.tomato_advice,
        location: data.location, // Niger State/Minna details come from here
      });
      
      // 6. Cache for offline use
      await AsyncStorage.setItem('weather_cache', JSON.stringify(data));
      
    } catch (err) {
      console.error("Weather Fetch Error:", err);
      
      // 7. Fallback to cache if network fails
      const cached = await AsyncStorage.getItem('weather_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        setWeatherData({
          current: parsed.current,
          forecast: formatDailyForecast(parsed.daily),
          tomatoAdvice: parsed.tomato_advice,
          location: parsed.location,
        });
      } else {
        Alert.alert(t('connection_error'), t('unable_fetch_weather'));
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  const formatDailyForecast = (dailyData) => {
    if (!dailyData) return [];
    const days = [t('sun'), t('mon'), t('tue'), t('wed'), t('thu'), t('fri'), t('sat')];
    return dailyData.map((day) => {
      const date = new Date(day.date);
      return {
        day: days[date.getDay()],
        date: `${date.getDate()}/${date.getMonth() + 1}`,
        temp: Math.round(parseFloat(day.max_temp)),
        condition: day.precip_sum > 2 ? t('rainy') : t('clear'),
        icon: day.precip_sum > 2 ? 'rainy' : 'sunny',
      };
    });
  };

  useEffect(() => { fetchWeatherData(); }, []);

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#1976D2" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1e3c72', '#2a5298']} style={styles.headerBackground}>
        <View style={styles.locationHeader}>
          <View style={styles.locationRow}>
            <Ionicons name="location" size={20} color="#FF5252" />
            <Text style={styles.stateText}>{weatherData?.location?.state}</Text>
          </View>
          <Text style={styles.areaText}>{weatherData?.location?.area}</Text>
        </View>

        <View style={styles.mainWeatherSection}>
          <Ionicons name={weatherData?.current?.icon || 'partly-sunny'} size={100} color="#FFF" />
          <Text style={styles.mainTemp}>{weatherData?.current?.temperature}</Text>
          <Text style={styles.mainCondition}>{t(weatherData?.current?.condition)}</Text>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); fetchWeatherData();}} />}
      >
        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <Surface style={styles.statBox}>
            <Ionicons name="water-outline" size={24} color="#1976D2" />
            <Text style={styles.statValue}>{weatherData?.current?.humidity}</Text>
            <Text style={styles.statLabel}>{t("humidity")}</Text>
          </Surface>
          <Surface style={styles.statBox}>
            <Ionicons name="umbrella-outline" size={24} color="#1976D2" />
            <Text style={styles.statValue}>{weatherData?.current?.precipitation}mm</Text>
            <Text style={styles.statLabel}>{t("precipitation")}</Text>
          </Surface>
        </View>

        {/* Farming Insight - PROFESSIONAL CARD */}
        <Card style={styles.insightCard}>
          <LinearGradient colors={['#f6fff8', '#e8f5e9']} style={styles.insightGradient}>
            <View style={styles.insightHeader}>
              <View style={styles.insightIconCircle}>
                <Ionicons name="leaf" size={24} color="#2E7D32" />
              </View>
              <Text style={styles.insightTitle}>{t("agronomy_insight")}</Text>
            </View>
            <Text style={styles.insightBody}>{weatherData?.tomatoAdvice}</Text>
          </LinearGradient>
        </Card>

        {/* 7-Day Forecast */}
        <Text style={styles.sectionTitle}>{t("weekly_forecast")}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.forecastScroll}>
          {weatherData?.forecast?.map((item, index) => (
            <Surface key={index} style={styles.forecastItem}>
              <Text style={styles.forecastDay} color="#000">{item.day} </Text>
              <Ionicons name={item.icon} size={30} color="#1976D2" />
              <Text style={styles.forecastTemp} color="#000">{item.temp}°</Text>
            </Surface>
          ))}
        </ScrollView>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  center: { justifyContent: 'center', alignItems: 'center' },
  headerBackground: {
    paddingTop: 50,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    alignItems: 'center',
  },
  locationHeader: { alignItems: 'center', marginBottom: 20 },
  locationRow: { flexDirection: 'row', alignItems: 'center' },
  stateText: { color: '#FFF', fontSize: 22, fontWeight: 'bold', marginLeft: 5 },
  areaText: { color: 'rgba(255,255,255,0.8)', fontSize: 16 },
  mainWeatherSection: { alignItems: 'center' },
  mainTemp: { color: '#FFF', fontSize: 72, fontWeight: '200' },
  mainCondition: { color: '#FFF', fontSize: 20, letterSpacing: 1 },
  content: { flex: 1, paddingHorizontal: 20, marginTop: -20 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  statBox: {
    width: (width - 60) / 2,
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    backgroundColor: '#FFF',
    elevation: 4,
  },
  statValue: { fontSize: 18, fontWeight: 'bold', marginTop: 5, color:"#000" },
  statLabel: { fontSize: 12, color: '#AAA', color:"#000"},
  insightCard: { borderRadius: 20, overflow: 'hidden', elevation: 5, marginBottom: 25 },
  insightGradient: { padding: 20 },
  insightHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  insightIconCircle: { 
    backgroundColor: '#C8E6C9', 
    padding: 8, 
    borderRadius: 50, 
    marginRight: 10 
  },
  insightTitle: { fontSize: 18, fontWeight: 'bold', color: '#1B5E20' },
  insightBody: { fontSize: 15, color: '#333', lineHeight: 22 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, color: '#333' },
  forecastScroll: { paddingBottom: 10 },
  forecastItem: {
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 15,
    marginRight: 12,
    alignItems: 'center',
    width: 80,
    elevation: 2,
  },
  forecastDay: { fontWeight: 'bold', marginBottom: 10, color: '#040303ff' },
  forecastTemp: { fontSize: 18, fontWeight: 'bold', marginTop: 10, color:"#000"},
});