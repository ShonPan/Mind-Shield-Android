import {useState, useCallback} from 'react';
import {
  PermissionsAndroid,
  Platform,
  NativeModules,
  Linking,
} from 'react-native';

const {PermissionsModule} = NativeModules;

export function usePermissions() {
  const [storageGranted, setStorageGranted] = useState(false);
  const [notificationGranted, setNotificationGranted] = useState(false);

  const checkPermissions = useCallback(async () => {
    try {
      // Check storage
      if (Platform.OS === 'android') {
        const apiLevel = Platform.Version;
        if (typeof apiLevel === 'number' && apiLevel >= 33) {
          const result = await PermissionsAndroid.check(
            'android.permission.READ_MEDIA_AUDIO' as any,
          );
          setStorageGranted(result);
        } else {
          const result = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          );
          setStorageGranted(result);
        }

        // Check notifications
        if (typeof apiLevel === 'number' && apiLevel >= 33) {
          const result = await PermissionsAndroid.check(
            'android.permission.POST_NOTIFICATIONS' as any,
          );
          setNotificationGranted(result);
        } else {
          // Pre-33 doesn't need notification permission
          setNotificationGranted(true);
        }
      }
    } catch (error) {
      console.error('Failed to check permissions:', error);
    }
  }, []);

  const requestStoragePermission = useCallback(async (): Promise<boolean> => {
    try {
      if (Platform.OS !== 'android') return false;
      const apiLevel = Platform.Version;
      let permission: string;
      if (typeof apiLevel === 'number' && apiLevel >= 33) {
        permission = 'android.permission.READ_MEDIA_AUDIO';
      } else {
        permission = PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;
      }
      const result = await PermissionsAndroid.request(permission as any, {
        title: 'Storage Access Required',
        message:
          'Mindshield needs access to your call recordings to detect scams and protect you.',
        buttonPositive: 'Allow',
        buttonNegative: 'Deny',
      });
      const granted = result === PermissionsAndroid.RESULTS.GRANTED;
      setStorageGranted(granted);
      return granted;
    } catch (error) {
      console.error('Failed to request storage permission:', error);
      return false;
    }
  }, []);

  const requestNotificationPermission =
    useCallback(async (): Promise<boolean> => {
      try {
        if (Platform.OS !== 'android') return false;
        const apiLevel = Platform.Version;
        if (typeof apiLevel === 'number' && apiLevel >= 33) {
          const result = await PermissionsAndroid.request(
            'android.permission.POST_NOTIFICATIONS' as any,
            {
              title: 'Notification Permission',
              message:
                'Mindshield needs to send you alerts when a scam call is detected.',
              buttonPositive: 'Allow',
              buttonNegative: 'Deny',
            },
          );
          const granted = result === PermissionsAndroid.RESULTS.GRANTED;
          setNotificationGranted(granted);
          return granted;
        }
        setNotificationGranted(true);
        return true;
      } catch (error) {
        console.error('Failed to request notification permission:', error);
        return false;
      }
    }, []);

  const openSettings = useCallback(async () => {
    try {
      if (PermissionsModule?.openAppSettings) {
        await PermissionsModule.openAppSettings();
      } else {
        await Linking.openSettings();
      }
    } catch (error) {
      console.error('Failed to open settings:', error);
    }
  }, []);

  return {
    storageGranted,
    notificationGranted,
    checkPermissions,
    requestStoragePermission,
    requestNotificationPermission,
    openSettings,
  };
}
