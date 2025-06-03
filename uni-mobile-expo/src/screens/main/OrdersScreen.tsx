import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Card, Chip, Button } from 'react-native-paper';
import * as Animatable from 'react-native-animatable';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../../theme/theme';

interface Order {
  id: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  total_amount: number;
  delivery_fee: number | null;
  service_fee: number | null;
  notes: string | null;
  estimated_delivery_time: string | null;
  created_at: string;
  cafeteria: {
    name: string;
    location: string | null;
  };
  order_items: {
    quantity: number;
    price: number;
    menu_item: {
      name: string;
      image_url: string | null;
    };
  }[];
}

interface OrdersScreenProps {
  navigation: any;
}

export default function OrdersScreen({ navigation }: OrdersScreenProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('All');
  
  const { user } = useAuth();

  const statusOptions = ['All', 'pending', 'confirmed', 'preparing', 'ready', 'completed'];

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      if (!user) return;

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          cafeteria:cafeterias(name, location),
          order_items(
            quantity,
            price,
            menu_item:menu_items(name, image_url)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
        return;
      }

      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const filteredOrders = selectedStatus === 'All' 
    ? orders 
    : orders.filter(order => order.status === selectedStatus);

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return colors.warning;
      case 'confirmed':
        return colors.info;
      case 'preparing':
        return colors.tertiary;
      case 'ready':
        return colors.secondary;
      case 'completed':
        return colors.success;
      case 'cancelled':
        return colors.error;
      default:
        return colors.textMuted;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return 'time-outline';
      case 'confirmed':
        return 'checkmark-circle-outline';
      case 'preparing':
        return 'restaurant-outline';
      case 'ready':
        return 'bag-check-outline';
      case 'completed':
        return 'checkmark-done-circle-outline';
      case 'cancelled':
        return 'close-circle-outline';
      default:
        return 'help-circle-outline';
    }
  };

  const renderOrderCard = ({ item, index }: { item: Order; index: number }) => (
    <Animatable.View
      animation="fadeInUp"
      delay={index * 100}
      duration={600}
    >
      <TouchableOpacity
        onPress={() => navigation.navigate('OrderDetails', { orderId: item.id })}
      >
        <Card style={styles.orderCard}>
          <Card.Content style={styles.cardContent}>
            {/* Order Header */}
            <View style={styles.orderHeader}>
              <View style={styles.orderInfo}>
                <Text style={styles.orderNumber}>
                  Order #{item.id.slice(-6).toUpperCase()}
                </Text>
                <Text style={styles.cafeteriaName}>
                  {item.cafeteria?.name || 'Unknown Cafeteria'}
                </Text>
                <Text style={styles.orderDate}>
                  {formatDate(item.created_at)}
                </Text>
              </View>
              
              <View style={styles.orderMeta}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                  <Ionicons 
                    name={getStatusIcon(item.status) as any} 
                    size={16} 
                    color={getStatusColor(item.status)} 
                  />
                  <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </Text>
                </View>
                <Text style={styles.totalAmount}>
                  {formatCurrency(item.total_amount)}
                </Text>
              </View>
            </View>

            {/* Order Items Preview */}
            <View style={styles.itemsPreview}>
              <Text style={styles.itemsTitle}>Items:</Text>
              <View style={styles.itemsList}>
                {item.order_items.slice(0, 2).map((orderItem, idx) => (
                  <Text key={idx} style={styles.itemText}>
                    {orderItem.quantity}x {orderItem.menu_item.name}
                  </Text>
                ))}
                {item.order_items.length > 2 && (
                  <Text style={styles.moreItemsText}>
                    +{item.order_items.length - 2} more items
                  </Text>
                )}
              </View>
            </View>

            {/* Order Actions */}
            <View style={styles.orderActions}>
              {item.status === 'ready' && (
                <Button
                  mode="contained"
                  onPress={() => {/* Handle pickup confirmation */}}
                  style={styles.actionButton}
                  buttonColor={colors.secondary}
                  compact
                >
                  Confirm Pickup
                </Button>
              )}
              
              {item.status === 'pending' && (
                <Button
                  mode="outlined"
                  onPress={() => {/* Handle cancel order */}}
                  style={styles.actionButton}
                  textColor={colors.error}
                  compact
                >
                  Cancel Order
                </Button>
              )}
              
              <Button
                mode="text"
                onPress={() => navigation.navigate('OrderDetails', { orderId: item.id })}
                textColor={colors.primary}
                compact
              >
                View Details
              </Button>
            </View>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    </Animatable.View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
        <Text style={styles.headerSubtitle}>
          {orders.length} {orders.length === 1 ? 'order' : 'orders'}
        </Text>
      </View>

      {/* Status Filter */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={statusOptions}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.statusFilterContent}
        renderItem={({ item, index }) => (
          <Animatable.View
            animation="fadeInRight"
            delay={index * 50}
          >
            <Chip
              selected={selectedStatus === item}
              onPress={() => setSelectedStatus(item)}
              style={[
                styles.statusChip,
                selectedStatus === item && styles.selectedStatusChip,
              ]}
              textStyle={[
                styles.statusChipText,
                selectedStatus === item && styles.selectedStatusChipText,
              ]}
            >
              {item}
            </Chip>
          </Animatable.View>
        )}
      />

      {/* Orders List */}
      <FlatList
        data={filteredOrders}
        renderItem={renderOrderCard}
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
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No orders found</Text>
            <Text style={styles.emptySubtitle}>
              {selectedStatus === 'All' 
                ? "You haven't placed any orders yet"
                : `No ${selectedStatus} orders found`
              }
            </Text>
            {selectedStatus === 'All' && (
              <Button
                mode="contained"
                onPress={() => navigation.navigate('Home')}
                style={styles.browseButton}
                buttonColor={colors.primary}
              >
                Browse Cafeterias
              </Button>
            )}
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
  header: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  statusFilterContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  statusChip: {
    backgroundColor: colors.surfaceVariant,
    marginRight: spacing.sm,
  },
  selectedStatusChip: {
    backgroundColor: colors.primary,
  },
  statusChipText: {
    color: colors.textMuted,
  },
  selectedStatusChipText: {
    color: 'white',
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  orderCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  cardContent: {
    padding: spacing.md,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  cafeteriaName: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  orderDate: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  orderMeta: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
    gap: 4,
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  totalAmount: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  itemsPreview: {
    marginBottom: spacing.md,
  },
  itemsTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  itemsList: {
    gap: 2,
  },
  itemText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  moreItemsText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  orderActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  actionButton: {
    borderRadius: borderRadius.md,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
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
    marginBottom: spacing.xl,
  },
  browseButton: {
    borderRadius: borderRadius.lg,
  },
});
