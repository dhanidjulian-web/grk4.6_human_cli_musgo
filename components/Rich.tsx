import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../lib/store';
import { mono, radius } from '../lib/theme';

type Block =
  | { kind: 'h'; text: string }
  | { kind: 'p'; text: string }
  | { kind: 'code'; lang: string; body: string }
  | { kind: 'ul'; items: string[] }
  | { kind: 'ol'; items: string[] }
  | { kind: 'quote'; text: string };

export function parseRich(text: string): Block[] {
  const lines = text.replace(/\r/g, '').split('\n');
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim() || 'txt';
      const body: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        body.push(lines[i]);
        i++;
      }
      i++;
      blocks.push({ kind: 'code', lang, body: body.join('\n') });
      continue;
    }
    if (!line.trim()) {
      i++;
      continue;
    }
    if (/^#{1,4}\s/.test(line)) {
      blocks.push({ kind: 'h', text: line.replace(/^#{1,4}\s/, '') });
      i++;
      continue;
    }
    if (line.startsWith('> ')) {
      blocks.push({ kind: 'quote', text: line.slice(2) });
      i++;
      continue;
    }
    if (/^-\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^-\s/.test(lines[i])) {
        items.push(lines[i].slice(2));
        i++;
      }
      blocks.push({ kind: 'ul', items });
      continue;
    }
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ''));
        i++;
      }
      blocks.push({ kind: 'ol', items });
      continue;
    }
    blocks.push({ kind: 'p', text: line });
    i++;
  }
  return blocks;
}

function Inline({ text, size, color }: { text: string; size: number; color: string }) {
  const t = useTheme();
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter((p) => p.length > 0);
  return (
    <Text style={{ fontSize: size, color, lineHeight: size * 1.5 }}>
      {parts.map((p, idx) => {
        if (p.startsWith('**') && p.endsWith('**')) {
          return (
            <Text key={idx} style={{ fontWeight: '800', color: t.text }}>
              {p.slice(2, -2)}
            </Text>
          );
        }
        if (p.startsWith('`') && p.endsWith('`') && p.length > 2) {
          return (
            <Text key={idx} style={{ fontFamily: mono, fontSize: size - 1.5, color: t.accent }}>
              {p.slice(1, -1)}
            </Text>
          );
        }
        return <Text key={idx}>{p}</Text>;
      })}
    </Text>
  );
}

export function Rich({ text, size = 14.5 }: { text: string; size?: number }) {
  const t = useTheme();
  const blocks = React.useMemo(() => parseRich(text), [text]);
  return (
    <View style={{ gap: 8 }}>
      {blocks.map((b, idx) => {
        if (b.kind === 'h') {
          return (
            <Text key={idx} style={{ color: t.text, fontSize: size + 1.5, fontWeight: '800', marginTop: 2 }}>
              {b.text}
            </Text>
          );
        }
        if (b.kind === 'code') {
          return (
            <View key={idx} style={{ backgroundColor: t.termBg, borderRadius: radius.md, borderWidth: 1, borderColor: t.border, overflow: 'hidden' }}>
              <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: t.border }}>
                <Text style={{ color: t.textFaint, fontSize: 10, fontFamily: mono, letterSpacing: 1 }}>{b.lang.toUpperCase()}</Text>
              </View>
              <Text selectable style={{ color: t.termText, fontFamily: mono, fontSize: size - 2, lineHeight: (size - 2) * 1.55, padding: 10 }}>
                {b.body}
              </Text>
            </View>
          );
        }
        if (b.kind === 'ul') {
          return (
            <View key={idx} style={{ gap: 5 }}>
              {b.items.map((it, j) => (
                <View key={j} style={{ flexDirection: 'row', gap: 8 }}>
                  <Text style={{ color: t.accent, fontSize: size, lineHeight: size * 1.5 }}>•</Text>
                  <View style={{ flex: 1 }}>
                    <Inline text={it} size={size} color={t.textDim} />
                  </View>
                </View>
              ))}
            </View>
          );
        }
        if (b.kind === 'ol') {
          return (
            <View key={idx} style={{ gap: 6 }}>
              {b.items.map((it, j) => (
                <View key={j} style={{ flexDirection: 'row', gap: 8 }}>
                  <View
                    style={{
                      width: 19,
                      height: 19,
                      borderRadius: 7,
                      backgroundColor: t.accentSoft,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: 1,
                    }}
                  >
                    <Text style={{ color: t.accent, fontSize: 10.5, fontWeight: '800' }}>{j + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Inline text={it} size={size} color={t.textDim} />
                  </View>
                </View>
              ))}
            </View>
          );
        }
        if (b.kind === 'quote') {
          return (
            <View key={idx} style={{ borderLeftWidth: 2, borderLeftColor: t.surfaceHigh, paddingLeft: 10 }}>
              <Text style={{ color: t.textFaint, fontSize: size - 1.5, fontFamily: mono }}>{b.text}</Text>
            </View>
          );
        }
        return <Inline key={idx} text={b.text} size={size} color={t.textDim} />;
      })}
    </View>
  );
}
