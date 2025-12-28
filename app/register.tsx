import { Text } from '@/components/Themed';
import { BluePalette } from '@/constants/Colors';
import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { clearError, register, setSkipAuth } from '@/domains/auth/store/authSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

export default function RegisterScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  
  const { isLoading, error } = useAppSelector((state) => state.auth);
  
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }
    
    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;
    
    dispatch(clearError());
    const result = await dispatch(register({
      email: formData.email,
      username: formData.username,
      password: formData.password,
      firstName: formData.firstName || undefined,
      lastName: formData.lastName || undefined,
    }));
    
    if (register.fulfilled.match(result)) {
      router.replace('/(tabs)');
    }
  };

  const handleSkip = () => {
    dispatch(setSkipAuth(true));
    router.replace('/(tabs)');
  };

  const handleBack = () => {
    router.back();
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
    dispatch(clearError());
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={handleBack} style={styles.backButton}>
              <Feather name="arrow-left" size={24} color={BluePalette.textPrimary} />
            </Pressable>
            <View style={styles.logoWrapper}>
              <Image
                source={require('@/assets/images/logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <View style={styles.backButton} />
          </View>

          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Sign up to get started</Text>

          {/* Form Section */}
          <View style={styles.formContainer}>
            {/* First Name & Last Name Row */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>First Name (Optional)</Text>
                <View style={styles.inputWrapper}>
                  <Feather
                    name="user"
                    size={18}
                    color={BluePalette.textDark}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="John"
                    placeholderTextColor="rgba(10, 31, 58, 0.5)"
                    value={formData.firstName}
                    onChangeText={(value) => updateField('firstName', value)}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Last Name (Optional)</Text>
                <View style={styles.inputWrapper}>
                  <Feather
                    name="user"
                    size={18}
                    color={BluePalette.textDark}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Doe"
                    placeholderTextColor="rgba(10, 31, 58, 0.5)"
                    value={formData.lastName}
                    onChangeText={(value) => updateField('lastName', value)}
                    autoCapitalize="words"
                  />
                </View>
              </View>
            </View>

            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={[
                styles.inputWrapper,
                errors.email ? styles.inputError : null,
              ]}>
                <Feather
                  name="mail"
                  size={20}
                  color={errors.email ? BluePalette.error : BluePalette.textDark}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="your.email@example.com"
                  placeholderTextColor="rgba(10, 31, 58, 0.5)"
                  value={formData.email}
                  onChangeText={(value) => updateField('email', value)}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                />
              </View>
              {errors.email ? (
                <Text style={styles.errorText}>{errors.email}</Text>
              ) : null}
            </View>

            {/* Username Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Username</Text>
              <View style={[
                styles.inputWrapper,
                errors.username ? styles.inputError : null,
              ]}>
                <Feather
                  name="at-sign"
                  size={20}
                  color={errors.username ? BluePalette.error : BluePalette.textDark}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Choose a username"
                  placeholderTextColor="rgba(10, 31, 58, 0.5)"
                  value={formData.username}
                  onChangeText={(value) => updateField('username', value)}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              {errors.username ? (
                <Text style={styles.errorText}>{errors.username}</Text>
              ) : null}
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={[
                styles.inputWrapper,
                errors.password ? styles.inputError : null,
              ]}>
                <Feather
                  name="lock"
                  size={20}
                  color={errors.password ? BluePalette.error : BluePalette.textDark}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Create a password"
                  placeholderTextColor="rgba(10, 31, 58, 0.5)"
                  value={formData.password}
                  onChangeText={(value) => updateField('password', value)}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Pressable
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <Feather
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={BluePalette.textDark}
                  />
                </Pressable>
              </View>
              {errors.password ? (
                <Text style={styles.errorText}>{errors.password}</Text>
              ) : null}
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={[
                styles.inputWrapper,
                errors.confirmPassword ? styles.inputError : null,
              ]}>
                <Feather
                  name="lock"
                  size={20}
                  color={errors.confirmPassword ? BluePalette.error : BluePalette.textDark}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm your password"
                  placeholderTextColor="rgba(10, 31, 58, 0.5)"
                  value={formData.confirmPassword}
                  onChangeText={(value) => updateField('confirmPassword', value)}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Pressable
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeIcon}
                >
                  <Feather
                    name={showConfirmPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={BluePalette.textDark}
                  />
                </Pressable>
              </View>
              {errors.confirmPassword ? (
                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
              ) : null}
            </View>

            {/* Error Message */}
            {error && (
              <View style={styles.errorContainer}>
                <Feather name="alert-circle" size={16} color={BluePalette.error} />
                <Text style={styles.errorMessage}>{error}</Text>
              </View>
            )}

            {/* Register Button */}
            <Pressable
              style={({ pressed }) => [
                styles.registerButton,
                isLoading && styles.registerButtonDisabled,
                pressed && !isLoading && styles.registerButtonPressed,
              ]}
              onPress={handleRegister}
              disabled={isLoading}
              android_ripple={{ color: BluePalette.primaryDark }}
            >
              {isLoading ? (
                <ActivityIndicator color={BluePalette.white} size="small" />
              ) : (
                <Text style={styles.registerButtonText}>Create Account</Text>
              )}
            </Pressable>

            {/* Skip Option */}
            <View style={styles.skipContainer}>
              <Pressable onPress={handleSkip} style={styles.skipButton}>
                <Text style={styles.skipText}>Continue without account</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BluePalette.backgroundCard,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: BluePalette.backgroundCard,
    borderWidth: 1,
    borderColor: BluePalette.border,
  },
  logoWrapper: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: BluePalette.white,
    padding: 10,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: BluePalette.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: BluePalette.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 32,
  },
  formContainer: {
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 0,
  },
  inputGroup: {
    gap: 8,
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: BluePalette.textSecondary,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BluePalette.white,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(10, 31, 58, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 4,
    minHeight: 52,
  },
  inputError: {
    borderColor: BluePalette.error,
    backgroundColor: `${BluePalette.error}15`,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: BluePalette.textDark,
    paddingVertical: 12,
  },
  eyeIcon: {
    padding: 4,
  },
  errorText: {
    fontSize: 12,
    color: BluePalette.error,
    marginLeft: 4,
    marginTop: 4,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: `${BluePalette.error}15`,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BluePalette.error,
  },
  errorMessage: {
    flex: 1,
    fontSize: 14,
    color: BluePalette.error,
    fontWeight: '500',
  },
  registerButton: {
    backgroundColor: BluePalette.merge,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: BluePalette.merge,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  registerButtonDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
  },
  registerButtonPressed: {
    transform: [{ scale: 0.98 }],
    backgroundColor: BluePalette.mergeDark,
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: BluePalette.white,
    letterSpacing: 0.5,
  },
  skipContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  skipText: {
    fontSize: 14,
    color: BluePalette.textMuted,
    fontWeight: '500',
  },
});


