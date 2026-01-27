import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {useAppContext} from '../context/AppContext';
import {HomeScreen} from '../screens/HomeScreen';
import {CallDetailScreen} from '../screens/CallDetailScreen';
import {SettingsScreen} from '../screens/SettingsScreen';
import {OnboardingScreen} from '../screens/OnboardingScreen';
import type {RootStackParamList} from '../types/Navigation';
import {colors, fonts} from '../styles/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  const {state} = useAppContext();

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {backgroundColor: colors.background},
          headerTitleStyle: {
            fontSize: fonts.sizeHeader,
            fontWeight: fonts.weightBold,
            color: colors.textPrimary,
          },
          headerTintColor: colors.primary,
          headerShadowVisible: false,
        }}>
        {!state.onboardingComplete ? (
          <Stack.Screen
            name="Onboarding"
            component={OnboardingScreen}
            options={{headerShown: false}}
          />
        ) : (
          <>
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{title: 'Mindshield'}}
            />
            <Stack.Screen
              name="CallDetail"
              component={CallDetailScreen}
              options={{title: 'Call Details'}}
            />
            <Stack.Screen
              name="Settings"
              component={SettingsScreen}
              options={{title: 'Settings'}}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
