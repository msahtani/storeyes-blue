import React from 'react';
import { StyleSheet, View, Image, Pressable, StyleProp, ViewStyle } from 'react-native';
import { Text } from '@/components/Themed';

export interface AlertItemProps {
  id: string;
  imageUri?: string;
  imageSource?: any; // For require() images
  title: string;
  timestamp: string;
  isNew?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export default function AlertItem({
  imageUri,
  imageSource,
  title,
  timestamp,
  isNew = true,
  onPress,
  style,
}: AlertItemProps) {
  return (
    <Pressable
      style={[styles.container, style]}
      onPress={onPress}
      android_ripple={{ color: 'rgba(255, 255, 255, 0.1)' }}
    >
      <View style={styles.imageContainer}>
        {imageSource ? (
          <Image source={imageSource} style={styles.image} resizeMode="cover" />
        ) : imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, styles.placeholderImage]} />
        )}
      </View>
      
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
        <View style={styles.timestampContainer}>
          <Text style={styles.timestamp}>{timestamp}</Text>
          {isNew && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>NEW</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    width: '100%',
  },
  imageContainer: {
    width: '100%',
  },
  image: {
    width: '100%',
    height: 120,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  placeholderImage: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  content: {
    padding: 12,
    flex: 1,
    gap: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  timestampContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timestamp: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  badge: {
    backgroundColor: '#2E7DDB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 45,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

