import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Screen } from '../components/Screen';
import { BackHeader } from '../components/BackHeader';
import { Field, PrimaryButton } from '../components/ui';
import { useApp } from '../lib/AppContext';
import { colors } from '../lib/theme';
import {
  BackupSlot,
  buildSnapshot,
  deleteSlot,
  downloadTextFile,
  listSlots,
  saveSlot,
} from '../lib/backup';
import { formatBytes, formatDate } from '../lib/id';

export function BackupScreen() {
  const app = useApp();
  const [slots, setSlots] = useState<BackupSlot[]>([]);
  const [label, setLabel] = useState('founder-local');
  const [includeKeys, setIncludeKeys] = useState(true);
  const [paste, setPaste] = useState('');
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    setSlots(await listSlots());
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const snapshotNow = async () => {
    setBusy(true);
    try {
      const snap = await buildSnapshot({
        label: label.trim() || 'local',
        includeKeyValues: includeKeys,
        profile: app.profile,
        sources: app.sources,
        skills: app.skills,
        models: app.models,
        keys: app.keys,
        extras: app.extras,
        bookmarks: app.bookmarks,
        sandbox: app.sandbox,
        sessions: app.sessions,
        assets: app.assets,
      });
      const slot = await saveSlot(snap);
      await reload();
      Alert.alert('Tersimpan di local storage', `${slot.label} · ${formatBytes(slot.bytes)}`);
    } finally {
      setBusy(false);
    }
  };

  const exportFile = async () => {
    const snap = await buildSnapshot({
      label: label.trim() || 'export',
      includeKeyValues: includeKeys,
      profile: app.profile,
      sources: app.sources,
      skills: app.skills,
      models: app.models,
      keys: app.keys,
      extras: app.extras,
      bookmarks: app.bookmarks,
      sandbox: app.sandbox,
      sessions: app.sessions,
      assets: app.assets,
    });
    downloadTextFile(`human-cli-${snap.label}-${Date.now()}.json`, JSON.stringify(snap, null, 2));
  };

  const restore = (raw: string) => {
    Alert.alert('Pulihkan konfigurasi?', 'Workspace saat ini akan ditimpa dari backup. API key hanya jika backup menyertakannya.', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Pulihkan',
        style: 'destructive',
        onPress: async () => {
          const r = await app.restoreWorkspace(raw);
          Alert.alert(r.ok ? 'Restore selesai' : 'Gagal', r.message);
        },
      },
    ]);
  };

  return (
    <Screen>
      <BackHeader title="Backup & Restore" subtitle="Pribadi Founder · local storage · tanpa monetisasi" />
      <FlatList
        data={slots}
        keyExtractor={(it) => it.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
        ListHeaderComponent={
          <View>
            <Text style={styles.note}>
              Human CLI adalah tools pribadi Dhani Yuliawan untuk MusGo-OS 2in1. Backup hanya di perangkat ini. Nilai API key opsional (SecureStore).
            </Text>
            <Field label="Label slot" value={label} onChangeText={setLabel} placeholder="founder-local" />
            <View style={styles.sw}>
              <Text style={styles.swT}>Sertakan nilai API key / PAT</Text>
              <Switch
                value={includeKeys}
                onValueChange={setIncludeKeys}
                trackColor={{ true: colors.greenDim }}
                thumbColor={includeKeys ? colors.green : colors.textDim}
              />
            </View>
            <PrimaryButton title={busy ? 'Menyimpan…' : 'Backup ke local storage'} icon="save-outline" onPress={snapshotNow} disabled={busy} />
            <View style={{ height: 10 }} />
            <PrimaryButton title="Export file .json" icon="download-outline" color={colors.cyan} onPress={exportFile} />
            <View style={{ height: 16 }} />
            <Field
              label="Restore dari tempel JSON"
              value={paste}
              onChangeText={setPaste}
              placeholder='{"app":"Human CLI",...}'
              multiline
            />
            <PrimaryButton title="Restore dari teks" icon="cloud-download-outline" color={colors.violet} onPress={() => restore(paste)} />
            <Text style={styles.sec}>SLOT LOCAL STORAGE  ·  {slots.length}/20</Text>
          </View>
        }
        ListEmptyComponent={<Text style={styles.empty}>Belum ada slot. Backup dulu.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.label}</Text>
            <Text style={styles.meta}>
              {formatDate(item.createdAt)} · {formatBytes(item.bytes)} · {item.includeKeyValues ? 'keys+' : 'tanpa nilai key'}
            </Text>
            <View style={styles.row}>
              <Pressable onPress={() => restore(JSON.stringify(item.snapshot))} style={styles.btn}>
                <Text style={styles.btnT}>RESTORE</Text>
              </Pressable>
              <Pressable
                onPress={() => downloadTextFile(`human-cli-${item.label}.json`, JSON.stringify(item.snapshot, null, 2))}
                style={styles.btnGhost}
              >
                <Text style={styles.btnG}>FILE</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  Alert.alert('Hapus slot?', item.label, [
                    { text: 'Batal', style: 'cancel' },
                    { text: 'Hapus', style: 'destructive', onPress: async () => { await deleteSlot(item.id); reload(); } },
                  ]);
                }}
                style={styles.btnGhost}
              >
                <Ionicons name="trash-outline" size={16} color={colors.coral} />
              </Pressable>
            </View>
          </View>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  note: { color: colors.textMuted, fontSize: 12, lineHeight: 18, marginBottom: 14 },
  sw: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  swT: { color: colors.text, fontSize: 13, flex: 1, paddingRight: 12 },
  sec: { color: colors.amber, fontSize: 11, fontWeight: '800', letterSpacing: 1, marginTop: 22, marginBottom: 10 },
  empty: { color: colors.textDim, fontSize: 12, marginBottom: 12 },
  card: { backgroundColor: colors.bgCard, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 12, marginBottom: 10 },
  name: { color: colors.text, fontWeight: '800', fontSize: 14 },
  meta: { color: colors.textDim, fontSize: 11, marginTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  btn: { backgroundColor: colors.green, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 },
  btnT: { color: colors.bg, fontWeight: '900', fontSize: 11, letterSpacing: 0.5 },
  btnGhost: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  btnG: { color: colors.cyan, fontWeight: '800', fontSize: 11 },
});
