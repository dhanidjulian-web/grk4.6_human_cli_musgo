import React, { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../components/Screen';
import { BackHeader } from '../components/BackHeader';
import { Badge, Chip, Field, PrimaryButton } from '../components/ui';
import { useApp } from '../lib/AppContext';
import { colors } from '../lib/theme';
import { RootStackParamList } from '../lib/navigation';
import { ModelItem, ModelProvider } from '../lib/types';
import { AI_PROVIDERS, CATALOG_MODELS, catalogToModel, keyPageFor, PROVIDER_MAP } from '../lib/aiCatalog';

export function ModelsScreen() {
  const app = useApp();
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [keyOpen, setKeyOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [provider, setProvider] = useState<ModelProvider>('groq');
  const [raw, setRaw] = useState('');
  const [busy, setBusy] = useState(false);

  const fallbacks = useMemo(
    () => app.models.filter((m) => m.isFallback).sort((a, b) => a.fallbackOrder - b.fallbackOrder),
    [app.models]
  );

  const allProviders = useMemo(() => {
    const extra = (app.extras || []).map((e) => ({ id: e.id, label: e.label, tier: e.tier as 'free' | 'freemium' }));
    return [...extra, ...AI_PROVIDERS.map((p) => ({ id: p.id, label: p.label, tier: p.tier }))];
  }, [app.extras]);

  const saveKey = async () => {
    if (!raw.trim()) {
      Alert.alert('API key kosong');
      return;
    }
    setBusy(true);
    const r = await app.addKey(label.trim() || `${provider} key`, provider, raw);
    setBusy(false);
    if (!r.ok) {
      Alert.alert('Validasi gagal', r.message);
      return;
    }
    Alert.alert('Key valid', r.message);
    setRaw('');
    setLabel('');
    setKeyOpen(false);
  };

  const remove = (item: ModelItem) => {
    Alert.alert('Hapus model', item.name, [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: () => app.removeModel(item.id) },
    ]);
  };

  const addFromCatalog = (name: string) => {
    const c = CATALOG_MODELS.find((x) => x.name === name);
    if (!c) return;
    const exists = app.models.some((m) => m.provider === c.provider && m.modelId === c.modelId);
    if (exists) {
      Alert.alert('Sudah ada', c.name);
      return;
    }
    const m = catalogToModel(c);
    app.addModel({
      name: m.name,
      provider: m.provider,
      modelId: m.modelId,
      kind: m.kind,
      path: m.path,
      contextWindow: m.contextWindow,
      enabled: true,
      isFallback: m.isFallback,
      fallbackOrder: m.fallbackOrder,
      keyIds: [],
      routing: 'manual',
      notes: m.notes,
    });
    Alert.alert('Ditambahkan', c.name);
  };

  const getKeyUrl = keyPageFor(provider, app.extras || []);

  return (
    <Screen>
      <BackHeader
        title="Model Manager"
        subtitle="Free / freemium · multi-key · uji validasi"
        right={
          <View style={{ flexDirection: 'row', gap: 6, marginRight: 8 }}>
            <Pressable onPress={() => nav.navigate('PlatformHub')} style={styles.ghost}>
              <Ionicons name="planet-outline" size={18} color={colors.cyan} />
            </Pressable>
            <Pressable onPress={() => setKeyOpen(true)} style={styles.ghost}>
              <Ionicons name="key-outline" size={18} color={colors.amber} />
            </Pressable>
            <Pressable onPress={() => setCatOpen(true)} style={styles.ghost}>
              <Ionicons name="grid-outline" size={18} color={colors.cyan} />
            </Pressable>
            <Pressable onPress={() => nav.navigate('ModelEditor')} style={styles.add}>
              <Ionicons name="add" size={20} color={colors.bg} />
            </Pressable>
          </View>
        }
      />

      <View style={styles.fb}>
        <Text style={styles.fbTitle}>FALLBACK CHAIN  {fallbacks.length}/15</Text>
        {fallbacks.length === 0 ? (
          <Text style={styles.fbEmpty}>Belum ada fallback. Aktifkan di kartu model.</Text>
        ) : (
          fallbacks.map((m, i) => (
            <Text key={m.id} style={styles.fbItem}>
              {i + 1}.  {m.name}  ·  {m.provider}
            </Text>
          ))
        )}
      </View>

      <FlatList
        data={app.models}
        keyExtractor={(it) => it.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
        renderItem={({ item }) => {
          const active = app.profile.activeModelId === item.id;
          const page = keyPageFor(item.provider, app.extras);
          return (
            <Pressable
              onPress={() => nav.navigate('ModelEditor', { id: item.id })}
              onLongPress={() => remove(item)}
              style={[styles.card, active && styles.cardOn]}
            >
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.meta}>
                    {item.provider} · {item.modelId} · ctx {item.contextWindow}
                  </Text>
                </View>
                <Pressable onPress={() => app.setActiveModel(item.id)}>
                  <Badge text={active ? 'ACTIVE' : 'USE'} color={active ? colors.green : colors.textMuted} />
                </Pressable>
              </View>
              <Text style={styles.notes}>{item.notes}</Text>
              <View style={styles.row2}>
                <Badge text={item.kind.toUpperCase()} color={item.kind === 'local' ? colors.amber : colors.cyan} />
                <Badge text={item.routing} color={colors.violet} />
                {item.path && item.provider === 'local-gguf' ? <Badge text="GGUF" color={colors.amber} /> : null}
                <View style={{ flex: 1 }} />
                <Switch
                  value={item.enabled}
                  onValueChange={(v) => app.updateModel(item.id, { enabled: v })}
                  trackColor={{ true: colors.greenDim, false: colors.border }}
                  thumbColor={item.enabled ? colors.green : colors.textDim}
                />
              </View>
              {item.isFallback ? <Text style={styles.fbTag}>fallback #{item.fallbackOrder || '?'}</Text> : null}
              {item.kind === 'external' ? (
                <View style={styles.actions}>
                  {page ? (
                    <Pressable onPress={() => Linking.openURL(page)} style={styles.get}>
                      <Text style={styles.getTxt}>GET KEY</Text>
                    </Pressable>
                  ) : null}
                  <Pressable onPress={() => nav.navigate('KeyEditor', { provider: item.provider })} style={styles.in}>
                    <Text style={styles.inTxt}>INPUT & UJI</Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable onPress={() => remove(item)} style={{ marginTop: 8 }}>
                  <Text style={{ color: colors.coral, fontWeight: '700', fontSize: 12 }}>Hapus GGUF</Text>
                </Pressable>
              )}
            </Pressable>
          );
        }}
        ListHeaderComponent={
          <View style={{ marginBottom: 12 }}>
            <Text style={styles.keysTitle}>
              PLATFORM  ·  {allProviders.length}  ·  Founder add/hapus di ikon planet
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginBottom: 12 }}>
              {allProviders.map((p) => (
                <Chip
                  key={p.id}
                  label={p.label}
                  color={p.tier === 'free' ? colors.green : colors.cyan}
                  onPress={() => nav.navigate('KeyEditor', { provider: p.id })}
                />
              ))}
            </ScrollView>
            <Text style={styles.keysTitle}>API KEYS  ·  {app.keys.length} (hanya yang lolos uji)</Text>
            {app.keys.map((k) => (
              <View key={k.id} style={styles.keyRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.keyName}>{k.label}</Text>
                  <Text style={styles.keyHint}>{k.provider} · {k.hint} · {k.lastMessage || ''}</Text>
                </View>
                <Badge text={k.valid ? 'OK' : '?'} color={k.valid ? colors.green : colors.amber} />
                <Pressable onPress={() => app.recheckKey(k.id)}>
                  <Ionicons name="refresh" size={16} color={colors.cyan} />
                </Pressable>
                <Pressable onPress={() => app.removeKey(k.id)}>
                  <Ionicons name="trash-outline" size={16} color={colors.coral} />
                </Pressable>
              </View>
            ))}
          </View>
        }
      />

      <Modal visible={keyOpen} transparent animationType="slide" onRequestClose={() => setKeyOpen(false)}>
        <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>BYOK — uji lalu simpan</Text>
            <Text style={styles.sheetHint}>Key tidak disimpan jika validasi gagal.</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginBottom: 12 }}>
              {allProviders.map((p) => (
                <Chip key={p.id} label={p.label} active={provider === p.id} onPress={() => setProvider(p.id)} />
              ))}
            </ScrollView>
            {getKeyUrl ? (
              <Pressable onPress={() => Linking.openURL(getKeyUrl)} style={styles.getWide}>
                <Text style={styles.getWideTxt}>GET KEY — {PROVIDER_MAP[provider]?.label || provider}</Text>
              </Pressable>
            ) : null}
            <Field label="Label" value={label} onChangeText={setLabel} placeholder="groq-prod" />
            <Field label="API Key" value={raw} onChangeText={setRaw} placeholder="sk-…" secure />
            <PrimaryButton title={busy ? 'Menguji…' : 'Uji & simpan'} icon="shield-checkmark-outline" onPress={saveKey} disabled={busy} />
            <Pressable onPress={() => setKeyOpen(false)} style={{ padding: 14, alignItems: 'center' }}>
              <Text style={{ color: colors.textMuted, fontWeight: '700' }}>Back</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={catOpen} transparent animationType="slide" onRequestClose={() => setCatOpen(false)}>
        <View style={styles.overlay}>
          <View style={[styles.sheet, { maxHeight: '88%' }]}>
            <Text style={styles.sheetTitle}>Katalog free / freemium</Text>
            <FlatList
              data={CATALOG_MODELS}
              keyExtractor={(it) => it.provider + it.modelId}
              style={{ maxHeight: 420 }}
              renderItem={({ item }) => {
                const on = app.models.some((m) => m.provider === item.provider && m.modelId === item.modelId);
                return (
                  <Pressable onPress={() => addFromCatalog(item.name)} style={styles.keyRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.keyName}>{item.name}</Text>
                      <Text style={styles.keyHint}>{item.provider} · {item.notes}</Text>
                    </View>
                    <Badge text={on ? 'ON' : 'ADD'} color={on ? colors.green : colors.cyan} />
                  </Pressable>
                );
              }}
            />
            <Pressable onPress={() => setCatOpen(false)} style={{ padding: 14, alignItems: 'center' }}>
              <Text style={{ color: colors.textMuted, fontWeight: '700' }}>Back</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  add: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  ghost: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: colors.bgCard,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
  },
  fb: {
    marginHorizontal: 16, backgroundColor: colors.bgCard, borderRadius: 14,
    borderWidth: 1, borderColor: colors.border, padding: 12, marginBottom: 4,
  },
  fbTitle: { color: colors.amber, fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 6 },
  fbEmpty: { color: colors.textDim, fontSize: 12 },
  fbItem: { color: colors.text, fontSize: 12, paddingVertical: 2, fontFamily: 'Courier New' },
  card: {
    backgroundColor: colors.bgCard, borderRadius: 14, borderWidth: 1,
    borderColor: colors.border, padding: 14, marginBottom: 10,
  },
  cardOn: { borderColor: colors.greenDim },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  name: { color: colors.text, fontWeight: '800', fontSize: 15 },
  meta: { color: colors.textDim, fontSize: 11, marginTop: 3 },
  notes: { color: colors.textMuted, fontSize: 12, marginTop: 8 },
  row2: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  fbTag: { color: colors.amber, fontSize: 11, marginTop: 8, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  get: { backgroundColor: colors.amber, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  getTxt: { color: colors.bg, fontWeight: '900', fontSize: 11, letterSpacing: 0.5 },
  in: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  inTxt: { color: colors.green, fontWeight: '800', fontSize: 11 },
  keysTitle: { color: colors.textMuted, fontSize: 11, fontWeight: '800', letterSpacing: 0.8, marginBottom: 8 },
  keyRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 8,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  keyName: { color: colors.text, fontWeight: '700', fontSize: 13 },
  keyHint: { color: colors.textDim, fontSize: 11, marginTop: 2 },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlay },
  sheet: {
    backgroundColor: colors.bgElevated, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 18, borderWidth: 1, borderColor: colors.borderBright,
  },
  sheetTitle: { color: colors.text, fontWeight: '800', fontSize: 16, marginBottom: 6 },
  sheetHint: { color: colors.textMuted, fontSize: 12, marginBottom: 12, lineHeight: 17 },
  getWide: { backgroundColor: colors.amber, borderRadius: 10, paddingVertical: 10, alignItems: 'center', marginBottom: 12 },
  getWideTxt: { color: colors.bg, fontWeight: '900', fontSize: 12 },
});
