import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  RefreshControl,
  Alert,
} from 'react-native';
import { Card, Button, Divider } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { Ionicons } from '@expo/vector-icons';

import { supabase } from '../../services/supabase';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../../theme/theme';

interface OrderDetails {
  id: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  total_amount: number;
  delivery_fee: number | null;
  service_fee: number | null;
  notes: string | null;
  estimated_delivery_time: string | null;
  created_at: string;
  updated_at: string;
  cafeteria: {
    name: string;
    location: string | null;
    phone: string | null;
    image_url: string | null;
  };
  order_items: {
    id: string;
    quantity: number;
    price: number;
    special_instructions: string | null;
    menu_item: {
      name: string;
      description: string | null;
      image_url: string | null;
    };
  }[];
}

interface OrderDetailsScreenProps {
  route: {
    params: {
      orderId: string;
    };
  };
  navigation: any;
}

export default function OrderDetailsScreen({ route, navigation }: OrderDetailsScreenProps) {
  const { orderId } = route.params;
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          cafeteria:cafeterias(name, location, phone, image_url),
          order_items(
            id,
            quantity,
            price,
            special_instructions,
            menu_item:menu_items(name, description, image_url)
          )
        `)
        .eq('id', orderId)
        .single();

      if (error) {
        console.error('Error fetching order details:', error);
        Alert.alert('Error', 'Failed to load order details');
        navigation.goBack();
        return;
      }

      setOrder(data);
    } catch (error) {
      console.error('Error fetching order details:', error);
      Alert.alert('Error', 'Failed to load order details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrderDetails();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
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

  const handleCancelOrder = () => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order?',
      [
        { text: 'No', style: 'cancel' },
        { text: 'Yes, Cancel', style: 'destructive', onPress: cancelOrder },
      ]
    );
  };

  const cancelOrder = async () => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId);

      if (error) {
        Alert.alert('Error', 'Failed to cancel order');
        return;
      }

      Alert.alert('Order Cancelled', 'Your order has been cancelled successfully');
      await fetchOrderDetails();
    } catch (error) {
      Alert.alert('Error', 'Failed to cancel order');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading order details...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Order not found</Text>
      </View>
    );
  }

  const subtotal = order.order_items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
    >
      {/* Order Status */}
      <Animatable.View animation="fadeInDown" duration={800}>
        <Card style={styles.statusCard}>
          <Card.Content style={styles.statusContent}>
            <View style={styles.statusHeader}>
              <View style={[styles.statusIcon, { backgroundColor: getStatusColor(order.status) + '20' }]}>
                <Ionicons 
                  name={getStatusIcon(order.status) as any} 
                  size={32} 
                  color={getStatusColor(order.status)} 
                />
              </View>
              <View style={styles.statusInfo}>
                <Text style={styles.orderNumber}>
                  Order #{order.id.slice(-6).toUpperCase()}
                </Text>
                <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </Text>
                <Text style={styles.orderDate}>
                  Placed on {formatDate(order.created_at)}
                </Text>
              </View>
            </View>

            {order.estimated_delivery_time && (
              <View style={styles.estimatedTime}>
                <Ionicons name="time" size={16} color={colors.textMuted} />
                <Text style={styles.estimatedTimeText}>
                  Estimated ready time: {formatDate(order.estimated_delivery_time)}
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>
      </Animatable.View>

      {/* Cafeteria Info */}
      <Animatable.View animation="fadeInUp" delay={200} duration={800}>
        <Card style={styles.cafeteriaCard}>
          <Card.Content style={styles.cafeteriaContent}>
            <View style={styles.cafeteriaHeader}>
              <View style={styles.cafeteriaImageContainer}>
                {order.cafeteria.image_url ? (
                  <Image source={{ uri: order.cafeteria.image_url }} style={styles.cafeteriaImage} />
                ) : (
                  <LinearGradient
                    colors={[colors.primary, colors.primaryDark]}
                    style={styles.cafeteriaImagePlaceholder}
                  >
                    <Ionicons name="restaurant" size={24} color="white" />
                  </LinearGradient>
                )}
              </View>
              <View style={styles.cafeteriaInfo}>
                <Text style={styles.cafeteriaName}>{order.cafeteria.name}</Text>
                {order.cafeteria.location && (
                  <View style={styles.locationContainer}>
                    <Ionicons name="location" size={14} color={colors.textMuted} />
                    <Text style={styles.locationText}>{order.cafeteria.location}</Text>
                  </View>
                )}
                {order.cafeteria.phone && (
                  <View style={styles.phoneContainer}>
                    <Ionicons name="call" size={14} color={colors.textMuted} />
                    <Text style={styles.phoneText}>{order.cafeteria.phone}</Text>
                  </View>
                )}
              </View>
            </View>
          </Card.Content>
        </Card>
      </Animatable.View>

      {/* Order Items */}
      <Animatable.View animation="fadeInUp" delay={400} duration={800}>
        <Card style={styles.itemsCard}>
          <Card.Content style={styles.itemsContent}>
            <Text style={styles.sectionTitle}>Order Items</Text>
            
            {order.order_items.map((item, index) => (
              <View key={item.id} style={styles.orderItem}>
                <View style={styles.itemImageContainer}>
                  {item.menu_item.image_url ? (
                    <Image source={{ uri: item.menu_item.image_url }} style={styles.itemImage} />
                  ) : (
                    <LinearGradient
                      colors={[colors.primary, colors.primaryDark]}
                      style={styles.itemImagePlaceholder}
                    >
                      <Ionicons name="restaurant" size={16} color="white" />
                    </LinearGradient>
                  )}
                </View>
                
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.menu_item.name}</Text>
                  {item.menu_item.description && (
                    <Text style={styles.itemDescription} numberOfLines={1}>
                      {item.menu_item.description}
                    </Text>
                  )}
                  {item.special_instructions && (
                    <Text style={styles.specialInstructions}>
                      Note: {item.special_instructions}
                    </Text>
                  )}
                </View>
                
                <View style={styles.itemPricing}>
                  <Text style={styles.itemQuantity}>×{item.quantity}</Text>
                  <Text style={styles.itemPrice}>
                    {formatCurrency(item.price * item.quantity)}
                  </Text>
                </View>
              </View>
            ))}
          </Card.Content>
        </Card>
      </Animatable.View>

      {/* Order Summary */}
      <Animatable.View animation="fadeInUp" delay={600} duration={800}>
        <Card style={styles.summaryCard}>
          <Card.Content style={styles.summaryContent}>
            <Text style={styles.sectionTitle}>Order Summary</Text>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>{formatCurrency(subtotal)}</Text>
            </View>
            
            {order.delivery_fee && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Delivery Fee</Text>
                <Text style={styles.summaryValue}>{formatCurrency(order.delivery_fee)}</Text>
              </View>
            )}
            
            {order.service_fee && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Service Fee</Text>
                <Text style={styles.summaryValue}>{formatCurrency(order.service_fee)}</Text>
              </View>
            )}
            
            <Divider style={styles.divider} />
            
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatCurrency(order.total_amount)}</Text>
            </View>

            {order.notes && (
              <>
                <Divider style={styles.divider} />
                <View style={styles.notesSection}>
                  <Text style={styles.notesTitle}>Special Instructions</Text>
                  <Text style={styles.notesText}>{order.notes}</Text>
                </View>
              </>
            )}
          </Card.Content>
        </Card>
      </Animatable.View>

      {/* Action Buttons */}
      <Animatable.View animation="fadeInUp" delay={800} duration={800}>
        <View style={styles.actionsContainer}>
          {order.status === 'pending' && (
            <Button
              mode="outlined"
              onPress={handleCancelOrder}
              style={styles.cancelButton}
              textColor={colors.error}
            >
              Cancel Order
            </Button>
          )}
          
          {order.status === 'ready' && (
            <Button
              mode="contained"
              onPress={() => {/* Handle pickup confirmation */}}
              style={styles.pickupButton}
              buttonColor={colors.secondary}
            >
              Confirm Pickup
            </Button>
          )}
          
          <Button
            mode="text"
            onPress={() => navigation.navigate('Home')}
            textColor={colors.primary}
          >
            Order Again
          </Button>
        </View>
      </Animatable.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    fontSize: fontSize.md,
    color: colors.textMuted,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  errorText: {
    fontSize: fontSize.md,
    color: colors.error,
  },
  statusCard: {
    margin: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    ...shadows.md,
  },
  statusContent: {
    padding: spacing.lg,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  statusIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  statusInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  statusText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  orderDate: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  estimatedTime: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceVariant,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  estimatedTimeText: {
    fontSize: fontSize.sm,
    color: colors.text,
    flex: 1,
  },
  cafeteriaCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  cafeteriaContent: {
    padding: spacing.lg,
  },
  cafeteriaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cafeteriaImageContainer: {
    width: 50,
    height: 50,
    marginRight: spacing.md,
  },
  cafeteriaImage: {
    width: '100%',
    height: '100%',
    borderRadius: borderRadius.md,
    resizeMode: 'cover',
  },
  cafeteriaImagePlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cafeteriaInfo: {
    flex: 1,
  },
  cafeteriaName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    gap: 4,
  },
  locationText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  phoneText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  itemsCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  itemsContent: {
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemImageContainer: {
    width: 40,
    height: 40,
    marginRight: spacing.md,
  },
  itemImage: {
    width: '100%',
    height: '100%',
    borderRadius: borderRadius.sm,
    resizeMode: 'cover',
  },
  itemImagePlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  itemName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  itemDescription: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  specialInstructions: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  itemPricing: {
    alignItems: 'flex-end',
  },
  itemQuantity: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  itemPrice: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  summaryCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  summaryContent: {
    padding: spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  summaryLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: fontWeight.medium,
  },
  divider: {
    marginVertical: spacing.md,
    backgroundColor: colors.border,
  },
  totalLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  totalValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  notesSection: {
    marginTop: spacing.sm,
  },
  notesTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  notesText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  actionsContainer: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  cancelButton: {
    borderColor: colors.error,
    borderRadius: borderRadius.lg,
  },
  pickupButton: {
    borderRadius: borderRadius.lg,
  },
});
