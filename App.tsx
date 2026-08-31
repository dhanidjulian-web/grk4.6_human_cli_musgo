import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { DarkTheme, DefaultTheme, NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import React, { useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Sidebar } from './components/Sidebar';
import { TabBar, type TabKey } from './components/TabBar';
import { ActivityIndicator } from 'react-native';
import type { RootStackParamList } from './lib/nav';
import { StoreProvider, useStore } from './lib/store';
import { shadowFor } from './lib/theme';
import { ByokScreen } from './screens/ByokScreen';
import { ChatScreen } from './screens/ChatScreen';
import { ConnectorScreen } from './screens/ConnectorScreen';
import { LogsScreen } from './screens/LogsScreen';
import { ProfileEditorScreen } from './screens/ProfileEditorScreen';
import { ProfilesScreen } from './screens/ProfilesScreen';
import { RepositoryScreen } from './screens/RepositoryScreen';
import { RouterScreen } from './screens/RouterScreen';
import { SandboxScreen } from './screens/SandboxScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { SwarmScreen } from './screens/SwarmScreen';
import { TerminalScreen } from './screens/TerminalScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const SIDEBAR_WIDTH = 302;

function MainScreen() {
  const { state, theme: t } = useStore();
  const nav = useNavigation();
  const [tab, setTab] = useState<TabKey>('chat');
  const [sidebar, setSidebar] = useState(false);
  const slide = useRef(new Animated.Value(-SIDEBAR_WIDTH - 20)).current;
  const backdrop = useRef(new Animated.Value(0)).current;

  const openSidebar = () => {
    setSidebar(true);
    Animated.parallel([
      Animated.timing(slide, { toValue: 0, duration: 240, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(backdrop, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
  };

  const closeSidebar = () => {
    Animated.parallel([
      Animated.timing(slide, { toValue: -SIDEBAR_WIDTH - 20, duration: 200, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      Animated.timing(backdrop, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (finished) setSidebar(false);
    });
  };

  const errorCount = state.logs.filter((l) => l.level === 'error').length;
  const runningSb = state.sandboxes.filter((s) => s.status === 'running').length;
  const runningAgents = state.profiles.reduce((acc, p) => acc + p.swarm.filter((a) => a.status === 'running').length, 0);

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ flex: 1 }}>
        {tab === 'chat' ? <ChatScreen onOpenSidebar={openSidebar} /> : null}
        {tab === 'sandbox' ? <SandboxScreen /> : null}
        {tab === 'swarm' ? <SwarmScreen /> : null}
        {tab === 'logs' ? <LogsScreen /> : null}
      </View>
      <TabBar
        tab={tab}
        onChange={setTab}
        badge={{ logs: errorCount, sandbox: runningSb, swarm: runningAgents }}
      />

      <Animated.View pointerEvents={sidebar ? 'auto' : 'none'} style={[StyleSheet.absoluteFill, { backgroundColor: '#000', opacity: backdrop }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={closeSidebar} />
      </Animated.View>

      <Animated.View
        pointerEvents={sidebar ? 'auto' : 'none'}
        style={[
          {
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            width: SIDEBAR_WIDTH,
            backgroundColor: t.bg,
            borderRightWidth: 1,
            borderRightColor: t.border,
            transform: [{ translateX: slide }],
          },
          shadowFor(t, 3),
        ]}
      >
        <Sidebar
          onClose={closeSidebar}
          navigate={(name, params) => (nav.navigate as (n: string, p?: object) => void)(name, params)}
          onTab={(k) => setTab(k)}
        />
      </Animated.View>
    </View>
  );
}

function Splash() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, backgroundColor: '#0A0E14' }}>
      <View style={{ width: 64, height: 64, borderRadius: 22, backgroundColor: 'rgba(49,208,170,0.14)', alignItems: 'center', justifyContent: 'center' }}>
        <MaterialCommunityIcons name="sitemap" size={32} color="#31D0AA" />
      </View>
      <Text style={{ color: '#E9EFF8', fontSize: 19, fontWeight: '900', letterSpacing: 0.5 }}>Filosofi</Text>
      <ActivityIndicator color="#31D0AA" />
      <Text style={{ color: '#5E6E84', fontSize: 12, fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }) }}>memuat workspace…</Text>
    </View>
  );
}

function Root() {
  const { state, theme: t } = useStore();
  const [fontsLoaded, fontError] = useFonts({ ...Ionicons.font, ...MaterialCommunityIcons.font });

  if (!state.hydrated || (!fontsLoaded && !fontError)) return <Splash />;

  const base = t.name === 'dark' ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    colors: { ...base.colors, background: t.bg, card: t.surface, text: t.text, border: t.border, primary: t.accent },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style={t.name === 'dark' ? 'light' : 'dark'} />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={MainScreen} />
        <Stack.Screen name="Terminal" component={TerminalScreen} options={{ presentation: 'modal' }} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ presentation: 'modal' }} />
        <Stack.Screen name="Connectors" component={ConnectorScreen} options={{ presentation: 'modal' }} />
        <Stack.Screen name="Byok" component={ByokScreen} options={{ presentation: 'modal' }} />
        <Stack.Screen name="RouterSettings" component={RouterScreen} options={{ presentation: 'modal' }} />
        <Stack.Screen name="Repos" component={RepositoryScreen} options={{ presentation: 'modal' }} />
        <Stack.Screen name="Profiles" component={ProfilesScreen} options={{ presentation: 'modal' }} />
        <Stack.Screen name="ProfileEditor" component={ProfileEditorScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StoreProvider>
          <Root />
        </StoreProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
