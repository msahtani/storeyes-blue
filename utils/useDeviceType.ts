import { useWindowDimensions } from 'react-native';

/**
 * Hook to detect device type (phone vs tablet)
 * Returns true if the device is a tablet (iPad or Android tablet)
 */
export function useDeviceType() {
  const { width, height } = useWindowDimensions();
  const minDimension = Math.min(width, height);
  
  // Consider device a tablet if:
  // - iOS: width >= 768 (iPad portrait minimum)
  // - Android: width >= 600 (common tablet breakpoint)
  // - Or if the minimum dimension is >= 600 (handles both orientations)
  const isTablet = minDimension >= 600;
  
  return {
    isTablet,
    isPhone: !isTablet,
    width,
    height,
    minDimension,
  };
}

/**
 * Get max content width for responsive layouts
 * On tablets, constrain content to a readable width
 */
export function getMaxContentWidth(isTablet: boolean): number {
  if (isTablet) {
    // Max width for tablet content (centered)
    return 600; // Optimal reading width for tablets
  }
  return Infinity; // No constraint on phones
}

