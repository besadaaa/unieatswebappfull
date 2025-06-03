import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { colors, fontSize, fontWeight } from '../../theme/theme';

export default function SplashScreen() {
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <LinearGradient
      colors={[colors.background, colors.surface]}
      style={styles.container}
    >
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Animatable.View
            animation="pulse"
            iterationCount="infinite"
            duration={2000}
            style={styles.logoCircle}
          >
            <Text style={styles.logoEmoji}>🍕</Text>
          </Animatable.View>
          
          <Animatable.Text
            animation="fadeInUp"
            delay={500}
            style={styles.title}
          >
            UniEats
          </Animatable.Text>
          
          <Animatable.Text
            animation="fadeInUp"
            delay={700}
            style={styles.subtitle}
          >
            Delicious food at your fingertips
          </Animatable.Text>
        </Animated.View>

        <Animatable.View
          animation="fadeInUp"
          delay={1000}
          style={styles.loadingContainer}
        >
          <View style={styles.loadingBar}>
            <Animatable.View
              animation="slideInLeft"
              duration={1500}
              style={styles.loadingProgress}
            />
          </View>
          <Text style={styles.loadingText}>Loading...</Text>
        </Animatable.View>
      </View>

      {/* Floating orbs */}
      <Animatable.View
        animation="fadeIn"
        delay={1200}
        style={[styles.orb, styles.orb1]}
      />
      <Animatable.View
        animation="fadeIn"
        delay={1400}
        style={[styles.orb, styles.orb2]}
      />
      <Animatable.View
        animation="fadeIn"
        delay={1600}
        style={[styles.orb, styles.orb3]}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  logoEmoji: {
    fontSize: 48,
  },
  title: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 250,
  },
  loadingContainer: {
    alignItems: 'center',
    position: 'absolute',
    bottom: 100,
  },
  loadingBar: {
    width: 200,
    height: 4,
    backgroundColor: colors.surfaceVariant,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 16,
  },
  loadingProgress: {
    height: '100%',
    width: '70%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  loadingText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontWeight: fontWeight.medium,
  },
  orb: {
    position: 'absolute',
    borderRadius: 50,
    opacity: 0.1,
  },
  orb1: {
    width: 100,
    height: 100,
    backgroundColor: colors.primary,
    top: 100,
    right: 50,
  },
  orb2: {
    width: 80,
    height: 80,
    backgroundColor: colors.secondary,
    bottom: 200,
    left: 30,
  },
  orb3: {
    width: 60,
    height: 60,
    backgroundColor: colors.tertiary,
    top: 300,
    left: 100,
  },
});
