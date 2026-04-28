import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Image,
  StatusBar
} from 'react-native';
import { Audio } from 'expo-av';
import { Text, Surface, Button, Divider, IconButton } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { PredictPlant } from '../src/api/api';
import { useTranslation } from '../src/context/LanguageContext';

const { width } = Dimensions.get('window');

export default function ScanScreen() {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [hasError, setHasError] = useState(false);
  const [soundObj, setSoundObj] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const { t } = useTranslation();

  const playAdvice = async (base64Audio) => {
    try {
      if (soundObj) {
        await soundObj.unloadAsync();
      }
      const uri = `data:audio/mp3;base64,${base64Audio}`;
      const { sound } = await Audio.Sound.createAsync({ uri });
      setSoundObj(sound);
      setIsPlaying(true);
      await sound.playAsync();

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setIsPlaying(false);
        }
      });
    } catch (e) {
      console.log("Audio Error", e);
    }
  };

  const toggleAudio = async () => {
    if (!soundObj) {
      if (result?.audio_base64) {
        await playAdvice(result.audio_base64);
      }
      return;
    }
    if (isPlaying) {
      await soundObj.pauseAsync();
      setIsPlaying(false);
    } else {
      await soundObj.playAsync();
      setIsPlaying(true);
    }
  };

  useEffect(() => {
    return soundObj
      ? () => {
          soundObj.unloadAsync();
        }
      : undefined;
  }, [soundObj]);

  const pickImage = async (useCamera = true) => {
    setHasError(false);
    setResult(null);

    const permissionResult = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      alert("Permission required!");
      return;
    }

    const pickerResult = useCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.7 })
      : await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

    if (!pickerResult.canceled) {
      const selectedImage = pickerResult.assets[0];
      setImage(selectedImage.uri);
      handleScan(selectedImage.uri);
    }
  };

  const handleScan = async (uri) => {
    setLoading(true);
    setHasError(false);

    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      let lat = 0, lon = 0;
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        lat = loc.coords.latitude;
        lon = loc.coords.longitude;
      }

      const data = await PredictPlant(uri, lat, lon);
      setResult(data);

      if (data.audio_base64) {
        await playAdvice(data.audio_base64);
      }
    } catch (err) {
      setHasError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#1B5E20', '#2E7D32']} style={styles.header}>
        <Text style={styles.headerTitle}>{t("crop_health_ai")}</Text>
        <Text style={styles.headerSubtitle}>{t("analyze_instantly")}</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Surface style={styles.previewContainer}>
          {image ? (
            <Image source={{ uri: image }} style={styles.previewImage} />
          ) : (
            <View style={styles.placeholder}>
              <Ionicons name="scan-outline" size={70} color="#CCC" />
              <Text style={styles.placeholderText}>{t("no_image_selected")}</Text>
            </View>
          )}
          {loading && (
            <View style={styles.scanOverlay}>
              <ActivityIndicator size="large" color="#FFF" />
              <Text style={styles.scanText}>{t("neural_analysis")}</Text>
            </View>
          )}
        </Surface>

        {!loading && !result && (
          <View style={styles.actionGrid}>
            <TouchableOpacity style={styles.mainAction} onPress={() => pickImage(true)}>
              <LinearGradient colors={['#4CAF50', '#2E7D32']} style={styles.actionGrad}>
                <Ionicons name="camera" size={32} color="#FFF" />
                <Text style={styles.actionLabel}>{t("take_photo")}</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.mainAction} onPress={() => pickImage(false)}>
              <Surface style={styles.secondaryAction}>
                <Ionicons name="images" size={32} color="#2E7D32" />
                <Text style={[styles.actionLabel, { color: '#2E7D32' }]}>{t("gallery")}</Text>
              </Surface>
            </TouchableOpacity>
          </View>
        )}

        {result && (
          <Surface style={styles.resultSurface}>
            <View style={styles.resultHeader}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{t("diagnosis")}</Text>
              </View>
              {result.audio_base64 && (
                <IconButton 
                  icon={isPlaying ? "pause" : "volume-high"} 
                  iconColor={isPlaying ? "#4CAF50" : "#2E7D32"} 
                  onPress={toggleAudio} 
                />
              )}
            </View>

            <Text style={styles.diseaseName}>{t(result.prediction)}</Text>
            <View style={styles.confRow}>
              <Text style={styles.confLabel}>{t("accuracy_confidence")}</Text>
              <Text style={styles.confVal}>{(result.confidence * 100).toFixed(1)}%</Text>
            </View>
            <View style={styles.progressBack}>
              <View style={[styles.progressBar, { width: `${result.confidence * 100}%` }]} />
            </View>

            <Divider style={styles.divider} />

            <View style={styles.adviceCard}>
              <View style={styles.adviceHead}>
                <TouchableOpacity onPress={toggleAudio}>
                  <Ionicons name="sparkles" size={18} color={isPlaying ? "#4CAF50" : "#2E7D32"} />
                </TouchableOpacity>
                <Text style={styles.adviceTitle}>{t("expert_advice")}</Text>
              </View>
              <Text style={styles.adviceBody}>{result.farmi_advice || t("no_advice")}</Text>
            </View>

            <Button mode="contained" onPress={() => { setResult(null); setImage(null) }} style={styles.resetBtn}>
              {t("new_scan")}
            </Button>
          </Surface>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { padding: 30, paddingTop: 60, borderBottomLeftRadius: 35, borderBottomRightRadius: 35 },
  headerTitle: { color: '#FFF', fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
  headerSubtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 14, textAlign: 'center', marginTop: 4 },
  scrollContent: { padding: 20 },
  previewContainer: { height: 320, borderRadius: 30, overflow: 'hidden', backgroundColor: '#FFF', elevation: 5, marginBottom: 25 },
  previewImage: { width: '100%', height: '100%' },
  placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  placeholderText: { color: '#AAA', marginTop: 15, fontWeight: '600' },
  scanOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(27, 94, 32, 0.7)', justifyContent: 'center', alignItems: 'center' },
  scanText: { color: '#FFF', marginTop: 15, fontWeight: 'bold', letterSpacing: 1 },

  actionGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  mainAction: { width: '48%', height: 120, borderRadius: 25, overflow: 'hidden', elevation: 4 },
  actionGrad: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  secondaryAction: { flex: 1, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
  actionLabel: { color: '#FFF', fontWeight: 'bold', marginTop: 8 },

  resultSurface: { padding: 25, borderRadius: 30, backgroundColor: '#FFF', elevation: 8 },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  badge: { backgroundColor: '#E8F5E9', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
  badgeText: { color: '#2E7D32', fontWeight: 'bold', fontSize: 11, textTransform: 'uppercase' },
  diseaseName: { fontSize: 28, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 10 },
  confRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  confLabel: { color: '#666', fontSize: 12 },
  confVal: { fontWeight: 'bold', color: '#2E7D32' },
  progressBack: { height: 6, backgroundColor: '#F0F0F0', borderRadius: 3, overflow: 'hidden', marginBottom: 20 },
  progressBar: { height: '100%', backgroundColor: '#2E7D32' },
  divider: { marginBottom: 20 },
  adviceCard: { backgroundColor: '#F5FAF5', padding: 18, borderRadius: 20, borderLeftWidth: 4, borderLeftColor: '#2E7D32' },
  adviceHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  adviceTitle: { fontWeight: 'bold', color: '#2E7D32', marginLeft: 8 },
  adviceBody: { lineHeight: 22, color: '#333' },
  resetBtn: { marginTop: 20, borderRadius: 15, backgroundColor: '#2E7D32' }
});
