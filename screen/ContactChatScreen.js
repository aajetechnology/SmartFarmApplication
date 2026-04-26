import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Platform,
  Keyboard,
  StatusBar,
  ActivityIndicator
} from 'react-native';
import { Text, Avatar } from 'react-native-paper';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // Import this
import { FetchMessages, BASE_URL } from '../src/api/api';

export default function ContactChatScreen() {
  const route = useRoute();
  const { contact } = route.params || {};
  const navigation = useNavigation();
  const insets = useSafeAreaInsets(); // Hook for system bars
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [ws, setWs] = useState(null);
  const flatListRef = useRef(null);

  // --- MANUAL KEYBOARD TRACKING ---
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => setKeyboardHeight(e.endCoordinates.height)
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0)
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);
  // --------------------------------

  useEffect(() => {
    fetchMessages();
    connectWebSocket();
    return () => ws?.close();
  }, [contact?.id]);

  const fetchMessages = async () => {
    try {
      const data = await FetchMessages(contact.id);
      setMessages(Array.isArray(data) ? data : (data?.messages || []));
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 200);
    } catch (err) { console.log("Fetch error"); }
  };

  const connectWebSocket = async () => {
    try {
      const token = await AsyncStorage.getItem("access_token");
      if (!token) {
        console.warn("No access token found, skipping WebSocket connection.");
        return;
      }

      // Fix: Protocol must be wss:// (for Render production)
      // Fix: Added missing '/' before 'api'
      // Use local IP for dev, matching api.js
      const domain = BASE_URL.replace('http://', '').replace('https://', '');
      const protocol = BASE_URL.startsWith('https') ? 'wss' : 'ws';
      const wsUrl = `${protocol}://${domain}/api/social/ws/chat?token=${token}`;

      const socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        console.log("✅ WebSocket Connected");
        setWs(socket);
      };

      socket.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          setMessages((prev) => [...prev, data]);
        } catch (err) {
          console.error("Error parsing WebSocket message:", err);
        }
      };

      socket.onerror = (error) => {
        console.error("❌ WebSocket Error:", error.message);
      };

      socket.onclose = (e) => {
        console.log("ℹ️ WebSocket Closed:", e.code, e.reason);
        setWs(null);
      };

    } catch (err) {
      console.error("WebSocket connection failed:", err);
    }
  };

  const sendMessage = () => {
    if (!newMessage.trim() || ws?.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ contact_id: contact.id, content: newMessage.trim() }));
    setNewMessage('');
  };

  return (
    <View style={styles.container}>
      {/* Header with safe area top padding */}
      <LinearGradient 
        colors={['#128c1eff', '#0b5e07ff']} 
        style={[styles.header, { paddingTop: insets.top + 10 }]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Avatar.Text 
          size={40} 
          label={(contact?.username || '?')[0].toUpperCase()} 
          style={{ marginLeft: 10, backgroundColor: '#2a422aff' }} 
        />
        <View style={{ marginLeft: 15 }}>
          <Text style={styles.name}>{contact?.full_name || contact?.username}</Text>
          <Text style={{ color: '#888', fontSize: 12 }}>Online</Text>
        </View>
      </LinearGradient>

      {/* Manual Keyboard Wrapper */}
      <View style={[
        styles.chatContent, 
        { marginBottom: keyboardHeight > 0 ? keyboardHeight - (Platform.OS === 'android' ? insets.bottom : 0) : 0 }
      ]}>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item, index) => item.id?.toString() || index.toString()}
          renderItem={({ item }) => {
            const isMine = item.sender_id !== contact.id;
            return (
              <View style={[styles.msgRow, isMine ? styles.right : styles.left]}>
                <View style={[styles.bubble, isMine ? styles.mine : styles.theirs]}>
                  <Text style={styles.msgText}>{item.content}</Text>
                </View>
              </View>
            );
          }}
          contentContainerStyle={{ padding: 10, flexGrow: 1 }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        <View style={[
          styles.inputBar, 
          { paddingBottom: keyboardHeight > 0 ? 10 : Math.max(insets.bottom, 15) }
        ]}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor="#888"
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
          />
          <TouchableOpacity onPress={sendMessage} style={styles.sendBtn}>
            <Ionicons name="send" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#142111ff' },
  chatContent: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 15, 
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2c34'
  },
  name: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  msgRow: { marginVertical: 4, width: '100%' },
  left: { alignItems: 'flex-start' },
  right: { alignItems: 'flex-end' },
  bubble: { maxWidth: '80%', padding: 12, borderRadius: 18 },
  mine: { backgroundColor: '#128c16ff', borderBottomRightRadius: 2 },
  theirs: { backgroundColor: '#2b422aff', borderBottomLeftRadius: 2 },
  msgText: { color: '#fff', fontSize: 16 },
  inputBar: { 
    flexDirection: 'row', 
    paddingHorizontal: 10, 
    paddingTop: 10,
    backgroundColor: '#1f2c34', 
    alignItems: 'center',
  },
  input: { 
    flex: 1, 
    backgroundColor: '#2a422aff', 
    color: '#fff', 
    borderRadius: 25, 
    paddingHorizontal: 15, 
    paddingVertical: 10,
    marginRight: 10,
    maxHeight: 100,
    fontSize: 16
  },
  sendBtn: { 
    backgroundColor: '#128c22ff', 
    width: 48, 
    height: 48, 
    borderRadius: 24, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
});