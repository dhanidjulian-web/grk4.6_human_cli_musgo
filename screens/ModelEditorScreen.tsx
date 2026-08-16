import React, { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../components/Screen';
import { BackHeader } from '../components/BackHeader';
import { Chip, Field, PrimaryButton } from '../components/ui';
import { useApp } from '../lib/AppContext';
import { colors } from '../lib/theme';
import { RootStackParamList } from '../lib/navigation';
import { ModelProvider, RoutingMode } from '../lib/types';
import { AI_PROVIDERS } from '../lib/aiCatalog';

export function ModelEditorScreen({ navigation, route }: NativeStackScreenProps<RootStackParamList, 'ModelEditor'>) {
  const app = useApp();
  const existing = useMemo(() => app.models.find((m) => m.id === route.params?.id), [app.models, route.params?.id]);
  const [name, setName] = useState(existing?.name || '');
  const [provider, setProvider] = useState<ModelProvider>(existing?.provider || 'groq');
  const [modelId, setModelId] = useState(existing?.modelId || '');
  const [path, setPath] = useState(existing?.path || '');
  const [ctx, setCtx] = useState(String(existing?.contextWindow || 8192));
  const [notes, setNotes] = useState(existing?.notes || '');
  const [enabled, setEnabled] = useState(existing?.enabled ?? true);
  const [isFallback, setIsFallback] = useState(existing?.isFallback ?? false);
  const [order, setOrder] = useState(String(existing?.fallbackOrder || 1));
  const [routing, setRouting] = useState<RoutingMode>(existing?.routing || 'manual');
  const [keyIds, setKeyIds] = useState<string[]>(existing?.keyIds || []);

  const toggleKey = (id: string) => {
    setKeyIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const save = () => {
    if (!name.trim() || !modelId.trim()) {
      Alert.alert('Nama dan model id wajib');
      return;
    }
    if (provider === 'local-gguf' && !path.trim()) {
      Alert.alert('Path file .gguf diperlukan untuk local model');
      return;
    }
    const payload = {
      name: name.trim(),
      provider,
      modelId: modelId.trim(),
      kind: (provider === 'local-gguf' ? 'local' : 'external') as 'local' | 'external',
      path: path.trim() || undefined,
      contextWindow: Number(ctx) || 8192,
      enabled,
      isFallback,
      fallbackOrder: Number(order) || 1,
      keyIds,
      routing,
      notes,
    };
    if (existing) app.updateModel(existing.id, payload);
    else app.addModel(payload);
    navigation.goBack();
  };

  return (
    <Screen>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <BackHeader title={existing ? 'Sunting model' : 'Model baru'} />
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
          <Text style={styles.label}>PROVIDER  ·  FREE / FREEMIUM ONLY  ·  Founder add manual</Text>
          <View style={styles.wrap}>
            {app.extras.map((e) => (
              <Chip key={e.id} label={e.label} active={provider === e.id} onPress={() => { setProvider(e.id); if (!path) setPath(e.endpoint); }} />
            ))}
            {AI_PROVIDERS.map((p) => (
              <Chip key={p.id} label={p.label} active={provider === p.id} onPress={() => setProvider(p.id)} />
            ))}
          </View>
          <Field label="Nama tampilan" value={name} onChangeText={setName} placeholder="Groq Llama 3.3" />
          <Field label="Model ID" value={modelId} onChangeText={setModelId} placeholder="llama-3.3-70b-versatile" />
          {provider === 'local-gguf' ? (
            <Field label="Path file .gguf (local storage)" value={path} onChangeText={setPath} placeholder="/models/model.gguf" />
          ) : null}
          {provider === 'ollama' ? (
            <Field label="Ollama host (opsional)" value={path} onChangeText={setPath} placeholder="http://127.0.0.1:11434" />
          ) : null}
          {provider === 'lmstudio' ? (
            <Field label="LM Studio URL" value={path} onChangeText={setPath} placeholder="http://127.0.0.1:1234/v1/chat/completions" />
          ) : null}
          {provider === 'custom' ? (
            <Field label="Endpoint OpenAI-compatible" value={path} onChangeText={setPath} placeholder="https://…/v1" />
          ) : null}
          <Field label="Context window" value={ctx} onChangeText={setCtx} placeholder="8192" />
          <Field label="Catatan" value={notes} onChangeText={setNotes} placeholder="Free tier, cepat, dsb" />

          <Text style={styles.label}>ROUTING KEY</Text>
          <View style={styles.wrap}>
            <Chip label="MANUAL" active={routing === 'manual'} onPress={() => setRouting('manual')} />
            <Chip label="RANDOM AUTO LOOP" active={routing === 'random'} onPress={() => setRouting('random')} />
          </View>
          <Text style={styles.hint}>Pilih satu atau beberapa key. Random = rotasi otomatis antar key.</Text>
          {app.keys.length === 0 ? (
            <Text style={styles.hint}>Belum ada key. Tambah dari layar Model → ikon kunci.</Text>
          ) : (
            app.keys.map((k) => (
              <Pressable key={k.id} onPress={() => toggleKey(k.id)} style={styles.key}>
                <Ionicons
                  name={keyIds.includes(k.id) ? 'checkbox' : 'square-outline'}
                  size={18}
                  color={keyIds.includes(k.id) ? colors.green : colors.textDim}
                />
                <Text style={styles.keyTxt}>{k.label}  ·  {k.provider}  ·  {k.hint}</Text>
              </Pressable>
            ))
          )}

          <View style={styles.sw}>
            <Text style={styles.swTxt}>Enabled</Text>
            <Switch value={enabled} onValueChange={setEnabled} trackColor={{ true: colors.greenDim }} thumbColor={enabled ? colors.green : colors.textDim} />
          </View>
          <View style={styles.sw}>
            <Text style={styles.swTxt}>Masuk fallback chain (max 15)</Text>
            <Switch value={isFallback} onValueChange={setIsFallback} trackColor={{ true: colors.greenDim }} thumbColor={isFallback ? colors.green : colors.textDim} />
          </View>
          {isFallback ? <Field label="Urutan fallback" value={order} onChangeText={setOrder} placeholder="1" /> : null}
          <PrimaryButton title="Simpan model" icon="save-outline" onPress={save} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 8 },
  title: { color: colors.text, fontWeight: '800', fontSize: 16 },
  label: { color: colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 8, marginTop: 4 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  hint: { color: colors.textDim, fontSize: 12, marginBottom: 10, lineHeight: 17 },
  key: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  keyTxt: { color: colors.text, fontSize: 13, flex: 1 },
  sw: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  swTxt: { color: colors.text, fontSize: 14 },
});
