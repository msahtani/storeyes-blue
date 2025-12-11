import React from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { Text } from '@/components/Themed';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { BackgroundColors } from '@/constants/Colors';

export default function HomeHeader() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Storeyes</Text>
      <Pressable onPress={() => {}}>
        <FontAwesome name="user" size={24} color="#FFFFFF" style={styles.userIcon} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: BackgroundColors.darkBlue,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userIcon: {
    opacity: 0.9,
  },
});

