import * as Haptics from 'expo-haptics';

/**
 * Safe Haptics Utility
 * Wraps expo-haptics in try-catch guards to prevent native crashes
 * on unsupported devices, emulators, or restricted runtimes.
 */
export const safeHaptics = {
  impact: async (style = Haptics.ImpactFeedbackStyle.Light) => {
    try {
      await Haptics.impactAsync(style);
    } catch {
      // Gracefully ignore
    }
  },
  notification: async (type = Haptics.NotificationFeedbackType.Success) => {
    try {
      await Haptics.notificationAsync(type);
    } catch {
      // Gracefully ignore
    }
  },
  selection: async () => {
    try {
      await Haptics.selectionAsync();
    } catch {
      // Gracefully ignore
    }
  },
};

export default safeHaptics;
