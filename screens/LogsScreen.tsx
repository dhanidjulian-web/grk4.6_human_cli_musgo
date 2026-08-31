import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { Badge, Btn, Card, Chip, EmptyState, IconBtn, Row, Segmented } from '../components/ui';
import { clockOf } from '../lib/sim';
import { useStore } from '../lib/store';
import { mono, radius } from '../lib/theme';
import type { LogLevel, LogLine } from '../lib/types';

const LEVELS: { key: LogLevel | 'all'; label: string }[] = [
  { key: 'all', label: 'all' },
  { key: 'info', label: 'info' },
  { key: 'ok', label: 'ok' },
  { key: 'warn', label: 'warn' },
  { key: 'error', label: 'error' },
  { key: 'tool', label: 'tool' },
];

function tone(level: LogLevel, t: ReturnType<typeof useStore>['theme']): string {
  if (level === 'ok') return t.ok;
  if (level === 'error') return t.danger;
  if (level === 'warn') return t.warn;
  if (level === 'tool') return t.accent;
  if (level === 'debug') return t.textFaint;
  return t.textDim;
}

export function LogsScreen() {
  const { state, theme: t, setState } = useStore();
  const [tab, setTab] = useState<'logs' | 'bookmarks' | 'sessions'>('logs');
  const [level, setLevel] = useState<LogLevel | 'all'>('all');
  const [q, setQ] = useState('');

  const logs = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return [...state.logs]
      .reverse()
      .filter((l) => (level === 'all' ? true : l.level === level))
      .filter((l) => (!needle ? true : (l.text + l.source).toLowerCase().includes(needle)));
  }, [state.logs, level, q]);

  const bookmarks = useMemo(() => {
    const out: { session: string; sessionId: string; line: LogLine }[] = [];
    state.sessions.forEach((s) =>
      s.messages.forEach((m) => {
        if (m.bookmarked) {
          out.push({ session: s.title, sessionId: s.id, line: { id: m.id, ts: m.ts, level: 'ok', source: m.role, text: m.text } });
        }
      }),
    );
    return out.sort((a, b) => b.line.ts - a.line.ts);
  }, [state.sessions]);

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ paddingTop: 12, paddingHorizontal: 16, paddingBottom: 10, gap: 10, borderBottomWidth: 1, borderBottomColor: t.border }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ flex: 1, color: t.text, fontSize: 22, fontWeight: '900' }}>Logs</Text>
          <IconBtn name="broom" onPress={() => setState((s) => ({ ...s, logs: [] }))} />
        </View>
        <Segmented
          value={tab}
          onChange={(v) => setTab(v as typeof tab)}
          options={[
            { label: `Logger (${state.logs.length})`, value: 'logs' },
            { label: `Bookmarks (${bookmarks.length})`, value: 'bookmarks' },
            { label: `Sessions (${state.sessions.length})`, value: 'sessions' },
          ]}
        />
      </View>

      {tab === 'logs' ? (
        <>
          <View style={{ paddingHorizontal: 16, paddingTop: 10, gap: 9 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                backgroundColor: t.surface,
                borderWidth: 1,
                borderColor: t.border,
                borderRadius: radius.md,
                paddingHorizontal: 10,
              }}
            >
              <MaterialCommunityIcons name="magnify" size={17} color={t.textFaint} />
              <TextInput
                value={q}
                onChangeText={setQ}
                placeholder="cari log, source, error…"
                placeholderTextColor={t.textFaint}
                style={{ flex: 1, color: t.text, fontSize: 13.5, paddingVertical: 9 }}
              />
              {q ? <IconBtn name="close-circle" size={16} onPress={() => setQ('')} /> : null}
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {LEVELS.map((l) => (
                <Chip key={l.key} label={l.label} selected={level === l.key} onPress={() => setLevel(l.key)} />
              ))}
            </View>
          </View>
          <FlatList
            data={logs}
            keyExtractor={(l) => l.id}
            contentContainerStyle={{ padding: 16, gap: 6, paddingBottom: 30 }}
            ListEmptyComponent={<EmptyState icon="text-search" title="Log kosong" body="Belum ada log yang cocok dengan filter. Jalankan perintah di Terminal atau dispatch swarm." />}
            renderItem={({ item }) => (
              <View style={{ flexDirection: 'row', gap: 8, backgroundColor: t.surface, borderRadius: radius.md, borderWidth: 1, borderColor: t.border, padding: 10 }}>
                <Text style={{ fontFamily: mono, fontSize: 10, color: t.textFaint, paddingTop: 2 }}>{clockOf(item.ts)}</Text>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={{ fontFamily: mono, fontSize: 10, color: t.textFaint }}>
                    {item.source} · {item.level}
                  </Text>
                  <Text selectable style={{ fontFamily: mono, fontSize: 11.5, lineHeight: 17, color: tone(item.level, t) }}>
                    {item.text}
                  </Text>
                </View>
              </View>
            )}
          />
        </>
      ) : null}

      {tab === 'bookmarks' ? (
        <FlatList
          data={bookmarks}
          keyExtractor={(b) => b.line.id}
          contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 30 }}
          ListEmptyComponent={<EmptyState icon="bookmark-outline" title="Belum ada bookmark" body="Tekan lama pesan di chat untuk menyimpannya ke sini." />}
          renderItem={({ item }) => (
            <Pressable onPress={() => setState((s) => ({ ...s, activeSessionId: item.sessionId }))}>
              <Card>
                <Row gap={7}>
                  <MaterialCommunityIcons name="bookmark" size={14} color={t.accent} />
                  <Text style={{ flex: 1, color: t.textDim, fontSize: 12 }} numberOfLines={1}>
                    {item.session}
                  </Text>
                  <Text style={{ fontFamily: mono, fontSize: 10, color: t.textFaint }}>{clockOf(item.line.ts)}</Text>
                </Row>
                <Text style={{ color: t.text, fontSize: 13.5, lineHeight: 20, marginTop: 8 }} numberOfLines={4}>
                  {item.line.text}
                </Text>
              </Card>
            </Pressable>
          )}
        />
      ) : null}

      {tab === 'sessions' ? (
        <FlatList
          data={[...state.sessions].sort((a, b) => b.updatedAt - a.updatedAt)}
          keyExtractor={(s) => s.id}
          contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 30 }}
          ListHeaderComponent={
            <Btn
              label="Sesi baru"
              icon="plus"
              variant="primary"
              style={{ marginBottom: 4 }}
              onPress={() => {
                const id = `se_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
                setState((s) => ({
                  ...s,
                  activeSessionId: id,
                  sessions: [{ id, title: 'Sesi baru', profileId: s.activeProfileId, messages: [], createdAt: Date.now(), updatedAt: Date.now() }, ...s.sessions],
                }));
              }}
            />
          }
          ListEmptyComponent={<EmptyState icon="chat-processing-outline" title="Belum ada sesi" body="Buat sesi baru untuk memulai percakapan dengan orchestrator." />}
          renderItem={({ item }) => {
            const active = item.id === state.activeSessionId;
            return (
              <Pressable onPress={() => setState((s) => ({ ...s, activeSessionId: item.id }))}>
                <Card style={active ? { borderColor: t.accent } : undefined}>
                  <Row gap={10}>
                    <View style={{ flex: 1 }}>
                      <Row gap={6}>
                        <Text style={{ color: t.text, fontSize: 14.5, fontWeight: '800' }} numberOfLines={1}>
                          {item.title}
                        </Text>
                        {active ? <Badge label="aktif" tone="accent" /> : null}
                      </Row>
                      <Text style={{ fontFamily: mono, fontSize: 11, color: t.textFaint, marginTop: 3 }}>
                        {item.messages.length} pesan · {new Date(item.updatedAt).toLocaleDateString('id-ID')}
                      </Text>
                    </View>
                    <IconBtn
                      name="trash-can-outline"
                      size={18}
                      onPress={() =>
                        setState((s) => {
                          const rest = s.sessions.filter((x) => x.id !== item.id);
                          return { ...s, sessions: rest, activeSessionId: s.activeSessionId === item.id ? (rest[0]?.id ?? '') : s.activeSessionId };
                        })
                      }
                    />
                  </Row>
                </Card>
              </Pressable>
            );
          }}
        />
      ) : null}
    </View>
  );
}
