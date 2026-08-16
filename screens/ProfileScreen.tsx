import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
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
import { Badge, Card, Field, PrimaryButton, Row, SectionTitle } from '../components/ui';
import { useApp } from '../lib/AppContext';
import { colors } from '../lib/theme';
import { RootStackParamList } from '../lib/navigation';
import { uid } from '../lib/id';
import { downloadTextFile, workspaceDump } from '../lib/backup';

export function ProfileScreen() {
  const app = useApp();
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const p = app.profile;
  const [name, setName] = useState(p.displayName);
  const [handle, setHandle] = useState(p.handle);
  const [org, setOrg] = useState(p.organization);
  const [instruction, setInstruction] = useState(p.instruction);
  const [secretOpen, setSecretOpen] = useState(false);
  const [sKey, setSKey] = useState('');
  const [sVal, setSVal] = useState('');
  const [sKind, setSKind] = useState<'env' | 'secret' | 'pat'>('pat');

  const saveIdentity = () => {
    app.updateProfile({ displayName: name.trim() || p.displayName, handle: handle.trim(), organization: org.trim(), instruction });
    Alert.alert('Tersimpan', 'Identitas & instruction diperbarui.');
  };

  const addSecret = () => {
    if (!sKey.trim()) return;
    app.updateProfile({
      secrets: [{ id: uid('sec'), key: sKey.trim(), hint: sVal ? `${sVal.slice(0, 2)}••••` : 'set', kind: sKind }, ...p.secrets],
    });
    setSKey('');
    setSVal('');
    setSecretOpen(false);
  };

  return (
    <Screen>
      <BackHeader title="Workspace" subtitle="Profil = workspace Founder · swarm · konektor" />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 80 }}>
        <Text style={styles.kicker}>WORKSPACE  ·  MUSGO-OS  2in1Ai-inside-OS</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
          <Pressable onPress={() => nav.navigate('Sandbox')} style={styles.ws}>
            <Text style={styles.wsT}>SANDBOX</Text>
          </Pressable>
          <Pressable onPress={() => nav.navigate('Bookmarks')} style={styles.ws}>
            <Text style={styles.wsT}>BOOKMARKS</Text>
          </Pressable>
          <Pressable onPress={() => nav.navigate('PlatformHub')} style={styles.ws}>
            <Text style={styles.wsT}>PLATFORMS / GET KEY</Text>
          </Pressable>
          <Pressable onPress={() => nav.navigate('Backup')} style={styles.ws}>
            <Text style={styles.wsT}>BACKUP / RESTORE</Text>
          </Pressable>
          <Pressable onPress={() => nav.navigate('SourceEditor')} style={styles.ws}>
            <Text style={styles.wsT}>FILE MANAGER</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              const json = workspaceDump(app);
              downloadTextFile(`human-cli-workspace-${Date.now()}.json`, json);
              Alert.alert(
                'Download workspace',
                'File JSON workspace diunduh. Di Android Chrome: menu ⋮ → Add to Home screen / Instal aplikasi untuk memasang Human CLI.'
              );
            }}
            style={styles.ws}
          >
            <Text style={styles.wsT}>DOWNLOAD / INSTALL</Text>
          </Pressable>
        </View>

        <Card style={{ marginTop: 16 }}>
          <View style={styles.avatarRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarTxt}>{(p.displayName || 'H').slice(0, 1).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.who}>{p.displayName}</Text>
              <Text style={styles.handle}>@{p.handle} · {p.organization}</Text>
            </View>
            <Badge text="FOUNDER" color={colors.amber} />
          </View>
          <Field label="Nama" value={name} onChangeText={setName} autoCapitalize="sentences" />
          <Field label="Handle" value={handle} onChangeText={setHandle} />
          <Field label="Organisasi" value={org} onChangeText={setOrg} />
          <Field label="Prompt instruction" value={instruction} onChangeText={setInstruction} multiline />
          <View style={styles.sw}>
            <Text style={styles.swTxt}>Auto mode selection</Text>
            <Switch
              value={p.autoMode}
              onValueChange={(v) => app.updateProfile({ autoMode: v })}
              trackColor={{ true: colors.greenDim }}
              thumbColor={p.autoMode ? colors.green : colors.textDim}
            />
          </View>
          <View style={styles.sw}>
            <Text style={styles.swTxt}>Orchestrator pilih agent tiap input</Text>
            <Switch
              value={p.orchestrator !== false}
              onValueChange={(v) => app.updateProfile({ orchestrator: v, lockAgent: v ? false : p.lockAgent })}
              trackColor={{ true: colors.greenDim }}
              thumbColor={p.orchestrator !== false ? colors.green : colors.textDim}
            />
          </View>
          <View style={styles.sw}>
            <Text style={styles.swTxt}>Kunci agent aktif (non-auto)</Text>
            <Switch
              value={!!p.lockAgent}
              onValueChange={(v) => app.updateProfile({ lockAgent: v, orchestrator: v ? false : p.orchestrator })}
              trackColor={{ true: colors.greenDim }}
              thumbColor={p.lockAgent ? colors.green : colors.textDim}
            />
          </View>
          <PrimaryButton title="Simpan identitas" icon="save-outline" onPress={saveIdentity} />
        </Card>

        <SectionTitle
          title={`AI Agents  ${p.agents.length}/30`}
          action={p.agents.length >= 30 ? 'PENUH' : 'Baru'}
          onAction={() => {
            if (p.agents.length >= 30) {
              Alert.alert('Batas 30 agent', 'Satu profil maksimal 30 agent spesifik.');
              return;
            }
            nav.navigate('AgentEditor');
          }}
        />
        <Text style={styles.empty}>Hanya nama, deskripsi, dan 1 prompt instruction per agent.</Text>
        {p.agents.map((a) => (
          <Card key={a.id} style={{ marginBottom: 8 }}>
            <Row
              icon="hardware-chip-outline"
              color={colors.green}
              title={a.name}
              subtitle={`${a.kind === 'admin' ? 'ADMIN · ' : a.kind === 'swarm' ? 'SWARM · ' : ''}${a.description}`}
              onPress={() => nav.navigate('AgentEditor', { id: a.id })}
              right={p.activeAgentId === a.id ? <Badge text="ON" /> : undefined}
            />
          </Card>
        ))}

        <SectionTitle title="MCP Servers" action="Baru" onAction={() => nav.navigate('McpEditor')} />
        {p.mcp.map((m) => (
          <View key={m.id} style={styles.line}>
            <View style={{ flex: 1 }}>
              <Text style={styles.lineTitle}>{m.name}</Text>
              <Text style={styles.lineSub} numberOfLines={1}>{m.command}</Text>
            </View>
            <Switch
              value={m.enabled}
              onValueChange={(v) =>
                app.updateProfile({ mcp: p.mcp.map((x) => (x.id === m.id ? { ...x, enabled: v } : x)) })
              }
              trackColor={{ true: colors.greenDim }}
              thumbColor={m.enabled ? colors.green : colors.textDim}
            />
          </View>
        ))}
        <SectionTitle title="Webhooks / WebSocket" action="Baru" onAction={() => nav.navigate('HookEditor')} />
        {p.hooks.length === 0 ? <Text style={styles.empty}>Belum ada hook.</Text> : null}
        {p.hooks.map((h) => (
          <View key={h.id} style={styles.line}>
            <View style={{ flex: 1 }}>
              <Text style={styles.lineTitle}>{h.name}</Text>
              <Text style={styles.lineSub}>{h.kind} · {h.url}</Text>
            </View>
            <Switch
              value={h.enabled}
              onValueChange={(v) =>
                app.updateProfile({ hooks: p.hooks.map((x) => (x.id === h.id ? { ...x, enabled: v } : x)) })
              }
              trackColor={{ true: colors.greenDim }}
              thumbColor={h.enabled ? colors.green : colors.textDim}
            />
          </View>
        ))}
        <SectionTitle title="Scheduled tasks" action="Baru" onAction={() => nav.navigate('ScheduleEditor')} />
        {(p.schedules || []).length === 0 ? <Text style={styles.empty}>Tidak ada jadwal. Task dijalankan live saat app terbuka.</Text> : null}
        {(p.schedules || []).map((s) => (
          <View key={s.id} style={styles.line}>
            <View style={{ flex: 1 }}>
              <Text style={styles.lineTitle}>{s.name}</Text>
              <Text style={styles.lineSub}>setiap {s.everyMin} mnt · {s.prompt.slice(0, 48)}</Text>
            </View>
            <Switch
              value={s.enabled}
              onValueChange={(v) =>
                app.updateProfile({ schedules: (p.schedules || []).map((x) => (x.id === s.id ? { ...x, enabled: v } : x)) })
              }
              trackColor={{ true: colors.greenDim }}
              thumbColor={s.enabled ? colors.green : colors.textDim}
            />
          </View>
        ))}

        <SectionTitle title="Autonomous Workflows" action="Baru" onAction={() => nav.navigate('WorkflowEditor')} />
        {p.workflows.map((w) => (
          <View key={w.id} style={styles.line}>
            <View style={{ flex: 1 }}>
              <Text style={styles.lineTitle}>{w.name}</Text>
              <Text style={styles.lineSub}>{w.trigger} · {w.steps.join(' → ')}</Text>
            </View>
            <Switch
              value={w.enabled}
              onValueChange={(v) =>
                app.updateProfile({ workflows: p.workflows.map((x) => (x.id === w.id ? { ...x, enabled: v } : x)) })
              }
              trackColor={{ true: colors.greenDim }}
              thumbColor={w.enabled ? colors.green : colors.textDim}
            />
          </View>
        ))}

        <SectionTitle title="Tools" />
        {p.tools.map((t) => (
          <View key={t.id} style={styles.line}>
            <View style={{ flex: 1 }}>
              <Text style={styles.lineTitle}>{t.name}</Text>
              <Text style={styles.lineSub}>{t.description}</Text>
            </View>
            <Switch
              value={t.enabled}
              onValueChange={(v) =>
                app.updateProfile({ tools: p.tools.map((x) => (x.id === t.id ? { ...x, enabled: v } : x)) })
              }
              trackColor={{ true: colors.greenDim }}
              thumbColor={t.enabled ? colors.green : colors.textDim}
            />
          </View>
        ))}

        <SectionTitle title="Memory" action="Pin baru" onAction={() => nav.navigate('MemoryEditor')} />
        {p.memory.map((m) => (
          <Card key={m.id} style={{ marginBottom: 8 }}>
            <Text style={styles.lineTitle}>{m.pinned ? '📌 ' : ''}{m.title}</Text>
            <Text style={styles.mem}>{m.content}</Text>
          </Card>
        ))}

        <SectionTitle title="Knowledge library" action="Buka" onAction={() => nav.navigate('SourceEditor')} />
        <Text style={styles.empty}>{app.sources.length} sumber terpasang · skill {app.skills.filter((s) => s.enabled).length} aktif</Text>
        <SectionTitle title="Skills tersimpan" action="Kelola" onAction={() => nav.navigate('SkillEditor')} />
        {app.skills.slice(0, 6).map((s) => (
          <View key={s.id} style={styles.line}>
            <View style={{ flex: 1 }}>
              <Text style={styles.lineTitle}>{s.name}</Text>
              <Text style={styles.lineSub}>{s.origin} · {s.enabled ? 'load' : 'off'}</Text>
            </View>
          </View>
        ))}
        <SectionTitle title="Connectors" action="Kelola di Ship" onAction={() => nav.navigate('ConnectorEditor')} />
        {p.connectors.map((c) => (
          <View key={c.id} style={styles.line}>
            <View style={{ flex: 1 }}>
              <Text style={styles.lineTitle}>{c.name}</Text>
              <Text style={styles.lineSub}>{c.type} · {c.target}</Text>
            </View>
            <Switch
              value={c.enabled}
              onValueChange={(v) =>
                app.updateProfile({ connectors: p.connectors.map((x) => (x.id === c.id ? { ...x, enabled: v } : x)) })
              }
              trackColor={{ true: colors.greenDim }}
              thumbColor={c.enabled ? colors.green : colors.textDim}
            />
          </View>
        ))}

        <SectionTitle title="Secrets / ENV / PAT" action="Tambah" onAction={() => setSecretOpen(true)} />
        {p.secrets.length === 0 ? <Text style={styles.empty}>Tidak ada secret tersimpan di profil.</Text> : null}
        {p.secrets.map((s) => (
          <View key={s.id} style={styles.line}>
            <View style={{ flex: 1 }}>
              <Text style={styles.lineTitle}>{s.key}</Text>
              <Text style={styles.lineSub}>{s.kind} · {s.hint}</Text>
            </View>
            <Pressable
              onPress={() => app.updateProfile({ secrets: p.secrets.filter((x) => x.id !== s.id) })}
            >
              <Ionicons name="trash-outline" size={16} color={colors.coral} />
            </Pressable>
          </View>
        ))}

        <View style={styles.sign}>
          <Text style={styles.signK}>===========™®©===========</Text>
          <Text style={styles.signT}>MusGo-OS 2in1Ai-inside-OS</Text>
          <Text style={styles.signS}>(2in1 Musyawarah & Gotong-Royong)</Text>
          <Text style={styles.signS}>Sovereign AI Operating Civilization</Text>
          <Text style={styles.signC}>© 2026 — Dhani Yuliawan</Text>
          <Text style={styles.signC}>All Rights Reserved</Text>
          <Text style={styles.signK}>===========™®©===========</Text>
          <Text style={styles.founder}>FOUNDER SIGN: DHANI YULIAWAN</Text>
        </View>
      </ScrollView>

      <Modal visible={secretOpen} transparent animationType="slide" onRequestClose={() => setSecretOpen(false)}>
        <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Secret / ENV / PAT</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
              {(['pat', 'env', 'secret'] as const).map((k) => (
                <Pressable key={k} onPress={() => setSKind(k)} style={[styles.kind, sKind === k && styles.kindOn]}>
                  <Text style={{ color: sKind === k ? colors.green : colors.textMuted, fontWeight: '800', fontSize: 11 }}>{k.toUpperCase()}</Text>
                </Pressable>
              ))}
            </View>
            <Field label="Key" value={sKey} onChangeText={setSKey} placeholder="GITHUB_PAT" />
            <Field label="Value" value={sVal} onChangeText={setSVal} placeholder="ghp_…" secure />
            <PrimaryButton title="Simpan" icon="lock-closed-outline" onPress={addSecret} />
            <Pressable onPress={() => setSecretOpen(false)} style={{ padding: 12, alignItems: 'center' }}>
              <Text style={{ color: colors.textMuted }}>Batal</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  kicker: { color: colors.green, fontSize: 11, fontWeight: '800', letterSpacing: 1.6 },
  ws: { backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
  wsT: { color: colors.green, fontWeight: '800', fontSize: 10, letterSpacing: 0.6 },
  title: { color: colors.text, fontSize: 26, fontWeight: '900', marginTop: 4 },
  sub: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  avatar: {
    width: 48, height: 48, borderRadius: 16, backgroundColor: colors.greenBg,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.greenDim,
  },
  avatarTxt: { color: colors.green, fontWeight: '900', fontSize: 20 },
  who: { color: colors.text, fontWeight: '800', fontSize: 16 },
  handle: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  sw: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  swTxt: { color: colors.text, fontSize: 14 },
  line: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border,
    borderRadius: 12, padding: 12, marginBottom: 8,
  },
  lineTitle: { color: colors.text, fontWeight: '700', fontSize: 13 },
  lineSub: { color: colors.textDim, fontSize: 11, marginTop: 2 },
  addLine: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8 },
  addTxt: { color: colors.green, fontWeight: '700' },
  empty: { color: colors.textDim, fontSize: 12, marginBottom: 8 },
  mem: { color: colors.textMuted, fontSize: 13, marginTop: 6, lineHeight: 18 },
  sign: {
    marginTop: 28, alignItems: 'center', padding: 16,
    borderWidth: 1, borderColor: colors.border, borderRadius: 16, backgroundColor: colors.bgCard,
  },
  signK: { color: colors.textDim, fontSize: 10, marginVertical: 6 },
  signT: { color: colors.green, fontWeight: '900', fontSize: 14 },
  signS: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  signC: { color: colors.textDim, fontSize: 11, marginTop: 2 },
  founder: { color: colors.amber, fontWeight: '800', fontSize: 11, marginTop: 10, letterSpacing: 1 },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlay },
  sheet: {
    backgroundColor: colors.bgElevated, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 18, borderWidth: 1, borderColor: colors.border,
  },
  sheetTitle: { color: colors.text, fontWeight: '800', fontSize: 16, marginBottom: 10 },
  kind: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: colors.border },
  kindOn: { borderColor: colors.green, backgroundColor: colors.greenBg },
});
