import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Badge, Btn, Card, EmptyState, IconBtn, Row, ScreenHeader, Scroll, SectionTitle } from '../components/ui';
import type { NavProps } from '../lib/nav';
import { uid, useStore } from '../lib/store';
import { mono, radius } from '../lib/theme';
import type { Profile } from '../lib/types';

export function ProfilesScreen() {
  const { state, theme: t, setState, pushLog } = useStore();
  const nav = useNavigation<NavProps<'Profiles'>['navigation']>();

  const createProfile = () => {
    const p: Profile = {
      id: uid('pf'),
      name: 'Profil baru',
      model: 'auto',
      systemPrompt: '',
      env: [],
      libraries: [],
      skills: [],
      pinnedRepos: [],
      workflow: [{ id: uid('wf'), title: 'Langkah 1', detail: '' }],
      connectors: [],
      swarm: [],
      createdAt: Date.now(),
    };
    setState((s) => ({ ...s, profiles: [...s.profiles, p] }));
    pushLog('ok', 'profile', `profil dibuat: ${p.name}`);
    nav.navigate('ProfileEditor', { id: p.id });
  };

  const duplicate = (p: Profile) => {
    const copy: Profile = {
      ...p,
      id: uid('pf'),
      name: `${p.name} (salinan)`,
      env: p.env.map((e) => ({ ...e, id: uid('ev') })),
      workflow: p.workflow.map((w) => ({ ...w, id: uid('wf') })),
      swarm: p.swarm.map((a) => ({ ...a, id: uid('ag'), status: 'idle' as const })),
      createdAt: Date.now(),
    };
    setState((s) => ({ ...s, profiles: [...s.profiles, copy] }));
    pushLog('ok', 'profile', `profil diduplikasi: ${copy.name}`);
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <ScreenHeader
        title="Orchestrator Profile"
        subtitle="Template yang dipakai model & agent"
        onBack={() => nav.goBack()}
        right={<IconBtn name="plus" onPress={createProfile} />}
      />
      <Scroll>
        <Text style={{ color: t.textDim, fontSize: 13, lineHeight: 19 }}>
          Tiap profil menggabungkan model, prompt (maks 15.000 karakter), environment variable, library, skill, repo pinned, workflow, connector, dan agent swarm.
        </Text>

        <View>
          <SectionTitle text={`Daftar profil · ${state.profiles.length}`} right={<Btn label="Baru" icon="plus" size="sm" variant="soft" onPress={createProfile} />} />
          {state.profiles.length === 0 ? (
            <Card>
              <EmptyState icon="account-star-outline" title="Belum ada profil" body="Buat profil orchestrator pertama untuk mengatur bagaimana agent bekerja." actionLabel="Buat profil" onAction={createProfile} />
            </Card>
          ) : (
            <View style={{ gap: 10 }}>
              {state.profiles.map((p) => {
                const active = p.id === state.activeProfileId;
                return (
                  <Pressable key={p.id} onPress={() => nav.navigate('ProfileEditor', { id: p.id })}>
                    <Card style={active ? { borderColor: t.accent } : undefined}>
                      <Row gap={10}>
                        <View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: t.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
                          <MaterialCommunityIcons name="account-star-outline" size={21} color={t.accent} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Row gap={6}>
                            <Text style={{ color: t.text, fontSize: 15, fontWeight: '800' }} numberOfLines={1}>
                              {p.name}
                            </Text>
                            {active ? <Badge label="aktif" tone="accent" /> : null}
                          </Row>
                          <Text style={{ fontFamily: mono, fontSize: 11, color: t.textFaint, marginTop: 2 }}>
                            model {p.model} · {p.swarm.length} agent · {p.workflow.length} langkah
                          </Text>
                        </View>
                        <IconBtn
                          name={active ? 'star' : 'star-outline'}
                          size={19}
                          color={active ? t.accent : t.textFaint}
                          onPress={() => {
                            setState((s) => ({ ...s, activeProfileId: p.id }));
                            pushLog('info', 'profile', `profil aktif → ${p.name}`);
                          }}
                        />
                      </Row>

                      {p.systemPrompt ? (
                        <Text style={{ color: t.textDim, fontSize: 12.5, lineHeight: 18, marginTop: 9 }} numberOfLines={2}>
                          {p.systemPrompt}
                        </Text>
                      ) : null}

                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                        {[
                          `library ${p.libraries.length}`,
                          `skill ${p.skills.length}`,
                          `repo ${p.pinnedRepos.length}`,
                          `env ${p.env.length}`,
                          `connector ${p.connectors.length}`,
                        ].map((c) => (
                          <View key={c} style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: t.surfaceAlt }}>
                            <Text style={{ fontSize: 10.5, color: t.textDim }}>{c}</Text>
                          </View>
                        ))}
                      </View>

                      <Row gap={8} style={{ marginTop: 11 }}>
                        <Btn label="Edit" icon="pencil" size="sm" variant="soft" onPress={() => nav.navigate('ProfileEditor', { id: p.id })} />
                        <Btn label="Duplikat" icon="content-copy" size="sm" variant="outline" onPress={() => duplicate(p)} />
                        <View style={{ flex: 1 }} />
                        <IconBtn
                          name="trash-can-outline"
                          size={18}
                          onPress={() => {
                            setState((s) => {
                              const rest = s.profiles.filter((x) => x.id !== p.id);
                              return {
                                ...s,
                                profiles: rest,
                                activeProfileId: s.activeProfileId === p.id ? (rest[0]?.id ?? '') : s.activeProfileId,
                              };
                            });
                            pushLog('warn', 'profile', `profil dihapus: ${p.name}`);
                          }}
                        />
                      </Row>
                    </Card>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      </Scroll>
    </View>
  );
}
