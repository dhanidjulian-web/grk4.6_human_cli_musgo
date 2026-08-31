import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../lib/store';
import { radius, shadowFor } from '../lib/theme';

export type TabKey = 'chat' | 'sandbox' | 'swarm' | 'logs';

const TABS: { key: TabKey; label: string; icon: string; iconActive: string }[] = [
  { key: 'chat', label: 'Chat', icon: 'message-text-outline', iconActive: 'message-text' },
  { key: 'sandbox', label: 'Sandbox', icon: 'package-variant-closed', iconActive: 'box' },
  { key: 'swarm', label: 'Swarm', icon: 'sitemap-outline', iconActive: 'sitemap' },
  { key: 'logs', label: 'Logs', icon: 'format-list-bulleted', iconActive: 'format-list-bulleted' },
];

export function TabBar({ tab, onChange, badge }: { tab: TabKey; onChange: (t: TabKey) => void; badge?: Partial<Record<TabKey, number>> }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          backgroundColor: t.surface,
          borderTopWidth: 1,
          borderTopColor: t.border,
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 8,
          paddingHorizontal: 6,
        },
        shadowFor(t, 2),
      ]}
    >
      {TABS.map((item) => {
        const active = item.key === tab;
        const count = badge?.[item.key];
        return (
          <Pressable
            key={item.key}
            onPress={() => onChange(item.key)}
            style={({ pressed }) => ({
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              paddingVertical: 6,
              borderRadius: radius.md,
              backgroundColor: active ? t.accentSoft : 'transparent',
              opacity: pressed ? 0.65 : 1,
            })}
          >
            <View>
              <MaterialCommunityIcons name={(active ? item.iconActive : item.icon) as never} size={21} color={active ? t.accent : t.textDim} />
              {count && count > 0 ? (
                <View
                  style={{
                    position: 'absolute',
                    top: -3,
                    right: -9,
                    minWidth: 15,
                    height: 15,
                    borderRadius: 8,
                    backgroundColor: t.danger,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: 3,
                  }}
                >
                  <Text style={{ color: '#fff', fontSize: 9, fontWeight: '800' }}>{count > 9 ? '9+' : count}</Text>
                </View>
              ) : null}
            </View>
            <Text style={{ color: active ? t.accent : t.textDim, fontSize: 10.5, fontWeight: '700' }}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
