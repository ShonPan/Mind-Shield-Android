/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import notifee, {EventType} from '@notifee/react-native';

// Handle notification events when app is in background
notifee.onBackgroundEvent(async ({type, detail}) => {
  if (type === EventType.PRESS) {
    // Navigation to CallDetail will be handled by the app when it opens
    // The callId is stored in detail.notification?.data?.callId
  }
});

AppRegistry.registerComponent(appName, () => App);
