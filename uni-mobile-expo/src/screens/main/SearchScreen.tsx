import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Searchbar, Card, Chip } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { Ionicons } from '@expo/vector-icons';

import { supabase } from '../../services/supabase';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../../theme/theme';

interface SearchResult {
  id: string;
  name: string;
  description: string | null;
  price?: number;
  image_url: string | null;
  type: 'cafeteria' | 'menu_item';
  cafeteria_name?: string;
  location?: string | null;
  rating?: number | null;
}

interface SearchScreenProps {
  navigation: any;
}

export default function SearchScreen({ navigation }: SearchScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([
    'Pizza',
    'Burger',
    'Coffee',
    'Healthy Food',
  ]);
  const [selectedFilter, setSelectedFilter] = useState('All');

  const filters = ['All', 'Cafeterias', 'Food Items'];

  useEffect(() => {
    if (searchQuery.length > 2) {
      performSearch();
    } else {
      setResults([]);
    }
  }, [searchQuery, selectedFilter]);

  const performSearch = async () => {
    try {
      setLoading(true);
      const searchResults: SearchResult[] = [];

      // Search cafeterias
      if (selectedFilter === 'All' || selectedFilter === 'Cafeterias') {
        const { data: cafeterias, error: cafeteriaError } = await supabase
          .from('cafeterias')
          .select('id, name, description, image_url, location, rating')
          .eq('status', 'active')
          .or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
          .limit(10);

        if (!cafeteriaError && cafeterias) {
          searchResults.push(
            ...cafeterias.map(cafeteria => ({
              ...cafeteria,
              type: 'cafeteria' as const,
            }))
          );
        }
      }

      // Search menu items
      if (selectedFilter === 'All' || selectedFilter === 'Food Items') {
        const { data: menuItems, error: menuError } = await supabase
          .from('menu_items')
          .select(`
            id,
            name,
            description,
            price,
            image_url,
            rating,
            cafeteria:cafeterias(name)
          `)
          .eq('is_available', true)
          .or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
          .limit(20);

        if (!menuError && menuItems) {
          searchResults.push(
            ...menuItems.map(item => ({
              id: item.id,
              name: item.name,
              description: item.description,
              price: item.price,
              image_url: item.image_url,
              rating: item.rating,
              type: 'menu_item' as const,
              cafeteria_name: item.cafeteria?.name,
            }))
          );
        }
      }

      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const handleResultPress = (result: SearchResult) => {
    if (result.type === 'cafeteria') {
      navigation.navigate('Cafeteria', {
        cafeteriaId: result.id,
        cafeteriaName: result.name,
      });
    } else {
      // For menu items, navigate to the cafeteria
      // In a real app, you might want to navigate directly to the item
      navigation.goBack();
    }
  };

  const handleRecentSearchPress = (query: string) => {
    setSearchQuery(query);
  };

  const renderSearchResult = ({ item, index }: { item: SearchResult; index: number }) => (
    <Animatable.View
      animation="fadeInUp"
      delay={index * 50}
      duration={600}
    >
      <TouchableOpacity onPress={() => handleResultPress(item)}>
        <Card style={styles.resultCard}>
          <View style={styles.resultContent}>
            <View style={styles.resultImageContainer}>
              {item.image_url ? (
                <Image source={{ uri: item.image_url }} style={styles.resultImage} />
              ) : (
                <LinearGradient
                  colors={[colors.primary, colors.primaryDark]}
                  style={styles.resultImagePlaceholder}
                >
                  <Ionicons 
                    name={item.type === 'cafeteria' ? 'restaurant' : 'fast-food'} 
                    size={24} 
                    color="white" 
                  />
                </LinearGradient>
              )}
              
              <View style={styles.typeIndicator}>
                <Text style={styles.typeText}>
                  {item.type === 'cafeteria' ? 'Cafeteria' : 'Food'}
                </Text>
              </View>
            </View>

            <View style={styles.resultInfo}>
              <Text style={styles.resultName}>{item.name}</Text>
              <Text style={styles.resultDescription} numberOfLines={2}>
                {item.description || 'No description available'}
              </Text>
              
              <View style={styles.resultMeta}>
                {item.type === 'menu_item' && item.cafeteria_name && (
                  <View style={styles.cafeteriaInfo}>
                    <Ionicons name="restaurant" size={12} color={colors.textMuted} />
                    <Text style={styles.cafeteriaText}>{item.cafeteria_name}</Text>
                  </View>
                )}
                
                {item.type === 'cafeteria' && item.location && (
                  <View style={styles.locationInfo}>
                    <Ionicons name="location" size={12} color={colors.textMuted} />
                    <Text style={styles.locationText}>{item.location}</Text>
                  </View>
                )}
                
                {item.rating && (
                  <View style={styles.ratingInfo}>
                    <Ionicons name="star" size={12} color={colors.warning} />
                    <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
                  </View>
                )}
              </View>
            </View>

            {item.type === 'menu_item' && item.price && (
              <View style={styles.priceContainer}>
                <Text style={styles.priceText}>{formatCurrency(item.price)}</Text>
              </View>
            )}
          </View>
        </Card>
      </TouchableOpacity>
    </Animatable.View>
  );

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.searchHeader}>
        <Searchbar
          placeholder="Search cafeterias and food..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          inputStyle={styles.searchInput}
          iconColor={colors.textMuted}
          placeholderTextColor={colors.textMuted}
          autoFocus
        />

        {/* Filters */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={filters}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.filtersContent}
          renderItem={({ item, index }) => (
            <Animatable.View
              animation="fadeInRight"
              delay={index * 50}
            >
              <Chip
                selected={selectedFilter === item}
                onPress={() => setSelectedFilter(item)}
                style={[
                  styles.filterChip,
                  selectedFilter === item && styles.selectedFilterChip,
                ]}
                textStyle={[
                  styles.filterChipText,
                  selectedFilter === item && styles.selectedFilterChipText,
                ]}
              >
                {item}
              </Chip>
            </Animatable.View>
          )}
        />
      </View>

      {/* Search Results */}
      {searchQuery.length > 2 ? (
        <FlatList
          data={results}
          renderItem={renderSearchResult}
          keyExtractor={(item) => `${item.type}-${item.id}`}
          contentContainerStyle={styles.resultsContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={64} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>No results found</Text>
                <Text style={styles.emptySubtitle}>
                  Try searching for different keywords
                </Text>
              </View>
            ) : null
          }
        />
      ) : (
        /* Recent Searches */
        <View style={styles.recentContainer}>
          <Text style={styles.recentTitle}>Recent Searches</Text>
          <View style={styles.recentChips}>
            {recentSearches.map((search, index) => (
              <Animatable.View
                key={search}
                animation="fadeInUp"
                delay={index * 100}
              >
                <TouchableOpacity onPress={() => handleRecentSearchPress(search)}>
                  <Chip
                    style={styles.recentChip}
                    textStyle={styles.recentChipText}
                    icon="clock-outline"
                  >
                    {search}
                  </Chip>
                </TouchableOpacity>
              </Animatable.View>
            ))}
          </View>

          <Text style={styles.suggestionsTitle}>Popular Categories</Text>
          <View style={styles.categoriesGrid}>
            {[
              { name: 'Fast Food', icon: 'fast-food' },
              { name: 'Healthy', icon: 'leaf' },
              { name: 'Beverages', icon: 'cafe' },
              { name: 'Desserts', icon: 'ice-cream' },
            ].map((category, index) => (
              <Animatable.View
                key={category.name}
                animation="fadeInUp"
                delay={index * 100}
              >
                <TouchableOpacity
                  style={styles.categoryCard}
                  onPress={() => setSearchQuery(category.name)}
                >
                  <Ionicons name={category.icon as any} size={24} color={colors.primary} />
                  <Text style={styles.categoryText}>{category.name}</Text>
                </TouchableOpacity>
              </Animatable.View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchHeader: {
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
  filtersContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  filterChip: {
    backgroundColor: colors.surfaceVariant,
    marginRight: spacing.sm,
  },
  selectedFilterChip: {
    backgroundColor: colors.primary,
  },
  filterChipText: {
    color: colors.textMuted,
  },
  selectedFilterChipText: {
    color: 'white',
  },
  resultsContent: {
    padding: spacing.lg,
  },
  resultCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  resultContent: {
    flexDirection: 'row',
    padding: spacing.md,
    alignItems: 'center',
  },
  resultImageContainer: {
    position: 'relative',
    width: 60,
    height: 60,
    marginRight: spacing.md,
  },
  resultImage: {
    width: '100%',
    height: '100%',
    borderRadius: borderRadius.md,
    resizeMode: 'cover',
  },
  resultImagePlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeIndicator: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  typeText: {
    fontSize: 8,
    color: 'white',
    fontWeight: fontWeight.bold,
  },
  resultInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  resultName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  resultDescription: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    lineHeight: 18,
  },
  resultMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  cafeteriaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cafeteriaText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  ratingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.primary,
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
  },
  recentContainer: {
    padding: spacing.lg,
  },
  recentTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  recentChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  recentChip: {
    backgroundColor: colors.surfaceVariant,
  },
  recentChipText: {
    color: colors.text,
  },
  suggestionsTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  categoryCard: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadows.sm,
  },
  categoryText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
    marginTop: spacing.sm,
  },
});
