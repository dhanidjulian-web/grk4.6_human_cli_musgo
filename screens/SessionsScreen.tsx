import React from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../components/Screen';
import { BackHeader } from '../components/BackHeader';
import { Empty } from '../components/ui';
import { useApp } from '../lib/AppContext';
import { colors } from '../lib/theme';
import { formatDate } from '../lib/id';
import { getMode } from '../lib/modes';
import { RootStackParamList } from '../lib/navigation';
import { Session } from '../lib/types';

export function SessionsScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'Sessions'>) {
  const app = useApp();

  const open = (id: string) => {
    app.openSession(id);
    navigation.goBack();
  };

  const remove = (item: Session) => {
    Alert.alert('Hapus sesi', item.title, [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: () => app.deleteSession(item.id) },
    ]);
  };

  return (
    <Screen>
      <BackHeader
        title="Sesi"
        right={
          <Pressable onPress={app.newSession} style={styles.back}>
            <Ionicons name="add" size={22} color={colors.green} />
          </Pressable>
        }
      />
      <FlatList
        data={app.sessions}
        keyExtractor={(it) => it.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        ListEmptyComponent={<Empty icon="time-outline" title="Belum ada sesi" body="Mulai percakapan dari konsol." />}
        renderItem={({ item }) => {
          const m = getMode(item.lastMode);
          const active = item.id === app.activeSessionId;
          return (
            <Pressable onPress={() => open(item.id)} onLongPress={() => remove(item)} style={[styles.card, active && styles.active]}>
              <View style={styles.row}>
                <Text style={styles.name} numberOfLines={1}>{item.title}</Text>
                <Text style={[styles.mode, { color: m.color }]}>{m.short}</Text>
              </View>
              <Text style={styles.meta}>
                {item.messages.length} pesan · {item.lines.length} baris · {formatDate(item.updatedAt)}
              </Text>
            </Pressable>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingBottom: 8 },
  back: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, textAlign: 'center', color: colors.text, fontSize: 16, fontWeight: '800' },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 10,
  },
  active: { borderColor: colors.greenDim },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { flex: 1, color: colors.text, fontWeight: '700', fontSize: 14 },
  mode: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
  meta: { color: colors.textDim, fontSize: 11, marginTop: 6 },
});
