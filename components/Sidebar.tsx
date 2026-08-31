import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { activeProfile, useStore } from '../lib/store';
import { mono, radius } from '../lib/theme';
import type { RootStackParamList } from '../lib/nav';
import { nextPreview } from '../lib/sim';
import { Badge } from './ui';
import type { TabKey } from './TabBar';

const MODULES: { icon: string; label: string; sub: string; go: keyof RootStackParamList }[] = [
  { icon: 'lan-connect', label: 'Connector', sub: 'OAuth provider', go: 'Connectors' },
  { icon: 'key-variant', label: 'BYOK', sub: 'Multi API key', go: 'Byok' },
  { icon: 'router-wireless', label: 'Router', sub: 'Manual / autoroute', go: 'RouterSettings' },
  { icon: 'source-branch', label: 'Repository', sub: 'PAT · API · HTTP · SSH', go: 'Repos' },
  { icon: 'account-star-outline', label: 'Orchestrator Profile', sub: 'Template agent', go: 'Profiles' },
];

export function Sidebar({
  onClose,
  navigate,
  onTab,
}: {
  onClose: () => void;
  navigate: (name: keyof RootStackParamList, params?: object) => void;
  onTab: (t: TabKey) => void;
}) {
  const { state, setState, newSession, theme: t } = useStore();
  const insets = useSafeAreaInsets();
  const profile = activeProfile(state);
  const sessions = [...state.sessions].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5);

  const initials = state.account.name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const go = (name: keyof RootStackParamList, params?: object) => {
    onClose();
    setTimeout(() => navigate(name as never, params as never), 180);
  };

  const jumpTab = (k: TabKey) => {
    onClose();
    setTimeout(() => onTab(k), 180);
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top + 10 }}>
      <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: insets.bottom + 24, gap: 16 }} showsVerticalScrollIndicator={false}>
        {/* account */}
        <Pressable
          onPress={() => go('Settings')}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 11,
            backgroundColor: t.surface,
            borderWidth: 1,
            borderColor: t.border,
            borderRadius: radius.lg,
            padding: 12,
          }}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 16,
              backgroundColor: t.accentSoft,
              borderWidth: 1,
              borderColor: t.accent + '44',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: t.accent, fontWeight: '900', fontSize: 15 }}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: t.text, fontWeight: '800', fontSize: 14.5 }} numberOfLines={1}>
              {state.account.name}
            </Text>
            <Text style={{ color: t.textDim, fontSize: 12, fontFamily: mono }} numberOfLines={1}>
              {state.account.handle} · {state.account.plan}
            </Text>
          </View>
          <MaterialCommunityIcons name="cog-outline" size={19} color={t.textDim} />
        </Pressable>

        {/* quick actions */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable
            onPress={() => {
              newSession();
              jumpTab('chat');
            }}
            style={{ flex: 1, backgroundColor: t.accent, borderRadius: radius.md, paddingVertical: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }}
          >
            <MaterialCommunityIcons name="plus" size={16} color={t.onAccent} />
            <Text style={{ color: t.onAccent, fontWeight: '800', fontSize: 13 }}>Sesi baru</Text>
          </Pressable>
          <Pressable
            onPress={() => go('Terminal')}
            style={{ flex: 1, backgroundColor: t.surfaceAlt, borderWidth: 1, borderColor: t.border, borderRadius: radius.md, paddingVertical: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }}
          >
            <MaterialCommunityIcons name="console" size={16} color={t.textDim} />
            <Text style={{ color: t.textDim, fontWeight: '800', fontSize: 13 }}>Terminal</Text>
          </Pressable>
        </View>

        {/* route preview */}
        <Pressable onPress={() => go('RouterSettings')} style={{ backgroundColor: t.surfaceAlt, borderRadius: radius.md, borderWidth: 1, borderColor: t.border, padding: 11, gap: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <MaterialCommunityIcons name="router-wireless" size={14} color={t.accent} />
            <Text style={{ color: t.textDim, fontSize: 10.5, fontWeight: '800', letterSpacing: 0.8 }}>ROUTER · {state.router.mode.toUpperCase()}</Text>
          </View>
          <Text style={{ color: t.text, fontSize: 12, fontFamily: mono }} numberOfLines={2}>
            next → {nextPreview(state)}
          </Text>
        </Pressable>

        {/* sessions */}
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <Text style={{ color: t.textDim, fontSize: 10.5, fontWeight: '800', letterSpacing: 0.8 }}>SESSIONS</Text>
            <Pressable onPress={() => jumpTab('logs')}>
              <Text style={{ color: t.accent, fontSize: 11, fontWeight: '700' }}>semua</Text>
            </Pressable>
          </View>
          <View style={{ gap: 2 }}>
            {sessions.map((s) => {
              const active = s.id === state.activeSessionId;
              return (
                <Pressable
                  key={s.id}
                  onPress={() => {
                    setState((prev) => ({ ...prev, activeSessionId: s.id }));
                    jumpTab('chat');
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    paddingVertical: 9,
                    paddingHorizontal: 10,
                    borderRadius: radius.md,
                    backgroundColor: active ? t.accentSoft : 'transparent',
                  }}
                >
                  <MaterialCommunityIcons name={active ? 'chat-processing' : 'chat-processing-outline'} size={15} color={active ? t.accent : t.textFaint} />
                  <Text style={{ flex: 1, color: active ? t.text : t.textDim, fontSize: 13, fontWeight: active ? '700' : '500' }} numberOfLines={1}>
                    {s.title}
                  </Text>
                  <Pressable
                    hitSlop={8}
                    onPress={() =>
                      setState((prev) => {
                        const rest = prev.sessions.filter((x) => x.id !== s.id);
                        const nextActive =
                          prev.activeSessionId === s.id
                            ? (rest[0]?.id ?? '')
                            : prev.activeSessionId;
                        return { ...prev, sessions: rest, activeSessionId: nextActive };
                      })
                    }
                  >
                    <MaterialCommunityIcons name="trash-can-outline" size={15} color={t.textFaint} />
                  </Pressable>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* modules */}
        <View>
          <Text style={{ color: t.textDim, fontSize: 10.5, fontWeight: '800', letterSpacing: 0.8, marginBottom: 6 }}>MODULES</Text>
          <View style={{ backgroundColor: t.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: t.border, paddingHorizontal: 12 }}>
            {MODULES.map((m, i) => (
              <Pressable
                key={m.go}
                onPress={() => go(m.go)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 11, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: t.border }}
              >
                <MaterialCommunityIcons name={m.icon as never} size={18} color={t.accent} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: t.text, fontSize: 13.5, fontWeight: '700' }}>{m.label}</Text>
                  <Text style={{ color: t.textFaint, fontSize: 11.5 }}>{m.sub}</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={18} color={t.textFaint} />
              </Pressable>
            ))}
          </View>
        </View>

        {/* runtime */}
        <View>
          <Text style={{ color: t.textDim, fontSize: 10.5, fontWeight: '800', letterSpacing: 0.8, marginBottom: 6 }}>RUNTIME</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable onPress={() => jumpTab('sandbox')} style={{ flex: 1, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: radius.md, padding: 11, gap: 3 }}>
              <MaterialCommunityIcons name="box" size={17} color={t.info} />
              <Text style={{ color: t.text, fontSize: 12.5, fontWeight: '700' }}>Sandbox</Text>
              <Text style={{ color: t.textFaint, fontSize: 11 }}>{state.sandboxes.filter((s) => s.status === 'running').length} running</Text>
            </Pressable>
            <Pressable onPress={() => jumpTab('swarm')} style={{ flex: 1, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: radius.md, padding: 11, gap: 3 }}>
              <MaterialCommunityIcons name="sitemap" size={17} color={t.accent} />
              <Text style={{ color: t.text, fontSize: 12.5, fontWeight: '700' }}>Agent Swarm</Text>
              <Text style={{ color: t.textFaint, fontSize: 11 }}>{profile.swarm.length} agent aktif</Text>
            </Pressable>
            <Pressable onPress={() => jumpTab('logs')} style={{ flex: 1, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: radius.md, padding: 11, gap: 3 }}>
              <MaterialCommunityIcons name="format-list-bulleted" size={17} color={t.warn} />
              <Text style={{ color: t.text, fontSize: 12.5, fontWeight: '700' }}>Logger</Text>
              <Text style={{ color: t.textFaint, fontSize: 11 }}>{state.logs.length} baris</Text>
            </Pressable>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 2 }}>
          <Badge label={`profile: ${profile.name}`} tone="accent" />
          <Badge label={state.keys.filter((k) => k.enabled).length + ' key aktif'} tone="info" />
        </View>
      </ScrollView>
    </View>
  );
}
