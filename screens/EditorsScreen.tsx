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
import { uid } from '../lib/id';
import { MAX_AGENTS, MAX_INSTRUCTION, ROUTE_MODELS } from '../lib/aiCatalog';

function Head({ title, onClose }: { title: string; onClose: () => void }) {
  return <BackHeader title={title} onBack={onClose} />;
}

export function AgentEditorScreen({ navigation, route }: NativeStackScreenProps<RootStackParamList, 'AgentEditor'>) {
  const app = useApp();
  const existing = useMemo(() => app.profile.agents.find((a) => a.id === route.params?.id), [app.profile.agents, route.params?.id]);
  const [name, setName] = useState(existing?.name || '');
  const [description, setDescription] = useState(existing?.description || '');
  const [instruction, setInstruction] = useState(existing?.instruction || '');
  const [modelId, setModelId] = useState(existing?.modelId || 'route-auto-best');
  const used = app.profile.agents.length;
  const modelChoices = [
    ...ROUTE_MODELS.map((r) => ({ id: r.id, label: r.name, hint: r.notes })),
    ...app.models.map((m) => ({ id: m.id, label: m.name, hint: `${m.provider} · ${m.kind}` })),
  ];

  const save = () => {
    if (!name.trim()) {
      Alert.alert('Nama agent wajib');
      return;
    }
    if (!instruction.trim()) {
      Alert.alert('Prompt instruction wajib (maks. 1 per agent)');
      return;
    }
    const payload = {
      name: name.trim(),
      description: description.trim() || 'Agent spesifik MusGo-OS',
      instruction: instruction.slice(0, MAX_INSTRUCTION),
      modelId,
    };
    if (existing) {
      app.updateAgent(existing.id, payload);
    } else {
      const ok = app.addAgent(payload);
      if (!ok) {
        Alert.alert('Batas 30 agent', 'Satu profil maksimal 30 agent spesifik. Hapus salah satu dulu.');
        return;
      }
    }
    navigation.goBack();
  };

  return (
    <Screen>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Head title={existing ? 'Sunting agent' : 'Agent baru'} onClose={() => navigation.goBack()} />
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
          <Text style={styles.cap}>
            {used}/{MAX_AGENTS} agent  ·  nama, deskripsi, 1 instruction, pilih model
          </Text>
          <Field label="Nama" value={name} onChangeText={setName} placeholder="Repo Steward" autoCapitalize="sentences" />
          <Field label="Deskripsi" value={description} onChangeText={setDescription} placeholder="Apa tugas spesifik agent ini" autoCapitalize="sentences" />
          {existing?.kind === 'admin' || existing?.kind === 'swarm' ? (
            <Text style={styles.cap}>ADMIN / SWARM  ·  terkunci ke Local Admin Kernel (always on)</Text>
          ) : (
            <>
              <Text style={styles.cap}>MODEL SELECTION  ·  worker memilih model</Text>
              <View style={styles.wrap}>
                {modelChoices.map((m) => (
                  <Chip key={m.id} label={m.label} active={modelId === m.id} onPress={() => setModelId(m.id)} />
                ))}
              </View>
              <Text style={styles.cap}>{modelChoices.find((m) => m.id === modelId)?.hint || ''}</Text>
            </>
          )}
          <Field
            label={`Prompt instruction  ·  1 saja  ·  ${instruction.length}/${MAX_INSTRUCTION}`}
            value={instruction}
            onChangeText={(t) => setInstruction(t.slice(0, MAX_INSTRUCTION))}
            placeholder="Satu instruksi sistem. Tidak ada field lain."
            multiline
          />
          {existing ? (
            <PrimaryButton title="Jadikan aktif" icon="flash-outline" color={colors.violet} onPress={() => { app.setActiveAgent(existing.id); navigation.goBack(); }} />
          ) : null}
          <View style={{ height: 10 }} />
          <PrimaryButton title="Simpan agent" icon="save-outline" onPress={save} />
          {existing ? (
            <Pressable
              onPress={() => {
                Alert.alert('Hapus agent?', existing.name, [
                  { text: 'Batal', style: 'cancel' },
                  { text: 'Hapus', style: 'destructive', onPress: () => { app.removeAgent(existing.id); navigation.goBack(); } },
                ]);
              }}
              style={{ padding: 16, alignItems: 'center' }}
            >
              <Text style={{ color: colors.coral, fontWeight: '700' }}>Hapus agent</Text>
            </Pressable>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

export function MemoryEditorScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'MemoryEditor'>) {
  const app = useApp();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const save = () => {
    if (!title.trim()) return;
    app.updateProfile({
      memory: [{ id: uid('mem'), title: title.trim(), content, pinned: true, createdAt: Date.now() }, ...app.profile.memory],
    });
    navigation.goBack();
  };
  return (
    <Screen>
      <Head title="Memory baru" onClose={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Field label="Judul" value={title} onChangeText={setTitle} placeholder="Keputusan arsitektur" autoCapitalize="sentences" />
        <Field label="Isi" value={content} onChangeText={setContent} placeholder="Fakta yang harus diingat agent" multiline />
        <PrimaryButton title="Pin ke memory" icon="bookmark-outline" onPress={save} />
      </ScrollView>
    </Screen>
  );
}

export function ConnectorEditorScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'ConnectorEditor'>) {
  const app = useApp();
  const [name, setName] = useState('');
  const [type, setType] = useState<'github' | 'vercel' | 'gitlab' | 'custom'>('github');
  const [target, setTarget] = useState('');
  const save = () => {
    if (!name.trim()) return;
    app.addConnector({ name: name.trim(), type, target: target.trim(), enabled: true, status: 'unknown' });
    navigation.goBack();
  };
  return (
    <Screen>
      <Head title="Connector" onClose={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={styles.wrap}>
          {(['github', 'vercel', 'gitlab', 'custom'] as const).map((t) => (
            <Chip key={t} label={t.toUpperCase()} active={type === t} onPress={() => setType(t)} />
          ))}
        </View>
        <Field label="Nama" value={name} onChangeText={setName} placeholder="prod-github" />
        <Field label="Target" value={target} onChangeText={setTarget} placeholder="owner/repo atau URL" />
        <PrimaryButton title="Hubungkan" icon="git-network-outline" onPress={save} />
      </ScrollView>
    </Screen>
  );
}

export function WorkflowEditorScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'WorkflowEditor'>) {
  const app = useApp();
  const [name, setName] = useState('');
  const [trigger, setTrigger] = useState('push:main');
  const [steps, setSteps] = useState('lint, test, export, deploy');
  const save = () => {
    if (!name.trim()) return;
    app.updateProfile({
      workflows: [{
        id: uid('wf'),
        name: name.trim(),
        trigger,
        steps: steps.split(',').map((s) => s.trim()).filter(Boolean),
        enabled: true,
      }, ...app.profile.workflows],
    });
    navigation.goBack();
  };
  return (
    <Screen>
      <Head title="Workflow otonom" onClose={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Field label="Nama" value={name} onChangeText={setName} placeholder="Nightly audit" autoCapitalize="sentences" />
        <Field label="Trigger" value={trigger} onChangeText={setTrigger} placeholder="cron:0 2 * * *" />
        <Field label="Langkah (koma)" value={steps} onChangeText={setSteps} placeholder="scan, report, notify" />
        <PrimaryButton title="Simpan workflow" icon="git-branch-outline" onPress={save} />
      </ScrollView>
    </Screen>
  );
}

export function HookEditorScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'HookEditor'>) {
  const app = useApp();
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [kind, setKind] = useState<'webhook' | 'websocket'>('webhook');
  const save = () => {
    if (!name.trim() || !url.trim()) {
      Alert.alert('Nama dan URL wajib');
      return;
    }
    app.updateProfile({
      hooks: [{ id: uid('hk'), name: name.trim(), url: url.trim(), kind, enabled: true }, ...app.profile.hooks],
    });
    navigation.goBack();
  };
  return (
    <Screen>
      <Head title="Webhook / WebSocket" onClose={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={styles.wrap}>
          <Chip label="WEBHOOK" active={kind === 'webhook'} onPress={() => setKind('webhook')} />
          <Chip label="WEBSOCKET" active={kind === 'websocket'} onPress={() => setKind('websocket')} />
        </View>
        <Field label="Nama" value={name} onChangeText={setName} placeholder="deploy-notify" />
        <Field label="URL" value={url} onChangeText={setUrl} placeholder={kind === 'websocket' ? 'wss://…' : 'https://…'} keyboardType="url" />
        <PrimaryButton title="Simpan hook" icon="flash-outline" onPress={save} />
      </ScrollView>
    </Screen>
  );
}

export function ScheduleEditorScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'ScheduleEditor'>) {
  const app = useApp();
  const [name, setName] = useState('');
  const [mins, setMins] = useState('60');
  const [prompt, setPrompt] = useState('test konektor');
  const save = () => {
    if (!name.trim() || !prompt.trim()) return;
    const everyMin = Math.max(5, Number(mins) || 60);
    app.updateProfile({
      schedules: [{
        id: uid('sch'),
        name: name.trim(),
        everyMin,
        prompt: prompt.trim(),
        agentId: app.profile.activeAgentId,
        enabled: true,
      }, ...(app.profile.schedules || [])],
    });
    navigation.goBack();
  };
  return (
    <Screen>
      <Head title="Scheduled task" onClose={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.cap}>Dijalankan live saat aplikasi terbuka. Interval minimum 5 menit.</Text>
        <Field label="Nama" value={name} onChangeText={setName} placeholder="CI pulse" autoCapitalize="sentences" />
        <Field label="Setiap (menit)" value={mins} onChangeText={setMins} placeholder="60" />
        <Field label="Prompt / perintah" value={prompt} onChangeText={setPrompt} placeholder="daftar repo saya" multiline />
        <PrimaryButton title="Simpan jadwal" icon="alarm-outline" onPress={save} />
      </ScrollView>
    </Screen>
  );
}

export function McpEditorScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'McpEditor'>) {
  const app = useApp();
  const [name, setName] = useState('');
  const [command, setCommand] = useState('');
  const save = () => {
    if (!name.trim() || !command.trim()) {
      Alert.alert('Nama dan command wajib');
      return;
    }
    app.updateProfile({
      mcp: [{ id: uid('mcp'), name: name.trim(), command: command.trim(), enabled: true }, ...app.profile.mcp],
    });
    navigation.goBack();
  };
  return (
    <Screen>
      <Head title="MCP server" onClose={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Field label="Nama" value={name} onChangeText={setName} placeholder="github" />
        <Field label="Command" value={command} onChangeText={setCommand} placeholder="npx -y @modelcontextprotocol/server-github" />
        <PrimaryButton title="Simpan MCP" icon="extension-puzzle-outline" onPress={save} />
      </ScrollView>
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
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  rowTxt: { color: colors.text, fontSize: 14 },
  cap: { color: colors.amber, fontSize: 12, marginBottom: 14, lineHeight: 17 },
});
