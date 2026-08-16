import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../components/Screen';
import { BackHeader } from '../components/BackHeader';
import { Badge, Chip, Empty, Field, PrimaryButton } from '../components/ui';
import { useApp } from '../lib/AppContext';
import { colors } from '../lib/theme';
import { RootStackParamList } from '../lib/navigation';
import {
  github,
  GhCommit,
  GhContent,
  GhIssue,
  GhPull,
  GhRepo,
  GhRun,
  GhWorkflow,
} from '../lib/github';
import { formatDate } from '../lib/id';

type Tab = 'code' | 'issues' | 'prs' | 'ci';

export function RepoDetailScreen({ navigation, route }: NativeStackScreenProps<RootStackParamList, 'RepoDetail'>) {
  const { owner, repo } = route.params;
  const app = useApp();
  const [tab, setTab] = useState<Tab>('code');
  const [meta, setMeta] = useState<GhRepo | null>(null);
  const [tree, setTree] = useState<GhContent[]>([]);
  const [issues, setIssues] = useState<GhIssue[]>([]);
  const [prs, setPrs] = useState<GhPull[]>([]);
  const [runs, setRuns] = useState<GhRun[]>([]);
  const [wfs, setWfs] = useState<GhWorkflow[]>([]);
  const [commits, setCommits] = useState<GhCommit[]>([]);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [issueOpen, setIssueOpen] = useState(false);
  const [ititle, setItitle] = useState('');
  const [ibody, setIbody] = useState('');
  const [fileOpen, setFileOpen] = useState(false);
  const [fpath, setFpath] = useState('docs/HUMANCLI.md');
  const [fbody, setFbody] = useState('# MusGo-OS\n\nCatatan dari Human CLI.\n');
  const [fmsg, setFmsg] = useState('docs: note from Human CLI');

  const token = useCallback(() => app.tokenFor('github'), [app]);

  const load = useCallback(async () => {
    setBusy(true);
    setErr('');
    const tok = (await token()) || undefined;
    const [r, c, cm] = await Promise.all([
      github.repo(tok, owner, repo),
      github.contents(tok, owner, repo, ''),
      github.commits(tok, owner, repo),
    ]);
    if (!r.ok) setErr(r.error || 'gagal memuat repo');
    else setMeta(r.data || null);
    if (c.ok) setTree(Array.isArray(c.data) ? c.data : c.data ? [c.data] : []);
    if (cm.ok) setCommits(cm.data || []);
    setBusy(false);
  }, [owner, repo, token]);

  const loadTab = useCallback(async (t: Tab) => {
    const tok = (await token()) || undefined;
    if (t === 'issues') {
      const r = await github.issues(tok, owner, repo);
      if (r.ok) setIssues((r.data || []).filter((i) => !i.pull_request));
      else setErr(r.error || '');
    }
    if (t === 'prs') {
      const r = await github.pulls(tok, owner, repo);
      if (r.ok) setPrs(r.data || []);
      else setErr(r.error || '');
    }
    if (t === 'ci') {
      const tkn = await token();
      if (!tkn) {
        setErr('PAT diperlukan untuk Actions');
        return;
      }
      const [a, w] = await Promise.all([github.runs(tkn, owner, repo), github.workflows(tkn, owner, repo)]);
      if (a.ok) setRuns(a.data?.workflow_runs || []);
      else setErr(a.error || '');
      if (w.ok) setWfs(w.data?.workflows || []);
    }
  }, [owner, repo, token]);

  useEffect(() => {
    load();
  }, [load]);

  const createIssue = async () => {
    const tok = await token();
    if (!tok || !ititle.trim()) return;
    const r = await github.createIssue(tok, owner, repo, ititle.trim(), ibody);
    if (!r.ok) Alert.alert('Gagal', r.error);
    else {
      setIssueOpen(false);
      setItitle('');
      setIbody('');
      loadTab('issues');
    }
  };

  const commitFile = async () => {
    const tok = await token();
    if (!tok) {
      Alert.alert('PAT diperlukan');
      return;
    }
    const r = await github.putFile(tok, owner, repo, fpath.trim(), fbody, fmsg.trim() || 'chore: Human CLI');
    if (!r.ok) Alert.alert('Gagal commit', r.error);
    else {
      setFileOpen(false);
      load();
      Alert.alert('Tersimpan', fpath);
    }
  };

  const dispatch = async (wf: GhWorkflow) => {
    const tok = await token();
    if (!tok) return;
    const file = wf.path.split('/').pop() || String(wf.id);
    const r = await github.dispatch(tok, owner, repo, file, meta?.default_branch || 'main');
    if (!r.ok) Alert.alert('Dispatch gagal', r.error);
    else {
      Alert.alert('Dispatched', wf.name);
      loadTab('ci');
    }
  };

  const data =
    tab === 'code' ? tree.map((t) => ({ key: t.path, kind: 'file' as const, t })) :
    tab === 'issues' ? issues.map((t) => ({ key: String(t.id), kind: 'issue' as const, t })) :
    tab === 'prs' ? prs.map((t) => ({ key: String(t.id), kind: 'pr' as const, t })) :
    runs.map((t) => ({ key: String(t.id), kind: 'run' as const, t }));

  return (
    <Screen>
      <BackHeader
        title={`${owner}/${repo}`}
        subtitle={meta ? `${meta.default_branch} · ★${meta.stargazers_count} · ${meta.language || '—'}` : 'memuat…'}
        right={
          <Pressable onPress={() => setFileOpen(true)} style={styles.iconBtn}>
            <Ionicons name="cloud-upload-outline" size={18} color={colors.cyan} />
          </Pressable>
        }
      />

      {err ? <Text style={styles.err}>{err}</Text> : null}

      <View style={styles.tabs}>
        {(['code', 'issues', 'prs', 'ci'] as Tab[]).map((t) => (
          <Chip key={t} label={t.toUpperCase()} active={tab === t} onPress={() => { setTab(t); loadTab(t); }} />
        ))}
      </View>

      {tab === 'ci' && wfs.length > 0 ? (
        <ScrollChips items={wfs.map((w) => w.name)} onPress={(i) => dispatch(wfs[i])} />
      ) : null}

      <FlatList
        data={data}
        keyExtractor={(it) => it.key}
        refreshControl={<RefreshControl refreshing={busy} onRefresh={() => { load(); loadTab(tab); }} tintColor={colors.green} />}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        ListHeaderComponent={
          tab === 'code' && commits[0] ? (
            <Text style={styles.commit}>
              {commits[0].sha.slice(0, 7)}  {(commits[0].commit.message || '').split('\n')[0]}  ·  {formatDate(Date.parse(commits[0].commit.author?.date || ''))}
            </Text>
          ) : null
        }
        ListEmptyComponent={<Empty icon="folder-open-outline" title="Kosong" body="Tarik untuk muat ulang, atau pasang PAT." />}
        renderItem={({ item }) => {
          if (item.kind === 'file') {
            const f = item.t;
            return (
              <View style={styles.row}>
                <Ionicons name={f.type === 'dir' ? 'folder-outline' : 'document-text-outline'} size={16} color={colors.cyan} />
                <Text style={styles.rowTxt}>{f.path}</Text>
                <Text style={styles.sz}>{f.size || ''}</Text>
              </View>
            );
          }
          if (item.kind === 'issue') {
            const i = item.t;
            return (
              <View style={styles.card}>
                <Text style={styles.cardT}>#{i.number}  {i.title}</Text>
                <Text style={styles.cardS}>{i.user?.login} · {formatDate(Date.parse(i.created_at))}</Text>
              </View>
            );
          }
          if (item.kind === 'pr') {
            const p = item.t;
            return (
              <View style={styles.card}>
                <Text style={styles.cardT}>#{p.number}  {p.title}</Text>
                <Text style={styles.cardS}>{p.head?.ref} → {p.base?.ref}</Text>
              </View>
            );
          }
          const r = item.t;
          const color = r.conclusion === 'success' ? colors.green : r.conclusion === 'failure' ? colors.coral : colors.amber;
          return (
            <View style={styles.card}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Badge text={(r.conclusion || r.status).toUpperCase()} color={color} />
                <Text style={[styles.cardT, { flex: 1 }]} numberOfLines={1}>{r.name}</Text>
              </View>
              <Text style={styles.cardS}>{r.head_branch} · {r.event} · {formatDate(Date.parse(r.created_at))}</Text>
            </View>
          );
        }}
      />

      {tab === 'issues' ? (
        <Pressable onPress={() => setIssueOpen(true)} style={styles.fab}>
          <Ionicons name="add" size={22} color={colors.bg} />
        </Pressable>
      ) : null}

      <Modal visible={issueOpen} transparent animationType="slide" onRequestClose={() => setIssueOpen(false)}>
        <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.sheet}>
            <Text style={styles.sheetT}>Issue baru</Text>
            <Field label="Judul" value={ititle} onChangeText={setItitle} placeholder="Bug / task" autoCapitalize="sentences" />
            <Field label="Body" value={ibody} onChangeText={setIbody} placeholder="Konteks" multiline />
            <PrimaryButton title="Buat issue" icon="create-outline" onPress={createIssue} />
            <Pressable onPress={() => setIssueOpen(false)} style={{ padding: 12, alignItems: 'center' }}>
              <Text style={{ color: colors.textMuted }}>Batal</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={fileOpen} transparent animationType="slide" onRequestClose={() => setFileOpen(false)}>
        <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.sheet}>
            <Text style={styles.sheetT}>Commit file</Text>
            <Field label="Path" value={fpath} onChangeText={setFpath} placeholder="README.md" />
            <Field label="Commit message" value={fmsg} onChangeText={setFmsg} />
            <Field label="Isi" value={fbody} onChangeText={setFbody} multiline />
            <PrimaryButton title="Commit ke GitHub" icon="git-commit-outline" onPress={commitFile} />
            <Pressable onPress={() => setFileOpen(false)} style={{ padding: 12, alignItems: 'center' }}>
              <Text style={{ color: colors.textMuted }}>Batal</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Screen>
  );
}

