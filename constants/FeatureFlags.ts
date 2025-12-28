/**
 * Feature Flags for Storeyes App
 * 
 * These flags control which features are enabled/disabled for different app versions.
 * Use these flags to conditionally render features throughout the app.
 * 
 * VERSION 1 (Current):
 * - Only Alertes feature is fully functional
 * - Live Camera stream is not configured/active
 * - Future modules (Café, Caisse, Statistiques) are disabled but visible
 * - Support and Profile tabs are hidden
 */

export const FeatureFlags = {
  // Live Camera Stream
  // Set to true when live stream is configured and active
  LIVE_CAMERA_ACTIVE: false,

  // Feature Modules
  ALERTES_ENABLED: true,           // Only active feature in v1
  CAFE_ENABLED: false,             // Future module – not available in v1
  CAISSE_ENABLED: false,           // Future module – not available in v1
  STATISTIQUES_ENABLED: false,     // Future module – not available in v1

  // Navigation Tabs
  SUPPORT_TAB_ENABLED: false,      // Hidden in v1
  PROFILE_TAB_ENABLED: false,      // Hidden in v1
} as const;

