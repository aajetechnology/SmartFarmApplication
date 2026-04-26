import React, { useState, useRef, useContext, useEffect } from 'react';
import {
  View, StyleSheet, TextInput,
  Platform, FlatList, TouchableOpacity, ActivityIndicator, Alert,
  Keyboard, TouchableWithoutFeedback, Animated, StatusBar, Modal
} from 'react-native';
import { Audio } from 'expo-av';
import { Text, Avatar, Surface, IconButton, Button } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthContext } from '../src/context/AuthContext';
import { useTranslation } from '../src/context/LanguageContext';
import { AskFarmi, SendVoiceMessage, BASE_URL } from '../src/api/api';

export default function ChatScreen() {
  const { user } = useContext(AuthContext);
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  
  const [messages, setMessages] = useState([
    { id: '1', text: '👩‍🌾 ' + t('farmi_welcome'), sender: 'farmi' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef();
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const timerRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // expo-av recording ref
  const recordingRef = useRef(null);

  useEffect(() => {
    const showSub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', (e) => setKeyboardHeight(e.endCoordinates.height));
    const hideSub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setKeyboardHeight(0));
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.3, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  useEffect(() => {
    if (isRecording) {
      setRecordTime(0);
      timerRef.current = setInterval(() => {
        setRecordTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRecording]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const playFarmiVoice = async (base64Audio) => {
    try {
      const uri = `data:audio/mp3;base64,${base64Audio}`;
      const { sound } = await Audio.Sound.createAsync({ uri });
      await sound.playAsync();
    } catch (e) {
      console.log("Audio play error", e);
    }
  };

  const startRecording = async () => {
    try {
      // 1. Request Permission
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert(t("permission_required"), "Microphone access is needed to send voice messages.");
        return;
      }

      // 2. Configure Audio Mode for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // 3. Start Recording
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording', err);
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    if (!recordingRef.current) return;

    try {
      setIsRecording(false);
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      
      if (uri) {
        handleVoiceSend(uri);
      }
    } catch (error) {
      console.error("Failed to stop recording", error);
    }
  };

  const handleVoiceSend = async (uri) => {
    setLoading(true);
    setMessages(prev => [...prev, { id: Date.now().toString(), text: "🎤 " + t("sending_voice"), sender: 'user' }]);

    try {
      const data = await SendVoiceMessage(uri);
      if (data.status === 'success') {
        // Update the last message with transcription
        setMessages(prev => {
          const newMsgs = [...prev];
          newMsgs[newMsgs.length - 1].text = "🎤 " + data.user_message;
          return newMsgs;
        });

        // Add Farmi's response
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          text: data.translated_reply || data.reply,
          sender: 'farmi'
        }]);

        if (data.audio_base64) {
          await playFarmiVoice(data.audio_base64);
        }
      }
    } catch (error) {
      setMessages(prev => [...prev, { id: 'err', text: t("conn_error"), sender: 'farmi' }]);
    } finally {
      setLoading(false);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const handleSend = async () => {
    if (input.trim() === '' || loading) return;
    const userMsg = input.trim();
    setMessages(prev => [...prev, { id: Date.now().toString(), text: userMsg, sender: 'user' }]);
    setInput('');
    setLoading(true);

    try {
      const data = await AskFarmi(userMsg);
      if (data?.translated_reply || data?.reply) {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          text: data.translated_reply || data.reply,
          sender: 'farmi'
        }]);

        if (data.audio_base64) {
          playFarmiVoice(data.audio_base64);
        }
      }
    } catch (error) {
      setMessages(prev => [...prev, { id: 'err', text: t("conn_error"), sender: 'farmi' }]);
    } finally {
      setLoading(false);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const renderItem = ({ item }) => {
    const isUser = item.sender === 'user';
    let profilePic = user?.profile_pic;

    // Ensure we don't accidentally prefix absolute Cloudinary URLs
    if (profilePic && !profilePic.startsWith('http')) {
      profilePic = `${BASE_URL}${profilePic.startsWith('/') ? '' : '/'}${profilePic}`;
    }

    return (
      <View style={[styles.messageRow, isUser ? styles.userRow : styles.farmiRow]}>
        {!isUser && (
          <Avatar.Icon
            size={36}
            icon="leaf"
            style={styles.farmiAvatar}
            color="#FFF"
          />
        )}
        {isUser ? (
          <View style={styles.userMessageContainer}>
            <LinearGradient colors={['#2E7D32', '#43A047']} style={[styles.bubble, styles.userBubble]}>
              <Text style={styles.userText}>{item.text}</Text>
            </LinearGradient>
            {profilePic ? (
              <Avatar.Image size={32} source={{ uri: profilePic }} style={styles.userAvatar} />
            ) : (
              <Avatar.Text size={32} label={(user?.username || 'U')[0].toUpperCase()} style={styles.userAvatar} />
            )}
          </View>
        ) : (
          <Surface style={[styles.bubble, styles.farmiBubble]}>
            <Text style={styles.farmiText}>{item.text}</Text>
          </Surface>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* ── RECORDING POPUP ───────────────────── */}
      <Modal visible={isRecording} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Surface style={styles.recordingCard} elevation={10}>
            <LinearGradient colors={['#FF5252', '#D32F2F']} style={styles.recordingCircle}>
              <Animated.View style={[styles.ripple, { transform: [{ scale: pulseAnim }] }]} />
              <Ionicons name="mic" size={40} color="#FFF" />
            </LinearGradient>

            <Text style={styles.recordingTitle}>{t("recording")}</Text>
            <Text style={styles.timerText}>{formatTime(recordTime)}</Text>

            <View style={styles.modalButtons}>
              <Button
                mode="contained"
                onPress={stopRecording}
                style={styles.doneBtn}
                contentStyle={{ height: 50 }}
              >
                {t("finish")}
              </Button>
            </View>

            <Text style={styles.releaseText}>{t("release_to_send")}</Text>
          </Surface>
        </View>
      </Modal>

      {/* ── GLASS HEADER ──────────────────────── */}
      <LinearGradient colors={['#1B5E20', '#2E7D32']} style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Avatar.Icon size={40} icon="leaf" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} color="#FFF" />
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle}>{t("farmi_ai")}</Text>
              <View style={styles.statusRow}>
                <View style={styles.statusDot} />
                <Text style={styles.headerSubtitle}>{t("chat_help")}</Text>
              </View>
            </View>
          </View>
          <IconButton icon="dots-vertical" iconColor="#FFF" />
        </View>
      </LinearGradient>

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={[styles.content, { marginBottom: keyboardHeight > 0 ? keyboardHeight - (Platform.OS === 'android' ? insets.bottom : 0) : 0 }]}>
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.list}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />

          {loading && (
            <View style={styles.loadingArea}>
              <ActivityIndicator size="small" color="#2E7D32" />
              <Text style={styles.loadingText}>{t("analyzing")}</Text>
            </View>
          )}

          {/* ── PREMIUM INPUT ────────────────────── */}
          <Surface style={[styles.inputContainer, { paddingBottom: keyboardHeight > 0 ? 15 : Math.max(insets.bottom, 20) }]} elevation={5}>
            <View style={styles.inputInner}>
              <TextInput
                style={styles.input}
                placeholder={t("chat_placeholder")}
                value={input}
                onChangeText={setInput}
                placeholderTextColor="#999"
                multiline
              />

              {input.trim() || isRecording ? (
                <TouchableOpacity
                  onPress={handleSend}
                  style={[styles.sendBtn, { backgroundColor: input.trim() ? '#2E7D32' : '#F0F0F0' }]}
                  disabled={!input.trim() || loading}
                >
                  <Ionicons name="arrow-up" size={24} color={input.trim() ? "#FFF" : "#CCC"} />
                </TouchableOpacity>
              ) : (
                <View style={styles.recorderWrapper}>
                  <TouchableOpacity
                    onPressIn={startRecording}
                    onPressOut={stopRecording}
                    style={[styles.sendBtn, { backgroundColor: isRecording ? '#FF5252' : '#2E7D32' }]}
                    disabled={loading}
                  >
                    <Ionicons name={isRecording ? "mic" : "mic-outline"} size={24} color="#FFF" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </Surface>
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FBFC' },
  header: { paddingBottom: 15, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, elevation: 5 },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerInfo: { marginLeft: 12 },
  headerTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4CAF50', marginRight: 6 },
  headerSubtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },

  content: { flex: 1 },
  list: { padding: 20, paddingBottom: 30 },
  messageRow: { flexDirection: 'row', marginBottom: 20, alignItems: 'flex-end' },
  userRow: { justifyContent: 'flex-end' },
  farmiRow: { justifyContent: 'flex-start' },

  farmiAvatar: { backgroundColor: '#2E7D32', marginRight: 10, elevation: 2 },
  userMessageContainer: { flexDirection: 'row', alignItems: 'flex-end', maxWidth: '85%' },
  userAvatar: { marginLeft: 8, elevation: 2 },

  aiAvatarCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', elevation: 2, marginRight: 10 },

  bubble: { maxWidth: '80%', padding: 15, borderRadius: 22 },
  userBubble: { borderBottomRightRadius: 4, elevation: 3 },
  farmiBubble: { backgroundColor: '#FFF', borderBottomLeftRadius: 4, elevation: 2, marginLeft: 0 },

  userText: { color: '#FFF', fontSize: 15, lineHeight: 22, fontWeight: '500' },
  farmiText: { color: '#333', fontSize: 15, lineHeight: 22 },

  loadingArea: { flexDirection: 'row', alignItems: 'center', marginLeft: 25, marginBottom: 15 },
  loadingText: { color: '#666', fontSize: 12, marginLeft: 10, fontStyle: 'italic' },

  inputContainer: { backgroundColor: '#FFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 20, paddingTop: 15 },
  inputInner: { flexDirection: 'row', alignItems: 'flex-end', backgroundColor: '#F2F4F7', borderRadius: 25, paddingHorizontal: 15, paddingVertical: 8 },
  input: { flex: 1, maxHeight: 120, fontSize: 16, color: '#000', paddingVertical: 10 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 2 },
  recorderWrapper: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  pulseCircle: { position: 'absolute', width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255, 82, 82, 0.4)' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  recordingCard: { width: '80%', padding: 40, borderRadius: 35, alignItems: 'center', backgroundColor: '#FFF' },
  recordingCircle: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  ripple: { ...StyleSheet.absoluteFillObject, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.3)' },
  recordingTitle: { fontSize: 20, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 10 },
  timerText: { fontSize: 32, fontWeight: 'bold', color: '#FF5252', marginBottom: 15, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  modalButtons: { width: '100%', marginBottom: 15 },
  doneBtn: { backgroundColor: '#FF5252', borderRadius: 15 },
  releaseText: { color: '#666', fontSize: 14, textAlign: 'center' },
});
