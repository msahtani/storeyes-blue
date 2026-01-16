import { BluePalette } from '@/constants/Colors';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function BottomBar() {
  const insets = useSafeAreaInsets();
  
  // Bottom bar height: 15px max
  const bottomBarHeight = 15;
  const totalHeight = bottomBarHeight + insets.bottom;

  return (
    <View 
      style={[
        styles.bottomBar,
        {
          height: totalHeight,
          paddingBottom: insets.bottom,
        }
      ]}
    />
  );
}

const styles = StyleSheet.create({
  bottomBar: {
    backgroundColor: BluePalette.backgroundNew,
    borderTopWidth: 1,
    borderTopColor: BluePalette.border,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});

