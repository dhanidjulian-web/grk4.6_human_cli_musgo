import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, Share, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MessageBubble } from '../components/MessageBubble';
import { Badge, EmptyState, IconBtn } from '../components/ui';
import { craftReply, estimateTokens, pickRoute, sessionTitle } from '../lib/sim';
import { activeProfile, activeSession, uid, useStore } from '../lib/store';
import { mono, radius, shadowFor } from '../lib/theme';
import type { ChatMessage } from '../lib/types';

const SUGGESTIONS = [
  'Boot sandbox alpine lalu jalankan build',
  'Jelaskan routing BYOK yang aktif sekarang',
  'Buat agent swarm untuk repo Kai',
  'Review pipeline CI kita',
];

export function ChatScreen({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  const { state, theme: t, setState, pushLog, addMessage, newSession } = useStore();
  const nav = useNavigation();
  const insets = useSafeAreaInsets();
  const session = activeSession(state);
  const profile = activeProfile(state);
  const [draft, setDraft] = useState('');
  const [stream, setStream] = useState<{ full: string; shown: number; model: string; route: string } | null>(null);
  const [actionMsg, setActionMsg] = useState<ChatMessage | null>(null);
  const sessionRef = useRef<string | null>(session?.id ?? null);
  const streamTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const route = pickRoute(state);

  useEffect(() => {
    if (!stream) return;
    if (stream.shown >= stream.full.length) {
      const msg: ChatMessage = {
        id: uid('msg'),
        role: 'assistant',
        text: stream.full,
        model: stream.model,
        route: stream.route,
        ts: Date.now(),
        tokens: estimateTokens(stream.full),
      };
      const sid = sessionRef.current;
      if (sid) addMessage(sid, msg);
      pushLog('ok', 'chat', `reply selesai · ${msg.tokens} tok · ${stream.model}`);
      if (state.router.mode === 'autoroute') {
        setState((s) => ({ ...s, rotation: s.rotation + 1 }));
      }
      setStream(null);
      return;
    }
    const id = setTimeout(() => {
      setStream((s) => (s ? { ...s, shown: Math.min(s.full.length, s.shown + 8) } : null));
    }, state.streamSpeed);
    streamTimer.current = id;
    return () => clearTimeout(id);
  }, [stream, state.streamSpeed, state.router.mode]);

  const send = (preset?: string) => {
    const text = (preset ?? draft).trim();
    if (!text || stream) return;
    setDraft('');
    let sid = state.sessions.some((s) => s.id === state.activeSessionId) ? state.activeSessionId : null;
    if (!sid) {
      sid = newSession(sessionTitle(text));
    }
    sessionRef.current = sid;
    const userMsg: ChatMessage = { id: uid('msg'), role: 'user', text, ts: Date.now(), tokens: estimateTokens(text) };
    addMessage(sid, userMsg);
    pushLog('tool', 'chat', `→ ${text.slice(0, 72)}`);

    const r = pickRoute(state);
    if (!r) {
      addMessage(sid, {
        id: uid('msg'),
        role: 'system',
        text: 'Tidak ada API key aktif. Tambahkan minimal satu key di **Settings → BYOK** (OpenRouter, Gemini, Mistral, Groq, …) lalu set router ke mode manual atau autoroute.',
        ts: Date.now(),
      });
      pushLog('error', 'byok', 'request diblokir: 0 key aktif');
      return;
    }
    const reply = craftReply(text, profile, r, state.sandboxes.filter((s) => s.status === 'running').length);
    pushLog('info', 'router', `${r.via} · ${r.model} · ${r.providerName} ${r.masked}`);
    setStream({ full: reply, shown: 0, model: r.model, route: r.via });
  };

  const stopStream = () => {
    if (!stream) return;
    if (streamTimer.current) clearTimeout(streamTimer.current);
    const partial = stream.full.slice(0, stream.shown).trimEnd() + '\n\n> ⏹ dihentikan manual';
    const sid = sessionRef.current;
    if (sid) {
      addMessage(sid, {
        id: uid('msg'),
        role: 'assistant',
        text: partial,
        model: stream.model,
        route: stream.route,
        ts: Date.now(),
        tokens: estimateTokens(partial),
      });
    }
    pushLog('warn', 'chat', 'stream dihentikan oleh user');
    setStream(null);
  };

  const items = useMemo(() => {
    const arr: ChatMessage[] = [...(session?.messages ?? [])];
    if (stream) {
      arr.push({
        id: 'msg_stream',
        role: 'assistant',
        text: stream.shown > 0 ? stream.full.slice(0, stream.shown) : '…',
        model: stream.model,
        route: stream.route,
        ts: Date.now(),
      });
    }
    return arr.reverse();
  }, [session?.messages, stream]);

  const toggleBookmark = (id: string) => {
    const sid = state.activeSessionId;
    if (!sid) return;
    setState((s) => ({
      ...s,
      sessions: s.sessions.map((se) =>
        se.id === sid ? { ...se, messages: se.messages.map((m) => (m.id === id ? { ...m, bookmarked: !m.bookmarked } : m)) } : se,
      ),
    }));
  };

  const deleteMessage = (id: string) => {
    const sid = state.activeSessionId;
    if (!sid) return;
    setState((s) => ({
      ...s,
      sessions: s.sessions.map((se) => (se.id === sid ? { ...se, messages: se.messages.filter((m) => m.id !== id) } : se)),
    }));
    pushLog('debug', 'chat', 'pesan dihapus');
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      {/* header */}
      <View
        style={{
          paddingTop: insets.top + 6,
          paddingBottom: 10,
          paddingHorizontal: 10,
          backgroundColor: t.bg,
          borderBottomWidth: 1,
          borderBottomColor: t.border,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <IconBtn name="menu" onPress={onOpenSidebar} size={23} color={t.text} />
        <IconBtn name="console" onPress={() => nav.navigate('Terminal' as never)} size={21} color={t.accent} />
        <View style={{ flex: 1, paddingHorizontal: 6 }}>
          <Text style={{ color: t.text, fontWeight: '800', fontSize: 15 }} numberOfLines={1}>
            {session?.title ?? 'Chat'}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <MaterialCommunityIcons name="account-star-outline" size={11} color={t.accent} />
            <Text style={{ color: t.textDim, fontSize: 11.5 }} numberOfLines={1}>
              {profile.name} · {state.router.mode === 'manual' ? 'manual' : 'autoroute'}
            </Text>
          </View>
        </View>
        <IconBtn name="account-circle" onPress={() => nav.navigate('Settings' as never)} size={25} color={t.text} />
      </View>

      {/* list */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={8}>
        <FlatList
          data={items}
          inverted
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ paddingVertical: 10, flexGrow: 1 }}
          keyboardDismissMode="interactive"
          ListEmptyComponent={
            <View style={{ flex: 1, justifyContent: 'center' }}>
              <EmptyState
                icon="robot-outline"
                title="Orchestrator siap"
                body={`${profile.swarm.length} agent · ${state.keys.filter((k) => k.enabled).length} key aktif · router ${state.router.mode}. Mulai dengan salah satu prompt di bawah.`}
              />
              <View style={{ paddingHorizontal: 20, gap: 8 }}>
                {SUGGESTIONS.map((s) => (
                  <Pressable
                    key={s}
                    onPress={() => send(s)}
                    style={{
                      backgroundColor: t.surface,
                      borderWidth: 1,
                      borderColor: t.border,
                      borderRadius: radius.md,
                      paddingHorizontal: 13,
                      paddingVertical: 11,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 9,
                    }}
                  >
                    <MaterialCommunityIcons name="flash-outline" size={15} color={t.accent} />
                    <Text style={{ color: t.textDim, fontSize: 13.5, flex: 1 }}>{s}</Text>
                    <MaterialCommunityIcons name="arrow-right" size={14} color={t.textFaint} />
                  </Pressable>
                ))}
              </View>
            </View>
          }
          renderItem={({ item }) => (
            <MessageBubble
              msg={item}
              onLongPress={() => setActionMsg(item)}
              onToggleBookmark={() => toggleBookmark(item.id)}
            />
          )}
        />

        {/* composer */}
        <View style={{ paddingHorizontal: 12, paddingBottom: 6, gap: 7 }}>
          <Pressable
            onPress={() => nav.navigate('RouterSettings' as never)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
          >
            <MaterialCommunityIcons name="router-wireless" size={13} color={route ? t.accent : t.danger} />
            <Text style={{ fontFamily: mono, fontSize: 10.5, color: route ? t.textDim : t.danger }} numberOfLines={1}>
              {route ? `${route.via} · ${route.model} · ${route.providerName} ${route.masked}` : 'tidak ada key aktif — buka BYOK'}
            </Text>
          </Pressable>
          <View
            style={[
              {
                flexDirection: 'row',
                alignItems: 'flex-end',
                gap: 8,
                backgroundColor: t.surface,
                borderWidth: 1,
                borderColor: t.border,
                borderRadius: radius.lg,
                paddingHorizontal: 12,
                paddingVertical: 8,
              },
              shadowFor(t, 1),
            ]}
          >
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder={`Perintah untuk ${profile.name}…`}
              placeholderTextColor={t.textFaint}
              multiline
              style={{ flex: 1, color: t.text, fontSize: 14.5, maxHeight: 110, paddingTop: 4, paddingBottom: 4 }}
            />
            {stream ? (
              <Pressable
                onPress={stopStream}
                style={{ width: 38, height: 38, borderRadius: 14, backgroundColor: t.danger + '22', alignItems: 'center', justifyContent: 'center' }}
              >
                <MaterialCommunityIcons name="stop" size={19} color={t.danger} />
              </Pressable>
            ) : (
              <Pressable
                onPress={() => send()}
                disabled={!draft.trim()}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 14,
                  backgroundColor: draft.trim() ? t.accent : t.surfaceHigh,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MaterialCommunityIcons name="send" size={18} color={draft.trim() ? t.onAccent : t.textFaint} />
              </Pressable>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* message actions */}
      <Modal visible={!!actionMsg} transparent animationType="fade" onRequestClose={() => setActionMsg(null)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' }} onPress={() => setActionMsg(null)}>
          <View style={{ backgroundColor: t.bg, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: 16, paddingBottom: insets.bottom + 16, gap: 8 }}>
            <Text style={{ color: t.textDim, fontSize: 12, fontWeight: '800', marginBottom: 4 }}>AKSI PESAN</Text>
            <Pressable
              onPress={() => {
                if (actionMsg) toggleBookmark(actionMsg.id);
                setActionMsg(null);
              }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 }}
            >
              <MaterialCommunityIcons name={actionMsg?.bookmarked ? 'bookmark' : 'bookmark-outline'} size={19} color={t.accent} />
              <Text style={{ color: t.text, fontSize: 14.5, fontWeight: '600' }}>{actionMsg?.bookmarked ? 'Hapus bookmark' : 'Bookmark pesan'}</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                if (actionMsg) Share.share({ message: actionMsg.text }).catch(() => undefined);
                setActionMsg(null);
              }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 }}
            >
              <MaterialCommunityIcons name="content-copy" size={19} color={t.textDim} />
              <Text style={{ color: t.text, fontSize: 14.5, fontWeight: '600' }}>Bagikan / salin</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                if (actionMsg) deleteMessage(actionMsg.id);
                setActionMsg(null);
              }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 }}
            >
              <MaterialCommunityIcons name="trash-can-outline" size={19} color={t.danger} />
              <Text style={{ color: t.danger, fontSize: 14.5, fontWeight: '600' }}>Hapus pesan</Text>
            </Pressable>
            {actionMsg?.model ? <Badge label={`${actionMsg.model}`} tone="info" /> : null}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
