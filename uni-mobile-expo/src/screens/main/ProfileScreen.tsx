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
import { Card, Button, TextInput, Avatar, Divider } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../../theme/theme';

interface ProfileScreenProps {
  navigation: any;
}

export default function ProfileScreen({ navigation }: ProfileScreenProps) {
  const { user, profile, signOut, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
  });

  const handleImagePicker = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions to change your profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      // Here you would upload the image to your storage service
      // For now, we'll just show an alert
      Alert.alert('Feature Coming Soon', 'Profile picture upload will be available soon!');
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      const { error } = await updateProfile({
        full_name: formData.full_name,
        phone: formData.phone,
      });

      if (error) {
        Alert.alert('Error', 'Failed to update profile');
        return;
      }

      setEditing(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: signOut },
      ]
    );
  };

  const menuItems = [
    {
      icon: 'receipt-outline',
      title: 'Order History',
      subtitle: 'View your past orders',
      onPress: () => navigation.navigate('Orders'),
    },
    {
      icon: 'heart-outline',
      title: 'Favorites',
      subtitle: 'Your favorite items',
      onPress: () => Alert.alert('Coming Soon', 'Favorites feature will be available soon!'),
    },
    {
      icon: 'location-outline',
      title: 'Addresses',
      subtitle: 'Manage delivery addresses',
      onPress: () => Alert.alert('Coming Soon', 'Address management will be available soon!'),
    },
    {
      icon: 'card-outline',
      title: 'Payment Methods',
      subtitle: 'Manage payment options',
      onPress: () => Alert.alert('Coming Soon', 'Payment methods will be available soon!'),
    },
    {
      icon: 'notifications-outline',
      title: 'Notifications',
      subtitle: 'Notification preferences',
      onPress: () => navigation.navigate('Notifications'),
    },
    {
      icon: 'help-circle-outline',
      title: 'Help & Support',
      subtitle: 'Get help and contact support',
      onPress: () => Alert.alert('Coming Soon', 'Help & Support will be available soon!'),
    },
    {
      icon: 'information-circle-outline',
      title: 'About',
      subtitle: 'App version and info',
      onPress: () => Alert.alert('UniEats', 'Version 1.0.0\nBuilt with ❤️ for students'),
    },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile Header */}
      <Animatable.View animation="fadeInDown" duration={800}>
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          style={styles.headerGradient}
        >
          <View style={styles.profileHeader}>
            <TouchableOpacity onPress={handleImagePicker} style={styles.avatarContainer}>
              {profile?.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
              ) : (
                <Avatar.Text
                  size={80}
                  label={profile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                  style={styles.avatarText}
                  labelStyle={styles.avatarLabel}
                />
              )}
              <View style={styles.cameraIcon}>
                <Ionicons name="camera" size={16} color="white" />
              </View>
            </TouchableOpacity>

            <Text style={styles.userName}>
              {profile?.full_name || 'User'}
            </Text>
            <Text style={styles.userEmail}>
              {user?.email}
            </Text>
            <View style={styles.userRole}>
              <Text style={styles.roleText}>
                {profile?.role?.charAt(0).toUpperCase() + profile?.role?.slice(1) || 'Student'}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </Animatable.View>

      {/* Profile Information */}
      <Animatable.View animation="fadeInUp" delay={200} duration={800}>
        <Card style={styles.infoCard}>
          <Card.Content style={styles.infoContent}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Personal Information</Text>
              <Button
                mode="text"
                onPress={() => editing ? handleSave() : setEditing(true)}
                loading={loading}
                disabled={loading}
                textColor={colors.primary}
                compact
              >
                {editing ? 'Save' : 'Edit'}
              </Button>
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                label="Full Name"
                value={editing ? formData.full_name : profile?.full_name || ''}
                onChangeText={(text) => setFormData({ ...formData, full_name: text })}
                mode="outlined"
                disabled={!editing}
                style={styles.input}
                theme={{
                  colors: {
                    primary: colors.primary,
                    outline: colors.border,
                    background: colors.surface,
                    onSurface: colors.text,
                  },
                }}
                left={<TextInput.Icon icon="account" iconColor={colors.textMuted} />}
              />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                label="Email"
                value={user?.email || ''}
                mode="outlined"
                disabled
                style={styles.input}
                theme={{
                  colors: {
                    primary: colors.primary,
                    outline: colors.border,
                    background: colors.surface,
                    onSurface: colors.text,
                  },
                }}
                left={<TextInput.Icon icon="email" iconColor={colors.textMuted} />}
              />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                label="Phone Number"
                value={editing ? formData.phone : profile?.phone || ''}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                mode="outlined"
                disabled={!editing}
                keyboardType="phone-pad"
                style={styles.input}
                theme={{
                  colors: {
                    primary: colors.primary,
                    outline: colors.border,
                    background: colors.surface,
                    onSurface: colors.text,
                  },
                }}
                left={<TextInput.Icon icon="phone" iconColor={colors.textMuted} />}
              />
            </View>

            {editing && (
              <Button
                mode="outlined"
                onPress={() => {
                  setEditing(false);
                  setFormData({
                    full_name: profile?.full_name || '',
                    phone: profile?.phone || '',
                  });
                }}
                style={styles.cancelButton}
                textColor={colors.textMuted}
              >
                Cancel
              </Button>
            )}
          </Card.Content>
        </Card>
      </Animatable.View>

      {/* Menu Items */}
      <Animatable.View animation="fadeInUp" delay={400} duration={800}>
        <Card style={styles.menuCard}>
          <Card.Content style={styles.menuContent}>
            <Text style={styles.sectionTitle}>Settings</Text>
            
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={item.title}
                style={styles.menuItem}
                onPress={item.onPress}
              >
                <View style={styles.menuItemLeft}>
                  <View style={styles.menuItemIcon}>
                    <Ionicons name={item.icon as any} size={20} color={colors.primary} />
                  </View>
                  <View style={styles.menuItemText}>
                    <Text style={styles.menuItemTitle}>{item.title}</Text>
                    <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            ))}
          </Card.Content>
        </Card>
      </Animatable.View>

      {/* Sign Out Button */}
      <Animatable.View animation="fadeInUp" delay={600} duration={800}>
        <View style={styles.signOutContainer}>
          <Button
            mode="outlined"
            onPress={handleSignOut}
            style={styles.signOutButton}
            textColor={colors.error}
            icon="logout"
          >
            Sign Out
          </Button>
        </View>
      </Animatable.View>

      {/* App Version */}
      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>UniEats v1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 40,
    borderBottomLeftRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
  },
  profileHeader: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarText: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  avatarLabel: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: 'white',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  userName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: 'white',
    marginBottom: spacing.xs,
  },
  userEmail: {
    fontSize: fontSize.sm,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: spacing.sm,
  },
  userRole: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  roleText: {
    fontSize: fontSize.sm,
    color: 'white',
    fontWeight: fontWeight.medium,
  },
  infoCard: {
    margin: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  infoContent: {
    padding: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  inputContainer: {
    marginBottom: spacing.md,
  },
  input: {
    backgroundColor: colors.surface,
  },
  cancelButton: {
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    marginTop: spacing.sm,
  },
  menuCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  menuContent: {
    padding: spacing.lg,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  menuItemText: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  menuItemSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  signOutContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  signOutButton: {
    borderColor: colors.error,
    borderRadius: borderRadius.lg,
  },
  versionContainer: {
    alignItems: 'center',
    paddingBottom: spacing.xl,
  },
  versionText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
});
