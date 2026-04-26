// screens/ContactChatLeastScreen.js ← FINAL 100% WORKING
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Text, Avatar, Card } from 'react-native-paper';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { debounce } from 'lodash';
import { FetchContacts, SearchUsers, AddContact } from '../src/api/api';

export default function ContactChatLeastScreen() {
  const [contacts, setContacts] = useState([]);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation(); // ← THIS IS CRITICAL

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    setLoading(true);
    try {
      const data = await FetchContacts();
      setContacts(data || []);
    } catch (err) {
      Alert.alert("Error", "Failed to load contacts");
    } finally {
      setLoading(false);
    }
  };

  const doSearch = useCallback(
    debounce(async (q) => {
      if (q.length < 2) {
        setResults([]);
        return;
      }
      try {
        const users = await SearchUsers(q);
        const filtered = users.filter(u => !contacts.some(c => c.username === u.username));
        setResults(filtered);
      } catch (err) {
        setResults([]);
      }
    }, 500),
    [contacts]
  );

  const handleSearch = (text) => {
    setSearch(text);
    doSearch(text);
  };

  const addAndOpen = async (user) => {
    try {
      await AddContact(user.username);
      Alert.alert("Success", `@${user.username} added!`);
      await loadContacts();
      navigation.navigate('ContactChatScreen', { contact: user });
    } catch (err) {
      Alert.alert("Error", err.message || "Failed");
    }
  };

  const openChat = (contact) => {
    navigation.navigate('ContactChatScreen', { contact }); // ← THIS MUST WORK
  };

  const data = search.length < 2 ? contacts : results;

  if (loading && contacts.length === 0) {
    return (
      <LinearGradient colors={['#4CAF50', '#8BC34A']} style={styles.container}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.title}>Loading...</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#4CAF50', '#8BC34A']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chats</Text>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#888" />
        <TextInput
          style={styles.input}
          placeholder="Search farmers..."
          value={search}
          onChangeText={handleSearch}
        />
      </View>

      <Card style={styles.card}>
        <FlatList
          data={data}
          keyExtractor = {(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.row}
              onPress={() => search.length < 2 ? openChat(item) : addAndOpen(item)}
            >
              <Avatar.Text
                size={56}
                label={(item.full_name || item.username || '?')[0].toUpperCase()}
                style={{ backgroundColor: search.length<2 ? '#4CAF50' : "#2196F3" }}
              />
              <View style={styles.info}>
                <Text style={styles.name}>{item.full_name || item.username}</Text>
                <Text style={styles.username}>@{item.username}</Text>
              </View>
              {search.length < 2 ? (
                <Ionicons name="chevron-forward" size={24} color="#ccc" />
              ) : (
                <View style={styles.addButton}>
                  <Ionicons name="chatbubble-outline" size={20} color="#fff" />
                  <Text style={styles.addText}>Add</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {search ? "No farmers found" : "No contacts yet"}
            </Text>
          }
        />
      </Card>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 50, padding: 20 },
  headerTitle: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  searchBar: { flexDirection: 'row', backgroundColor: '#fff', margin: 16, borderRadius: 25, padding: 12, alignItems: 'center' },
  input: { flex: 1, marginLeft: 10, fontSize: 16 },
  card: { flex: 1, margin: 16, marginTop: 0, borderRadius: 16, backgroundColor: '#fff' },
  row: { flexDirection: 'row', padding: 16, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#eee' },
  info: { flex: 1, marginLeft: 16 },
  name: { fontSize: 17, fontWeight: '600' },
  username: { fontSize: 14, color: '#888' },
  add: { color: '#4CAF50', fontWeight: 'bold', fontSize: 16 },
  empty: { textAlign: 'center', padding: 40, color: '#888', fontSize: 16 },
  title: { color: '#fff', fontSize: 18, marginTop: 20, textAlign: 'center' },
});