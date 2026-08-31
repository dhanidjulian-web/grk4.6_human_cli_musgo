import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { clockOf } from '../lib/sim';
import { useTheme } from '../lib/store';
import { mono, radius } from '../lib/theme';
import type { ChatMessage } from '../lib/types';
import { Rich } from './Rich';

export function MessageBubble({
  msg,
  onLongPress,
  onToggleBookmark,
}: {
  msg: ChatMessage;
  onLongPress?: () => void;
  onToggleBookmark?: () => void;
}) {
  const t = useTheme();
  const mine = msg.role === 'user';
  return (
    <Pressable onLongPress={onLongPress} style={{ marginHorizontal: 14, marginVertical: 5 }}>
      <View style={{ flexDirection: 'row', justifyContent: mine ? 'flex-end' : 'flex-start', gap: 8 }}>
        {!mine ? (
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 10,
              backgroundColor: msg.role === 'system' ? t.surfaceHigh : t.accentSoft,
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 2,
            }}
          >
            <MaterialCommunityIcons
              name={msg.role === 'system' ? 'information-outline' : 'robot-outline'}
              size={16}
              color={msg.role === 'system' ? t.textDim : t.accent}
            />
          </View>
        ) : null}
        <View style={{ maxWidth: '86%', gap: 5 }}>
          <View
            style={{
              backgroundColor: mine ? t.accentSoft : t.surface,
              borderWidth: 1,
              borderColor: mine ? t.accent + '55' : t.border,
              borderRadius: radius.lg,
              paddingHorizontal: 13,
              paddingVertical: 11,
            }}
          >
            {mine ? (
              <Text style={{ color: t.text, fontSize: 14.5, lineHeight: 21.5 }}>{msg.text}</Text>
            ) : (
              <Rich text={msg.text} />
            )}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4 }}>
            {msg.model ? (
              <Text style={{ fontFamily: mono, fontSize: 10, color: t.textFaint }} numberOfLines={1}>
                {msg.model}
                {msg.route ? ` · ${msg.route}` : ''}
              </Text>
            ) : null}
            {msg.tokens ? <Text style={{ fontFamily: mono, fontSize: 10, color: t.textFaint }}>{msg.tokens} tok</Text> : null}
            <Text style={{ fontFamily: mono, fontSize: 10, color: t.textFaint }}>{clockOf(msg.ts)}</Text>
            {onToggleBookmark ? (
              <Pressable onPress={onToggleBookmark} hitSlop={8} style={{ marginLeft: 'auto' }}>
                <MaterialCommunityIcons
                  name={msg.bookmarked ? 'bookmark' : 'bookmark-outline'}
                  size={13}
                  color={msg.bookmarked ? t.accent : t.textFaint}
                />
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
    </Pressable>
  );
}
