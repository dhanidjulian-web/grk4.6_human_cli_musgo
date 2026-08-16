import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../lib/theme';

export function BackHeader({
  title,
  subtitle,
  right,
  onBack,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onBack?: () => void;
}) {
  const nav = useNavigation<any>();
  const back = () => {
    if (onBack) {
      onBack();
      return;
    }
    if (nav.canGoBack && nav.canGoBack()) {
      nav.goBack();
      return;
    }
    nav.navigate('Console');
  };

  return (
    <View style={styles.row}>
      <Pressable onPress={back} style={styles.back} accessibilityRole="button" accessibilityLabel="Back">
        <Ionicons name="chevron-back" size={22} color={colors.green} />
      </Pressable>
      <View style={{ flex: 1 }}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {subtitle ? <Text style={styles.sub} numberOfLines={1}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 8,
    gap: 4,
  },
  back: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  title: { color: colors.text, fontSize: 18, fontWeight: '800' },
  sub: { color: colors.textDim, fontSize: 11, marginTop: 2 },
});
