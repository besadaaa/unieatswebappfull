import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { TextInput, Button, Card } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';

import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../../theme/theme';

interface RegisterScreenProps {
  navigation: any;
}

export default function RegisterScreen({ navigation }: RegisterScreenProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

  const handleRegister = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    const { error } = await signUp(email, password, fullName);
    setLoading(false);

    if (error) {
      Alert.alert('Registration Failed', error.message);
    } else {
      Alert.alert(
        'Registration Successful',
        'Please check your email to verify your account.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    }
  };

  return (
    <LinearGradient
      colors={[colors.background, colors.surface]}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animatable.View
            animation="fadeInDown"
            duration={1000}
            style={styles.header}
          >
            <View style={styles.logoContainer}>
              <Text style={styles.logoEmoji}>🍕</Text>
            </View>
            <Text style={styles.title}>Join UniEats!</Text>
            <Text style={styles.subtitle}>Create your account to get started</Text>
          </Animatable.View>

          {/* Register Form */}
          <Animatable.View
            animation="fadeInUp"
            duration={1000}
            delay={300}
          >
            <Card style={styles.card}>
              <Card.Content style={styles.cardContent}>
                <View style={styles.inputContainer}>
                  <TextInput
                    label="Full Name"
                    value={fullName}
                    onChangeText={setFullName}
                    mode="outlined"
                    autoCapitalize="words"
                    autoComplete="name"
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
                    value={email}
                    onChangeText={setEmail}
                    mode="outlined"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
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
                    label="Password"
                    value={password}
                    onChangeText={setPassword}
                    mode="outlined"
                    secureTextEntry={!showPassword}
                    autoComplete="password-new"
                    style={styles.input}
                    theme={{
                      colors: {
                        primary: colors.primary,
                        outline: colors.border,
                        background: colors.surface,
                        onSurface: colors.text,
                      },
                    }}
                    left={<TextInput.Icon icon="lock" iconColor={colors.textMuted} />}
                    right={
                      <TextInput.Icon
                        icon={showPassword ? 'eye-off' : 'eye'}
                        iconColor={colors.textMuted}
                        onPress={() => setShowPassword(!showPassword)}
                      />
                    }
                  />
                </View>

                <View style={styles.inputContainer}>
                  <TextInput
                    label="Confirm Password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    mode="outlined"
                    secureTextEntry={!showConfirmPassword}
                    autoComplete="password-new"
                    style={styles.input}
                    theme={{
                      colors: {
                        primary: colors.primary,
                        outline: colors.border,
                        background: colors.surface,
                        onSurface: colors.text,
                      },
                    }}
                    left={<TextInput.Icon icon="lock-check" iconColor={colors.textMuted} />}
                    right={
                      <TextInput.Icon
                        icon={showConfirmPassword ? 'eye-off' : 'eye'}
                        iconColor={colors.textMuted}
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      />
                    }
                  />
                </View>

                <Button
                  mode="contained"
                  onPress={handleRegister}
                  loading={loading}
                  disabled={loading}
                  style={styles.registerButton}
                  contentStyle={styles.buttonContent}
                  labelStyle={styles.buttonLabel}
                  buttonColor={colors.primary}
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </Button>

                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>OR</Text>
                  <View style={styles.dividerLine} />
                </View>

                <Button
                  mode="outlined"
                  onPress={() => navigation.navigate('Login')}
                  style={styles.loginButton}
                  contentStyle={styles.buttonContent}
                  labelStyle={styles.loginButtonLabel}
                  textColor={colors.primary}
                >
                  Already have an account? Sign In
                </Button>
              </Card.Content>
            </Card>
          </Animatable.View>

          {/* Terms */}
          <Animatable.View
            animation="fadeInUp"
            duration={1000}
            delay={600}
            style={styles.termsContainer}
          >
            <Text style={styles.termsText}>
              By creating an account, you agree to our{' '}
              <Text style={styles.termsLink}>Terms of Service</Text>
              {' '}and{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>
          </Animatable.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...shadows.lg,
  },
  logoEmoji: {
    fontSize: 36,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    ...shadows.lg,
  },
  cardContent: {
    padding: spacing.lg,
  },
  inputContainer: {
    marginBottom: spacing.md,
  },
  input: {
    backgroundColor: colors.surface,
  },
  registerButton: {
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    marginTop: spacing.md,
  },
  buttonContent: {
    paddingVertical: spacing.sm,
  },
  buttonLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    marginHorizontal: spacing.md,
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  loginButton: {
    borderRadius: borderRadius.lg,
    borderColor: colors.primary,
  },
  loginButtonLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  termsContainer: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  termsText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  termsLink: {
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
});
