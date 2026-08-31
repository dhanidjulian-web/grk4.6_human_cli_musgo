import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Badge, Btn, Card, IconBtn, Meter, Row, SectionTitle } from '../components/ui';
import { bootScript, execCommand } from '../lib/sim';
import { uid, useStore } from '../lib/store';
import { mono, radius } from '../lib/theme';
import type { SandboxEngine } from '../lib/types';

const ENGINES: {
  engine: SandboxEngine;
  name: string;
  repo: string;
  icon: string;
  tint: string;
  desc: string;
  specs: string[];
}[] = [
  {
    engine: 'alpine',
    name: 'Alpine Linux · Kai',
    repo: 'github.com/SimonSchubert/Kai',
    icon: 'snowflake',
    tint: '#31D0AA',
    desc: 'Rootfs Alpine 3.20 super ringan untuk eksekusi build/test yang butuh shell sungguhan.',
    specs: ['image 42 MB', 'boot < 1 dtk', 'sshd :2222', 'busybox + musl'],
  },
  {
    engine: 'microbox',
    name: 'Microbox',
    repo: 'github.com/HQarroum/microbox',
    icon: 'package-variant-closed',
    tint: '#6FA8FF',
    desc: 'Container image build-sendiri dengan seccomp profile & batas cgroup yang ketat.',
    specs: ['overlayfs', 'seccomp default', 'cpu 2 · mem 512m', 'qemu-lite'],
  },
];

function fmtUptime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}j ${m % 60}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

