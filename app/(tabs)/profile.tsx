import { Text } from '@/components/Themed';
import { BluePalette } from '@/constants/Colors';
import { getCurrentUser, logout } from '@/domains/auth/store/authSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { getMaxContentWidth, useDeviceType } from '@/utils/useDeviceType';
import { getUserDisplayName, getUserInitials } from '@/utils/userUtils';
import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const { user, isLoading, error } = useAppSelector((state) => state.auth);
  const { isTablet } = useDeviceType();
  const maxContentWidth = getMaxContentWidth(isTablet);

  // Tab bar total height: 65px base + bottom safe area inset
  const tabBarBaseHeight = 65;
  const tabBarTotalHeight = tabBarBaseHeight + insets.bottom;
  const bottomPadding = tabBarTotalHeight + 8;

  useEffect(() => {
    // Fetch current user info when screen loads
    if (!user || (!user.firstName && !user.lastName)) {
      dispatch(getCurrentUser());
    }
  }, [dispatch, user]);

  const handleLogout = async () => {
    await dispatch(logout());
    router.replace('/login');
  };

  const initials = getUserInitials(user);
  const displayName = getUserDisplayName(user);

  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor: BluePalette.backgroundCard }]}
      edges={['left', 'right']}
    >
      {/* Header with back button */}
      <View style={[styles.topHeader, { paddingTop: insets.top + 5 }]}>
        <Pressable 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={24} color={BluePalette.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomPadding }
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.contentWrapper, { maxWidth: maxContentWidth }]}>
          {/* User Info Card */}
          <View style={styles.userCard}>
            {/* Avatar Circle */}
            <View style={styles.avatarContainer}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
              <View style={styles.avatarRing} />
            </View>

            {/* User Name */}
            <Text style={styles.userName}>{displayName}</Text>

            {/* User Email */}
            {user?.email && (
              <Text style={styles.userEmail}>{user.email}</Text>
            )}

            {/* Username */}
            {user?.username && user.username !== user.email && (
              <View style={styles.usernameContainer}>
                <Feather name="user" size={14} color={BluePalette.textTertiary} />
                <Text style={styles.usernameText}>@{user.username}</Text>
              </View>
            )}
          </View>

          {/* Loading State */}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={BluePalette.merge} />
              <Text style={styles.loadingText}>Loading profile...</Text>
            </View>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <View style={styles.errorContainer}>
              <Feather name="alert-circle" size={20} color={BluePalette.error} />
              <Text style={styles.errorText}>{error}</Text>
              <Pressable
                style={styles.retryButton}
                onPress={() => dispatch(getCurrentUser())}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </Pressable>
            </View>
          )}

          {/* User Details Section */}
          {user && !isLoading && (
          <View style={styles.detailsSection}>
            <View style={styles.detailItem}>
              <View style={styles.detailIconContainer}>
                <Feather name="mail" size={18} color={BluePalette.merge} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Email</Text>
                <Text style={styles.detailValue}>{user.email}</Text>
              </View>
            </View>

            {user.username && (
              <View style={styles.detailItem}>
                <View style={styles.detailIconContainer}>
                  <Feather name="user" size={18} color={BluePalette.merge} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Username</Text>
                  <Text style={styles.detailValue}>{user.username}</Text>
                </View>
              </View>
            )}

            {user.firstName && (
              <View style={styles.detailItem}>
                <View style={styles.detailIconContainer}>
                  <Feather name="user" size={18} color={BluePalette.merge} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>First Name</Text>
                  <Text style={styles.detailValue}>{user.firstName}</Text>
                </View>
              </View>
            )}

            {user.lastName && (
              <View style={styles.detailItem}>
                <View style={styles.detailIconContainer}>
                  <Feather name="user" size={18} color={BluePalette.merge} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Last Name</Text>
                  <Text style={styles.detailValue}>{user.lastName}</Text>
                </View>
              </View>
            )}
            </View>
          )}

          {/* Logout Button */}
          {/* {user && !isLoading && (
            <Pressable
              style={({ pressed }) => [
                styles.logoutButton,
                pressed && styles.logoutButtonPressed,
              ]}
              onPress={handleLogout}
              android_ripple={{ color: BluePalette.error }}
            >
              <Feather name="log-out" size={18} color={BluePalette.white} />
              <Text style={styles.logoutButtonText}>Logout</Text>
            </Pressable>
          )} */}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BluePalette.background,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: BluePalette.backgroundCard,
    borderBottomWidth: 1,
    borderBottomColor: BluePalette.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BluePalette.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: BluePalette.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: BluePalette.textPrimary,
    letterSpacing: -0.5,
  },
  headerSpacer: {
    width: 40,
    height: 40,
  },
  scrollView: {
    flex: 1,
    backgroundColor: BluePalette.white,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    alignItems: 'center',
  },
  contentWrapper: {
    width: '100%',
  },
  userCard: {
    backgroundColor: BluePalette.backgroundCard,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: BluePalette.border,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: BluePalette.merge,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: BluePalette.mergeDark,
    zIndex: 2,
  },
  avatarRing: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
    borderColor: BluePalette.merge,
    opacity: 0.3,
    top: -5,
    left: -5,
    zIndex: 1,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '700',
    color: BluePalette.white,
    letterSpacing: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: BluePalette.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  userEmail: {
    fontSize: 16,
    color: BluePalette.textSecondary,
    marginBottom: 8,
    textAlign: 'center',
  },
  usernameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  usernameText: {
    fontSize: 14,
    color: BluePalette.textTertiary,
    fontWeight: '500',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: BluePalette.textTertiary,
  },
  errorContainer: {
    backgroundColor: `${BluePalette.error}15`,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: BluePalette.error,
    marginBottom: 24,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: BluePalette.error,
    fontWeight: '500',
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: BluePalette.error,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: BluePalette.white,
  },
  detailsSection: {
    backgroundColor: BluePalette.backgroundCard,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: BluePalette.border,
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  detailIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${BluePalette.merge}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: BluePalette.textTertiary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: BluePalette.textPrimary,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: BluePalette.error,
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 8,
    shadowColor: BluePalette.error,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutButtonPressed: {
    transform: [{ scale: 0.98 }],
    backgroundColor: '#DC2626',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: BluePalette.white,
    letterSpacing: 0.5,
  },
});
