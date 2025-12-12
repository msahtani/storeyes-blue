// Dramatic Color Palette: White, Dark Blue, and Merging Color (Light Cyan/Blue)
export const BluePalette = {
  // Primary Colors - White (Main)
  white: '#FFFFFF',
  whiteLight: '#FAFAFA',
  whiteDark: '#F5F5F5',
  
  // Primary Blues - Dark Blue (Main)
  primary: '#1E3A8A',        // Deep dark blue (primary actions)
  primaryLight: '#3B82F6',  // Medium blue
  primaryDark: '#1E40AF',   // Darker blue (pressed states)
  
  // Merging Color - Light Cyan/Blue (Merges white and blue)
  merge: '#06B6D4',         // Cyan-blue (merging color)
  mergeLight: '#22D3EE',    // Light cyan
  mergeDark: '#0891B2',      // Dark cyan
  
  // Accent Colors
  accent: '#2563EB',        // Bright blue accent
  accentLight: '#60A5FA',   // Light blue accent
  accentDark: '#1D4ED8',    // Dark blue accent
  
  // Background Colors - Dark Blue Theme
  background: '#0A1F3A',     // Very dark blue (main background)
  backgroundElevated: '#0F2D5C', // Elevated surfaces
  backgroundCard: '#1A3A6B',    // Card backgrounds (lighter dark blue)
  
  // Surface Colors
  surface: '#1E3A8A',        // Surface elements (dark blue)
  surfaceLight: '#2563EB',   // Light surfaces
  surfaceDark: '#0F2D5C',   // Dark surfaces
  
  // Border & Divider
  border: 'rgba(255, 255, 255, 0.15)',  // White borders with opacity
  borderLight: 'rgba(255, 255, 255, 0.1)',
  divider: 'rgba(6, 182, 212, 0.2)',    // Cyan divider
  
  // Text Colors - White Theme
  textPrimary: '#FFFFFF',           // Primary text (white)
  textSecondary: 'rgba(255, 255, 255, 0.85)',  // Secondary text
  textTertiary: 'rgba(255, 255, 255, 0.7)',   // Tertiary text
  textMuted: 'rgba(255, 255, 255, 0.5)',      // Muted text
  textDark: '#0A1F3A',              // Dark text for light backgrounds
  
  // Status Colors
  success: '#10B981',        // Green for success
  warning: '#F59E0B',        // Amber for warnings
  error: '#EF4444',          // Red for errors
  info: '#06B6D4',           // Cyan for info (using merge color)
  
  // Overlay
  overlay: 'rgba(10, 31, 58, 0.85)',
  overlayLight: 'rgba(10, 31, 58, 0.6)',
  
  // Selected/Active States - Using merge color
  selected: '#06B6D4',       // Cyan for selected items
  selectedBackground: 'rgba(6, 182, 212, 0.2)',
  selectedDark: '#0891B2',   // Darker cyan for pressed
};

const tintColorLight = BluePalette.primary;
const tintColorDark = BluePalette.textPrimary;

// Configurable background colors
export const BackgroundColors = {
  darkBlue: BluePalette.background,
  dark: '#000000',
  light: '#FFFFFF',
};

export default {
  light: {
    text: '#000',
    background: '#fff',
    tint: tintColorLight,
    secondary: BluePalette.primary,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: BluePalette.textPrimary,
    background: BluePalette.background,
    tint: tintColorDark,
    secondary: BluePalette.primary,
    tabIconDefault: '#64748B',
    tabIconSelected: tintColorDark,
  },
};
