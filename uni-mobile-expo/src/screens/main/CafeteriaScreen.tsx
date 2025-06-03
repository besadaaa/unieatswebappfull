import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Card, Button, Chip, FAB } from 'react-native-paper';
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

interface Cafeteria {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  location: string | null;
  phone: string | null;
  rating: number | null;
  total_ratings: number;
}

interface CafeteriaScreenProps {
  route: {
    params: {
      cafeteriaId: string;
      cafeteriaName: string;
    };
  };
  navigation: any;
}

export default function CafeteriaScreen({ route, navigation }: CafeteriaScreenProps) {
  const { cafeteriaId, cafeteriaName } = route.params;
  const [cafeteria, setCafeteria] = useState<Cafeteria | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  const { state: cartState, addItem, getItemQuantity } = useCart();

  const categories = ['All', 'Mains', 'Sides', 'Beverages', 'Desserts'];

  useEffect(() => {
    navigation.setOptions({ title: cafeteriaName });
    fetchCafeteriaData();
  }, [cafeteriaId, cafeteriaName]);

  const fetchCafeteriaData = async () => {
    try {
      setLoading(true);
      
      // Fetch cafeteria details
      const { data: cafeteriaData, error: cafeteriaError } = await supabase
        .from('cafeterias')
        .select('*')
        .eq('id', cafeteriaId)
        .single();

      if (cafeteriaError) {
        console.error('Error fetching cafeteria:', cafeteriaError);
        return;
      }

      setCafeteria(cafeteriaData);

      // Fetch menu items
      const { data: menuData, error: menuError } = await supabase
        .from('menu_items')
        .select('*')
        .eq('cafeteria_id', cafeteriaId)
        .eq('is_available', true)
        .order('category', { ascending: true });

      if (menuError) {
        console.error('Error fetching menu items:', menuError);
        return;
      }

      setMenuItems(menuData || []);
    } catch (error) {
      console.error('Error fetching cafeteria data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCafeteriaData();
    setRefreshing(false);
  };

  const filteredMenuItems = selectedCategory === 'All' 
    ? menuItems 
    : menuItems.filter(item => item.category === selectedCategory);

  const handleAddToCart = (item: MenuItem) => {
    addItem(item, 1);
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const renderMenuItem = (item: MenuItem, index: number) => (
    <Animatable.View
      key={item.id}
      animation="fadeInUp"
      delay={index * 50}
      duration={600}
    >
      <Card style={styles.menuItemCard}>
        <View style={styles.menuItemContent}>
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
                    <Ionicons name="time" size={12} color={colors.textMuted} />
                    <Text style={styles.prepTimeText}>
                      {item.preparation_time}min
                    </Text>
                  </View>
                )}
                
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={12} color={colors.warning} />
                  <Text style={styles.ratingText}>
                    {item.rating ? item.rating.toFixed(1) : '4.5'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.menuItemImageContainer}>
            {item.image_url ? (
              <Image source={{ uri: item.image_url }} style={styles.menuItemImage} />
            ) : (
              <LinearGradient
                colors={[colors.primary, colors.primaryDark]}
                style={styles.menuItemImagePlaceholder}
              >
                <Ionicons name="restaurant" size={24} color="white" />
              </LinearGradient>
            )}
            
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => handleAddToCart(item)}
            >
              <Ionicons name="add" size={20} color="white" />
            </TouchableOpacity>
            
            {getItemQuantity(item.id) > 0 && (
              <View style={styles.quantityBadge}>
                <Text style={styles.quantityText}>
                  {getItemQuantity(item.id)}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Card>
    </Animatable.View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading menu...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
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
        {/* Cafeteria Header */}
        {cafeteria && (
          <Animatable.View animation="fadeInDown" duration={800}>
            <View style={styles.headerImageContainer}>
              {cafeteria.image_url ? (
                <Image source={{ uri: cafeteria.image_url }} style={styles.headerImage} />
              ) : (
                <LinearGradient
                  colors={[colors.primary, colors.primaryDark]}
                  style={styles.headerImagePlaceholder}
                >
                  <Ionicons name="restaurant" size={64} color="white" />
                </LinearGradient>
              )}
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.7)']}
                style={styles.headerOverlay}
              />
            </View>

            <Card style={styles.cafeteriaInfoCard}>
              <Card.Content style={styles.cafeteriaInfoContent}>
                <Text style={styles.cafeteriaName}>{cafeteria.name}</Text>
                <Text style={styles.cafeteriaDescription}>
                  {cafeteria.description || 'Great food, great service!'}
                </Text>
                
                <View style={styles.cafeteriaMetaContainer}>
                  <View style={styles.cafeteriaMeta}>
                    <Ionicons name="star" size={16} color={colors.warning} />
                    <Text style={styles.cafeteriaRating}>
                      {cafeteria.rating ? cafeteria.rating.toFixed(1) : '4.5'}
                    </Text>
                    <Text style={styles.cafeteriaReviews}>
                      ({cafeteria.total_ratings || 0} reviews)
                    </Text>
                  </View>
                  
                  {cafeteria.location && (
                    <View style={styles.cafeteriaMeta}>
                      <Ionicons name="location" size={16} color={colors.textMuted} />
                      <Text style={styles.cafeteriaLocation}>
                        {cafeteria.location}
                      </Text>
                    </View>
                  )}
                </View>

                <Button
                  mode="outlined"
                  onPress={() => navigation.navigate('Menu', {
                    cafeteriaId: cafeteria.id,
                    cafeteriaName: cafeteria.name,
                  })}
                  style={styles.viewMenuButton}
                  textColor={colors.primary}
                >
                  View Full Menu
                </Button>
              </Card.Content>
            </Card>
          </Animatable.View>
        )}

        {/* Categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categoriesContent}
        >
          {categories.map((category, index) => (
            <Animatable.View
              key={category}
              animation="fadeInRight"
              delay={index * 50}
            >
              <Chip
                selected={selectedCategory === category}
                onPress={() => setSelectedCategory(category)}
                style={[
                  styles.categoryChip,
                  selectedCategory === category && styles.selectedCategoryChip,
                ]}
                textStyle={[
                  styles.categoryChipText,
                  selectedCategory === category && styles.selectedCategoryChipText,
                ]}
              >
                {category}
              </Chip>
            </Animatable.View>
          ))}
        </ScrollView>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          <Text style={styles.menuTitle}>Popular Items</Text>
          {filteredMenuItems.map((item, index) => renderMenuItem(item, index))}
        </View>
      </ScrollView>

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
  scrollView: {
    flex: 1,
  },
  headerImageContainer: {
    height: 200,
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  headerImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  cafeteriaInfoCard: {
    margin: spacing.lg,
    marginTop: -50,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    ...shadows.lg,
  },
  cafeteriaInfoContent: {
    padding: spacing.lg,
  },
  cafeteriaName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  cafeteriaDescription: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  cafeteriaMetaContainer: {
    marginBottom: spacing.md,
  },
  cafeteriaMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    gap: 4,
  },
  cafeteriaRating: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  cafeteriaReviews: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  cafeteriaLocation: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  viewMenuButton: {
    borderColor: colors.primary,
    borderRadius: borderRadius.lg,
  },
  categoriesContainer: {
    marginVertical: spacing.md,
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
  menuContainer: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  menuTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.md,
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
  menuItemImageContainer: {
    position: 'relative',
    width: 80,
    height: 80,
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
  addButton: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    backgroundColor: colors.primary,
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.md,
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
  quantityText: {
    color: 'white',
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: colors.primary,
  },
});
