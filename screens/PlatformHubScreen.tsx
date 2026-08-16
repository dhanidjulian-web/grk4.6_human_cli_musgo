import React, { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../components/Screen';
import { BackHeader } from '../components/BackHeader';
import { Badge, Chip, Field, PrimaryButton } from '../components/ui';
import { useApp } from '../lib/AppContext';
import { colors } from '../lib/theme';
import { AI_PROVIDERS, keyPageFor } from '../lib/aiCatalog';
import { RootStackParamList } from '../lib/navigation';

export function PlatformHubScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'PlatformHub'>) {
  const app = useApp();
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [keyUrl, setKeyUrl] = useState('');
  const [gguf, setGguf] = useState(false);
  const [ggufName, setGgufName] = useState('');
  const [ggufPath, setGgufPath] = useState('/models/model.gguf');
  const [ggufId, setGgufId] = useState('local-model');

  const list = useMemo(() => {
    const extra = (app.extras || []).map((e) => ({
      id: e.id,
      label: e.label,
      tier: e.tier,
      blurb: e.endpoint,
      keyUrl: e.keyUrl,
      extra: true,
    }));
    const built = AI_PROVIDERS.map((p) => ({
      id: p.id,
      label: p.label,
      tier: p.tier,
      blurb: p.blurb,
      keyUrl: p.keyUrl,
      extra: false,
    }));
    return [...extra, ...built];
  }, [app.extras]);

  const savePlat = () => {
    if (!label.trim() || !endpoint.trim()) {
      Alert.alert('Nama dan endpoint wajib');
      return;
    }
    app.addExtra({
      label: label.trim(),
      endpoint: endpoint.trim(),
      keyUrl: keyUrl.trim(),
      tier: 'freemium',
    });
    setLabel('');
    setEndpoint('');
    setKeyUrl('');
    setAdding(false);
  };

  const saveGguf = () => {
    if (!ggufName.trim() || !ggufPath.trim()) {
      Alert.alert('Nama dan path .gguf wajib');
      return;
    }
    app.addModel({
      name: ggufName.trim(),
      provider: 'local-gguf',
      modelId: ggufId.trim() || 'local-model',
      kind: 'local',
      path: ggufPath.trim(),
      contextWindow: 8192,
      enabled: true,
      isFallback: false,
      fallbackOrder: 0,
      keyIds: [],
      routing: 'manual',
      notes: 'Local GGUF · Founder',
    });
    setGguf(false);
    setGgufName('');
    Alert.alert('GGUF ditambahkan', ggufPath.trim());
  };

  return (
    <Screen>
      <BackHeader
        title="Platform AI"
        subtitle={`${list.length} platform · Founder add/hapus`}
        right={
          <Pressable onPress={() => setAdding((v) => !v)} style={styles.add}>
            <Ionicons name="add" size={20} color={colors.bg} />
          </Pressable>
        }
      />
      {adding ? (
        <View style={styles.form}>
          <Text style={styles.formT}>Platform eksternal baru (OpenAI-compatible)</Text>
          <Field label="Nama" value={label} onChangeText={setLabel} placeholder="My Lab" />
          <Field label="Chat endpoint" value={endpoint} onChangeText={setEndpoint} placeholder="https://…/v1/chat/completions" keyboardType="url" />
          <Field label="Halaman Get Key" value={keyUrl} onChangeText={setKeyUrl} placeholder="https://…/keys" keyboardType="url" />
          <PrimaryButton title="Simpan platform" icon="add-circle-outline" onPress={savePlat} />
        </View>
      ) : null}
      {gguf ? (
        <View style={styles.form}>
          <Text style={styles.formT}>Model lokal .gguf</Text>
          <Field label="Nama" value={ggufName} onChangeText={setGgufName} placeholder="Qwen Coder 7B" />
          <Field label="Model id" value={ggufId} onChangeText={setGgufId} placeholder="qwen2.5-coder" />
          <Field label="Path file .gguf" value={ggufPath} onChangeText={setGgufPath} placeholder="/models/model.gguf" />
          <PrimaryButton title="Pasang GGUF" icon="cube-outline" onPress={saveGguf} />
        </View>
      ) : (
        <Pressable onPress={() => setGguf(true)} style={styles.ggufBtn}>
          <Ionicons name="hardware-chip-outline" size={16} color={colors.amber} />
          <Text style={styles.ggufTxt}>Tambah model lokal .gguf</Text>
        </Pressable>
      )}
      <FlatList
        data={list}
        keyExtractor={(it) => it.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        renderItem={({ item }) => {
          const keys = app.keys.filter((k) => k.provider === item.id);
          const url = keyPageFor(item.id, app.extras);
          return (
            <View style={styles.card}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{item.label}</Text>
                  <Text style={styles.meta}>{item.tier} · {item.blurb}</Text>
                </View>
                {item.extra ? (
                  <Pressable onPress={() => {
                    Alert.alert('Hapus platform?', item.label, [
                      { text: 'Batal', style: 'cancel' },
                      { text: 'Hapus', style: 'destructive', onPress: () => app.removeExtra(item.id) },
                    ]);
                  }}>
                    <Ionicons name="trash-outline" size={16} color={colors.coral} />
                  </Pressable>
                ) : null}
              </View>
              <Text style={styles.keys}>{keys.length} API key · {keys.filter((k) => k.valid).length} valid</Text>
              <View style={styles.actions}>
                {url ? (
                  <Pressable onPress={() => Linking.openURL(url)} style={styles.get}>
                    <Text style={styles.getTxt}>GET KEY</Text>
                  </Pressable>
                ) : null}
                <Pressable onPress={() => navigation.navigate('KeyEditor', { provider: item.id })} style={styles.in}>
                  <Text style={styles.inTxt}>INPUT & UJI</Text>
                </Pressable>
              </View>
            </View>
          );
        }}
      />
    </Screen>
  );
}

export function KeyEditorScreen({ navigation, route }: NativeStackScreenProps<RootStackParamList, 'KeyEditor'>) {
  const app = useApp();
  const provider = route.params?.provider || 'groq';
  const meta = AI_PROVIDERS.find((p) => p.id === provider) || app.extras.find((e) => e.id === provider);
  const title = (meta && 'label' in meta ? meta.label : provider) as string;
  const url = keyPageFor(provider, app.extras);
  const [label, setLabel] = useState(`${title} key`);
  const [raw, setRaw] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const mine = app.keys.filter((k) => k.provider === provider);

  const save = async () => {
    if (!raw.trim()) {
      Alert.alert('API key kosong');
      return;
    }
    setBusy(true);
    setMsg('Menguji key…');
    const r = await app.addKey(label.trim() || `${title} key`, provider, raw);
    setBusy(false);
    setMsg(r.message);
    if (r.ok) {
      setRaw('');
      Alert.alert('Valid', r.message);
    } else {
      Alert.alert('Key ditolak', r.message);
    }
  };

  return (
    <Screen>
      <BackHeader title={title} subtitle="Uji & simpan API key" />
      <View style={{ padding: 16 }}>
        {url ? (
          <Pressable onPress={() => Linking.openURL(url)} style={styles.getWide}>
            <Ionicons name="open-outline" size={16} color={colors.bg} />
            <Text style={styles.getWideTxt}>GET KEY — buka halaman resmi</Text>
          </Pressable>
        ) : null}
        <Field label="Label" value={label} onChangeText={setLabel} />
        <Field label="API Key" value={raw} onChangeText={setRaw} placeholder="tempel key" secure />
        <PrimaryButton title={busy ? 'Menguji…' : 'Uji & simpan'} icon="shield-checkmark-outline" onPress={save} disabled={busy} />
        {msg ? <Text style={styles.msg}>{msg}</Text> : null}
        <Text style={styles.sec}>KEY TERSIMPAN</Text>
        {mine.map((k) => (
          <View key={k.id} style={styles.keyRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{k.label}</Text>
              <Text style={styles.meta}>{k.hint} · {k.lastMessage || 'belum diuji ulang'}</Text>
            </View>
            <Badge text={k.valid ? 'OK' : '—'} color={k.valid ? colors.green : colors.textMuted} />
            <Pressable onPress={() => app.recheckKey(k.id)} style={{ padding: 6 }}>
              <Ionicons name="refresh" size={16} color={colors.cyan} />
            </Pressable>
            <Pressable onPress={() => app.removeKey(k.id)} style={{ padding: 6 }}>
              <Ionicons name="trash-outline" size={16} color={colors.coral} />
            </Pressable>
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  add: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  form: { marginHorizontal: 16, marginBottom: 10, backgroundColor: colors.bgCard, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 12 },
  formT: { color: colors.amber, fontWeight: '800', fontSize: 12, marginBottom: 8 },
  ggufBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginBottom: 8, paddingVertical: 8 },
  ggufTxt: { color: colors.amber, fontWeight: '700' },
  card: { backgroundColor: colors.bgCard, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 12, marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  name: { color: colors.text, fontWeight: '800', fontSize: 14 },
  meta: { color: colors.textDim, fontSize: 11, marginTop: 3 },
  keys: { color: colors.textMuted, fontSize: 11, marginTop: 8 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  get: { backgroundColor: colors.amber, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  getTxt: { color: colors.bg, fontWeight: '900', fontSize: 11, letterSpacing: 0.6 },
  in: { backgroundColor: colors.bgInput, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  inTxt: { color: colors.green, fontWeight: '800', fontSize: 11 },
  getWide: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.amber, borderRadius: 12, paddingVertical: 12, marginBottom: 14 },
  getWideTxt: { color: colors.bg, fontWeight: '900' },
  msg: { color: colors.cyan, fontSize: 12, marginTop: 10 },
  sec: { color: colors.textMuted, fontSize: 11, fontWeight: '800', letterSpacing: 1, marginTop: 18, marginBottom: 8 },
  keyRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
});
