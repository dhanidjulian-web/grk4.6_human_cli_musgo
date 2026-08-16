import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppProvider, useApp } from './lib/AppContext';
import { colors } from './lib/theme';
import { RootStackParamList, TabParamList } from './lib/navigation';
import { ConsoleScreen } from './screens/ConsoleScreen';
import { ShipScreen } from './screens/ShipScreen';
import { LibraryScreen } from './screens/LibraryScreen';
import { SkillsScreen } from './screens/SkillsScreen';
import { ModelsScreen } from './screens/ModelsScreen';
import { StudioScreen, AssetDetailScreen } from './screens/StudioScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { SessionsScreen } from './screens/SessionsScreen';
import { SkillEditorScreen } from './screens/SkillEditorScreen';
import { SourceEditorScreen } from './screens/SourceEditorScreen';
import { ModelEditorScreen } from './screens/ModelEditorScreen';
import { RepoDetailScreen } from './screens/RepoDetailScreen';
import { PlatformHubScreen, KeyEditorScreen } from './screens/PlatformHubScreen';
import {
  BookmarksScreen,
  SandboxScreen,
  SandboxEditorScreen,
  SourceDetailScreen,
} from './screens/WorkspaceScreens';
import { BackupScreen } from './screens/BackupScreen';
import {
  AgentEditorScreen,
  ConnectorEditorScreen,
  MemoryEditorScreen,
  WorkflowEditorScreen,
  HookEditorScreen,
  ScheduleEditorScreen,
  McpEditorScreen,
} from './screens/EditorsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.bg,
    card: colors.bgElevated,
    text: colors.text,
    border: colors.border,
    primary: colors.green,
  },
};

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bgElevated,
          borderTopColor: colors.border,
          height: 68,
          paddingTop: 6,
          paddingBottom: 10,
        },
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: colors.green,
        tabBarInactiveTintColor: colors.textDim,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700', letterSpacing: 0.4 },
        tabBarIcon: ({ color, size }) => {
          const map: Record<string, keyof typeof Ionicons.glyphMap> = {
            Console: 'terminal-outline',
            Ship: 'rocket-outline',
            Library: 'folder-open-outline',
            Skills: 'flash-outline',
            Models: 'cube-outline',
            Profile: 'person-circle-outline',
          };
          return <Ionicons name={map[route.name] || 'ellipse-outline'} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Console" component={ConsoleScreen} />
      <Tab.Screen name="Ship" component={ShipScreen} />
      <Tab.Screen name="Library" component={LibraryScreen} />
      <Tab.Screen name="Skills" component={SkillsScreen} />
      <Tab.Screen name="Models" component={ModelsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function Root() {
  const app = useApp();
  if (!app.ready) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.green} />
      </View>
    );
  }
  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg }, animation: 'slide_from_right' }}>
        <Stack.Screen name="Tabs" component={Tabs} />
        <Stack.Screen name="Sessions" component={SessionsScreen} />
        <Stack.Screen name="SkillEditor" component={SkillEditorScreen} />
        <Stack.Screen name="SourceEditor" component={SourceEditorScreen} />
        <Stack.Screen name="ModelEditor" component={ModelEditorScreen} />
        <Stack.Screen name="AgentEditor" component={AgentEditorScreen} />
        <Stack.Screen name="AssetDetail" component={AssetDetailScreen} />
        <Stack.Screen name="MemoryEditor" component={MemoryEditorScreen} />
        <Stack.Screen name="ConnectorEditor" component={ConnectorEditorScreen} />
        <Stack.Screen name="WorkflowEditor" component={WorkflowEditorScreen} />
        <Stack.Screen name="HookEditor" component={HookEditorScreen} />
        <Stack.Screen name="ScheduleEditor" component={ScheduleEditorScreen} />
        <Stack.Screen name="McpEditor" component={McpEditorScreen} />
        <Stack.Screen name="RepoDetail" component={RepoDetailScreen} />
        <Stack.Screen name="Studio" component={StudioScreen} />
        <Stack.Screen name="PlatformHub" component={PlatformHubScreen} />
        <Stack.Screen name="KeyEditor" component={KeyEditorScreen} />
        <Stack.Screen name="Bookmarks" component={BookmarksScreen} />
        <Stack.Screen name="Sandbox" component={SandboxScreen} />
        <Stack.Screen name="SandboxEditor" component={SandboxEditorScreen} />
        <Stack.Screen name="SourceDetail" component={SourceDetailScreen} />
        <Stack.Screen name="Backup" component={BackupScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  useFonts({
    ...Ionicons.font,
  });

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaProvider>
        <AppProvider>
          <StatusBar style="light" />
          <Root />
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
