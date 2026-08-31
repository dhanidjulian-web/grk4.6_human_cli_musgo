import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import React, { useMemo, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { QUICK_COMMANDS, clockOf, execCommand } from '../lib/sim';
import { useStore } from '../lib/store';
import { mono, radius } from '../lib/theme';
import type { LogLevel, LogLine } from '../lib/types';
import { IconBtn, ScreenHeader } from '../components/ui';

function levelColor(level: LogLevel, t: ReturnType<typeof useStore>['theme']): string {
  switch (level) {
    case 'ok':
      return t.ok;
    case 'error':
      return t.danger;
    case 'warn':
      return t.warn;
    case 'tool':
      return t.accent;
    case 'debug':
      return t.textFaint;
    default:
      return t.termText;
  }
}

export function TerminalScreen() {
  const { state, theme: t, setState, pushLog } = useStore();
  const nav = useNavigation();
  const [cmd, setCmd] = useState('');
  const listRef = useRef<FlatList<LogLine>>(null);

  const lines = useMemo(() => [...state.logs].reverse(), [state.logs]);

  const run = (raw: string) => {
    const command = raw.trim();
    if (!command) return;
    setCmd('');
    pushLog('tool', 'shell', `$ ${command}`);
    setState((s) => ({ ...s, terminalHistory: [...s.terminalHistory, command].slice(-60) }));
    const res = execCommand(command, state);
    if (res.clear) {
      setState((s) => ({ ...s, logs: [] }));
      return;
    }
    res.lines.forEach((l, i) => {
      setTimeout(() => pushLog(l.level, 'shell', l.text), 70 * (i + 1));
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.termBg }}>
      <ScreenHeader
        title="Terminal · CLI · SSH"
        subtitle={`workspace /workspace/filosofi · ${state.logs.length} baris log`}
        onBack={() => nav.goBack()}
        right={<IconBtn name="broom" onPress={() => setState((s) => ({ ...s, logs: [] }))} size={20} />}
      />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          ref={listRef}
          data={lines}
          inverted
          keyExtractor={(l) => l.id}
          contentContainerStyle={{ padding: 12, gap: 1 }}
          renderItem={({ item }) => (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Text style={{ fontFamily: mono, fontSize: 10.5, color: t.textFaint, paddingTop: 2 }}>{clockOf(item.ts)}</Text>
              <Text style={{ flex: 1, fontFamily: mono, fontSize: 11.5, lineHeight: 17, color: levelColor(item.level, t) }} selectable>
                {item.source ? `[${item.source}] ` : ''}
                {item.text}
              </Text>
            </View>
          )}
        />
        <View style={{ borderTopWidth: 1, borderTopColor: t.border, paddingHorizontal: 10, paddingTop: 8, paddingBottom: Platform.OS === 'ios' ? 14 : 10, gap: 8 }}>
          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
            {QUICK_COMMANDS.map((q) => (
              <Pressable
                key={q}
                onPress={() => run(q)}
                style={{ paddingHorizontal: 9, paddingVertical: 5, borderRadius: radius.pill, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border }}
              >
                <Text style={{ fontFamily: mono, fontSize: 10.5, color: t.accent }}>{q}</Text>
              </Pressable>
            ))}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ fontFamily: mono, fontSize: 14, color: t.accent }}>$</Text>
            <TextInput
              value={cmd}
              onChangeText={setCmd}
              placeholder="ketik perintah… (help)"
              placeholderTextColor={t.textFaint}
              autoCapitalize="none"
              autoCorrect={false}
              onSubmitEditing={() => run(cmd)}
              style={{ flex: 1, fontFamily: mono, fontSize: 13.5, color: t.termText, paddingVertical: 6 }}
            />
            <Pressable
              onPress={() => run(cmd)}
              style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: t.accent, alignItems: 'center', justifyContent: 'center' }}
            >
              <MaterialCommunityIcons name="play" size={17} color={t.onAccent} />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
