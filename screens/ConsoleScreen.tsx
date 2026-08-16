import React, { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../components/Screen';
import { TerminalView } from '../components/TerminalView';
import { Composer } from '../components/Composer';
import { Badge } from '../components/ui';
import { useApp } from '../lib/AppContext';
import { colors } from '../lib/theme';
import { getMode, MODE_LIST } from '../lib/modes';
import { RootStackParamList, TabParamList } from '../lib/navigation';
import { shareExport } from '../lib/export';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Console'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export function ConsoleScreen() {
  const navigation = useNavigation<Nav>();
  const app = useApp();
  const ses = app.activeSession;
  const [help, setHelp] = useState(false);
  const mode = getMode(app.lockedMode);
  const last = ses?.lastMode ? getMode(ses.lastMode) : null;

  return (
    <Screen edges={['top']}>
      <View style={styles.top}>
        <View style={{ flex: 1 }}>
          <Text style={styles.brand}>HUMAN CLI</Text>
          <Text style={styles.sub} numberOfLines={1}>
            {ses?.title || 'console'}  ·  {app.profile.agents.find((a) => a.id === app.profile.activeAgentId)?.name || 'orch'}  ·  {app.activeModel?.name || 'model-chain'}
          </Text>
        </View>
        <Pressable onPress={() => setHelp(true)} style={styles.iconBtn}>
          <Ionicons name="information-circle-outline" size={20} color={colors.mint} />
        </Pressable>
        <Pressable onPress={() => app.newSession()} style={styles.iconBtn}>
          <Ionicons name="add" size={20} color={colors.green} />
        </Pressable>
        <Pressable onPress={() => navigation.navigate('Bookmarks')} style={styles.iconBtn}>
          <Ionicons name="bookmark-outline" size={16} color={colors.amber} />
        </Pressable>
        <Pressable onPress={() => navigation.navigate('Sessions')} style={styles.iconBtn}>
          <Ionicons name="time-outline" size={18} color={colors.textMuted} />
        </Pressable>
        <Pressable onPress={() => navigation.navigate('Studio')} style={styles.iconBtn}>
          <Ionicons name="color-palette-outline" size={16} color={colors.violet} />
        </Pressable>
        <Pressable onPress={() => navigation.navigate('Ship')} style={styles.iconBtn}>
          <Ionicons name="rocket-outline" size={16} color={colors.cyan} />
        </Pressable>
      </View>

      <View style={styles.meta}>
        <Badge text={mode.short} color={mode.color} />
        {last && last.id !== app.lockedMode ? <Badge text={`last ${last.short}`} color={last.color} /> : null}
        <Badge text={app.profile.orchestrator !== false ? 'ORCH' : 'PIN'} color={app.profile.orchestrator !== false ? colors.violet : colors.amber} />
        <Text style={styles.metaTxt} numberOfLines={1}>
          {app.skills.filter((s) => s.enabled).length} skills · {app.sources.length} src
        </Text>
      </View>

      <View style={styles.acts}>
        <Pressable style={styles.act} onPress={() => app.regenerate()}>
          <Ionicons name="refresh" size={14} color={colors.cyan} />
          <Text style={styles.actT}>REGEN</Text>
        </Pressable>
        <Pressable style={styles.act} onPress={() => {
          const t = (ses?.lines || []).map((l) => l.text).join('\n');
          Share.share({ message: t || ' ' });
        }}>
          <Ionicons name="copy-outline" size={14} color={colors.mint} />
          <Text style={styles.actT}>COPY</Text>
        </Pressable>
        <Pressable style={styles.act} onPress={() => {
          const prompt = ses?.messages.filter((m) => m.role === 'user').slice(-1)[0]?.text || app.lastPrompt;
          const body = (ses?.lines || []).map((l) => l.text).join('\n');
          const agent = app.profile.agents.find((a) => a.id === app.profile.activeAgentId);
          app.addBookmark({
            title: (prompt || 'bookmark').slice(0, 48),
            prompt: prompt || '',
            response: body.slice(-4000),
            mode: ses?.lastMode || 'agent',
            agentName: agent?.name || 'admin',
          });
          Alert.alert('Bookmark', 'Input + respons disimpan.');
        }}>
          <Ionicons name="bookmark" size={14} color={colors.amber} />
          <Text style={styles.actT}>SAVE</Text>
        </Pressable>
        <Pressable style={styles.act} onPress={() => {
          const prompt = ses?.messages.filter((m) => m.role === 'user').slice(-1)[0]?.text || app.lastPrompt;
          const body = (ses?.lines || []).map((l) => l.text).join('\n');
          Alert.alert('Export', 'Pilih format', [
            { text: 'TXT', onPress: () => shareExport('txt', ses?.title || 'console', prompt, body) },
            { text: 'MD', onPress: () => shareExport('md', ses?.title || 'console', prompt, body) },
            { text: 'CSV', onPress: () => shareExport('csv', ses?.title || 'console', prompt, body) },
            { text: 'HTML/PDF', onPress: () => shareExport('pdf', ses?.title || 'console', prompt, body) },
            { text: 'DOC', onPress: () => shareExport('docx', ses?.title || 'console', prompt, body) },
            { text: 'JSON', onPress: () => shareExport('json', ses?.title || 'console', prompt, body) },
            { text: 'Batal', style: 'cancel' },
          ]);
        }}>
          <Ionicons name="download-outline" size={14} color={colors.violet} />
          <Text style={styles.actT}>EXPORT</Text>
        </Pressable>
      </View>

      <View style={styles.split}>
        <TerminalView lines={ses?.lines || []} streaming={app.streaming} />
        <Composer
          lockedMode={app.lockedMode}
          onChangeMode={app.setLockedMode}
          onSend={app.send}
          streaming={app.streaming}
          autoMode={app.profile.autoMode}
        />
      </View>

      <Modal visible={help} transparent animationType="fade" onRequestClose={() => setHelp(false)}>
        <Pressable style={styles.overlay} onPress={() => setHelp(false)}>
          <Pressable style={styles.sheet} onPress={() => undefined}>
            <Text style={styles.sheetTitle}>Auto Mode Router</Text>
            <Text style={styles.sheetBody}>
              Setiap input dianalisa: obrolan, browsing, planning, peraturan, atau perintah eksekusi. Agent memilih mode.
            </Text>
            <ScrollView style={{ maxHeight: 360 }}>
              {MODE_LIST.map((m) => (
                <View key={m.id} style={styles.modeRow}>
                  <View style={[styles.modeDot, { backgroundColor: m.color }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modeName}>{m.label}</Text>
                    <Text style={styles.modeDesc}>{m.description}</Text>
                    <Text style={styles.modeHint}>{m.hint}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
            <Pressable onPress={() => setHelp(false)} style={styles.close}>
              <Text style={styles.closeTxt}>TUTUP</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 6,
  },
  brand: {
    color: colors.green,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2.4,
  },
  sub: { color: colors.textDim, fontSize: 11, marginTop: 2 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  metaTxt: { color: colors.textDim, fontSize: 11, flex: 1 },
  acts: { flexDirection: 'row', gap: 6, paddingHorizontal: 12, paddingBottom: 8 },
  act: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingVertical: 7,
  },
  actT: { color: colors.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },
  split: { flex: 1 },
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
    padding: 16,
  },
  sheet: {
    backgroundColor: colors.bgElevated,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderBright,
    padding: 18,
    maxHeight: '86%',
  },
  sheetTitle: { color: colors.text, fontSize: 18, fontWeight: '800', marginBottom: 6 },
  sheetBody: { color: colors.textMuted, fontSize: 13, lineHeight: 19, marginBottom: 12 },
  modeRow: { flexDirection: 'row', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  modeDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  modeName: { color: colors.text, fontWeight: '700', fontSize: 13 },
  modeDesc: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  modeHint: { color: colors.textDim, fontSize: 11, marginTop: 2 },
  close: {
    marginTop: 12,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.bgCard,
  },
  closeTxt: { color: colors.green, fontWeight: '800', letterSpacing: 1.2 },
});
