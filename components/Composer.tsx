import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, radius } from '../lib/theme';
import { MODE_LIST } from '../lib/modes';
import { AgentMode } from '../lib/types';
import { Chip } from './ui';

const SUGGESTIONS = [
  'Coba buka dokumentasi python',
  'Buatkan code github action workflows README auto generate',
  'daftar repo saya',
  'status deploy vercel',
  'Audit defensif repo (OWASP + secrets)',
  'Generate poster MusGo-OS sovereign AI',
];

export function Composer({
  lockedMode,
  onChangeMode,
  onSend,
  streaming,
  autoMode,
}: {
  lockedMode: AgentMode;
  onChangeMode: (m: AgentMode) => void;
  onSend: (t: string) => void;
  streaming?: boolean;
  autoMode?: boolean;
}) {
  const [text, setText] = useState('');

  const submit = () => {
    const t = text.trim();
    if (!t || streaming) return;
    onSend(t);
    setText('');
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'android' ? 8 : 0}>
      <View style={styles.wrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.modes}
        >
          {MODE_LIST.map((m) => (
            <Chip
              key={m.id}
              label={m.short}
              icon={m.icon as any}
              color={m.color}
              active={lockedMode === m.id}
              onPress={() => onChangeMode(m.id)}
            />
          ))}
        </ScrollView>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sugs}
        >
          {SUGGESTIONS.map((s) => (
            <Pressable key={s} onPress={() => setText(s)} style={styles.sug}>
              <Text style={styles.sugText} numberOfLines={1}>
                {s}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.box}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={autoMode ? 'Tulis tugas — agent memilih mode…' : 'Kirim perintah ke mode terkunci…'}
            placeholderTextColor={colors.textDim}
            multiline
            returnKeyType="send"
            onSubmitEditing={submit}
            blurOnSubmit
            style={styles.input}
          />
          <Pressable
            onPress={submit}
            disabled={!text.trim() || streaming}
            style={[styles.send, { opacity: !text.trim() || streaming ? 0.4 : 1 }]}
          >
            <Ionicons name={streaming ? 'hourglass-outline' : 'arrow-up'} size={18} color={colors.bg} />
          </Pressable>
        </View>
        <Text style={styles.hint}>
          {autoMode ? 'ORCH + AUTO MODE' : 'MANUAL LOCK'}  ·  agent dipilih · model live · konektor nyata
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.bgElevated,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
    paddingBottom: 10,
  },
  modes: { paddingHorizontal: 12, gap: 6, paddingBottom: 8 },
  sugs: { paddingHorizontal: 12, gap: 6, paddingBottom: 8 },
  sug: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
    maxWidth: 260,
  },
  sugText: { color: colors.textMuted, fontSize: 11 },
  box: {
    marginHorizontal: 12,
    backgroundColor: colors.bgInput,
    borderWidth: 1,
    borderColor: colors.borderBright,
    borderRadius: radius.xl,
    minHeight: 48,
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    maxHeight: 110,
    paddingTop: 8,
    paddingBottom: 8,
  },
  send: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 1,
  },
  hint: {
    color: colors.textDim,
    fontSize: 9,
    letterSpacing: 0.6,
    textAlign: 'center',
    marginTop: 6,
  },
});
