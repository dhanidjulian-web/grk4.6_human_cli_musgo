import React, { useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../components/Screen';
import { BackHeader } from '../components/BackHeader';
import { Badge, Empty } from '../components/ui';
import { useApp } from '../lib/AppContext';
import { colors } from '../lib/theme';
import { formatDate } from '../lib/id';
import { RootStackParamList } from '../lib/navigation';
import { SkillItem } from '../lib/types';

export function SkillsScreen() {
  const app = useApp();
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [q, setQ] = useState('');

  const data = useMemo(() => {
    const t = q.toLowerCase();
    return app.skills.filter((s) => !t || `${s.name} ${s.description} ${s.markdown}`.toLowerCase().includes(t));
  }, [app.skills, q]);

  const remove = (item: SkillItem) => {
    Alert.alert('Hapus skill', item.name, [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: () => app.removeSkill(item.id) },
    ]);
  };

  return (
    <Screen>
      <BackHeader
        title="Skills"
        subtitle="SKILL.md · kompetensi agent"
        right={
          <Pressable onPress={() => nav.navigate('SkillEditor')} style={styles.add}>
            <Ionicons name="add" size={22} color={colors.bg} />
          </Pressable>
        }
      />
      <View style={styles.search}>
        <Ionicons name="search" size={16} color={colors.textDim} />
        <TextInput value={q} onChangeText={setQ} placeholder="Cari skill…" placeholderTextColor={colors.textDim} style={styles.searchInput} />
      </View>
      <FlatList
        data={data}
        keyExtractor={(it) => it.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        ListEmptyComponent={<Empty icon="sparkles-outline" title="Belum ada skill" body="Upload, tempel, unduh, atau generate SKILL.md." />}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => nav.navigate('SkillEditor', { id: item.id })}
            onLongPress={() => remove(item)}
            style={styles.card}
          >
            <View style={styles.row}>
              <Text style={styles.name}>{item.name}</Text>
              <Switch
                value={item.enabled}
                onValueChange={(v) => app.updateSkill(item.id, { enabled: v })}
                trackColor={{ true: colors.greenDim, false: colors.border }}
                thumbColor={item.enabled ? colors.green : colors.textDim}
              />
            </View>
            <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
            <View style={styles.meta}>
              <Badge text={item.origin} color={colors.violet} />
              <Text style={styles.metaTxt}>{formatDate(item.updatedAt)}</Text>
            </View>
          </Pressable>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 10 },
  title: { color: colors.text, fontSize: 20, fontWeight: '800' },
  sub: { color: colors.textDim, fontSize: 12, marginTop: 2 },
  add: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center',
  },
  search: {
    marginHorizontal: 16, backgroundColor: colors.bgInput, borderWidth: 1,
    borderColor: colors.border, borderRadius: 12, paddingHorizontal: 12,
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  searchInput: { flex: 1, color: colors.text, height: 42 },
  card: {
    backgroundColor: colors.bgCard, borderRadius: 14, borderWidth: 1,
    borderColor: colors.border, padding: 14, marginBottom: 10,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  name: { flex: 1, color: colors.text, fontWeight: '800', fontSize: 15 },
  desc: { color: colors.textMuted, fontSize: 13, marginTop: 6, lineHeight: 18 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  metaTxt: { color: colors.textDim, fontSize: 11 },
});
