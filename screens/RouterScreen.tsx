import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Badge, Btn, Card, Chip, EmptyState, Row, ScreenHeader, Scroll, SectionTitle, Segmented } from '../components/ui';
import { providerById } from '../lib/providers';
import type { NavProps } from '../lib/nav';
import { maskSecret, nextPreview } from '../lib/sim';
import { useStore } from '../lib/store';
import { mono, radius } from '../lib/theme';

export function RouterScreen() {
  const { state, theme: t, setState, pushLog } = useStore();
  const nav = useNavigation<NavProps<'RouterSettings'>['navigation']>();
  const enabled = state.keys.filter((k) => k.enabled);
  const models = Array.from(new Set(enabled.flatMap((k) => k.models)));
  const mode = state.router.mode;

  const setMode = (m: 'manual' | 'autoroute') => {
    setState((s) => ({ ...s, router: { ...s.router, mode: m } }));
    pushLog('info', 'router', `mode diubah → ${m}`);
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <ScreenHeader title="Router" subtitle="Menentukan model & key yang dipakai sistem" onBack={() => nav.goBack()} />
      <Scroll>
        <Card>
          <Segmented
            value={mode}
            onChange={(v) => setMode(v as 'manual' | 'autoroute')}
            options={[
              { label: 'Manual', value: 'manual' },
              { label: 'Random autoroute', value: 'autoroute' },
            ]}
          />
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
            <View style={{ flex: 1, backgroundColor: t.surfaceAlt, borderRadius: radius.md, padding: 10, borderWidth: 1, borderColor: mode === 'manual' ? t.accent + '66' : 'transparent' }}>
              <Text style={{ color: mode === 'manual' ? t.accent : t.textDim, fontSize: 12.5, fontWeight: '800' }}>1 · Manual</Text>
              <Text style={{ color: t.textDim, fontSize: 12, marginTop: 4, lineHeight: 17 }}>Pilih 1 model yang dipakai sistem untuk semua API key.</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: t.surfaceAlt, borderRadius: radius.md, padding: 10, borderWidth: 1, borderColor: mode === 'autoroute' ? t.accent + '66' : 'transparent' }}>
              <Text style={{ color: mode === 'autoroute' ? t.accent : t.textDim, fontSize: 12.5, fontWeight: '800' }}>2 · Autoroute loop</Text>
              <Text style={{ color: t.textDim, fontSize: 12, marginTop: 4, lineHeight: 17 }}>Semua API key dipakai untuk semua model secara random & berulang.</Text>
            </View>
          </View>
        </Card>

        <Card>
          <Text style={{ color: t.textDim, fontSize: 11, fontWeight: '800', letterSpacing: 0.8 }}>PREVIEW REQUEST BERIKUTNYA</Text>
          <Row gap={8} style={{ marginTop: 8 }}>
            <MaterialCommunityIcons name="flash" size={16} color={t.accent} />
            <Text style={{ flex: 1, fontFamily: mono, fontSize: 12, color: t.text }} numberOfLines={2}>
              {nextPreview(state)}
            </Text>
          </Row>
        </Card>

        {enabled.length === 0 ? (
          <Card>
            <EmptyState icon="key-variant" title="Belum ada key aktif" body="Router butuh minimal satu API key aktif. Tambahkan di BYOK lalu kembali ke sini." actionLabel="Buka BYOK" onAction={() => nav.navigate('Byok')} />
          </Card>
        ) : mode === 'manual' ? (
          <View>
            <SectionTitle text="Model terpakai (untuk semua key)" />
            <Card>
              <Pressable
                onPress={() => {
                  setState((s) => ({ ...s, router: { ...s.router, manualModel: 'auto' } }));
                  pushLog('info', 'router', 'model → auto (pilihan sistem)');
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  paddingVertical: 11,
                  paddingHorizontal: 11,
                  borderRadius: radius.md,
                  borderWidth: 1,
                  borderColor: state.router.manualModel === 'auto' ? t.accent : t.border,
                  backgroundColor: state.router.manualModel === 'auto' ? t.accentSoft : 'transparent',
                }}
              >
                <MaterialCommunityIcons name={(state.router.manualModel === 'auto' ? 'radio-button-checked' : 'radio-button-unchecked') as never} size={18} color={state.router.manualModel === 'auto' ? t.accent : t.textFaint} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: t.text, fontSize: 13.5, fontWeight: '700' }}>auto · best/default pilihan sistem</Text>
                  <Text style={{ color: t.textFaint, fontSize: 11.5, marginTop: 1 }}>Sistem memilih model terbaik yang tersedia di key aktif.</Text>
                </View>
              </Pressable>
              <View style={{ height: 10 }} />
              <View style={{ gap: 7 }}>
                {models.map((m) => {
                  const sel = state.router.manualModel === m;
                  const owner = enabled.find((k) => k.models.includes(m));
                  const p = owner ? providerById(owner.providerId) : undefined;
                  return (
                    <Pressable
                      key={m}
                      onPress={() => {
                        setState((s) => ({ ...s, router: { ...s.router, manualModel: m } }));
                        pushLog('info', 'router', `model → ${m}`);
                      }}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 10,
                        paddingVertical: 10,
                        paddingHorizontal: 11,
                        borderRadius: radius.md,
                        borderWidth: 1,
                        borderColor: sel ? t.accent : t.border,
                        backgroundColor: sel ? t.accentSoft : 'transparent',
                      }}
                    >
                      <MaterialCommunityIcons name={(sel ? 'radio-button-checked' : 'radio-button-unchecked') as never} size={18} color={sel ? t.accent : t.textFaint} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: mono, fontSize: 12, color: t.text }} numberOfLines={1}>
                          {m}
                        </Text>
                        <Text style={{ fontSize: 11, color: t.textFaint, marginTop: 2 }}>
                          {p?.name ?? owner?.providerId} · {owner?.label} {owner ? maskSecret(owner.secret) : ''}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </Card>
          </View>
        ) : (
          <View>
            <SectionTitle text="Urutan rotasi autoroute" right={<Btn label="Advance" icon="refresh" size="sm" variant="soft" onPress={() => { setState((s) => ({ ...s, rotation: s.rotation + 1 })); pushLog('debug', 'router', 'rotasi maju manual'); }} />} />
            <Card>
              <Text style={{ color: t.textDim, fontSize: 12.5, lineHeight: 19 }}>
                Setiap request mengambil key berikutnya dalam lingkaran, lalu model bergantian dari daftar key tersebut. Index saat ini:{' '}
                <Text style={{ fontFamily: mono, color: t.accent }}>{state.rotation}</Text> / {enabled.length}.
              </Text>
              <View style={{ gap: 7, marginTop: 12 }}>
                {enabled.map((k, i) => {
                  const active = state.rotation % enabled.length === i;
                  const p = providerById(k.providerId);
                  return (
                    <View
                      key={k.id}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 10,
                        paddingVertical: 9,
                        paddingHorizontal: 11,
                        borderRadius: radius.md,
                        borderWidth: 1,
                        borderColor: active ? t.accent : t.border,
                        backgroundColor: active ? t.accentSoft : 'transparent',
                      }}
                    >
                      <Text style={{ fontFamily: mono, fontSize: 11, color: active ? t.accent : t.textFaint, width: 22 }}>#{i + 1}</Text>
                      <View style={{ width: 26, alignItems: 'center' }}>
                        <MaterialCommunityIcons name={(p?.icon ?? 'chip') as never} size={16} color={p?.tint ?? t.textDim} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: t.text, fontSize: 13, fontWeight: '700' }} numberOfLines={1}>
                          {p?.name} · {k.label}
                        </Text>
                        <Text style={{ fontFamily: mono, fontSize: 10.5, color: t.textFaint }} numberOfLines={1}>
                          {maskSecret(k.secret)} · {k.models.length} model
                        </Text>
                      </View>
                      {active ? <Badge label="next" tone="accent" /> : null}
                    </View>
                  );
                })}
              </View>
            </Card>
          </View>
        )}

        <View>
          <SectionTitle text="Semua model terdaftar" />
          <Card>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {models.map((m) => (
                <Chip key={m} label={m.length > 30 ? m.slice(0, 28) + '…' : m} icon="chip" selected={state.router.mode === 'manual' && state.router.manualModel === m} />
              ))}
            </View>
          </Card>
        </View>
      </Scroll>
    </View>
  );
}
