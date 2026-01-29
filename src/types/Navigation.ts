import type {NativeStackScreenProps} from '@react-navigation/native-stack';

export type RootStackParamList = {
  Onboarding: undefined;
  Home: undefined;
  CallDetail: {callId: string};
  Settings: undefined;
  ScamDatabase: undefined;
};

export type OnboardingScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'Onboarding'
>;
export type HomeScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'Home'
>;
export type CallDetailScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'CallDetail'
>;
export type SettingsScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'Settings'
>;
export type ScamDatabaseScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'ScamDatabase'
>;