function ScrollChips({ items, onPress }: { items: string[]; onPress: (i: number) => void }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 16, paddingTop: 8 }}>
      {items.map((n, i) => (
        <Chip key={n + i} label={`▶ ${n}`} onPress={() => onPress(i)} color={colors.amber} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingBottom: 8 },
  back: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { color: colors.text, fontWeight: '800', fontSize: 16 },
  sub: { color: colors.textDim, fontSize: 11, marginTop: 2 },
  iconBtn: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: colors.bgCard,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginRight: 8,
  },
  err: { color: colors.coral, fontSize: 12, paddingHorizontal: 16, marginBottom: 6 },
  tabs: { flexDirection: 'row', gap: 6, paddingHorizontal: 16 },
  commit: { color: colors.textMuted, fontSize: 12, marginBottom: 12, lineHeight: 17 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  rowTxt: { flex: 1, color: colors.text, fontSize: 13 },
  sz: { color: colors.textDim, fontSize: 11 },
  card: {
    backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border,
    borderRadius: 12, padding: 12, marginBottom: 8,
  },
  cardT: { color: colors.text, fontWeight: '700', fontSize: 13 },
  cardS: { color: colors.textDim, fontSize: 11, marginTop: 4 },
  fab: {
    position: 'absolute', right: 18, bottom: 24, width: 52, height: 52, borderRadius: 26,
    backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center',
  },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlay },
  sheet: {
    backgroundColor: colors.bgElevated, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 18, borderWidth: 1, borderColor: colors.border,
  },
  sheetT: { color: colors.text, fontWeight: '800', fontSize: 16, marginBottom: 10 },
});