export function SandboxScreen() {
  const { state, theme: t, setState, pushLog } = useStore();
  const nav = useNavigation();
  const [now, setNow] = useState(Date.now());
  const [execDraft, setExecDraft] = useState('');

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const running = state.sandboxes.filter((s) => s.status === 'running');

  const boot = (engine: SandboxEngine) => {
    const n = state.sandboxes.filter((s) => s.engine === engine).length + 1;
    const name = engine === 'alpine' ? `kai-alpine-0${n}` : `microbox-0${n}`;
    const id = uid('sb');
    setState((s) => ({
      ...s,
      sandboxes: [...s.sandboxes, { id, engine, name, status: 'booting', pid: 4100 + Math.floor(Math.random() * 700) }],
    }));
    pushLog('info', 'sandbox', `boot dimulai: ${name}`);
    const script = bootScript(engine, name);
    script.forEach((l, i) => setTimeout(() => pushLog(l.level, 'sandbox', l.text), 400 * (i + 1)));
    setTimeout(() => {
      setState((s) => ({
        ...s,
        sandboxes: s.sandboxes.map((x) => (x.id === id ? { ...x, status: 'running', startedAt: Date.now() } : x)),
      }));
      pushLog('ok', 'sandbox', `${name} siap dipakai agent`);
    }, 400 * script.length + 400);
  };

  const stop = (id: string, name: string) => {
    setState((s) => ({ ...s, sandboxes: s.sandboxes.filter((x) => x.id !== id) }));
    pushLog('warn', 'sandbox', `${name} dihentikan & dibersihkan`);
  };

  const runExec = (raw: string) => {
    const command = raw.trim();
    if (!command) return;
    setExecDraft('');
    pushLog('tool', 'sandbox', `$ ${command}`);
    const res = execCommand(command, state);
    res.lines.forEach((l, i) => setTimeout(() => pushLog(l.level, 'sandbox', l.text), 60 * (i + 1)));
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.bg }} contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 14 }}>
      <View>
        <Text style={{ color: t.text, fontSize: 22, fontWeight: '900' }}>Sandbox</Text>
        <Text style={{ color: t.textDim, fontSize: 13, marginTop: 3 }}>
          Lingkungan terisolasi untuk eksekusi build, test, dan perintah git oleh agent.
        </Text>
      </View>

      {ENGINES.map((e) => {
        const inst = state.sandboxes.filter((s) => s.engine === e.engine && s.status !== 'stopped');
        const isRunning = inst.some((s) => s.status === 'running');
        const isBooting = inst.some((s) => s.status === 'booting');
        return (
          <Card key={e.engine}>
            <Row gap={11}>
              <View style={{ width: 44, height: 44, borderRadius: 15, backgroundColor: e.tint + '1F', alignItems: 'center', justifyContent: 'center' }}>
                <MaterialCommunityIcons name={e.icon as never} size={23} color={e.tint} />
              </View>
              <View style={{ flex: 1 }}>
                <Row gap={6}>
                  <Text style={{ color: t.text, fontSize: 15.5, fontWeight: '800' }}>{e.name}</Text>
                  <Badge label={isRunning ? 'running' : isBooting ? 'booting' : 'stopped'} tone={isRunning ? 'ok' : isBooting ? 'warn' : 'dim'} />
                </Row>
                <Text style={{ fontFamily: mono, fontSize: 10.5, color: t.textFaint, marginTop: 2 }}>{e.repo}</Text>
              </View>
            </Row>
            <Text style={{ color: t.textDim, fontSize: 13, lineHeight: 19, marginTop: 10 }}>{e.desc}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
              {e.specs.map((s) => (
                <View key={s} style={{ paddingHorizontal: 8, paddingVertical: 4, backgroundColor: t.surfaceAlt, borderRadius: radius.pill }}>
                  <Text style={{ fontFamily: mono, fontSize: 10.5, color: t.textDim }}>{s}</Text>
                </View>
              ))}
            </View>
            <Row gap={8} style={{ marginTop: 12 }}>
              {isRunning ? (
                <Btn label="Hentikan" icon="stop" variant="danger" size="sm" onPress={() => inst.filter((s) => s.status === 'running').forEach((s) => stop(s.id, s.name))} />
              ) : (
                <Btn label={isBooting ? 'Booting…' : 'Boot sandbox'} icon="play" variant="primary" size="sm" loading={isBooting} onPress={() => boot(e.engine)} />
              )}
              <Btn label="Terminal" icon="console" variant="outline" size="sm" onPress={() => nav.navigate('Terminal' as never)} />
            </Row>
          </Card>
        );
      })}

      <View>
        <SectionTitle text={`Instance aktif · ${running.length}`} />
        {running.length === 0 ? (
          <Card>
            <Text style={{ color: t.textDim, fontSize: 13.5, lineHeight: 20 }}>
              Belum ada instance berjalan. Boot Alpine (Kai) atau Microbox di atas — output boot akan muncul di Terminal.
            </Text>
          </Card>
        ) : (
          <View style={{ gap: 10 }}>
            {running.map((s, idx) => (
              <Card key={s.id}>
                <Row>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: t.ok }} />
                  <Text style={{ flex: 1, color: t.text, fontWeight: '800', fontSize: 14 }}>{s.name}</Text>
                  <Text style={{ fontFamily: mono, fontSize: 11, color: t.textFaint }}>pid {s.pid}</Text>
                  <IconBtn name="trash-can-outline" size={17} onPress={() => stop(s.id, s.name)} />
                </Row>
                <Text style={{ fontFamily: mono, fontSize: 11, color: t.textDim, marginTop: 6 }}>
                  uptime {fmtUptime(now - (s.startedAt ?? now))} · {s.engine === 'alpine' ? 'kai:alpine-3.20' : 'microbox:latest'}
                </Text>
                <View style={{ gap: 8, marginTop: 10 }}>
                  <View style={{ gap: 4 }}>
                    <Row>
                      <Text style={{ flex: 1, color: t.textFaint, fontSize: 11 }}>CPU</Text>
                      <Text style={{ fontFamily: mono, fontSize: 10.5, color: t.textDim }}>{(12 + idx * 9 + (now % 7)) % 60}%</Text>
                    </Row>
                    <Meter value={((12 + idx * 9 + (now % 7)) % 60) / 100} />
                  </View>
                  <View style={{ gap: 4 }}>
                    <Row>
                      <Text style={{ flex: 1, color: t.textFaint, fontSize: 11 }}>MEM</Text>
                      <Text style={{ fontFamily: mono, fontSize: 10.5, color: t.textDim }}>{(34 + idx * 11 + (now % 5)) % 80}%</Text>
                    </Row>
                    <Meter value={((34 + idx * 11 + (now % 5)) % 80) / 100} tone={t.info} />
                  </View>
                </View>
              </Card>
            ))}
          </View>
        )}
      </View>

      <View>
        <SectionTitle text="Quick exec" />
        <Card>
          <Text style={{ fontFamily: mono, fontSize: 11.5, color: t.textDim, marginBottom: 8 }}>
            output ditempel ke Terminal · contoh: ls · git status · docker ps · uname -a
          </Text>
          <Row gap={8}>
            <View style={{ flex: 1, backgroundColor: t.surfaceAlt, borderRadius: radius.md, borderWidth: 1, borderColor: t.border, paddingHorizontal: 10 }}>
              <TextInput
                value={execDraft}
                onChangeText={setExecDraft}
                placeholder="$ …"
                placeholderTextColor={t.textFaint}
                autoCapitalize="none"
                autoCorrect={false}
                onSubmitEditing={() => runExec(execDraft)}
                style={{ fontFamily: mono, fontSize: 13, color: t.text, paddingVertical: 10 }}
              />
            </View>
            <Pressable onPress={() => runExec(execDraft)} style={{ width: 42, height: 42, borderRadius: radius.md, backgroundColor: t.accent, alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="play" size={18} color={t.onAccent} />
            </Pressable>
          </Row>
        </Card>
      </View>
    </ScrollView>
  );
}
