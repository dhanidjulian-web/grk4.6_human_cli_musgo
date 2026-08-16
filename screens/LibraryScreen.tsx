import React, { useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '../components/Screen';
import { BackHeader } from '../components/BackHeader';
import { Badge, Chip, Empty } from '../components/ui';
import { useApp } from '../lib/AppContext';
import { colors } from '../lib/theme';
import { formatBytes, formatDate, LIBRARY_CAP } from '../lib/id';
import { RootStackParamList } from '../lib/navigation';
import { SourceItem } from '../lib/types';

const FILTERS = ['all', 'file', 'link', 'note', 'archive', 'folder'] as const;

export function LibraryScreen() {
  const app = useApp();
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [q, setQ] = useState('');
  const [f, setF] = useState<(typeof FILTERS)[number]>('all');

  const data = useMemo(() => {
    return app.sources.filter((s) => {
      if (f !== 'all' && s.kind !== f) return false;
      if (!q.trim()) return true;
      const hay = `${s.name} ${s.content} ${s.url || ''} ${s.tags.join(' ')}`.toLowerCase();
      return hay.includes(q.toLowerCase());
    });
  }, [app.sources, q, f]);

  const used = app.sources.length;
  const capLabel = `${used} sumber · ${formatBytes(app.libraryBytes)} / ${formatBytes(LIBRARY_CAP)}`;

  const remove = (item: SourceItem) => {
    Alert.alert('Lepas sumber', item.name, [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: () => app.removeSource(item.id) },
    ]);
  };

  const icon = (k: SourceItem['kind']): keyof typeof Ionicons.glyphMap => {
    if (k === 'link') return 'link-outline';
    if (k === 'note') return 'create-outline';
    if (k === 'archive') return 'archive-outline';
    if (k === 'folder') return 'folder-outline';
    return 'document-text-outline';
  };

  return (
    <Screen>
      <BackHeader
        title="Knowledge Library"
        subtitle={capLabel}
        right={
          <View style={{ flexDirection: 'row', gap: 6, marginRight: 8 }}>
            <Pressable onPress={() => nav.navigate('Sandbox')} style={styles.add}>
              <Ionicons name="cube-outline" size={18} color={colors.bg} />
            </Pressable>
            <Pressable onPress={() => nav.navigate('SourceEditor')} style={styles.add}>
              <Ionicons name="add" size={22} color={colors.bg} />
            </Pressable>
          </View>
        }
      />

      <View style={styles.search}>
        <Ionicons name="search" size={16} color={colors.textDim} />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Cari file, link, catatan…"
          placeholderTextColor={colors.textDim}
          style={styles.searchInput}
        />
      </View>

      <View style={styles.filters}>
        {FILTERS.map((x) => (
          <Chip key={x} label={x.toUpperCase()} active={f === x} onPress={() => setF(x)} />
        ))}
      </View>

      <FlatList
        data={data}
        keyExtractor={(it) => it.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        ListEmptyComponent={
          <Empty icon="folder-open-outline" title="Library kosong" body="Tambah file .md/.txt/.pdf atau tempel beberapa URL sebagai source." />
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => nav.navigate('SourceDetail', { id: item.id })} onLongPress={() => remove(item)} style={styles.card}>
            <View style={styles.icon}>
              <Ionicons name={icon(item.kind)} size={18} color={colors.cyan} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.row}>
                <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                <Badge text={item.kind} color={colors.cyan} />
              </View>
              <Text style={styles.meta} numberOfLines={2}>
                {item.sizeLabel} · {item.mime} · {formatDate(item.createdAt)}
              </Text>
              {item.url ? <Text style={styles.url} numberOfLines={1}>{item.url}</Text> : null}
              <Text style={styles.preview} numberOfLines={2}>{item.content}</Text>
            </View>
          </Pressable>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 10 },
  title: { color: colors.text, fontSize: 20, fontWeight: '800' },
  sub: { color: colors.textDim, fontSize: 12, marginTop: 2 },
  add: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  search: {
    marginHorizontal: 16,
    backgroundColor: colors.bgInput,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: { flex: 1, color: colors.text, height: 42 },
  filters: { flexDirection: 'row', gap: 6, paddingHorizontal: 16, paddingTop: 10 },
  card: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: colors.bgCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 10,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.cyanBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { flex: 1, color: colors.text, fontWeight: '700' },
  meta: { color: colors.textDim, fontSize: 11, marginTop: 3 },
  url: { color: colors.cyan, fontSize: 11, marginTop: 3 },
  preview: { color: colors.textMuted, fontSize: 12, marginTop: 6, lineHeight: 16 },
});
