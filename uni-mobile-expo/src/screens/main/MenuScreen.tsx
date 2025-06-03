import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  Modal,
} from 'react-native';
import { Searchbar, Card, Chip, FAB, Button, TextInput } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { Ionicons } from '@expo/vector-icons';

import { useCart } from '../../contexts/CartContext';
import { supabase } from '../../services/supabase';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../../theme/theme';

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: string | null;
  is_available: boolean;
  preparation_time: number | null;
  rating: number | null;
  total_ratings: number;
}

interface MenuScreenProps {
  route: {
    params: {
      cafeteriaId: string;
      cafeteriaName: string;
    };
  };
  navigation: any;
}

export default function MenuScreen({ route, navigation }: MenuScreenProps) {
  const { cafeteriaId, cafeteriaName } = route.params;
  const [searchQuery, setSearchQuery] = useState('');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [specialInstructions, setSpecialInstructions] = useState('');
  
  const { state: cartState, addItem, getItemQuantity } = useCart();

  const categories = ['All', 'Mains', 'Sides', 'Beverages', 'Desserts', 'Snacks'];

  useEffect(() => {
    navigation.setOptions({ title: `${cafeteriaName} Menu` });
    fetchMenuItems();
  }, [cafeteriaId, cafeteriaName]);

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('cafeteria_id', cafeteriaId)
        .eq('is_available', true)
        .order('category', { ascending: true });

      if (error) {
        console.error('Error fetching menu items:', error);
        return;
      }

      setMenuItems(data || []);
    } catch (error) {
      console.error('Error fetching menu items:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMenuItems();
    setRefreshing(false);
  };

  const filteredMenuItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const handleItemPress = (item: MenuItem) => {
    setSelectedItem(item);
    setQuantity(1);
    setSpecialInstructions('');
    setModalVisible(true);
  };

  const handleAddToCart = () => {
    if (selectedItem) {
      addItem(selectedItem, quantity, specialInstructions);
      setModalVisible(false);
      setSelectedItem(null);
    }
  };

  const renderMenuItem = ({ item, index }: { item: MenuItem; index: number }) => (
    <Animatable.View
      animation="fadeInUp"
      delay={index * 50}
      duration={600}
    >
      <TouchableOpacity onPress={() => handleItemPress(item)}>
        <Card style={styles.menuItemCard}>
          <View style={styles.menuItemContent}>
            <View style={styles.menuItemImageContainer}>
              {item.image_url ? (
                <Image source={{ uri: item.image_url }} style={styles.menuItemImage} />
              ) : (
                <LinearGradient
                  colors={[colors.primary, colors.primaryDark]}
                  style={styles.menuItemImagePlaceholder}
                >
                  <Ionicons name="restaurant" size={32} color="white" />
                </LinearGradient>
              )}
              
              {getItemQuantity(item.id) > 0 && (
                <View style={styles.quantityBadge}>
                  <Text style={styles.quantityBadgeText}>
                    {getItemQuantity(item.id)}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.menuItemInfo}>
              <Text style={styles.menuItemName}>{item.name}</Text>
              <Text style={styles.menuItemDescription} numberOfLines={2}>
                {item.description || 'Delicious and fresh!'}
              </Text>
              
              <View style={styles.menuItemFooter}>
                <Text style={styles.menuItemPrice}>
                  {formatCurrency(item.price)}
                </Text>
                
                <View style={styles.menuItemMeta}>
                  {item.preparation_time && (
                    <View style={styles.prepTimeContainer}>
                      <Ionicons name="time" size={14} color={colors.textMuted} />
                      <Text style={styles.prepTimeText}>
                        {item.preparation_time}min
                      </Text>
                    </View>
                  )}
                  
                  <View style={styles.ratingContainer}>
                    <Ionicons name="star" size={14} color={colors.warning} />
                    <Text style={styles.ratingText}>
                      {item.rating ? item.rating.toFixed(1) : '4.5'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.addButton}
              onPress={() => handleItemPress(item)}
            >
              <Ionicons name="add" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </Card>
      </TouchableOpacity>
    </Animatable.View>
  );

  return (
    <View style={styles.container}>
      {/* Search and Categories */}
      <View style={styles.headerContainer}>
        <Searchbar
          placeholder="Search menu items..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          inputStyle={styles.searchInput}
          iconColor={colors.textMuted}
          placeholderTextColor={colors.textMuted}
        />

        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.categoriesContent}
          renderItem={({ item, index }) => (
            <Animatable.View
              animation="fadeInRight"
              delay={index * 50}
            >
              <Chip
                selected={selectedCategory === item}
                onPress={() => setSelectedCategory(item)}
                style={[
                  styles.categoryChip,
                  selectedCategory === item && styles.selectedCategoryChip,
                ]}
                textStyle={[
                  styles.categoryChipText,
                  selectedCategory === item && styles.selectedCategoryChipText,
                ]}
              >
                {item}
              </Chip>
            </Animatable.View>
          )}
        />
      </View>

      {/* Menu Items */}
      <FlatList
        data={filteredMenuItems}
        renderItem={renderMenuItem}
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
            <Ionicons name="search-outline" size={64} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No items found</Text>
            <Text style={styles.emptySubtitle}>Try adjusting your search or category</Text>
          </View>
        }
      />

      {/* Item Detail Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedItem && (
              <>
                <View style={styles.modalHeader}>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <Ionicons name="close" size={24} color={colors.text} />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalImageContainer}>
                  {selectedItem.image_url ? (
                    <Image source={{ uri: selectedItem.image_url }} style={styles.modalImage} />
                  ) : (
                    <LinearGradient
                      colors={[colors.primary, colors.primaryDark]}
                      style={styles.modalImagePlaceholder}
                    >
                      <Ionicons name="restaurant" size={48} color="white" />
                    </LinearGradient>
                  )}
                </View>

                <View style={styles.modalInfo}>
                  <Text style={styles.modalItemName}>{selectedItem.name}</Text>
                  <Text style={styles.modalItemPrice}>
                    {formatCurrency(selectedItem.price)}
                  </Text>
                  <Text style={styles.modalItemDescription}>
                    {selectedItem.description || 'Delicious and fresh!'}
                  </Text>

                  <TextInput
                    label="Special Instructions (Optional)"
                    value={specialInstructions}
                    onChangeText={setSpecialInstructions}
                    mode="outlined"
                    multiline
                    numberOfLines={2}
                    style={styles.instructionsInput}
                    theme={{
                      colors: {
                        primary: colors.primary,
                        outline: colors.border,
                        background: colors.surface,
                        onSurface: colors.text,
                      },
                    }}
                  />

                  <View style={styles.quantityContainer}>
                    <Text style={styles.quantityLabel}>Quantity</Text>
                    <View style={styles.quantityControls}>
                      <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={() => setQuantity(Math.max(1, quantity - 1))}
                      >
                        <Ionicons name="remove" size={20} color={colors.primary} />
                      </TouchableOpacity>
                      
                      <Text style={styles.quantityText}>{quantity}</Text>
                      
                      <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={() => setQuantity(quantity + 1)}
                      >
                        <Ionicons name="add" size={20} color={colors.primary} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <Button
                    mode="contained"
                    onPress={handleAddToCart}
                    style={styles.addToCartButton}
                    contentStyle={styles.addToCartButtonContent}
                    labelStyle={styles.addToCartButtonLabel}
                    buttonColor={colors.primary}
                  >
                    Add to Cart • {formatCurrency(selectedItem.price * quantity)}
                  </Button>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Cart FAB */}
      {cartState.itemCount > 0 && (
        <FAB
          icon="shopping-bag"
          label={`${cartState.itemCount} items`}
          style={styles.fab}
          onPress={() => navigation.navigate('Cart')}
          color="white"
          customSize={56}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerContainer: {
    backgroundColor: colors.surface,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchBar: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.lg,
    elevation: 0,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  searchInput: {
    color: colors.text,
  },
  categoriesContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  categoryChip: {
    backgroundColor: colors.surfaceVariant,
    marginRight: spacing.sm,
  },
  selectedCategoryChip: {
    backgroundColor: colors.primary,
  },
  categoryChipText: {
    color: colors.textMuted,
  },
  selectedCategoryChipText: {
    color: 'white',
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  menuItemCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  menuItemContent: {
    flexDirection: 'row',
    padding: spacing.md,
    alignItems: 'center',
  },
  menuItemImageContainer: {
    position: 'relative',
    width: 80,
    height: 80,
    marginRight: spacing.md,
  },
  menuItemImage: {
    width: '100%',
    height: '100%',
    borderRadius: borderRadius.md,
    resizeMode: 'cover',
  },
  menuItemImagePlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.secondary,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityBadgeText: {
    color: 'white',
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  menuItemInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  menuItemName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  menuItemDescription: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    lineHeight: 18,
  },
  menuItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  menuItemPrice: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  menuItemMeta: {
    alignItems: 'flex-end',
    gap: 4,
  },
  prepTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  prepTimeText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.md,
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
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: spacing.md,
  },
  closeButton: {
    padding: spacing.sm,
  },
  modalImageContainer: {
    height: 200,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  modalImage: {
    width: '100%',
    height: '100%',
    borderRadius: borderRadius.lg,
    resizeMode: 'cover',
  },
  modalImagePlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalInfo: {
    padding: spacing.lg,
    paddingTop: 0,
  },
  modalItemName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  modalItemPrice: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  modalItemDescription: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  instructionsInput: {
    backgroundColor: colors.surface,
    marginBottom: spacing.lg,
  },
  quantityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  quantityLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginHorizontal: spacing.lg,
    minWidth: 30,
    textAlign: 'center',
  },
  addToCartButton: {
    borderRadius: borderRadius.lg,
  },
  addToCartButtonContent: {
    paddingVertical: spacing.md,
  },
  addToCartButtonLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: colors.primary,
  },
});
