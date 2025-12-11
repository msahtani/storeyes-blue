const tintColorLight = '#2f95dc';
const tintColorDark = '#fff';

// Configurable background colors
export const BackgroundColors = {
  darkBlue: '#0A1929', // Default dark blue background
  dark: '#000000',
  light: '#FFFFFF',
};

export default {
  light: {
    text: '#000',
    background: '#fff',
    tint: tintColorLight,
    secondary: '#0D6EFD',
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#fff',
    background: BackgroundColors.darkBlue, // Use configurable dark blue
    tint: tintColorDark,
    secondary: '#1A3C66',
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorDark,
  },
};
