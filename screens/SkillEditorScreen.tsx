import React, { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../components/Screen';
import { BackHeader } from '../components/BackHeader';
import { Chip, Field, PrimaryButton } from '../components/ui';
import { useApp } from '../lib/AppContext';
import { colors } from '../lib/theme';
import { RootStackParamList } from '../lib/navigation';
import { SkillItem } from '../lib/types';
import { loadGithubFile, loadRemoteText } from '../lib/liveFetch';

const ORIGINS: SkillItem['origin'][] = ['manual', 'paste', 'link', 'github', 'upload', 'generate'];

function generateFrom(name: string, source: string): string {
  const body = source.trim().slice(0, 1800) || 'Tidak ada sumber — skill generik operator.';
  return `# SKILL.md — ${name || 'untitled'}

## Purpose
Kompetensi agent yang dirangkum dari sumber operator.

## When to use
- Ketika tugas menyentuh domain: ${name || 'general'}

## Procedure
1. Baca konteks & sumber terpasang
2. Rencanakan langkah terkecil yang benar
3. Eksekusi lewat konektor live, catat jejak
4. Verifikasi + laporkan

## Source excerpt
${body}

## Guardrails
- Tidak menghasilkan exploit / payload
- Secret hanya lewat SecureStore
- Human-in-the-loop untuk aksi destruktif
`;
}

export function SkillEditorScreen({ navigation, route }: NativeStackScreenProps<RootStackParamList, 'SkillEditor'>) {
  const app = useApp();
  const existing = useMemo(() => app.skills.find((s) => s.id === route.params?.id), [app.skills, route.params?.id]);
  const [origin, setOrigin] = useState<SkillItem['origin']>(existing?.origin || 'paste');
  const [name, setName] = useState(existing?.name || '');
  const [description, setDescription] = useState(existing?.description || '');
  const [originRef, setOriginRef] = useState(existing?.originRef || '');
  const [markdown, setMarkdown] = useState(existing?.markdown || '');
  const [source, setSource] = useState('');

  const generate = () => {
    const md = generateFrom(name, source || originRef || description);
    setMarkdown(md);
    if (!description) setDescription(`Skill dihasilkan dari ${origin}${originRef ? ': ' + originRef : ''}`);
  };

  const loadRemote = async () => {
    if (!originRef.trim()) {
      Alert.alert('Isi URL / path GitHub');
      return;
    }
    if (origin === 'github') {
      const tok = await app.tokenFor('github');
      const r = await loadGithubFile(tok || undefined, originRef.trim());
      if (!r.ok) {
        Alert.alert('GitHub gagal', r.error);
        return;
      }
      setMarkdown(r.text);
      if (!name.trim()) setName(r.path.split('/').pop()?.replace(/\.md$/i, '') || 'skill');
      return;
    }
    const r = await loadRemoteText(originRef.trim());
    if (!r.ok) {
      Alert.alert('Fetch gagal', r.error);
      return;
    }
    if (/^#\s*skill/i.test(r.text) || r.text.includes('## Purpose')) setMarkdown(r.text);
    else {
      setSource(r.text);
      setMarkdown(generateFrom(name || 'imported', r.text));
    }
  };

  const save = () => {
    if (!name.trim() || !markdown.trim()) {
      Alert.alert('Nama dan SKILL.md wajib diisi');
      return;
    }
    if (source.length > 100 * 1024) {
      Alert.alert('Sumber teks melebihi 100KB');
      return;
    }
    if (existing) {
      app.updateSkill(existing.id, { name: name.trim(), description, origin, originRef, markdown });
    } else {
      app.addSkill({
        name: name.trim(),
        description: description || 'Skill operator',
        markdown,
        origin,
        originRef: originRef || undefined,
        enabled: true,
      });
    }
    navigation.goBack();
  };

  return (
    <Screen>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <BackHeader title={existing ? 'Sunting Skill' : 'SKILL.md baru'} />
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
          <Text style={styles.label}>ASAL</Text>
          <View style={styles.row}>
            {ORIGINS.map((o) => (
              <Chip key={o} label={o.toUpperCase()} active={origin === o} onPress={() => setOrigin(o)} />
            ))}
          </View>
          <Field label="Nama skill" value={name} onChangeText={setName} placeholder="github-operator" />
          <Field label="Deskripsi" value={description} onChangeText={setDescription} placeholder="Apa yang dikuasai skill ini" />
          {(origin === 'link' || origin === 'upload' || origin === 'github') && (
            <Field
              label={origin === 'github' ? 'owner/repo/path/SKILL.md atau URL GitHub' : origin === 'link' ? 'URL SKILL.md / halaman' : 'Path / arsip'}
              value={originRef}
              onChangeText={setOriginRef}
              placeholder={origin === 'github' ? 'org/repo/SKILL.md' : 'https://…/SKILL.md'}
              keyboardType={origin === 'upload' ? 'default' : 'url'}
            />
          )}
          {(origin === 'link' || origin === 'github') && (
            <PrimaryButton title={origin === 'github' ? 'Load dari GitHub' : 'Fetch URL'} icon="cloud-download-outline" color={colors.cyan} onPress={loadRemote} />
          )}
          {(origin === 'generate' || origin === 'paste' || origin === 'upload' || origin === 'manual') && (
            <Field
              label={origin === 'generate' ? 'Sumber (web text / dokumen)' : 'Teks sumber (max 100KB)'}
              value={source}
              onChangeText={setSource}
              placeholder="Tempel teks, isi dokumen, atau cuplikan web…"
              multiline
            />
          )}
          <View style={{ height: 10 }} />
          <PrimaryButton title="Generate SKILL.md" icon="flash-outline" color={colors.violet} onPress={generate} />
          <View style={{ height: 14 }} />
          <Field label="SKILL.md" value={markdown} onChangeText={setMarkdown} placeholder="# SKILL.md" multiline />
          <PrimaryButton title={existing ? 'Simpan perubahan' : 'Pasang skill'} icon="checkmark" onPress={save} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 8,
  },
  title: { color: colors.text, fontWeight: '800', fontSize: 16 },
  label: { color: colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 8 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
});
