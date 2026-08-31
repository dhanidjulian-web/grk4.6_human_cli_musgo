import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import React, { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { Badge, Btn, Card, Chip, EmptyState, Field, IconBtn, Row, ScreenHeader, Scroll, SectionTitle, Sheet, Toggle } from '../components/ui';
import { PROVIDERS, providerById } from '../lib/providers';
import type { NavProps } from '../lib/nav';
import { maskSecret } from '../lib/sim';
import { uid, useStore } from '../lib/store';
import { mono, radius } from '../lib/theme';
import type { ApiKeyRec } from '../lib/types';

const blank = (): ApiKeyRec => ({
  id: uid('k'),
  providerId: 'openrouter',
  label: '',
  secret: '',
  enabled: true,
  models: [],
  createdAt: Date.now(),
  lastTest: null,
});

export function ByokScreen() {
  const { state, theme: t, setState, pushLog } = useStore();
  const nav = useNavigation<NavProps<'Byok'>['navigation']>();
  const [draft, setDraft] = useState<ApiKeyRec | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');

  const provider = draft ? providerById(draft.providerId) : undefined;
  const list = useMemo(() => (filter === 'all' ? state.keys : state.keys.filter((k) => k.providerId === filter)), [state.keys, filter]);

  const openNew = () => {
    setIsNew(true);
    setDraft(blank());
  };

  const save = () => {
    if (!draft) return;
    const clean: ApiKeyRec = {
      ...draft,
      label: draft.label.trim() || providerById(draft.providerId)?.name || 'key',
      secret: draft.secret.trim(),
      models: draft.models.length ? draft.models : (providerById(draft.providerId)?.models.slice(0, 2) ?? []),
    };
    setState((s) => ({ ...s, keys: isNew ? [...s.keys, clean] : s.keys.map((k) => (k.id === clean.id ? clean : k)) }));
    pushLog('ok', 'byok', `${isNew ? 'key ditambahkan' : 'key diperbarui'}: ${clean.providerId}/${clean.label} · ${clean.models.length} model`);
    setDraft(null);
  };

  const test = (k: ApiKeyRec) => {
    setTesting(k.id);
    pushLog('info', 'byok', `uji kunci ${k.providerId}/${k.label}…`);
    setTimeout(() => {
      const ok = k.secret.trim().length >= 8;
      const ms = 120 + Math.floor(Math.random() * 320);
      setState((s) => ({ ...s, keys: s.keys.map((x) => (x.id === k.id ? { ...x, lastTest: { ok, ms, at: Date.now() } } : x)) }));
      pushLog(ok ? 'ok' : 'error', 'byok', ok ? `${k.label} valid · ${ms} ms · ${k.models.length} model tersedia` : `${k.label} ditolak (401) — panjang key minimal 8 karakter`);
      setTesting(null);
    }, 850);
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <ScreenHeader
        title="BYOK"
        subtitle="Multi API key provider free-freemium"
        onBack={() => nav.goBack()}
        right={<IconBtn name="plus" onPress={openNew} />}
      />
      <Scroll>
        <Text style={{ color: t.textDim, fontSize: 13, lineHeight: 19 }}>
          Simpan sebanyak mungkin key dari provider gratis/freemium. Router akan memakainya secara manual atau berputar (autoroute).
        </Text>

        <View>
          <SectionTitle
            text="Provider"
            right={<Btn label="Tambah key" icon="plus" size="sm" variant="soft" onPress={openNew} />}
          />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
            <Chip label={`semua · ${state.keys.length}`} selected={filter === 'all'} onPress={() => setFilter('all')} />
            {PROVIDERS.map((p) => {
              const count = state.keys.filter((k) => k.providerId === p.id).length;
              return <Chip key={p.id} label={`${p.name}${count ? ` · ${count}` : ''}`} selected={filter === p.id} onPress={() => setFilter(p.id)} />;
            })}
          </View>
        </View>

        <View>
          <SectionTitle text={`Keys · ${list.length}`} right={<Badge label={`${state.keys.filter((k) => k.enabled).length} aktif`} tone="ok" />} />
          {list.length === 0 ? (
            <Card>
              <EmptyState icon="key-variant" title="Belum ada key di sini" body="Tambahkan key OpenRouter, Gemini, Mistral, Groq, NVIDIA, Qwen, dll. Semua tersimpan lokal." actionLabel="Tambah key" onAction={openNew} />
            </Card>
          ) : (
            <View style={{ gap: 10 }}>
              {list.map((k) => {
                const p = providerById(k.providerId);
                return (
                  <Card key={k.id}>
                    <Row gap={10}>
                      <View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: (p?.tint ?? t.accent) + '1F', alignItems: 'center', justifyContent: 'center' }}>
                        <MaterialCommunityIcons name={(p?.icon ?? 'chip') as never} size={21} color={p?.tint ?? t.accent} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Row gap={6}>
                          <Text style={{ color: t.text, fontSize: 14.5, fontWeight: '800' }} numberOfLines={1}>
                            {k.label}
                          </Text>
                          <Badge label={k.enabled ? 'on' : 'off'} tone={k.enabled ? 'ok' : 'dim'} />
                        </Row>
                        <Text style={{ fontFamily: mono, fontSize: 11, color: t.textFaint, marginTop: 2 }} numberOfLines={1}>
                          {p?.name} · {maskSecret(k.secret)}
                        </Text>
                      </View>
                      <Toggle
                        value={k.enabled}
                        onValueChange={(v) => {
                          setState((s) => ({ ...s, keys: s.keys.map((x) => (x.id === k.id ? { ...x, enabled: v } : x)) }));
                          pushLog('info', 'byok', `${k.label} ${v ? 'diaktifkan' : 'dinonaktifkan'}`);
                        }}
                      />
                    </Row>

                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                      {k.models.map((m) => (
                        <View key={m} style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: t.surfaceAlt }}>
                          <Text style={{ fontFamily: mono, fontSize: 10.5, color: t.textDim }}>{m.length > 32 ? m.slice(0, 30) + '…' : m}</Text>
                        </View>
                      ))}
                    </View>

                    <Row gap={8} style={{ marginTop: 11 }}>
                      <Btn label={testing === k.id ? 'Menguji…' : k.lastTest ? (k.lastTest.ok ? `Valid · ${k.lastTest.ms}ms` : 'Gagal (401)') : 'Uji kunci'} icon="flask" size="sm" variant="outline" loading={testing === k.id} onPress={() => test(k)} />
                      <Btn label="Edit" icon="pencil" size="sm" variant="soft" onPress={() => { setIsNew(false); setDraft({ ...k }); }} />
                      <View style={{ flex: 1 }} />
                      <IconBtn
                        name="trash-can-outline"
                        size={18}
                        onPress={() => {
                          setState((s) => ({ ...s, keys: s.keys.filter((x) => x.id !== k.id) }));
                          pushLog('warn', 'byok', `key dihapus: ${k.label}`);
                        }}
                      />
                    </Row>
                  </Card>
                );
              })}
            </View>
          )}
        </View>
      </Scroll>

      <Sheet
        visible={!!draft}
        onClose={() => setDraft(null)}
        title={isNew ? 'Tambah API key' : 'Edit API key'}
        footer={
          <>
            <Btn label="Batal" variant="ghost" style={{ flex: 1 }} onPress={() => setDraft(null)} />
            <Btn label="Simpan" variant="primary" style={{ flex: 2 }} disabled={!draft?.secret.trim()} onPress={save} />
          </>
        }
      >
        {draft ? (
          <>
            <View style={{ gap: 8 }}>
              <Text style={{ color: t.textDim, fontSize: 11.5, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase' }}>Provider</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
                {PROVIDERS.map((p) => (
                  <Chip
                    key={p.id}
                    label={p.name}
                    icon={p.icon}
                    selected={draft.providerId === p.id}
                    onPress={() => setDraft({ ...draft, providerId: p.id, models: [] })}
                  />
                ))}
              </View>
            </View>

            {provider ? (
              <Card>
                <Row gap={8}>
                  <Badge label={provider.tier} tone={provider.tier === 'free' ? 'ok' : 'warn'} />
                  <Text style={{ flex: 1, color: t.textDim, fontSize: 12 }}>{provider.blurb}</Text>
                </Row>
                <Text style={{ fontFamily: mono, fontSize: 11, color: t.textFaint, marginTop: 8 }}>env: {provider.envPrefix} · {provider.docs}</Text>
              </Card>
            ) : null}

            <Field label="Label" value={draft.label} onChangeText={(v) => setDraft({ ...draft, label: v })} placeholder={provider ? `${provider.id}-key-1` : 'label'} />
            <Field
              label="Secret key"
              value={draft.secret}
              onChangeText={(v) => setDraft({ ...draft, secret: v })}
              placeholder={provider?.placeholder ?? 'api key'}
              secure
              autoCapitalize="none"
              hint={provider?.keyHint}
            />

            <View style={{ gap: 8 }}>
              <Text style={{ color: t.textDim, fontSize: 11.5, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase' }}>Model pada key ini</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
                {(provider?.models ?? []).map((m) => {
                  const sel = draft.models.includes(m);
                  return (
                    <Chip
                      key={m}
                      label={m.length > 30 ? m.slice(0, 28) + '…' : m}
                      selected={sel}
                      onPress={() => setDraft({ ...draft, models: sel ? draft.models.filter((x) => x !== m) : [...draft.models, m] })}
                    />
                  );
                })}
              </View>
              <Text style={{ color: t.textFaint, fontSize: 11.5 }}>Kosongkan untuk memakai 2 model pertama provider.</Text>
            </View>

            <Row gap={10}>
              <Text style={{ flex: 1, color: t.text, fontSize: 13.5, fontWeight: '600' }}>Aktifkan untuk router</Text>
              <Toggle value={draft.enabled} onValueChange={(v) => setDraft({ ...draft, enabled: v })} />
            </Row>
          </>
        ) : null}
      </Sheet>
    </View>
  );
}
