import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Badge, Btn, Card, Chip, Field, IconBtn, Row, ScreenHeader, Scroll, SectionTitle, Sheet } from '../components/ui';
import { CONNECTOR_CATALOG } from '../lib/providers';
import type { NavProps } from '../lib/nav';
import { uid, useStore } from '../lib/store';
import { mono } from '../lib/theme';
import type { ConnectorRec } from '../lib/types';

export function ConnectorScreen() {
  const { state, theme: t, setState, pushLog } = useStore();
  const nav = useNavigation<NavProps<'Connectors'>['navigation']>();
  const [pending, setPending] = useState<string | null>(null);
  const [custom, setCustom] = useState<ConnectorRec | null>(null);
  const [scopes, setScopes] = useState('');

  const find = (slug: string) => state.connectors.find((c) => c.slug === slug);

  const connect = (slug: string, name: string, account: string, scopeList: string[]) => {
    setPending(slug);
    pushLog('info', 'oauth', `memulai alur OAuth ${name}…`);
    setTimeout(() => {
      setState((s) => {
        const existing = s.connectors.find((c) => c.slug === slug);
        if (existing) {
          return {
            ...s,
            connectors: s.connectors.map((c) => (c.slug === slug ? { ...c, connected: true, account, connectedAt: Date.now() } : c)),
          };
        }
        return {
          ...s,
          connectors: [...s.connectors, { id: uid('cn'), slug, name, account, connected: true, scopes: scopeList, connectedAt: Date.now() }],
        };
      });
      pushLog('ok', 'oauth', `${name} terhubung sebagai ${account}`);
      setPending(null);
    }, 950);
  };

  const disconnect = (slug: string, name: string) => {
    setState((s) => ({ ...s, connectors: s.connectors.map((c) => (c.slug === slug ? { ...c, connected: false, account: null } : c)) }));
    pushLog('warn', 'oauth', `${name} diputus`);
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <ScreenHeader
        title="Connector"
        subtitle="Daftar OAuth provider untuk eksekusi agent"
        onBack={() => nav.goBack()}
        right={<IconBtn name="plus" onPress={() => { setCustom({ id: uid('cn'), slug: '', name: '', account: null, connected: false, scopes: [] }); setScopes(''); }} />}
      />
      <Scroll>
        <Text style={{ color: t.textDim, fontSize: 13, lineHeight: 19 }}>
          Connector memberi agent izin memakai layanan luar (git, deploy, inference, workflow). Semua bisa dihubungkan, diputus, dan dihapus kapan saja.
        </Text>

        <View>
          <SectionTitle text="Provider OAuth" right={<Badge label={`${state.connectors.filter((c) => c.connected).length} aktif`} tone="ok" />} />
          <View style={{ gap: 10 }}>
            {CONNECTOR_CATALOG.map((cat) => {
              const rec = find(cat.slug);
              const isPending = pending === cat.slug;
              return (
                <Card key={cat.slug}>
                  <Row gap={11}>
                    <View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: cat.tint + '1F', alignItems: 'center', justifyContent: 'center' }}>
                      <MaterialCommunityIcons name={cat.icon as never} size={21} color={cat.tint} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Row gap={6}>
                        <Text style={{ color: t.text, fontSize: 14.5, fontWeight: '800' }}>{cat.name}</Text>
                        {rec?.connected ? <Badge label="connected" tone="ok" /> : <Badge label="off" tone="dim" />}
                      </Row>
                      <Text style={{ color: t.textDim, fontSize: 12, marginTop: 2 }}>{cat.blurb}</Text>
                    </View>
                  </Row>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 9 }}>
                    {cat.scopes.map((sc) => (
                      <View key={sc} style={{ paddingHorizontal: 7, paddingVertical: 3, borderRadius: 7, backgroundColor: t.surfaceAlt }}>
                        <Text style={{ fontFamily: mono, fontSize: 10, color: t.textDim }}>{sc}</Text>
                      </View>
                    ))}
                  </View>
                  <Row gap={8} style={{ marginTop: 11 }}>
                    {rec?.connected ? (
                      <>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontFamily: mono, fontSize: 11.5, color: t.textDim }} numberOfLines={1}>
                            {rec.account}
                          </Text>
                          {rec.connectedAt ? (
                            <Text style={{ fontSize: 10.5, color: t.textFaint, marginTop: 1 }}>
                              sejak {new Date(rec.connectedAt).toLocaleDateString('id-ID')}
                            </Text>
                          ) : null}
                        </View>
                        <Btn label="Putuskan" variant="danger" size="sm" onPress={() => disconnect(cat.slug, cat.name)} />
                      </>
                    ) : (
                      <Btn
                        label={isPending ? 'Menghubungkan…' : 'Hubungkan'}
                        icon="link-variant"
                        variant="primary"
                        size="sm"
                        loading={isPending}
                        style={{ flex: 1 }}
                        onPress={() => connect(cat.slug, cat.name, cat.account, cat.scopes)}
                      />
                    )}
                  </Row>
                </Card>
              );
            })}
          </View>
        </View>

        {custom ? (
          <Sheet visible={!!custom} onClose={() => setCustom(null)} title="Connector khusus"
            footer={
              <>
                <Btn label="Batal" variant="ghost" style={{ flex: 1 }} onPress={() => setCustom(null)} />
                <Btn
                  label="Simpan & hubungkan"
                  variant="primary"
                  style={{ flex: 2 }}
                  onPress={() => {
                    const name = custom.name.trim();
                    const slug = (custom.slug.trim() || name.toLowerCase().replace(/\s+/g, '-')) || 'custom';
                    if (!name) return;
                    const scopeList = scopes.split(',').map((s) => s.trim()).filter(Boolean);
                    setState((s) => ({
                      ...s,
                      connectors: [...s.connectors.filter((c) => c.id !== custom.id), { ...custom, slug, name, scopes: scopeList }],
                    }));
                    setCustom(null);
                    setTimeout(() => connect(slug, name, `${slug}.selfhost`, scopeList), 150);
                  }}
                />
              </>
            }
          >
            <Field label="Nama" value={custom.name} onChangeText={(v) => setCustom({ ...custom, name: v })} placeholder="Internal GitLab" />
            <Field label="Slug / base url" value={custom.slug} onChangeText={(v) => setCustom({ ...custom, slug: v })} placeholder="gitlab.internal" autoCapitalize="none" />
            <Field label="Scopes (pisah koma)" value={scopes} onChangeText={setScopes} placeholder="api, read_user" autoCapitalize="none" />
          </Sheet>
        ) : null}

        {state.connectors.filter((c) => !CONNECTOR_CATALOG.some((x) => x.slug === c.slug)).length > 0 ? (
          <View>
            <SectionTitle text="Connector khusus" />
            <View style={{ gap: 10 }}>
              {state.connectors
                .filter((c) => !CONNECTOR_CATALOG.some((x) => x.slug === c.slug))
                .map((c) => (
                  <Card key={c.id}>
                    <Row gap={10}>
                      <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: t.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
                        <MaterialCommunityIcons name="lan-connect" size={19} color={t.accent} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Row gap={6}>
                          <Text style={{ color: t.text, fontSize: 14, fontWeight: '700' }}>{c.name}</Text>
                          <Badge label={c.connected ? 'connected' : 'off'} tone={c.connected ? 'ok' : 'dim'} />
                        </Row>
                        <Text style={{ fontFamily: mono, fontSize: 11, color: t.textFaint, marginTop: 2 }}>{c.account ?? c.slug}</Text>
                      </View>
                      <IconBtn
                        name="trash-can-outline"
                        size={18}
                        onPress={() => {
                          setState((s) => ({ ...s, connectors: s.connectors.filter((x) => x.id !== c.id) }));
                          pushLog('warn', 'oauth', `connector dihapus: ${c.name}`);
                        }}
                      />
                    </Row>
                    <Row style={{ marginTop: 9, flexWrap: 'wrap', gap: 6 }} align="flex-start">
                      {c.scopes.map((sc) => (
                        <Chip key={sc} label={sc} />
                      ))}
                    </Row>
                    {!c.connected ? (
                      <Btn
                        label={pending === c.slug ? 'Menghubungkan…' : 'Hubungkan'}
                        icon="link-variant"
                        variant="primary"
                        size="sm"
                        loading={pending === c.slug}
                        style={{ marginTop: 10 }}
                        onPress={() => connect(c.slug, c.name, `${c.slug}.selfhost`, c.scopes)}
                      />
                    ) : null}
                  </Card>
                ))}
            </View>
          </View>
        ) : null}

        {pending ? (
          <Row gap={8}>
            <ActivityIndicator size="small" color={t.accent} />
            <Text style={{ color: t.textDim, fontSize: 12.5 }}>menunggu callback OAuth…</Text>
          </Row>
        ) : null}
      </Scroll>
    </View>
  );
}
