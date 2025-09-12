import { Platform, Vibration } from 'react-native';

// Define haptic feedback interface for type safety
interface HapticFeedbackInterface {
  trigger: (type: string) => void;
  impact: (style: string) => void;
  notification: (type: string) => void;
  selection: () => void;
}

// Cross-platform haptic feedback utility
let HapticFeedback: HapticFeedbackInterface;

if (Platform.OS === 'web') {
  // Web implementation using Vibration API if available
  HapticFeedback = {
    trigger: (type: string) => {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        switch (type) {
          case 'impactLight':
          case 'selection':
            navigator.vibrate(10);
            break;
          case 'impactMedium':
            navigator.vibrate(20);
            break;
          case 'impactHeavy':
          case 'notificationSuccess':
          case 'notificationWarning':
          case 'notificationError':
            navigator.vibrate(30);
            break;
          default:
            navigator.vibrate(15);
        }
      }
    },
    impact: (style: string) => {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        switch (style) {
          case 'Light':
            navigator.vibrate(10);
            break;
          case 'Medium':
            navigator.vibrate(20);
            break;
          case 'Heavy':
            navigator.vibrate(30);
            break;
          default:
            navigator.vibrate(15);
        }
      }
    },
    notification: (type: string) => {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        switch (type) {
          case 'Success':
            navigator.vibrate([10, 50, 10]);
            break;
          case 'Warning':
            navigator.vibrate([20, 50, 20]);
            break;
          case 'Error':
            navigator.vibrate([30, 50, 30]);
            break;
          default:
            navigator.vibrate(20);
        }
      }
    },
    selection: () => {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(10);
      }
    },
  };
} else {
  // Native iOS/Android implementation using React Native's built-in Vibration
  HapticFeedback = {
    trigger: (type: string) => {
      try {
        switch (type) {
          case 'impactLight':
          case 'selection':
            Vibration.vibrate(10);
            break;
          case 'impactMedium':
            Vibration.vibrate(20);
            break;
          case 'impactHeavy':
          case 'notificationSuccess':
          case 'notificationWarning':
          case 'notificationError':
            Vibration.vibrate(50);
            break;
          default:
            Vibration.vibrate(25);
        }
      } catch (error) {
        // Vibration not supported on this device
        console.warn('Vibration not supported:', error);
      }
    },
    impact: (style: string) => {
      try {
        switch (style) {
          case 'Light':
            Vibration.vibrate(10);
            break;
          case 'Medium':
            Vibration.vibrate(25);
            break;
          case 'Heavy':
            Vibration.vibrate(50);
            break;
          default:
            Vibration.vibrate(25);
        }
      } catch (error) {
        console.warn('Vibration not supported:', error);
      }
    },
    notification: (type: string) => {
      try {
        switch (type) {
          case 'Success':
            Vibration.vibrate([10, 50, 10]);
            break;
          case 'Warning':
            Vibration.vibrate([25, 50, 25]);
            break;
          case 'Error':
            Vibration.vibrate([50, 100, 50]);
            break;
          default:
            Vibration.vibrate(30);
        }
      } catch (error) {
        console.warn('Vibration not supported:', error);
      }
    },
    selection: () => {
      try {
        Vibration.vibrate(10);
      } catch (error) {
        console.warn('Vibration not supported:', error);
      }
    },
  };
}

export default HapticFeedback;
