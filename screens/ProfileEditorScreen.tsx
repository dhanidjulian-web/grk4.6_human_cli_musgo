import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Badge, Btn, Card, Chip, EmptyState, Field, IconBtn, Row, ScreenHeader, Scroll, SectionTitle, Sheet } from '../components/ui';
import { LIBRARY_FILES, SKILL_LIBRARY, providerById } from '../lib/providers';
import type { NavProps } from '../lib/nav';
import { uid, useStore } from '../lib/store';
import { mono, radius } from '../lib/theme';
import type { AgentRec, EnvVar, Profile, WorkflowStep } from '../lib/types';

const PROMPT_MAX = 15000;

const clone = (p: Profile): Profile => ({
  ...p,
  env: p.env.map((e) => ({ ...e })),
  workflow: p.workflow.map((w) => ({ ...w })),
  swarm: p.swarm.map((a) => ({ ...a })),
  libraries: [...p.libraries],
  skills: [...p.skills],
  pinnedRepos: [...p.pinnedRepos],
  connectors: [...p.connectors],
});

type SectionKey = 'ident' | 'prompt' | 'env' | 'lib' | 'skill' | 'repo' | 'flow' | 'conn' | 'swarm';

export function ProfileEditorScreen({ route }: NavProps<'ProfileEditor'>) {
  const { id } = route.params;
  const { state, theme: t, setState, pushLog } = useStore();
  const nav = useNavigation<NavProps<'ProfileEditor'>['navigation']>();
  const source = state.profiles.find((p) => p.id === id);
  const [draft, setDraft] = useState<Profile | null>(source ? clone(source) : null);
  const [open, setOpen] = useState<Record<SectionKey, boolean>>({
    ident: true,
    prompt: true,
    env: false,
    lib: false,
    skill: false,
    repo: false,
    flow: false,
    conn: false,
    swarm: false,
  });
  const [agent, setAgent] = useState<AgentRec | null>(null);
  const [isNewAgent, setIsNewAgent] = useState(false);
  const [customLib, setCustomLib] = useState('');

  const models = useMemo(() => {
    const set = new Set<string>(['auto']);
    state.keys.filter((k) => k.enabled).forEach((k) => k.models.forEach((m) => set.add(m)));
    return Array.from(set);
  }, [state.keys]);

  if (!draft) {
    return (
      <View style={{ flex: 1, backgroundColor: t.bg }}>
        <ScreenHeader title="Profil tidak ditemukan" onBack={() => nav.goBack()} />
        <EmptyState icon="alert-circle-outline" title="Profil hilang" body="Profil ini mungkin sudah dihapus. Kembali ke daftar profil." actionLabel="Kembali" onAction={() => nav.goBack()} />
      </View>
    );
  }

  const patch = (fn: (p: Profile) => Profile) => setDraft((d) => (d ? fn(d) : d));

  const toggle = (key: SectionKey) => setOpen((o) => ({ ...o, [key]: !o[key] }));

  const save = () => {
    const clean: Profile = { ...draft, name: draft.name.trim() || 'Profil', systemPrompt: draft.systemPrompt.slice(0, PROMPT_MAX) };
    setState((s) => ({ ...s, profiles: s.profiles.map((p) => (p.id === clean.id ? clean : p)) }));
    pushLog('ok', 'profile', `profil disimpan: ${clean.name} · prompt ${clean.systemPrompt.length} char · ${clean.swarm.length} agent`);
    nav.goBack();
  };

  const Section = ({ k, icon, title, hint, children }: { k: SectionKey; icon: string; title: string; hint: string; children: React.ReactNode }) => (
    <Card>
      <Pressable onPress={() => toggle(k)} style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}>
        <View style={{ width: 34, height: 34, borderRadius: 12, backgroundColor: t.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
          <MaterialCommunityIcons name={icon as never} size={18} color={t.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: t.text, fontSize: 14.5, fontWeight: '800' }}>{title}</Text>
          <Text style={{ color: t.textFaint, fontSize: 11.5, marginTop: 1 }}>{hint}</Text>
        </View>
        <MaterialCommunityIcons name={open[k] ? 'chevron-up' : 'chevron-down'} size={20} color={t.textFaint} />
      </Pressable>
      {open[k] ? <View style={{ marginTop: 13, gap: 11 }}>{children}</View> : null}
    </Card>
  );

  const toggleIn = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <ScreenHeader
        title="Edit profil"
        subtitle={`${draft.swarm.length}/30 agent · ${draft.systemPrompt.length}/${PROMPT_MAX.toLocaleString('id-ID')} karakter prompt`}
        onBack={() => nav.goBack()}
        right={<Btn label="Simpan" icon="content-save" variant="primary" size="sm" onPress={save} />}
      />
      <Scroll>
        {/* identity */}
        <Section k="ident" icon="badge-account-horizontal-outline" title="Identitas & model" hint="Nama profil dan model yang dipakai">
          <Field label="Nama profil" value={draft.name} onChangeText={(v) => patch((p) => ({ ...p, name: v }))} placeholder="Default Orchestrator" />
          <View style={{ gap: 8 }}>
            <Text style={{ color: t.textDim, fontSize: 11.5, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase' }}>Model</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
              <Chip label="auto · best/default sistem" icon="star" selected={draft.model === 'auto'} onPress={() => patch((p) => ({ ...p, model: 'auto' }))} />
              {models.slice(1).map((m) => (
                <Chip key={m} label={m.length > 28 ? m.slice(0, 26) + '…' : m} selected={draft.model === m} onPress={() => patch((p) => ({ ...p, model: m }))} />
              ))}
            </View>
          </View>
        </Section>

        {/* prompt */}
        <Section k="prompt" icon="text-box-edit-outline" title="Prompt" hint={`Maksimal ${PROMPT_MAX.toLocaleString('id-ID')} karakter`}>
          <Field
            label="System prompt"
            value={draft.systemPrompt}
            onChangeText={(v) => patch((p) => ({ ...p, systemPrompt: v.slice(0, PROMPT_MAX) }))}
            placeholder="Kamu adalah orchestrator engineering otonom…"
            multiline
            maxLength={PROMPT_MAX}
            hint={`${draft.systemPrompt.length} char`}
          />
        </Section>

        {/* env */}
        <Section k="env" icon="key-chain" title="Environment variable" hint={`${draft.env.length} entri · pat token, secret`}>
          {draft.env.map((e, i) => (
            <View key={e.id} style={{ gap: 8, backgroundColor: t.surfaceAlt, borderRadius: radius.md, padding: 10 }}>
              <Row gap={8}>
                <Field
                  label={i === 0 ? 'Nama' : undefined}
                  style={{ flex: 1 }}
                  value={e.k}
                  onChangeText={(v) => patch((p) => ({ ...p, env: p.env.map((x) => (x.id === e.id ? { ...x, k: v } : x)) }))}
                  placeholder="GITHUB_PAT"
                  autoCapitalize="none"
                />
                <IconBtn name="trash-can-outline" size={17} onPress={() => patch((p) => ({ ...p, env: p.env.filter((x) => x.id !== e.id) }))} />
              </Row>
              <Field
                label={i === 0 ? 'Nilai' : undefined}
                value={e.v}
                onChangeText={(v) => patch((p) => ({ ...p, env: p.env.map((x) => (x.id === e.id ? { ...x, v } : x)) }))}
                placeholder="ghp_••••"
                secure
                autoCapitalize="none"
              />
            </View>
          ))}
          <Btn
            label="Tambah variabel"
            icon="plus"
            variant="soft"
            size="sm"
            onPress={() => patch((p) => ({ ...p, env: [...p.env, { id: uid('ev'), k: '', v: '' } as EnvVar] }))}
          />
        </Section>

        {/* library */}
        <Section k="lib" icon="folder-multiple-outline" title="Library" hint={`${draft.libraries.length} file / daftar terpilih`}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
            {LIBRARY_FILES.map((f) => (
              <Chip key={f} label={f} icon="file-document-outline" selected={draft.libraries.includes(f)} onPress={() => patch((p) => ({ ...p, libraries: toggleIn(p.libraries, f) }))} />
            ))}
          </View>
          <Row gap={8}>
            <Field style={{ flex: 1 }} label="File khusus" value={customLib} onChangeText={setCustomLib} placeholder="src/agents/router.ts" autoCapitalize="none" />
            <Btn
              label="Tambah"
              size="sm"
              variant="outline"
              style={{ marginTop: 18 }}
              onPress={() => {
                const v = customLib.trim();
                if (!v) return;
                patch((p) => ({ ...p, libraries: Array.from(new Set([...p.libraries, v])) }));
                setCustomLib('');
              }}
            />
          </Row>
        </Section>

        {/* skills */}
        <Section k="skill" icon="puzzle-outline" title="Skill" hint={`${draft.skills.length} skill dari library`}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
            {SKILL_LIBRARY.map((s) => (
              <Chip key={s} label={s} selected={draft.skills.includes(s)} onPress={() => patch((p) => ({ ...p, skills: toggleIn(p.skills, s) }))} />
            ))}
          </View>
        </Section>

        {/* repos */}
        <Section k="repo" icon="pin-outline" title="Repository pinned" hint={`${draft.pinnedRepos.length} repo terpilih`}>
          {state.repos.length === 0 ? (
            <Text style={{ color: t.textFaint, fontSize: 12.5 }}>Belum ada repo — tambahkan di Settings → Repository.</Text>
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
              {state.repos.map((r) => (
                <Chip key={r.id} label={r.name} icon="source-branch" selected={draft.pinnedRepos.includes(r.id)} onPress={() => patch((p) => ({ ...p, pinnedRepos: toggleIn(p.pinnedRepos, r.id) }))} />
              ))}
            </View>
          )}
        </Section>

        {/* workflow */}
        <Section k="flow" icon="workflow" title="Workflow" hint={`${draft.workflow.length} langkah urut`}>
          {draft.workflow.map((w, i) => (
            <View key={w.id} style={{ gap: 8, backgroundColor: t.surfaceAlt, borderRadius: radius.md, padding: 10 }}>
              <Row gap={8}>
                <View style={{ width: 22, height: 22, borderRadius: 8, backgroundColor: t.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: t.accent, fontSize: 10.5, fontWeight: '800' }}>{i + 1}</Text>
                </View>
                <Field
                  style={{ flex: 1 }}
                  label={i === 0 ? 'Judul langkah' : undefined}
                  value={w.title}
                  onChangeText={(v) => patch((p) => ({ ...p, workflow: p.workflow.map((x) => (x.id === w.id ? { ...x, title: v } : x)) }))}
                  placeholder="Rencana"
                />
                <IconBtn name="trash-can-outline" size={17} onPress={() => patch((p) => ({ ...p, workflow: p.workflow.filter((x) => x.id !== w.id) }))} />
              </Row>
              <Field
                label={i === 0 ? 'Detail' : undefined}
                value={w.detail}
                onChangeText={(v) => patch((p) => ({ ...p, workflow: p.workflow.map((x) => (x.id === w.id ? { ...x, detail: v } : x)) }))}
                placeholder="Apa yang dilakukan langkah ini"
                multiline
              />
            </View>
          ))}
          <Btn
            label="Tambah langkah"
            icon="plus"
            variant="soft"
            size="sm"
            onPress={() => patch((p) => ({ ...p, workflow: [...p.workflow, { id: uid('wf'), title: `Langkah ${p.workflow.length + 1}`, detail: '' } as WorkflowStep] }))}
          />
        </Section>

        {/* connectors */}
        <Section k="conn" icon="lan-connect" title="Connector" hint={`${draft.connectors.length} connector untuk eksekusi`}>
          {state.connectors.length === 0 ? (
            <Text style={{ color: t.textFaint, fontSize: 12.5 }}>Belum ada connector.</Text>
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
              {state.connectors.map((c) => (
                <Chip
                  key={c.id}
                  label={`${c.name}${c.connected ? '' : ' · off'}`}
                  selected={draft.connectors.includes(c.id)}
                  onPress={() => patch((p) => ({ ...p, connectors: toggleIn(p.connectors, c.id) }))}
                />
              ))}
            </View>
          )}
        </Section>

        {/* swarm */}
        <Section k="swarm" icon="sitemap" title="Agent Swarm" hint={`${draft.swarm.length}/30 agent`}>
          {draft.swarm.length === 0 ? (
            <Text style={{ color: t.textFaint, fontSize: 12.5 }}>Belum ada agent. Tambahkan planner, coder, verifier, dll.</Text>
          ) : (
            <View style={{ gap: 8 }}>
              {draft.swarm.map((a, i) => (
                <Pressable
                  key={a.id}
                  onPress={() => { setIsNewAgent(false); setAgent({ ...a }); }}
                  style={{ backgroundColor: t.surfaceAlt, borderRadius: radius.md, borderWidth: 1, borderColor: t.border, padding: 10 }}
                >
                  <Row gap={8}>
                    <Text style={{ fontFamily: mono, fontSize: 11, color: t.textFaint, width: 20 }}>{String(i + 1).padStart(2, '0')}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: t.text, fontSize: 13.5, fontWeight: '700' }}>{a.name}</Text>
                      <Text style={{ color: t.textDim, fontSize: 12, marginTop: 1 }} numberOfLines={1}>
                        {a.task}
                      </Text>
                    </View>
                    <Badge label={a.model === 'auto' ? 'auto' : a.model.split('/').pop() ?? a.model} tone="info" />
                    <IconBtn name="trash-can-outline" size={16} onPress={() => patch((p) => ({ ...p, swarm: p.swarm.filter((x) => x.id !== a.id) }))} />
                  </Row>
                </Pressable>
              ))}
            </View>
          )}
          <Btn
            label={draft.swarm.length >= 30 ? 'Limit 30 agent tercapai' : 'Tambah agent'}
            icon="plus"
            variant="soft"
            size="sm"
            disabled={draft.swarm.length >= 30}
            onPress={() => { setIsNewAgent(true); setAgent({ id: uid('ag'), name: '', task: '', prompt: '', model: 'auto', status: 'idle' }); }}
          />
        </Section>

        <Text style={{ color: t.textFaint, fontSize: 11.5, textAlign: 'center', fontFamily: mono, marginTop: 4 }}>
          profile id · {draft.id}
        </Text>
      </Scroll>

      <Sheet
        visible={!!agent}
        onClose={() => setAgent(null)}
        title={isNewAgent ? 'Agent baru' : 'Edit agent'}
        footer={
          <>
            <Btn label="Batal" variant="ghost" style={{ flex: 1 }} onPress={() => setAgent(null)} />
            <Btn
              label="Simpan agent"
              variant="primary"
              style={{ flex: 2 }}
              onPress={() => {
                if (!agent) return;
                const clean: AgentRec = { ...agent, name: agent.name.trim() || 'agent', task: agent.task.trim() || 'tanpa task' };
                patch((p) => ({ ...p, swarm: isNewAgent ? [...p.swarm, clean] : p.swarm.map((x) => (x.id === clean.id ? clean : x)) }));
                setAgent(null);
              }}
            />
          </>
        }
      >
        {agent ? (
          <>
            <Field label="Nama" value={agent.name} onChangeText={(v) => setAgent({ ...agent, name: v })} placeholder="planner" />
            <Field label="Task" value={agent.task} onChangeText={(v) => setAgent({ ...agent, task: v })} placeholder="Susun rencana" />
            <Field label="Prompt singkat" value={agent.prompt} onChangeText={(v) => setAgent({ ...agent, prompt: v })} placeholder="Instruksi ringkas" multiline maxLength={400} />
            <View style={{ gap: 8 }}>
              <Text style={{ color: t.textDim, fontSize: 11.5, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase' }}>Model / router</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
                {models.map((m) => (
                  <Chip key={m} label={m === 'auto' ? 'auto' : m.length > 26 ? m.slice(0, 24) + '…' : m} selected={agent.model === m} onPress={() => setAgent({ ...agent, model: m })} />
                ))}
              </View>
            </View>
          </>
        ) : null}
      </Sheet>
    </View>
  );
}
