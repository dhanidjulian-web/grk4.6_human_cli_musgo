import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../components/Screen';
import { BackHeader } from '../components/BackHeader';
import { Badge, Empty, Field, PrimaryButton } from '../components/ui';
import { useApp } from '../lib/AppContext';
import { colors } from '../lib/theme';
import { CATEGORY_LABEL, getPlatform, PLATFORMS } from '../lib/platforms';
import { github, GhRepo } from '../lib/github';
import { RootStackParamList } from '../lib/navigation';
import { ConnectorItem, ConnectorPlatform } from '../lib/types';
import { formatDate } from '../lib/id';

export function ShipScreen() {
  const app = useApp();
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [tab, setTab] = useState<'board' | 'github' | 'catalog'>('board');
  const [refreshing, setRefreshing] = useState(false);
  const [picker, setPicker] = useState(false);
  const [edit, setEdit] = useState<ConnectorItem | null>(null);
  const [token, setToken] = useState('');
  const [target, setTarget] = useState('');
  const [repos, setRepos] = useState<GhRepo[]>([]);
  const [repoErr, setRepoErr] = useState('');
  const [repoBusy, setRepoBusy] = useState(false);
  const [q, setQ] = useState('');

  const gh = app.profile.connectors.find((c) => c.type === 'github' && c.enabled);

  const loadRepos = useCallback(async () => {
    setRepoBusy(true);
    setRepoErr('');
    const tok = await app.tokenFor('github');
    if (!tok) {
      setRepoErr('Simpan GitHub PAT di kartu konektor.');
      setRepos([]);
      setRepoBusy(false);
      return;
    }
    const r = await github.repos(tok);
    if (!r.ok) {
      setRepoErr(r.error || 'gagal');
      setRepos([]);
    } else {
      setRepos(r.data || []);
    }
    setRepoBusy(false);
  }, [app]);

  const onRefresh = async () => {
    setRefreshing(true);
    await app.probeAll();
    if (tab === 'github') await loadRepos();
    setRefreshing(false);
  };

  const openEdit = (c: ConnectorItem) => {
    setEdit(c);
    setTarget(c.target);
    setToken('');
  };

  const saveEdit = async () => {
    if (!edit) return;
    app.updateConnector(edit.id, { target: target.trim() });
    if (token.trim()) await app.saveConnectorToken(edit.id, token.trim());
    setToken('');
    await app.probeConnector(edit.id);
    setEdit(null);
  };

  const addPlatform = (id: ConnectorPlatform) => {
    const def = getPlatform(id);
    const existing = app.profile.connectors.find((c) => c.type === id);
    if (existing) {
      setPicker(false);
      openEdit(existing);
      return;
    }
    const nid = app.addConnector({
      name: def.label,
      type: id,
      target: '',
      enabled: true,
      status: 'unknown',
      lastMessage: 'token belum diisi',
    });
    setPicker(false);
    const created = { ...app.profile.connectors[0], id: nid, name: def.label, type: id, target: '', enabled: true } as ConnectorItem;
    openEdit({ ...created, id: nid });
  };

  const filteredRepos = useMemo(() => {
    const t = q.toLowerCase();
    if (!t) return repos;
    return repos.filter((r) => `${r.full_name} ${r.description || ''} ${r.language || ''}`.toLowerCase().includes(t));
  }, [repos, q]);

  const okN = app.profile.connectors.filter((c) => c.status === 'ok').length;
  const enN = app.profile.connectors.filter((c) => c.enabled).length;

  return (
    <Screen>
      <BackHeader
        title="Ship"
        subtitle={`${okN}/${enN} konektor hidup · GitHub + deploy`}
        right={
          <View style={{ flexDirection: 'row', gap: 6, marginRight: 8 }}>
            <Pressable onPress={() => nav.navigate('Studio')} style={styles.iconBtn}>
              <Ionicons name="color-palette-outline" size={18} color={colors.violet} />
            </Pressable>
            <Pressable onPress={() => setPicker(true)} style={styles.add}>
              <Ionicons name="add" size={22} color={colors.bg} />
            </Pressable>
          </View>
        }
      />

      <View style={styles.tabs}>
        {(['board', 'github', 'catalog'] as const).map((t) => (
          <Pressable key={t} onPress={() => { setTab(t); if (t === 'github' && repos.length === 0) loadRepos(); }} style={[styles.tab, tab === t && styles.tabOn]}>
            <Text style={[styles.tabTxt, tab === t && styles.tabTxtOn]}>{t.toUpperCase()}</Text>
          </Pressable>
        ))}
      </View>

      {tab === 'board' ? (
        <FlatList
          data={app.profile.connectors}
          keyExtractor={(it) => it.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.green} />}
          contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
          ListHeaderComponent={
            <View style={styles.quick}>
              <Quick title="Repos" icon="logo-github" onPress={() => { setTab('github'); loadRepos(); }} />
              <Quick title="Probe all" icon="pulse-outline" onPress={() => app.probeAll()} />
              <Quick title="Console" icon="terminal-outline" onPress={() => app.send('test konektor')} />
            </View>
          }
          ListEmptyComponent={<Empty icon="git-network-outline" title="Belum ada konektor" body="Tambah GitHub PAT, Vercel, GitLab, VPS…" />}
          renderItem={({ item }) => {
            const p = getPlatform(item.type);
            const st = item.status === 'ok' ? colors.green : item.status === 'error' ? colors.coral : colors.textDim;
            return (
              <Pressable onPress={() => openEdit(item)} onLongPress={() => {
                Alert.alert(item.name, undefined, [
                  { text: 'Batal', style: 'cancel' },
                  { text: 'Probe', onPress: () => app.probeConnector(item.id) },
                  { text: 'Hapus', style: 'destructive', onPress: () => app.removeConnector(item.id) },
                ]);
              }} style={styles.card}>
                <View style={[styles.picon, { backgroundColor: `${p.color}22` }]}>
                  <Ionicons name={p.icon} size={18} color={p.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.row}>
                    <Text style={styles.name}>{item.name}</Text>
                    <View style={[styles.dot, { backgroundColor: st }]} />
                  </View>
                  <Text style={styles.meta} numberOfLines={1}>
                    {p.label}  ·  {item.username || item.target || 'no target'}  ·  {item.tokenId ? 'token●' : 'token○'}
                  </Text>
                  {item.lastMessage ? <Text style={styles.msg} numberOfLines={1}>{item.lastMessage}</Text> : null}
                </View>
                <Switch
                  value={item.enabled}
                  onValueChange={(v) => app.updateConnector(item.id, { enabled: v })}
                  trackColor={{ true: colors.greenDim }}
                  thumbColor={item.enabled ? colors.green : colors.textDim}
                />
              </Pressable>
            );
          }}
        />
      ) : null}

      {tab === 'github' ? (
        <FlatList
          data={filteredRepos}
          keyExtractor={(it) => String(it.id)}
          refreshControl={<RefreshControl refreshing={refreshing || repoBusy} onRefresh={loadRepos} tintColor={colors.green} />}
          contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
          ListHeaderComponent={
            <View>
              <View style={styles.search}>
                <Ionicons name="search" size={16} color={colors.textDim} />
                <TextInput value={q} onChangeText={setQ} placeholder="Filter repo…" placeholderTextColor={colors.textDim} style={styles.searchInput} />
              </View>
              {repoErr ? <Text style={styles.err}>{repoErr}</Text> : null}
              {gh?.username ? <Text style={styles.hint}>signed in as @{gh.username}</Text> : null}
            </View>
          }
          ListEmptyComponent={
            <Empty
              icon="logo-github"
              title={repoBusy ? 'Memuat…' : 'Belum ada repo'}
              body={gh?.tokenId ? 'Tarik untuk refresh, atau periksa scope PAT (repo).' : 'Pasang GitHub PAT di tab Board.'}
            />
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => nav.navigate('RepoDetail', { owner: item.owner.login, repo: item.name })}
              style={styles.card}
            >
              <View style={{ flex: 1 }}>
                <View style={styles.row}>
                  <Text style={styles.name}>{item.full_name}</Text>
                  {item.private ? <Badge text="PRIV" color={colors.amber} /> : <Badge text="PUB" color={colors.green} />}
                </View>
                <Text style={styles.meta} numberOfLines={2}>
                  {item.language || '—'}  ·  ★{item.stargazers_count}  ·  {item.open_issues_count} issues  ·  {formatDate(Date.parse(item.updated_at))}
                </Text>
                {item.description ? <Text style={styles.msg} numberOfLines={2}>{item.description}</Text> : null}
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textDim} />
            </Pressable>
          )}
        />
      ) : null}

      {tab === 'catalog' ? (
        <FlatList
          data={PLATFORMS}
          keyExtractor={(it) => it.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
          renderItem={({ item }) => {
            const linked = app.profile.connectors.some((c) => c.type === item.id);
            return (
              <Pressable onPress={() => addPlatform(item.id)} style={styles.card}>
                <View style={[styles.picon, { backgroundColor: `${item.color}22` }]}>
                  <Ionicons name={item.icon} size={18} color={item.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.row}>
                    <Text style={styles.name}>{item.label}</Text>
                    <Badge text={CATEGORY_LABEL[item.category]} color={item.color} />
                  </View>
                  <Text style={styles.msg}>{item.blurb}</Text>
                  <Text style={styles.meta}>{item.scopes}</Text>
                </View>
                <Text style={{ color: linked ? colors.green : colors.cyan, fontWeight: '800', fontSize: 11 }}>
                  {linked ? 'OPEN' : 'ADD'}
                </Text>
              </Pressable>
            );
          }}
        />
      ) : null}

      <Modal visible={picker} transparent animationType="fade" onRequestClose={() => setPicker(false)}>
        <Pressable style={styles.overlay} onPress={() => setPicker(false)}>
          <Pressable style={styles.sheet} onPress={() => undefined}>
            <Text style={styles.sheetTitle}>Tambah platform</Text>
            <ScrollView style={{ maxHeight: 420 }}>
              {PLATFORMS.map((p) => (
                <Pressable key={p.id} onPress={() => addPlatform(p.id)} style={styles.pick}>
                  <Ionicons name={p.icon} size={18} color={p.color} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{p.label}</Text>
                    <Text style={styles.meta}>{p.blurb}</Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={!!edit} transparent animationType="slide" onRequestClose={() => setEdit(null)}>
        <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {edit ? (
            <View style={styles.sheet}>
              <Text style={styles.sheetTitle}>{getPlatform(edit.type).label}</Text>
              <Text style={styles.meta}>{getPlatform(edit.type).tokenLabel} · {getPlatform(edit.type).scopes}</Text>
              <View style={{ height: 10 }} />
              <Field
                label={edit.type === 'github' ? 'Default repo (owner/name)' : 'Target / URL'}
                value={target}
                onChangeText={setTarget}
                placeholder={getPlatform(edit.type).docs ? 'owner/repo atau URL' : ''}
              />
              <Field
                label={getPlatform(edit.type).tokenLabel}
                value={token}
                onChangeText={setToken}
                placeholder={getPlatform(edit.type).tokenHint}
                secure
              />
              <PrimaryButton title="Simpan & probe" icon="flash-outline" onPress={saveEdit} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 10 }}>
                <Pressable onPress={() => { app.probeConnector(edit.id); }}>
                  <Text style={{ color: colors.cyan, fontWeight: '700' }}>Probe ulang</Text>
                </Pressable>
                <Pressable onPress={() => setEdit(null)}>
                  <Text style={{ color: colors.textMuted, fontWeight: '700' }}>Tutup</Text>
                </Pressable>
              </View>
            </View>
          ) : null}
        </KeyboardAvoidingView>
      </Modal>
    </Screen>
  );
}

