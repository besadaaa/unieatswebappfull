import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Card, Button, Switch } from 'react-native-paper';
import * as Animatable from 'react-native-animatable';
import { Ionicons } from '@expo/vector-icons';

import { useNotifications } from '../../contexts/NotificationContext';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../../theme/theme';

interface Notification {
  id: string;
  title: string;
  body: string;
  type: 'order' | 'promotion' | 'system' | 'reminder';
  timestamp: Date;
  read: boolean;
  data?: any;
}

interface NotificationsScreenProps {
  navigation: any;
}

export default function NotificationsScreen({ navigation }: NotificationsScreenProps) {
  const { notifications: contextNotifications, clearNotifications } = useNotifications();
  const [refreshing, setRefreshing] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    orderUpdates: true,
    promotions: true,
    reminders: true,
    sound: true,
    vibration: true,
  });

  // Mock notifications for demo
  const [notifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'Order Ready for Pickup!',
      body: 'Your order #ABC123 from Campus Cafe is ready for pickup.',
      type: 'order',
      timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      read: false,
    },
    {
      id: '2',
      title: '20% Off Pizza Today!',
      body: 'Get 20% off all pizza orders at Tony\'s Pizza. Limited time offer!',
      type: 'promotion',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      read: false,
    },
    {
      id: '3',
      title: 'Order Confirmed',
      body: 'Your order #XYZ789 has been confirmed and is being prepared.',
      type: 'order',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      read: true,
    },
    {
      id: '4',
      title: 'Don\'t forget your lunch!',
      body: 'It\'s almost lunch time. Check out today\'s specials.',
      type: 'reminder',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      read: true,
    },
    {
      id: '5',
      title: 'App Update Available',
      body: 'A new version of UniEats is available with bug fixes and improvements.',
      type: 'system',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      read: true,
    },
  ]);

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return timestamp.toLocaleDateString();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order':
        return 'receipt';
      case 'promotion':
        return 'pricetag';
      case 'system':
        return 'settings';
      case 'reminder':
        return 'alarm';
      default:
        return 'notifications';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'order':
        return colors.primary;
      case 'promotion':
        return colors.secondary;
      case 'system':
        return colors.info;
      case 'reminder':
        return colors.warning;
      default:
        return colors.textMuted;
    }
  };

  const handleNotificationPress = (notification: Notification) => {
    if (notification.type === 'order' && notification.data?.orderId) {
      navigation.navigate('OrderDetails', { orderId: notification.data.orderId });
    }
  };

  const renderNotification = ({ item, index }: { item: Notification; index: number }) => (
    <Animatable.View
      animation="fadeInUp"
      delay={index * 50}
      duration={600}
    >
      <TouchableOpacity onPress={() => handleNotificationPress(item)}>
        <Card style={[styles.notificationCard, !item.read && styles.unreadCard]}>
          <Card.Content style={styles.notificationContent}>
            <View style={styles.notificationHeader}>
              <View style={[styles.iconContainer, { backgroundColor: getNotificationColor(item.type) + '20' }]}>
                <Ionicons 
                  name={getNotificationIcon(item.type) as any} 
                  size={20} 
                  color={getNotificationColor(item.type)} 
                />
              </View>
              
              <View style={styles.notificationInfo}>
                <Text style={[styles.notificationTitle, !item.read && styles.unreadTitle]}>
                  {item.title}
                </Text>
                <Text style={styles.notificationBody} numberOfLines={2}>
                  {item.body}
                </Text>
                <Text style={styles.notificationTime}>
                  {formatTimestamp(item.timestamp)}
                </Text>
              </View>
              
              {!item.read && <View style={styles.unreadDot} />}
            </View>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    </Animatable.View>
  );

  const renderSettings = () => (
    <Animatable.View animation="fadeInUp" delay={200} duration={800}>
      <Card style={styles.settingsCard}>
        <Card.Content style={styles.settingsContent}>
          <Text style={styles.settingsTitle}>Notification Settings</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Order Updates</Text>
              <Text style={styles.settingDescription}>
                Get notified about order status changes
              </Text>
            </View>
            <Switch
              value={notificationSettings.orderUpdates}
              onValueChange={(value) => 
                setNotificationSettings(prev => ({ ...prev, orderUpdates: value }))
              }
              thumbColor={notificationSettings.orderUpdates ? colors.primary : colors.textMuted}
              trackColor={{ false: colors.border, true: colors.primary + '40' }}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Promotions</Text>
              <Text style={styles.settingDescription}>
                Receive offers and promotional notifications
              </Text>
            </View>
            <Switch
              value={notificationSettings.promotions}
              onValueChange={(value) => 
                setNotificationSettings(prev => ({ ...prev, promotions: value }))
              }
              thumbColor={notificationSettings.promotions ? colors.primary : colors.textMuted}
              trackColor={{ false: colors.border, true: colors.primary + '40' }}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Reminders</Text>
              <Text style={styles.settingDescription}>
                Get reminded about meal times and specials
              </Text>
            </View>
            <Switch
              value={notificationSettings.reminders}
              onValueChange={(value) => 
                setNotificationSettings(prev => ({ ...prev, reminders: value }))
              }
              thumbColor={notificationSettings.reminders ? colors.primary : colors.textMuted}
              trackColor={{ false: colors.border, true: colors.primary + '40' }}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Sound</Text>
              <Text style={styles.settingDescription}>
                Play sound for notifications
              </Text>
            </View>
            <Switch
              value={notificationSettings.sound}
              onValueChange={(value) => 
                setNotificationSettings(prev => ({ ...prev, sound: value }))
              }
              thumbColor={notificationSettings.sound ? colors.primary : colors.textMuted}
              trackColor={{ false: colors.border, true: colors.primary + '40' }}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Vibration</Text>
              <Text style={styles.settingDescription}>
                Vibrate for notifications
              </Text>
            </View>
            <Switch
              value={notificationSettings.vibration}
              onValueChange={(value) => 
                setNotificationSettings(prev => ({ ...prev, vibration: value }))
              }
              thumbColor={notificationSettings.vibration ? colors.primary : colors.textMuted}
              trackColor={{ false: colors.border, true: colors.primary + '40' }}
            />
          </View>
        </Card.Content>
      </Card>
    </Animatable.View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <Animatable.View animation="fadeInDown" duration={800}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Notifications</Text>
              <View style={styles.headerActions}>
                <Button
                  mode="text"
                  onPress={clearNotifications}
                  textColor={colors.primary}
                  compact
                >
                  Clear All
                </Button>
              </View>
            </View>
          </Animatable.View>
        }
        ListFooterComponent={renderSettings}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-outline" size={64} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No notifications</Text>
            <Text style={styles.emptySubtitle}>
              You're all caught up! New notifications will appear here.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  headerActions: {
    flexDirection: 'row',
  },
  notificationCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  notificationContent: {
    padding: spacing.md,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  notificationInfo: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  unreadTitle: {
    fontWeight: fontWeight.semibold,
  },
  notificationBody: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    lineHeight: 18,
  },
  notificationTime: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginTop: spacing.xs,
  },
  settingsCard: {
    margin: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  settingsContent: {
    padding: spacing.lg,
  },
  settingsTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  settingLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  settingDescription: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
