import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Badge, Btn, Card, EmptyState, Field, IconBtn, Row, ScreenHeader, Scroll, SectionTitle, Segmented, Sheet } from '../components/ui';
import type { NavProps } from '../lib/nav';
import { uid, useStore } from '../lib/store';
import { mono, radius } from '../lib/theme';
import type { RepoAuth, RepoRec } from '../lib/types';

const AUTH_HINT: Record<RepoAuth, string> = {
  PAT: 'Personal access token — disimpan di env profile',
  API: 'API key provider repo (GitHub App / GitLab token)',
  HTTP: 'URL HTTPS dengan kredensial / token di query',
  SSH: 'Kunci SSH privat — dipakai di sandbox Alpine',
};

const blank = (): RepoRec => ({ id: uid('rp'), name: '', url: '', branch: 'main', auth: 'PAT', valid: false });

export function RepositoryScreen() {
  const { state, theme: t, setState, pushLog } = useStore();
  const nav = useNavigation<NavProps<'Repos'>['navigation']>();
  const [draft, setDraft] = useState<RepoRec | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [checking, setChecking] = useState<string | null>(null);

  const save = () => {
    if (!draft) return;
    const clean: RepoRec = {
      ...draft,
      name: draft.name.trim() || draft.url.split('/').pop()?.replace('.git', '') || 'repo',
      url: draft.url.trim(),
      branch: draft.branch.trim() || 'main',
    };
    setState((s) => ({ ...s, repos: isNew ? [...s.repos, clean] : s.repos.map((r) => (r.id === clean.id ? clean : r)) }));
    pushLog('ok', 'repo', `${isNew ? 'repo ditambahkan' : 'repo diperbarui'}: ${clean.name} (${clean.auth})`);
    setDraft(null);
  };

  const validate = (r: RepoRec) => {
    setChecking(r.id);
    pushLog('info', 'repo', `validasi ${r.name} via ${r.auth}…`);
    setTimeout(() => {
      const ok = r.url.trim().length > 8;
      setState((s) => ({ ...s, repos: s.repos.map((x) => (x.id === r.id ? { ...x, valid: ok, lastCheck: Date.now() } : x)) }));
      pushLog(ok ? 'ok' : 'error', 'repo', ok ? `${r.name} valid · ${r.auth} · branch ${r.branch}` : `${r.name} gagal: url tidak valid`);
      setChecking(null);
    }, 900);
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <ScreenHeader
        title="Repository"
        subtitle="GitHub / GitLab setelah terhubung & divalidasi"
        onBack={() => nav.goBack()}
        right={<IconBtn name="plus" onPress={() => { setIsNew(true); setDraft(blank()); }} />}
      />
      <Scroll>
        <Text style={{ color: t.textDim, fontSize: 13, lineHeight: 19 }}>
          Repo yang valid bisa di-pin ke profil orchestrator dan dibaca agent lewat connector GitHub atau sandbox.
        </Text>

        <View>
          <SectionTitle
            text={`Daftar repo · ${state.repos.length}`}
            right={<Btn label="Tambah" icon="plus" size="sm" variant="soft" onPress={() => { setIsNew(true); setDraft(blank()); }} />}
          />
          {state.repos.length === 0 ? (
            <Card>
              <EmptyState icon="source-repository" title="Belum ada repo" body="Tambahkan repo lalu validasi dengan PAT, API, HTTP, atau SSH." actionLabel="Tambah repo" onAction={() => { setIsNew(true); setDraft(blank()); }} />
            </Card>
          ) : (
            <View style={{ gap: 10 }}>
              {state.repos.map((r) => (
                <Card key={r.id}>
                  <Row gap={10}>
                    <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: t.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
                      <MaterialCommunityIcons name="github" size={19} color={t.text} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Row gap={6}>
                        <Text style={{ color: t.text, fontSize: 14.5, fontWeight: '800', fontFamily: mono }} numberOfLines={1}>
                          {r.name}
                        </Text>
                        <Badge label={r.auth} tone="info" />
                      </Row>
                      <Text style={{ fontFamily: mono, fontSize: 11, color: t.textFaint, marginTop: 2 }} numberOfLines={1}>
                        {r.url}
                      </Text>
                    </View>
                    <MaterialCommunityIcons
                      name={r.valid ? 'check-decagram' : 'alert-circle-outline'}
                      size={19}
                      color={r.valid ? t.ok : t.warn}
                    />
                  </Row>

                  <Row gap={8} style={{ marginTop: 10 }}>
                    <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: t.surfaceAlt }}>
                      <Text style={{ fontFamily: mono, fontSize: 10.5, color: t.textDim }}>{r.branch}</Text>
                    </View>
                    <Text style={{ flex: 1, color: t.textFaint, fontSize: 11 }} numberOfLines={1}>
                      {r.lastCheck ? `cek terakhir ${new Date(r.lastCheck).toLocaleString('id-ID')}` : 'belum pernah divalidasi'}
                    </Text>
                  </Row>

                  <Row gap={8} style={{ marginTop: 11 }}>
                    <Btn
                      label={checking === r.id ? 'Memvalidasi…' : r.valid ? 'Validasi ulang' : 'Validasi'}
                      icon="shield-check"
                      size="sm"
                      variant={r.valid ? 'outline' : 'primary'}
                      loading={checking === r.id}
                      onPress={() => validate(r)}
                    />
                    <Btn label="Edit" icon="pencil" size="sm" variant="soft" onPress={() => { setIsNew(false); setDraft({ ...r }); }} />
                    <View style={{ flex: 1 }} />
                    <IconBtn
                      name="trash-can-outline"
                      size={18}
                      onPress={() => {
                        setState((s) => ({ ...s, repos: s.repos.filter((x) => x.id !== r.id) }));
                        pushLog('warn', 'repo', `repo dihapus: ${r.name}`);
                      }}
                    />
                  </Row>
                </Card>
              ))}
            </View>
          )}
        </View>
      </Scroll>

      <Sheet
        visible={!!draft}
        onClose={() => setDraft(null)}
        title={isNew ? 'Tambah repository' : 'Edit repository'}
        footer={
          <>
            <Btn label="Batal" variant="ghost" style={{ flex: 1 }} onPress={() => setDraft(null)} />
            <Btn label="Simpan" variant="primary" style={{ flex: 2 }} disabled={!draft?.url.trim()} onPress={save} />
          </>
        }
      >
        {draft ? (
          <>
            <Field label="Nama" value={draft.name} onChangeText={(v) => setDraft({ ...draft, name: v })} placeholder="SimonSchubert/Kai" />
            <Field label="URL" value={draft.url} onChangeText={(v) => setDraft({ ...draft, url: v })} placeholder="git@github.com:owner/repo.git" autoCapitalize="none" />
            <Field label="Branch" value={draft.branch} onChangeText={(v) => setDraft({ ...draft, branch: v })} placeholder="main" autoCapitalize="none" />
            <View style={{ gap: 8 }}>
              <Text style={{ color: t.textDim, fontSize: 11.5, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase' }}>Metode autentikasi</Text>
              <Segmented
                value={draft.auth}
                onChange={(v) => setDraft({ ...draft, auth: v as RepoAuth })}
                options={[
                  { label: 'PAT', value: 'PAT' },
                  { label: 'API', value: 'API' },
                  { label: 'HTTP', value: 'HTTP' },
                  { label: 'SSH', value: 'SSH' },
                ]}
              />
              <Text style={{ color: t.textFaint, fontSize: 12, lineHeight: 17 }}>{AUTH_HINT[draft.auth]}</Text>
            </View>
          </>
        ) : null}
      </Sheet>
    </View>
  );
}
