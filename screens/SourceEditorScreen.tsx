import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../components/Screen';
import { BackHeader } from '../components/BackHeader';
import { Chip, Field, PrimaryButton } from '../components/ui';
import { useApp } from '../lib/AppContext';
import { colors } from '../lib/theme';
import { RootStackParamList } from '../lib/navigation';
import { SourceItem } from '../lib/types';

const KINDS: SourceItem['kind'][] = ['file', 'link', 'note', 'archive', 'folder'];

function guessMime(name: string, kind: SourceItem['kind']): string {
  const n = name.toLowerCase();
  if (kind === 'link') return 'text/html';
  if (n.endsWith('.md')) return 'text/markdown';
  if (n.endsWith('.json')) return 'application/json';
  if (n.endsWith('.pdf')) return 'application/pdf';
  if (n.endsWith('.ppt') || n.endsWith('.pptx')) return 'application/vnd.ms-powerpoint';
  if (n.endsWith('.doc') || n.endsWith('.docx')) return 'application/msword';
  if (n.endsWith('.zip')) return 'application/zip';
  if (n.endsWith('.txt')) return 'text/plain';
  return 'text/plain';
}

function sizeOf(content: string): string {
  const n = unescape(encodeURIComponent(content)).length;
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

export function SourceEditorScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'SourceEditor'>) {
  const app = useApp();
  const [kind, setKind] = useState<SourceItem['kind']>('file');
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');

  const save = () => {
    if (!name.trim()) {
      Alert.alert('Nama diperlukan');
      return;
    }
    if (content.length > 100 * 1024 && kind === 'note') {
      Alert.alert('Catatan terlalu besar', 'Maksimal 100KB untuk teks tempel.');
      return;
    }
    const tagList = tags.split(',').map((t) => t.trim()).filter(Boolean);
    if (kind === 'link') {
      const urls = url.split(/[\n,]+/).map((u) => u.trim()).filter((u) => /^https?:\/\//i.test(u));
      if (urls.length === 0) {
        Alert.alert('URL diperlukan', 'Satu baris per link, atau pisahkan koma.');
        return;
      }
      let ok = true;
      urls.forEach((u, i) => {
        const added = app.addSource({
          name: urls.length === 1 ? name.trim() : `${name.trim()}-${i + 1}`,
          kind: 'link',
          mime: 'text/html',
          sizeLabel: 'remote',
          content: content || `Sumber remote ${u}`,
          url: u,
          tags: tagList,
        });
        if (!added) ok = false;
      });
      if (!ok) Alert.alert('Library penuh', 'Batas 100MB tercapai.');
      else navigation.goBack();
      return;
    }
    const added = app.addSource({
      name: name.trim(),
      kind,
      mime: guessMime(name, kind),
      sizeLabel: sizeOf(content),
      content,
      url: url.trim() || undefined,
      tags: tagList,
    });
    if (!added) Alert.alert('Library penuh', 'Batas 100MB tercapai.');
    else navigation.goBack();
  };

  return (
    <Screen>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <BackHeader title="Tambah Source" />
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          <Text style={styles.label}>JENIS</Text>
          <View style={styles.row}>
            {KINDS.map((k) => (
              <Chip key={k} label={k.toUpperCase()} active={kind === k} onPress={() => setKind(k)} />
            ))}
          </View>
          <Field label="Nama" value={name} onChangeText={setName} placeholder="README.md / python-docs" />
          {kind === 'link' || kind === 'archive' ? (
            <Field
              label={kind === 'link' ? 'URL (boleh banyak, 1 baris / koma)' : 'URL arsip'}
              value={url}
              onChangeText={setUrl}
              placeholder="https://docs.python.org/3/\nhttps://docs.github.com"
              multiline={kind === 'link'}
              keyboardType="url"
            />
          ) : null}
          <Field
            label={kind === 'note' ? 'Teks (max 100KB)' : 'Cuplikan / isi'}
            value={content}
            onChangeText={setContent}
            placeholder="Tempel isi file, catatan, atau deskripsi…"
            multiline
          />
          <Field label="Tags" value={tags} onChangeText={setTags} placeholder="docs, python, ci" />
          <PrimaryButton title="Pasang ke library" icon="cube-outline" onPress={save} />
          <Text style={styles.hint}>
            Format: .txt .md .doc .pdf .ppt .canvas .zip dan tautan. Library dibatasi 100MB.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  title: { color: colors.text, fontWeight: '800', fontSize: 16 },
  label: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
  hint: { color: colors.textDim, fontSize: 12, marginTop: 14, lineHeight: 18 },
});
