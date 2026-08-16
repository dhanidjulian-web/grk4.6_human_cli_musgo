import React, { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../components/Screen';
import { BackHeader } from '../components/BackHeader';
import { Chip, Empty, Field, PrimaryButton } from '../components/ui';
import { useApp } from '../lib/AppContext';
import { colors } from '../lib/theme';
import { formatDate } from '../lib/id';
import { RootStackParamList } from '../lib/navigation';
import { shareExport, ExportKind } from '../lib/export';

export function BookmarksScreen() {
  const app = useApp();
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <Screen>
      <BackHeader title="Bookmarks" subtitle={`${app.bookmarks.length} tersimpan`} />
      <FlatList
        data={app.bookmarks}
        keyExtractor={(it) => it.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        ListEmptyComponent={<Empty icon="bookmark-outline" title="Belum ada bookmark" body="Dari konsol: ikon bookmark menyimpan input + respons." />}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => {
              Alert.alert(item.title, undefined, [
                { text: 'Tutup', style: 'cancel' },
                { text: 'Jalankan ulang', onPress: () => { nav.navigate('Tabs'); app.send(item.prompt); } },
                { text: 'Hapus', style: 'destructive', onPress: () => app.removeBookmark(item.id) },
              ]);
            }}
            style={styles.card}
          >
            <Text style={styles.name}>{item.title}</Text>
            <Text style={styles.meta}>{item.agentName} · {item.mode} · {formatDate(item.createdAt)}</Text>
            <Text style={styles.preview} numberOfLines={2}>{item.prompt}</Text>
            <Text style={styles.body} numberOfLines={4}>{item.response}</Text>
          </Pressable>
        )}
      />
    </Screen>
  );
}

export function SandboxScreen() {
  const app = useApp();
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return (
    <Screen>
      <BackHeader
        title="Sandbox"
        subtitle={`${app.sandbox.length} file workspace`}
        right={
          <Pressable onPress={() => nav.navigate('SandboxEditor')} style={styles.add}>
            <Ionicons name="add" size={20} color={colors.bg} />
          </Pressable>
        }
      />
      <Text style={styles.hint}>
        Workspace terisolasi: skrip, catatan, artefak generate. Bukan simulasi — file tersimpan di perangkat.
      </Text>
      <FlatList
        data={app.sandbox}
        keyExtractor={(it) => it.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        ListEmptyComponent={<Empty icon="cube-outline" title="Sandbox kosong" body="Buat file di workspace: .md .txt .json .csv .html" />}
        renderItem={({ item }) => (
          <Pressable onPress={() => nav.navigate('SandboxEditor', { id: item.id })} onLongPress={() => app.removeSandbox(item.id)} style={styles.card}>
            <Text style={styles.name}>{item.path}</Text>
            <Text style={styles.meta}>{item.mime} · {formatDate(item.updatedAt)}</Text>
            <Text style={styles.preview} numberOfLines={3}>{item.content}</Text>
          </Pressable>
        )}
      />
    </Screen>
  );
}

export function SandboxEditorScreen({ navigation, route }: NativeStackScreenProps<RootStackParamList, 'SandboxEditor'>) {
  const app = useApp();
  const existing = useMemo(() => app.sandbox.find((s) => s.id === route.params?.id), [app.sandbox, route.params?.id]);
  const [path, setPath] = useState(existing?.path || '/workspace/note.md');
  const [content, setContent] = useState(existing?.content || '');
  const save = () => {
    if (!path.trim()) return;
    const mime = path.endsWith('.json') ? 'application/json' : path.endsWith('.md') ? 'text/markdown' : 'text/plain';
    if (existing) app.updateSandbox(existing.id, { path: path.trim(), content, mime });
    else app.addSandbox({ path: path.trim(), content, mime });
    navigation.goBack();
  };
  return (
    <Screen>
      <BackHeader title={existing ? 'Sunting file' : 'File sandbox'} />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Field label="Path" value={path} onChangeText={setPath} placeholder="/workspace/script.ts" />
        <Field label="Isi" value={content} onChangeText={setContent} multiline placeholder="isi file…" />
        <PrimaryButton title="Simpan ke sandbox" icon="save-outline" onPress={save} />
      </ScrollView>
    </Screen>
  );
}

export function SourceDetailScreen({ navigation, route }: NativeStackScreenProps<RootStackParamList, 'SourceDetail'>) {
  const app = useApp();
  const item = app.sources.find((s) => s.id === route.params.id);
  const [folder, setFolder] = useState(item?.folder || '/');
  if (!item) {
    return (
      <Screen>
        <BackHeader title="Tidak ditemukan" />
        <Empty icon="alert-circle-outline" title="File hilang" body="Sudah dihapus." />
      </Screen>
    );
  }
  return (
    <Screen>
      <BackHeader title={item.name} subtitle={`${item.kind} · ${item.sizeLabel}`} />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Field label="Folder" value={folder} onChangeText={setFolder} placeholder="/docs" />
        <PrimaryButton title="Pindah folder" icon="folder-outline" onPress={() => { app.updateSource(item.id, { folder }); navigation.goBack(); }} />
        {item.url ? <Text style={styles.url}>{item.url}</Text> : null}
        <Text style={styles.body}>{item.content}</Text>
        <Pressable onPress={() => app.removeSource(item.id)} style={{ padding: 16, alignItems: 'center' }}>
          <Text style={{ color: colors.coral, fontWeight: '700' }}>Hapus dari library</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

export const EXPORT_KINDS: ExportKind[] = ['txt', 'md', 'csv', 'html', 'json', 'pdf', 'docx'];

export function ExportBar({ title, prompt, body }: { title: string; prompt: string; body: string }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingVertical: 8 }}>
      {EXPORT_KINDS.map((k) => (
        <Chip key={k} label={k.toUpperCase()} onPress={() => shareExport(k, title, prompt, body)} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  add: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  card: { backgroundColor: colors.bgCard, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 12, marginBottom: 10 },
  name: { color: colors.text, fontWeight: '800', fontSize: 14 },
  meta: { color: colors.textDim, fontSize: 11, marginTop: 4 },
  preview: { color: colors.textMuted, fontSize: 12, marginTop: 6, lineHeight: 16 },
  body: { color: colors.text, fontSize: 13, marginTop: 10, lineHeight: 19 },
  hint: { color: colors.textDim, fontSize: 12, paddingHorizontal: 16, marginBottom: 4, lineHeight: 17 },
  url: { color: colors.cyan, fontSize: 12, marginTop: 12 },
});
