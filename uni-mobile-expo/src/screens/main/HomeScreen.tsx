import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Image,
} from 'react-native';
import { Searchbar, Card, Chip, FAB } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { supabase } from '../../services/supabase';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../../theme/theme';

interface Cafeteria {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  status: 'active' | 'inactive' | 'pending';
  location: string | null;
  rating: number | null;
  total_ratings: number;
}

interface HomeScreenProps {
  navigation: any;
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [cafeterias, setCafeterias] = useState<Cafeteria[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  const { profile } = useAuth();
  const { state: cartState } = useCart();

  const categories = ['All', 'Fast Food', 'Healthy', 'Desserts', 'Beverages', 'Asian'];

  useEffect(() => {
    fetchCafeterias();
  }, []);

  const fetchCafeterias = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cafeterias')
        .select('*')
        .eq('status', 'active')
        .order('rating', { ascending: false });

      if (error) {
        console.error('Error fetching cafeterias:', error);
        return;
      }

      setCafeterias(data || []);
    } catch (error) {
      console.error('Error fetching cafeterias:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCafeterias();
    setRefreshing(false);
  };

  const filteredCafeterias = cafeterias.filter(cafeteria =>
    cafeteria.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (cafeteria.description && cafeteria.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const renderCafeteriaCard = ({ item, index }: { item: Cafeteria; index: number }) => (
    <Animatable.View
      animation="fadeInUp"
      delay={index * 100}
      duration={600}
    >
      <TouchableOpacity
        onPress={() => navigation.navigate('Cafeteria', {
          cafeteriaId: item.id,
          cafeteriaName: item.name,
        })}
      >
        <Card style={styles.cafeteriaCard}>
          <View style={styles.cardImageContainer}>
            {item.image_url ? (
              <Image source={{ uri: item.image_url }} style={styles.cardImage} />
            ) : (
              <LinearGradient
                colors={[colors.primary, colors.primaryDark]}
                style={styles.cardImagePlaceholder}
              >
                <Ionicons name="restaurant" size={40} color="white" />
              </LinearGradient>
            )}
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={12} color={colors.warning} />
              <Text style={styles.ratingText}>
                {item.rating ? item.rating.toFixed(1) : '4.5'}
              </Text>
            </View>
          </View>
          
          <Card.Content style={styles.cardContent}>
            <Text style={styles.cafeteriaName}>{item.name}</Text>
            <Text style={styles.cafeteriaDescription} numberOfLines={2}>
              {item.description || 'Delicious food awaits you!'}
            </Text>
            
            <View style={styles.cardFooter}>
              <View style={styles.locationContainer}>
                <Ionicons name="location" size={14} color={colors.textMuted} />
                <Text style={styles.locationText}>
                  {item.location || 'Campus Location'}
                </Text>
              </View>
              <Text style={styles.reviewsText}>
                ({item.total_ratings || 0} reviews)
              </Text>
            </View>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    </Animatable.View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>Hello, {profile?.full_name || 'Student'}! 👋</Text>
              <Text style={styles.subtitle}>What would you like to eat today?</Text>
            </View>
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={() => navigation.navigate('Notifications')}
            >
              <Ionicons name="notifications" size={24} color="white" />
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>3</Text>
              </View>
            </TouchableOpacity>
          </View>

          <Searchbar
            placeholder="Search cafeterias..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
            inputStyle={styles.searchInput}
            iconColor={colors.textMuted}
            placeholderTextColor={colors.textMuted}
            onSubmitEditing={() => navigation.navigate('Search')}
          />
        </View>
      </LinearGradient>

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

      {/* Cafeterias List */}
      <FlatList
        data={filteredCafeterias}
        renderItem={renderCafeteriaCard}
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
            <Ionicons name="restaurant-outline" size={64} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No cafeterias found</Text>
            <Text style={styles.emptySubtitle}>Try adjusting your search</Text>
          </View>
        }
      />

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
  header: {
    paddingTop: 50,
    paddingBottom: spacing.lg,
    borderBottomLeftRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
  },
  headerContent: {
    paddingHorizontal: spacing.lg,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  greeting: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: 'white',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  notificationButton: {
    position: 'relative',
    padding: spacing.sm,
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: colors.error,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: fontWeight.bold,
  },
  searchBar: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: borderRadius.lg,
    elevation: 0,
  },
  searchInput: {
    color: colors.text,
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
  listContent: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  cafeteriaCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadows.md,
  },
  cardImageContainer: {
    position: 'relative',
    height: 150,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cardImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ratingBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    color: 'white',
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  cardContent: {
    padding: spacing.md,
  },
  cafeteriaName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  cafeteriaDescription: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  reviewsText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
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
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: colors.primary,
  },
});
