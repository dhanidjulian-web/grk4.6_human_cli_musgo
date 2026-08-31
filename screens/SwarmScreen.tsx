import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Badge, Btn, Card, Chip, EmptyState, Field, IconBtn, Row, SectionTitle, Sheet } from '../components/ui';
import { activeProfile, uid, useStore } from '../lib/store';
import { mono, radius } from '../lib/theme';
import type { AgentRec, AgentStatus, Profile } from '../lib/types';

const STATUS_TONE: Record<AgentStatus, 'ok' | 'warn' | 'dim' | 'danger'> = {
  done: 'ok',
  running: 'warn',
  idle: 'dim',
  error: 'danger',
};

function modelOptions(state: ReturnType<typeof useStore>['state']): string[] {
  const set = new Set<string>(['auto']);
  state.keys.filter((k) => k.enabled).forEach((k) => k.models.forEach((m) => set.add(m)));
  return Array.from(set).slice(0, 16);
}

export function SwarmScreen() {
  const { state, theme: t, setState, pushLog } = useStore();
  const profile = activeProfile(state);
  const [sheet, setSheet] = useState<AgentRec | null>(null);
  const [isNew, setIsNew] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [runningAll, setRunningAll] = useState(false);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const patchProfile = (fn: (p: Profile) => Profile) => {
    setState((s) => ({ ...s, profiles: s.profiles.map((p) => (p.id === profile.id ? fn(p) : p)) }));
  };

  const setStatus = (agentId: string, status: AgentStatus) =>
    patchProfile((p) => ({ ...p, swarm: p.swarm.map((a) => (a.id === agentId ? { ...a, status } : a)) }));

  const dispatch = () => {
    if (!profile.swarm.length) return;
    setRunningAll(true);
    pushLog('info', 'swarm', `dispatch ${profile.swarm.length} agent · profile ${profile.name}`);
    profile.swarm.forEach((a, i) => {
      const start = setTimeout(() => {
        setStatus(a.id, 'running');
        pushLog('tool', 'swarm', `▶ ${a.name} · ${a.model} — ${a.task}`);
      }, i * 650);
      const end = setTimeout(
        () => {
          setStatus(a.id, 'done');
          pushLog('ok', 'swarm', `✔ ${a.name} selesai · ${120 + Math.floor(Math.random() * 700)} tok`);
          if (i === profile.swarm.length - 1) setRunningAll(false);
        },
        i * 650 + 2600 + Math.random() * 1600,
      );
      timers.current.push(start, end);
    });
  };

  const halt = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    profile.swarm.forEach((a) => setStatus(a.id, 'idle'));
    setRunningAll(false);
    pushLog('warn', 'swarm', 'semua agent dihentikan');
  };

  const openNew = () => {
    setIsNew(true);
    setSheet({ id: uid('ag'), name: '', task: '', prompt: '', model: 'auto', status: 'idle' });
  };

  const openEdit = (a: AgentRec) => {
    setIsNew(false);
    setSheet({ ...a });
  };

  const saveAgent = () => {
    if (!sheet) return;
    const clean: AgentRec = { ...sheet, name: sheet.name.trim() || 'agent', task: sheet.task.trim() || 'tanpa task' };
    patchProfile((p) => ({
      ...p,
      swarm: isNew ? [...p.swarm, clean].slice(0, 30) : p.swarm.map((a) => (a.id === clean.id ? clean : a)),
    }));
    pushLog('ok', 'swarm', `${isNew ? 'agent ditambahkan' : 'agent diperbarui'}: ${clean.name} (${clean.model})`);
    setSheet(null);
  };

  const removeAgent = (id: string, name: string) => {
    patchProfile((p) => ({ ...p, swarm: p.swarm.filter((a) => a.id !== id) }));
    pushLog('warn', 'swarm', `agent dihapus: ${name}`);
  };

  const doneCount = profile.swarm.filter((a) => a.status === 'done').length;
  const models = modelOptions(state);

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 14 }}>
        <View>
          <Text style={{ color: t.text, fontSize: 22, fontWeight: '900' }}>Agent Swarm</Text>
          <Text style={{ color: t.textDim, fontSize: 13, marginTop: 3 }}>Maksimal 30 agent per profil · tiap agent punya task, prompt, dan pilihan model.</Text>
        </View>

        {/* profile picker */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {state.profiles.map((p) => (
            <Chip key={p.id} label={`${p.name} · ${p.swarm.length}`} selected={p.id === profile.id} onPress={() => setState((s) => ({ ...s, activeProfileId: p.id }))} />
          ))}
        </ScrollView>

        <Card>
          <Row>
            <View style={{ flex: 1 }}>
              <Text style={{ color: t.textDim, fontSize: 11, fontWeight: '800', letterSpacing: 0.8 }}>PROGRES RUN</Text>
              <Text style={{ color: t.text, fontSize: 14, fontWeight: '700', marginTop: 3 }}>
                {doneCount}/{profile.swarm.length} agent selesai
              </Text>
            </View>
            {runningAll ? (
              <Btn label="Halt" icon="stop" variant="danger" size="sm" onPress={halt} />
            ) : (
              <Btn label="Dispatch" icon="play" variant="primary" size="sm" disabled={!profile.swarm.length} onPress={dispatch} />
            )}
          </Row>
        </Card>

        <View>
          <SectionTitle
            text={`Agents · ${profile.swarm.length}/30`}
            right={<Btn label="Tambah" icon="plus" size="sm" variant="soft" disabled={profile.swarm.length >= 30} onPress={openNew} />}
          />
          {profile.swarm.length === 0 ? (
            <Card>
              <EmptyState icon="sitemap" title="Belum ada agent" body="Tambahkan agent planner, coder, verifier — atau biarkan workflow yang menugaskan mereka." actionLabel="Tambah agent" onAction={openNew} />
            </Card>
          ) : (
            <View style={{ gap: 10 }}>
              {profile.swarm.map((a, idx) => (
                <Card key={a.id}>
                  <Row gap={10}>
                    <View
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 12,
                        backgroundColor: t.surfaceAlt,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ fontFamily: mono, fontSize: 12, color: t.textDim }}>{String(idx + 1).padStart(2, '0')}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Row gap={6}>
                        <Text style={{ color: t.text, fontSize: 14.5, fontWeight: '800' }}>{a.name}</Text>
                        <Badge label={a.status} tone={STATUS_TONE[a.status]} />
                      </Row>
                      <Text style={{ color: t.textDim, fontSize: 12.5, marginTop: 2 }} numberOfLines={2}>
                        {a.task}
                      </Text>
                    </View>
                    <IconBtn name="pencil" size={17} onPress={() => openEdit(a)} />
                    <IconBtn name="trash-can-outline" size={17} onPress={() => removeAgent(a.id, a.name)} />
                  </Row>
                  {a.prompt ? (
                    <Text style={{ fontFamily: mono, fontSize: 11, color: t.textFaint, marginTop: 8, lineHeight: 16 }} numberOfLines={2}>
                      “{a.prompt}”
                    </Text>
                  ) : null}
                  <Row gap={6} style={{ marginTop: 8 }}>
                    <Chip label={a.model === 'auto' ? 'auto · best' : a.model} icon="chip" selected />
                    <Chip label={a.status === 'running' ? 'berjalan' : a.status === 'done' ? 'selesai' : 'siap'} />
                  </Row>
                </Card>
              ))}
            </View>
          )}
        </View>

        <View>
          <SectionTitle text="Workflow profile" />
          <Card>
            <View style={{ gap: 12 }}>
              {profile.workflow.map((w, i) => (
                <View key={w.id} style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ alignItems: 'center', width: 22 }}>
                    <View style={{ width: 22, height: 22, borderRadius: 8, backgroundColor: t.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: t.accent, fontSize: 10.5, fontWeight: '800' }}>{i + 1}</Text>
                    </View>
                    {i < profile.workflow.length - 1 ? <View style={{ flex: 1, width: 1, backgroundColor: t.border, marginTop: 4 }} /> : null}
                  </View>
                  <View style={{ flex: 1, paddingBottom: 2 }}>
                    <Text style={{ color: t.text, fontSize: 13.5, fontWeight: '700' }}>{w.title}</Text>
                    <Text style={{ color: t.textDim, fontSize: 12.5, marginTop: 1 }}>{w.detail}</Text>
                  </View>
                </View>
              ))}
            </View>
          </Card>
        </View>

        <View>
          <SectionTitle text="Konteks profile" />
          <Card>
            <Text style={{ color: t.textDim, fontSize: 11, fontWeight: '800', letterSpacing: 0.6 }}>SKILLS</Text>
            <Row style={{ flexWrap: 'wrap', marginTop: 7, gap: 6, rowGap: 6 }} align="flex-start">
              {profile.skills.map((s) => (
                <Chip key={s} label={s} icon="puzzle" selected={false} />
              ))}
            </Row>
            <View style={{ height: 12 }} />
            <Text style={{ color: t.textDim, fontSize: 11, fontWeight: '800', letterSpacing: 0.6 }}>REPOS PINNED</Text>
            <View style={{ marginTop: 7, gap: 6 }}>
              {profile.pinnedRepos.map((rid) => {
                const repo = state.repos.find((r) => r.id === rid);
                return (
                  <Row key={rid} gap={7}>
                    <MaterialCommunityIcons name="source-branch" size={14} color={t.info} />
                    <Text style={{ fontFamily: mono, fontSize: 11.5, color: t.textDim, flex: 1 }}>{repo?.name ?? rid}</Text>
                    {repo ? <Badge label={repo.auth} tone={repo.valid ? 'ok' : 'warn'} /> : null}
                  </Row>
                );
              })}
            </View>
            <View style={{ height: 12 }} />
            <Text style={{ color: t.textDim, fontSize: 11, fontWeight: '800', letterSpacing: 0.6 }}>CONNECTORS</Text>
            <View style={{ marginTop: 7, gap: 6 }}>
              {profile.connectors.map((cid) => {
                const c = state.connectors.find((x) => x.id === cid);
                return (
                  <Row key={cid} gap={7}>
                    <MaterialCommunityIcons name="lan-connect" size={14} color={t.accent} />
                    <Text style={{ fontSize: 12.5, color: t.textDim, flex: 1 }}>{c?.name ?? cid}</Text>
                    {c ? <Badge label={c.connected ? 'connected' : 'off'} tone={c.connected ? 'ok' : 'dim'} /> : null}
                  </Row>
                );
              })}
            </View>
          </Card>
        </View>
      </ScrollView>

      <Sheet
        visible={!!sheet}
        onClose={() => setSheet(null)}
        title={isNew ? 'Agent baru' : 'Edit agent'}
        footer={
          <>
            <Btn label="Batal" variant="ghost" style={{ flex: 1 }} onPress={() => setSheet(null)} />
            <Btn label="Simpan" variant="primary" style={{ flex: 2 }} onPress={saveAgent} />
          </>
        }
      >
        {sheet ? (
          <>
            <Field label="Nama agent" value={sheet.name} onChangeText={(v) => setSheet({ ...sheet, name: v })} placeholder="planner" />
            <Field label="Task singkat" value={sheet.task} onChangeText={(v) => setSheet({ ...sheet, task: v })} placeholder="Susun rencana & pecah task" />
            <Field label="Prompt" value={sheet.prompt} onChangeText={(v) => setSheet({ ...sheet, prompt: v })} placeholder="Instruksi singkat untuk agent" multiline maxLength={600} />
            <View style={{ gap: 8 }}>
              <Text style={{ color: t.textDim, fontSize: 11.5, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase' }}>Model / router</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
                {models.map((m) => (
                  <Chip key={m} label={m === 'auto' ? 'auto · best' : m.length > 26 ? m.slice(0, 24) + '…' : m} selected={sheet.model === m} onPress={() => setSheet({ ...sheet, model: m })} />
                ))}
              </View>
            </View>
          </>
        ) : null}
      </Sheet>
    </View>
  );
}
