import React, { useEffect, useRef } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { TerminalLine } from '../lib/types';
import { colors } from '../lib/theme';
import { formatTime } from '../lib/id';

function lineColor(kind: TerminalLine['kind']): string {
  switch (kind) {
    case 'ok':
      return colors.green;
    case 'warn':
      return colors.amber;
    case 'err':
      return colors.coral;
    case 'info':
      return colors.cyan;
    case 'cmd':
      return colors.mint;
    case 'head':
      return colors.green;
    case 'code':
      return '#c6d4e3';
    case 'dim':
      return colors.textDim;
    case 'sep':
      return colors.greenDim;
    case 'sys':
      return colors.violet;
    default:
      return colors.text;
  }
}

function LineRow({ item }: { item: TerminalLine }) {
  return (
    <View style={styles.line}>
      <Text style={styles.ts}>{formatTime(item.ts)}</Text>
      <Text selectable style={[styles.body, { color: lineColor(item.kind) }]}>
        {item.text}
      </Text>
    </View>
  );
}

export function TerminalView({
  lines,
  streaming,
  onClearHint,
}: {
  lines: TerminalLine[];
  streaming?: boolean;
  onClearHint?: () => void;
}) {
  const ref = useRef<FlatList<TerminalLine>>(null);

  useEffect(() => {
    if (lines.length === 0) return;
    const t = setTimeout(() => {
      ref.current?.scrollToEnd({ animated: true });
    }, 40);
    return () => clearTimeout(t);
  }, [lines.length, streaming]);

  return (
    <View style={styles.wrap}>
      <View style={styles.chrome}>
        <View style={styles.dots}>
          <View style={[styles.dot, { backgroundColor: '#ff5f57' }]} />
          <View style={[styles.dot, { backgroundColor: '#febc2e' }]} />
          <View style={[styles.dot, { backgroundColor: '#28c840' }]} />
        </View>
        <Text style={styles.chromeTitle}>human@musgo-os — zsh — 80×24</Text>
        <Pressable onPress={onClearHint}>
          <Text style={styles.live}>{streaming ? '● STREAM' : '● IDLE'}</Text>
        </Pressable>
      </View>
      <FlatList
        ref={ref}
        data={lines}
        keyExtractor={(it) => it.id}
        renderItem={({ item }) => <LineRow item={item} />}
        contentContainerStyle={styles.list}
        style={styles.listFlex}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: colors.bgTerminal,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  chrome: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: '#080d12',
    gap: 10,
  },
  dots: { flexDirection: 'row', gap: 5 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  chromeTitle: {
    flex: 1,
    color: colors.textDim,
    fontSize: 10,
    letterSpacing: 0.4,
    fontVariant: ['tabular-nums'],
  },
  live: {
    color: colors.greenDim,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  listFlex: { flex: 1 },
  list: { paddingHorizontal: 10, paddingVertical: 8, paddingBottom: 18 },
  line: { flexDirection: 'row', gap: 8, paddingVertical: 1 },
  ts: {
    color: '#2a3a4a',
    fontSize: 10,
    width: 54,
    fontVariant: ['tabular-nums'],
    paddingTop: 1,
  },
  body: {
    flex: 1,
    fontSize: 11.5,
    lineHeight: 16.5,
    fontFamily: 'Courier New',
  },
});
