import React, {useEffect} from 'react';
import {StatusBar} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {AppProvider} from './src/context/AppContext';
import {AppNavigator} from './src/navigation/AppNavigator';
import {initDatabase} from './src/database/database';
import {setupNotificationChannel} from './src/services/notificationService';

function App(): React.JSX.Element {
  useEffect(() => {
    const bootstrap = async () => {
      await initDatabase();
      await setupNotificationChannel();
    };
    bootstrap();
  }, []);

  return (
    <SafeAreaProvider>
      <AppProvider>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <AppNavigator />
      </AppProvider>
    </SafeAreaProvider>
  );
}

export default App;
