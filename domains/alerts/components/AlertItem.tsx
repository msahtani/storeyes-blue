import { Text } from '@/components/Themed';
import { BluePalette } from '@/constants/Colors';
import { useI18n } from '@/constants/i18n/I18nContext';
import Feather from '@expo/vector-icons/Feather';
import React from 'react';
import { Image, Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

export interface AlertItemProps {
  id: string;
  imageUri?: string;
  imageSource?: any; // For require() images
  title: string;
  timestamp: string;
  isNew?: boolean;
  /** When true, shows a check icon indicating confirmed true alert */
  isConfirmed?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export default function AlertItem({
  imageUri,
  imageSource,
  title,
  timestamp,
  isNew = true,
  isConfirmed = false,
  onPress,
  style,
}: AlertItemProps) {
  const { t } = useI18n();
  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        style,
        pressed && styles.containerPressed,
      ]}
      onPress={onPress}
      android_ripple={{ color: 'rgba(99, 102, 241, 0.2)' }}
    >
      <View style={styles.imageContainer}>
        {imageSource ? (
          <Image source={imageSource} style={styles.image} resizeMode="cover" />
        ) : imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, styles.placeholderImage]}>
            <View style={styles.placeholderIcon} />
          </View>
        )}
        <View style={styles.alertBadge}>
          <Text style={styles.alertBadgeText}>{t('alerts.item.badge')}</Text>
        </View>
      </View>
      
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={2}>{title}</Text>
          {isConfirmed && (
            <View style={styles.confirmedBadge}>
              <Feather name="check-circle" size={18} color={BluePalette.merge} />
            </View>
          )}
        </View>
        <View style={styles.footer}>
          <View style={styles.timestampContainer}>
            <View style={styles.timeIcon} />
            <Text style={styles.timestamp}>{timestamp}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: BluePalette.backgroundNew,
    borderRadius: 18,
    width: '100%',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: BluePalette.border,
    shadowColor: BluePalette.textDark,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  containerPressed: {
    transform: [{ scale: 0.98 }],
    borderColor: BluePalette.selected,
    shadowColor: BluePalette.selected,
    shadowOpacity: 0.25,
  },
  imageContainer: {
    width: '100%',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 140,
    backgroundColor: BluePalette.surfaceDark,
  },
  placeholderImage: {
    backgroundColor: BluePalette.surfaceDark,
    alignItems: 'center',
    justifyContent: 'center',
    height: 140,
  },
  placeholderIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: BluePalette.surface,
    opacity: 0.5,
  },
  alertBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: BluePalette.error,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    shadowColor: BluePalette.error,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 5,
  },
  alertBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  confirmedBadge: {
    marginTop: 2,
    flexShrink: 0,
  },
  content: {
    padding: 14,
    gap: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: {
    flex: 1,
    minWidth: 0,
    fontSize: 15,
    fontWeight: '600',
    color: BluePalette.textPrimary,
    lineHeight: 20,
    letterSpacing: -0.2,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timestampContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeIcon: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: BluePalette.merge,
    opacity: 0.9,
  },
  timestamp: {
    fontSize: 12,
    color: BluePalette.textSecondary,
    fontWeight: '500',
  },
});

