import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Main: undefined;
  Terminal: undefined;
  Settings: undefined;
  Connectors: undefined;
  Byok: undefined;
  RouterSettings: undefined;
  Repos: undefined;
  Profiles: undefined;
  ProfileEditor: { id: string };
};

export type NavProps<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>;
