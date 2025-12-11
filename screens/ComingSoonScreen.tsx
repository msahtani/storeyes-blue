import React from 'react';
import { StyleSheet, View, SafeAreaView } from 'react-native';
import { Text } from '@/components/Themed';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { BackgroundColors } from '@/constants/Colors';

interface ComingSoonScreenProps {
  backgroundColor?: string;
}

export default function ComingSoonScreen({ backgroundColor }: ComingSoonScreenProps) {
  const bgColor = backgroundColor || BackgroundColors.darkBlue;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      <View style={styles.content}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Coming Soon</Text>
        </View>
        <View style={styles.iconContainer}>
          <FontAwesome name="ellipsis-h" size={32} color="rgba(255, 255, 255, 0.5)" />
        </View>
        <Text style={styles.title}>Counting</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginBottom: 20,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  iconContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.6)',
  },
});

