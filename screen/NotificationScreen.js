import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Card, Avatar, Button } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import API from '../src/api/api'; // Import your configured axios instance

export default function NotificationScreen() {
  const [notifications, setNotifications] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // Helper to get visual styles based on notification type
  const getVisuals = (type) => {
    switch (type) {
      case 'weather':
        return { icon: 'weather-cloudy', color: '#FF9800', label: 'Weather Alert' };
      case 'security':
        return { icon: 'shield-alert', color: '#F44336', label: 'Security Alert' };
      case 'friend_request':
        return { icon: 'account-plus', color: '#2196F3', label: 'Social' };
      case 'message':
        return { icon: 'chat-processing', color: '#4CAF50', label: 'New Message' };
      case 'broadcast':
        return { icon: 'bullhorn', color: '#9C27B0', label: 'Official' };
      default:
        return { icon: 'bell', color: '#607D8B', label: 'Notification' };
    }
  };

  const fetchNotifications = async () => {
    try {
      // Backend route is registered as app.include_router(notify_router, prefix="/api")
      // And notify.py has prefix="/notify"
      const res = await API.get('/api/notify/'); 
      
      const { notifications: rawData } = res.data;

      // Transform raw data into displayable items
      const list = rawData.map(item => ({
        id: item.id.toString(),
        title: item.title,
        message: item.content,
        time: new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isRead: item.is_read,
        ...getVisuals(item.type)
      }));

      // Empty State
      if (list.length === 0) {
        list.push({
          id: 'empty',
          title: 'All Good!',
          message: 'No new alerts. Your farm is doing great!',
          time: 'Now',
          icon: 'check-circle',
          color: '#4CAF50',
          label: 'Status'
        });
      }

      setNotifications(list);
    } catch (err) {
      console.error("Fetch Error:", err);
      setNotifications([{
        id: 'error',
        title: 'Connection Error',
        message: 'Could not load alerts. Please check your internet.',
        time: 'Now',
        icon: 'alert-circle',
        color: '#F44336',
        label: 'Error'
      }]);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const renderItem = ({ item }) => (
    <Card style={[styles.card, !item.isRead && item.id !== 'empty' && styles.unreadCard]}>
      <View style={styles.cardRow}>
        <Avatar.Icon
          size={48}
          icon={item.icon}
          style={[styles.avatar, { backgroundColor: item.color }]}
        />
        <View style={styles.cardContent}>
          <View style={styles.titleRow}>
             <Text style={styles.cardLabel}>{item.label}</Text>
             <Text style={styles.cardTime}>{item.time}</Text>
          </View>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardMessage}>{item.message}</Text>
        </View>
      </View>
    </Card>
  );

  return (
    <LinearGradient colors={['#1B5E20', '#388E3C']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        <Text style={styles.subtitle}>Real-time Farm Monitoring</Text>
      </View>

      <FlatList
        data={notifications}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4CAF50']} />
        }
      />

      <Button
        mode="contained"
        onPress={onRefresh}
        style={styles.refreshButton}
        icon="refresh"
      >
        Refresh Alerts
      </Button>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { alignItems: 'center', paddingTop: 60, paddingBottom: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 16, color: '#C8E6C9', marginTop: 5 },
  list: { padding: 16, paddingBottom: 100 },
  card: {
    marginBottom: 12,
    borderRadius: 15,
    backgroundColor: '#fff',
    elevation: 4,
  },
  unreadCard: {
    borderLeftWidth: 5,
    borderLeftColor: '#4CAF50',
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', padding: 15 },
  avatar: { marginRight: 15 },
  cardContent: { flex: 1 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  cardLabel: { fontSize: 12, fontWeight: 'bold', color: '#888', textTransform: 'uppercase' },
  cardTitle: { fontSize: 17, fontWeight: 'bold', color: '#333' },
  cardMessage: { fontSize: 14, color: '#555', marginTop: 2, lineHeight: 18 },
  cardTime: { fontSize: 11, color: '#999' },
  refreshButton: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    borderRadius: 25,
    backgroundColor: '#1B5E20',
    paddingHorizontal: 20,
  },
});