function Quick({ title, icon, onPress }: { title: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.quickBtn}>
      <Ionicons name={icon} size={16} color={colors.green} />
      <Text style={styles.quickTxt}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 8, gap: 8 },
  kicker: { color: colors.green, fontSize: 10, fontWeight: '800', letterSpacing: 1.4 },
  title: { color: colors.text, fontSize: 24, fontWeight: '900' },
  sub: { color: colors.textDim, fontSize: 12, marginTop: 2 },
  add: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  iconBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: colors.bgCard,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
  },
  tabs: { flexDirection: 'row', marginHorizontal: 16, backgroundColor: colors.bgCard, borderRadius: 12, padding: 4, borderWidth: 1, borderColor: colors.border },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 9 },
  tabOn: { backgroundColor: colors.bgInput },
  tabTxt: { color: colors.textDim, fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
  tabTxtOn: { color: colors.green },
  quick: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  quickBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingVertical: 10,
  },
  quickTxt: { color: colors.text, fontWeight: '700', fontSize: 12 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.bgCard, borderRadius: 14, borderWidth: 1, borderColor: colors.border,
    padding: 12, marginBottom: 10,
  },
  picon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { flex: 1, color: colors.text, fontWeight: '800', fontSize: 14 },
  meta: { color: colors.textDim, fontSize: 11, marginTop: 3 },
  msg: { color: colors.textMuted, fontSize: 12, marginTop: 4, lineHeight: 16 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  search: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.bgInput,
    borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 12, marginBottom: 10,
  },
  searchInput: { flex: 1, color: colors.text, height: 42 },
  err: { color: colors.coral, fontSize: 12, marginBottom: 8 },
  hint: { color: colors.textDim, fontSize: 11, marginBottom: 10 },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlay },
  sheet: {
    backgroundColor: colors.bgElevated, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 18, borderWidth: 1, borderColor: colors.borderBright, maxHeight: '88%',
  },
  sheetTitle: { color: colors.text, fontWeight: '800', fontSize: 18, marginBottom: 4 },
  pick: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
});
