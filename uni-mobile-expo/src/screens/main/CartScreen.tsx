import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { Card, Button, TextInput, Divider } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { Ionicons } from '@expo/vector-icons';

import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { supabase } from '../../services/supabase';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../../theme/theme';

interface CartScreenProps {
  navigation: any;
}

export default function CartScreen({ navigation }: CartScreenProps) {
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { state: cartState, updateQuantity, removeItem, clearCart } = useCart();
  const { user } = useAuth();
  const { sendNotification } = useNotifications();

  const deliveryFee = 2.99;
  const serviceFee = 1.50;
  const subtotal = cartState.total;
  const total = subtotal + deliveryFee + serviceFee;

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(itemId);
    } else {
      updateQuantity(itemId, newQuantity);
    }
  };

  const handlePlaceOrder = async () => {
    if (!user || cartState.items.length === 0) {
      Alert.alert('Error', 'Your cart is empty');
      return;
    }

    Alert.alert(
      'Confirm Order',
      `Place order for ${formatCurrency(total)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: processOrder },
      ]
    );
  };

  const processOrder = async () => {
    try {
      setLoading(true);

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user!.id,
          cafeteria_id: cartState.cafeteriaId!,
          total_amount: total,
          delivery_fee: deliveryFee,
          service_fee: serviceFee,
          notes: notes || null,
          status: 'pending',
        })
        .select()
        .single();

      if (orderError) {
        throw orderError;
      }

      // Create order items
      const orderItems = cartState.items.map(item => ({
        order_id: order.id,
        item_id: item.menuItem.id,
        quantity: item.quantity,
        price: item.menuItem.price,
        special_instructions: item.specialInstructions || null,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        throw itemsError;
      }

      // Send notification
      await sendNotification(
        'Order Placed Successfully!',
        `Your order #${order.id.slice(-6)} has been placed and is being prepared.`
      );

      // Clear cart and navigate
      clearCart();
      
      Alert.alert(
        'Order Placed!',
        'Your order has been placed successfully. You will receive updates on its status.',
        [
          {
            text: 'View Orders',
            onPress: () => navigation.navigate('Orders'),
          },
        ]
      );

    } catch (error) {
      console.error('Error placing order:', error);
      Alert.alert('Error', 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (cartState.items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Animatable.View
          animation="fadeInUp"
          duration={800}
          style={styles.emptyContent}
        >
          <Ionicons name="bag-outline" size={80} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>
            Add some delicious items to get started!
          </Text>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('Home')}
            style={styles.browseButton}
            buttonColor={colors.primary}
          >
            Browse Cafeterias
          </Button>
        </Animatable.View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Cart Items */}
        <View style={styles.itemsContainer}>
          <Text style={styles.sectionTitle}>Your Order</Text>
          
          {cartState.items.map((item, index) => (
            <Animatable.View
              key={item.id}
              animation="fadeInUp"
              delay={index * 100}
              duration={600}
            >
              <Card style={styles.itemCard}>
                <View style={styles.itemContent}>
                  <View style={styles.itemImageContainer}>
                    {item.menuItem.image_url ? (
                      <Image
                        source={{ uri: item.menuItem.image_url }}
                        style={styles.itemImage}
                      />
                    ) : (
                      <LinearGradient
                        colors={[colors.primary, colors.primaryDark]}
                        style={styles.itemImagePlaceholder}
                      >
                        <Ionicons name="restaurant" size={20} color="white" />
                      </LinearGradient>
                    )}
                  </View>

                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.menuItem.name}</Text>
                    <Text style={styles.itemPrice}>
                      {formatCurrency(item.menuItem.price)}
                    </Text>
                    {item.specialInstructions && (
                      <Text style={styles.itemInstructions}>
                        Note: {item.specialInstructions}
                      </Text>
                    )}
                  </View>

                  <View style={styles.quantityContainer}>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => handleQuantityChange(item.id, item.quantity - 1)}
                    >
                      <Ionicons name="remove" size={16} color={colors.primary} />
                    </TouchableOpacity>
                    
                    <Text style={styles.quantityText}>{item.quantity}</Text>
                    
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => handleQuantityChange(item.id, item.quantity + 1)}
                    >
                      <Ionicons name="add" size={16} color={colors.primary} />
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeItem(item.id)}
                  >
                    <Ionicons name="trash-outline" size={18} color={colors.error} />
                  </TouchableOpacity>
                </View>
              </Card>
            </Animatable.View>
          ))}
        </View>

        {/* Order Notes */}
        <Animatable.View
          animation="fadeInUp"
          delay={300}
          duration={600}
        >
          <Card style={styles.notesCard}>
            <Card.Content>
              <Text style={styles.notesTitle}>Special Instructions</Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Any special requests for your order..."
                multiline
                numberOfLines={3}
                style={styles.notesInput}
                theme={{
                  colors: {
                    primary: colors.primary,
                    outline: colors.border,
                    background: colors.surface,
                    onSurface: colors.text,
                  },
                }}
              />
            </Card.Content>
          </Card>
        </Animatable.View>

        {/* Order Summary */}
        <Animatable.View
          animation="fadeInUp"
          delay={400}
          duration={600}
        >
          <Card style={styles.summaryCard}>
            <Card.Content>
              <Text style={styles.summaryTitle}>Order Summary</Text>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>{formatCurrency(subtotal)}</Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Delivery Fee</Text>
                <Text style={styles.summaryValue}>{formatCurrency(deliveryFee)}</Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Service Fee</Text>
                <Text style={styles.summaryValue}>{formatCurrency(serviceFee)}</Text>
              </View>
              
              <Divider style={styles.divider} />
              
              <View style={styles.summaryRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
              </View>
            </Card.Content>
          </Card>
        </Animatable.View>
      </ScrollView>

      {/* Place Order Button */}
      <Animatable.View
        animation="fadeInUp"
        delay={500}
        duration={600}
        style={styles.checkoutContainer}
      >
        <LinearGradient
          colors={[colors.background, 'transparent']}
          style={styles.checkoutGradient}
        />
        <Button
          mode="contained"
          onPress={handlePlaceOrder}
          loading={loading}
          disabled={loading}
          style={styles.checkoutButton}
          contentStyle={styles.checkoutButtonContent}
          labelStyle={styles.checkoutButtonLabel}
          buttonColor={colors.primary}
        >
          {loading ? 'Placing Order...' : `Place Order • ${formatCurrency(total)}`}
        </Button>
      </Animatable.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  emptyContent: {
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  browseButton: {
    borderRadius: borderRadius.lg,
  },
  scrollView: {
    flex: 1,
  },
  itemsContainer: {
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  itemCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  itemImageContainer: {
    width: 60,
    height: 60,
    marginRight: spacing.md,
  },
  itemImage: {
    width: '100%',
    height: '100%',
    borderRadius: borderRadius.md,
    resizeMode: 'cover',
  },
  itemImagePlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  itemName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  itemPrice: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  itemInstructions: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginHorizontal: spacing.md,
    minWidth: 20,
    textAlign: 'center',
  },
  removeButton: {
    padding: spacing.sm,
  },
  notesCard: {
    margin: spacing.lg,
    marginTop: 0,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  notesTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  notesInput: {
    backgroundColor: colors.surface,
  },
  summaryCard: {
    margin: spacing.lg,
    marginTop: 0,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  summaryTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.md,
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
  checkoutContainer: {
    position: 'relative',
    padding: spacing.lg,
    paddingTop: 0,
  },
  checkoutGradient: {
    position: 'absolute',
    top: -20,
    left: 0,
    right: 0,
    height: 20,
  },
  checkoutButton: {
    borderRadius: borderRadius.lg,
  },
  checkoutButtonContent: {
    paddingVertical: spacing.md,
  },
  checkoutButtonLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
});
