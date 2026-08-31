import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { Platform, Pressable, Share, Text, View } from 'react-native';
import { Badge, Btn, Card, Divider, Field, IconBtn, Row, ScreenHeader, Scroll, SectionTitle, Segmented, Sheet } from '../components/ui';
import { activeProfile, useStore } from '../lib/store';
import { mono } from '../lib/theme';
import type { NavProps } from '../lib/nav';

export function SettingsScreen() {
  const { state, theme: t, setState, pushLog, resetAll } = useStore();
  const nav = useNavigation<NavProps<'Settings'>['navigation']>();
  const [editAccount, setEditAccount] = useState(false);
  const [name, setName] = useState(state.account.name);
  const [handle, setHandle] = useState(state.account.handle);
  const [confirmReset, setConfirmReset] = useState(false);
  const profile = activeProfile(state);

  const connected = state.connectors.filter((c) => c.connected).length;
  const enabledKeys = state.keys.filter((k) => k.enabled).length;
  const validRepos = state.repos.filter((r) => r.valid).length;

  const exportData = () => {
    const payload = JSON.stringify({ ...state, logs: state.logs.slice(-20), hydrated: undefined }, null, 2);
    Share.share({ message: payload, title: 'filosofi-config.json' }).catch(() => undefined);
    pushLog('ok', 'settings', `export config · ${(payload.length / 1024).toFixed(1)} KB`);
  };

  const reset = () => {
    resetAll();
    setConfirmReset(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <ScreenHeader title="Profil & Settings" subtitle="Akun, connector, BYOK, router, repository, orchestrator" onBack={() => nav.goBack()} />
      <Scroll>
        {/* account */}
        <Card>
          <Row gap={12}>
            <View
              style={{
                width: 54,
                height: 54,
                borderRadius: 19,
                backgroundColor: t.accentSoft,
                borderWidth: 1,
                borderColor: t.accent + '44',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: t.accent, fontWeight: '900', fontSize: 18 }}>
                {state.account.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: t.text, fontSize: 16.5, fontWeight: '800' }}>{state.account.name}</Text>
              <Text style={{ color: t.textDim, fontSize: 12.5, fontFamily: mono, marginTop: 2 }}>{state.account.handle}</Text>
              <Badge label={state.account.plan} tone="accent" />
            </View>
            <IconBtn name="pencil" onPress={() => { setName(state.account.name); setHandle(state.account.handle); setEditAccount(true); }} />
          </Row>
          <View style={{ height: 12 }} />
          <Divider />
          <View style={{ flexDirection: 'row', marginTop: 12, gap: 8 }}>
            {[
              { label: 'connector', value: `${connected}/${state.connectors.length}` },
              { label: 'key aktif', value: `${enabledKeys}/${state.keys.length}` },
              { label: 'repo valid', value: `${validRepos}/${state.repos.length}` },
              { label: 'profile', value: `${state.profiles.length}` },
            ].map((s) => (
              <View key={s.label} style={{ flex: 1, backgroundColor: t.surfaceAlt, borderRadius: 12, paddingVertical: 9, alignItems: 'center' }}>
                <Text style={{ color: t.text, fontWeight: '800', fontSize: 14.5, fontFamily: mono }}>{s.value}</Text>
                <Text style={{ color: t.textFaint, fontSize: 10.5, marginTop: 2 }}>{s.label}</Text>
              </View>
            ))}
          </View>
        </Card>

        {/* modules */}
        <View>
          <SectionTitle text="Modul sistem" />
          <Card>
            {[
              { icon: 'lan-connect', label: 'Connector', sub: 'Google, GitHub, Vercel, HF, n8n, …', go: 'Connectors' as const, badge: `${connected} aktif` },
              { icon: 'key-variant', label: 'BYOK', sub: 'Multi API key provider free-freemium', go: 'Byok' as const, badge: `${enabledKeys} key` },
              { icon: 'router-wireless', label: 'Router', sub: 'Manual atau random autoroute loop', go: 'RouterSettings' as const, badge: state.router.mode },
              { icon: 'source-branch', label: 'Repository', sub: 'Validasi PAT · API · HTTP · SSH', go: 'Repos' as const, badge: `${validRepos} valid` },
              { icon: 'account-star-outline', label: 'Orchestrator Profile', sub: 'Template prompt, library, skill, workflow, swarm', go: 'Profiles' as const, badge: profile.name },
            ].map((row, i) => (
              <View key={row.label}>
                {i > 0 ? <Divider inset={50} /> : null}
                <Pressable
                  onPress={() => nav.navigate(row.go as never)}
                  style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, opacity: pressed ? 0.6 : 1 })}
                >
                  <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: t.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
                    <MaterialCommunityIcons name={row.icon as never} size={19} color={t.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: t.text, fontSize: 14.5, fontWeight: '700' }}>{row.label}</Text>
                    <Text style={{ color: t.textDim, fontSize: 12, marginTop: 1 }}>{row.sub}</Text>
                  </View>
                  <Text style={{ color: t.textFaint, fontSize: 11.5, maxWidth: 110 }} numberOfLines={1}>
                    {row.badge}
                  </Text>
                  <MaterialCommunityIcons name="chevron-right" size={19} color={t.textFaint} />
                </Pressable>
              </View>
            ))}
          </Card>
        </View>

        {/* appearance */}
        <View>
          <SectionTitle text="Tampilan" />
          <Card>
            <Text style={{ color: t.textDim, fontSize: 12, marginBottom: 8 }}>Tema aplikasi</Text>
            <Segmented
              value={state.appearance}
              onChange={(v) => setState((s) => ({ ...s, appearance: v as typeof s.appearance }))}
              options={[
                { label: 'System', value: 'system' },
                { label: 'Terang', value: 'light' },
                { label: 'Gelap', value: 'dark' },
              ]}
            />
            <View style={{ height: 14 }} />
            <Text style={{ color: t.textDim, fontSize: 12, marginBottom: 8 }}>Kecepatan stream jawaban</Text>
            <Segmented
              value={`${state.streamSpeed}`}
              onChange={(v) => setState((s) => ({ ...s, streamSpeed: Number(v) }))}
              options={[
                { label: 'Cepat (8ms)', value: '8' },
                { label: 'Normal (16ms)', value: '16' },
                { label: 'Santai (32ms)', value: '32' },
              ]}
            />
          </Card>
        </View>

        {/* logger */}
        <View>
          <SectionTitle text="Logger" />
          <Card>
            <Text style={{ color: t.textDim, fontSize: 12, marginBottom: 8 }}>Level minimum yang disimpan</Text>
            <Segmented
              value={state.logLevel}
              onChange={(v) => setState((s) => ({ ...s, logLevel: v as typeof s.logLevel }))}
              options={[
                { label: 'debug', value: 'debug' },
                { label: 'info', value: 'info' },
                { label: 'warn', value: 'warn' },
              ]}
            />
            <Row gap={8} style={{ marginTop: 12 }}>
              <MaterialCommunityIcons name="database-outline" size={15} color={t.textFaint} />
              <Text style={{ color: t.textFaint, fontSize: 12, flex: 1 }}>
                {state.logs.length} baris log tersimpan lokal (AsyncStorage)
              </Text>
            </Row>
          </Card>
        </View>

        {/* data */}
        <View>
          <SectionTitle text="Data" />
          <Card>
            <Text style={{ color: t.textDim, fontSize: 12.5, lineHeight: 19 }}>
              Semua konfigurasi (template, module, workflow, library, tools, profile, agent, secret, project, logger, session, bookmark) tersimpan di perangkat ini.
            </Text>
            <Row gap={8} style={{ marginTop: 12 }}>
              <Btn label="Export JSON" icon="download" variant="soft" style={{ flex: 1 }} onPress={exportData} />
              <Btn label="Reset data" icon="restore" variant="danger" style={{ flex: 1 }} onPress={() => setConfirmReset(true)} />
            </Row>
          </Card>
        </View>

        <View style={{ alignItems: 'center', gap: 3, marginTop: 6 }}>
          <Text style={{ color: t.textFaint, fontSize: 11.5, fontFamily: mono }}>filosofi 1.0.0 · runtime {Platform.OS}</Text>
          <Text style={{ color: t.textFaint, fontSize: 11.5, fontFamily: mono }}>sandbox: alpine (kai) + microbox</Text>
        </View>
      </Scroll>

      {/* edit account */}
      <SheetAccount visible={editAccount} onClose={() => setEditAccount(false)}>
        <Field label="Nama" value={name} onChangeText={setName} placeholder="Nama kamu" />
        <Field label="Handle" value={handle} onChangeText={setHandle} placeholder="@handle" autoCapitalize="none" />
        <Row gap={8}>
          <Btn label="Batal" variant="ghost" style={{ flex: 1 }} onPress={() => setEditAccount(false)} />
          <Btn
            label="Simpan"
            variant="primary"
            style={{ flex: 2 }}
            onPress={() => {
              setState((s) => ({ ...s, account: { ...s.account, name: name.trim() || s.account.name, handle: handle.trim() || s.account.handle } }));
              pushLog('ok', 'settings', 'akun diperbarui');
              setEditAccount(false);
            }}
          />
        </Row>
      </SheetAccount>

      {/* confirm reset */}
      <SheetAccount visible={confirmReset} onClose={() => setConfirmReset(false)} title="Reset semua data?">
        <Text style={{ color: t.textDim, fontSize: 13.5, lineHeight: 20 }}>
          Semua API key, connector, repository, profil orchestrator, sesi chat, dan log akan dihapus dan dikembalikan ke state awal.
        </Text>
        <Row gap={8}>
          <Btn label="Batal" variant="ghost" style={{ flex: 1 }} onPress={() => setConfirmReset(false)} />
          <Btn label="Ya, reset" variant="danger" style={{ flex: 1 }} onPress={reset} />
        </Row>
      </SheetAccount>
    </View>
  );
}

/* kecil: wrapper sheet agar file tetap rapi */
function SheetAccount({ visible, onClose, title = 'Edit akun', children }: { visible: boolean; onClose: () => void; title?: string; children: React.ReactNode }) {
  return (
    <Sheet visible={visible} onClose={onClose} title={title}>
      {children}
    </Sheet>
  );
}
