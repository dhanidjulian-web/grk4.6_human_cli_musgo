import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, radius, spacing } from '../lib/theme';

export function Chip({
  label,
  active,
  color,
  onPress,
  icon,
}: {
  label: string;
  active?: boolean;
  color?: string;
  onPress?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  const c = color || colors.green;
  return (
    <Pressable
      onPress={onPress}
      style={[{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: radius.full,
        borderWidth: 1,
        borderColor: active ? c : colors.border,
        backgroundColor: active ? `${c}22` : colors.bgCard,
      }]}
    >
      {icon ? <Ionicons name={icon} size={12} color={active ? c : colors.textMuted} /> : null}
      <Text style={{ color: active ? c : colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 0.6 }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.section}>{title}</Text>
      {action ? (
        <Pressable onPress={onAction}>
          <Text style={styles.action}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  secure,
  keyboardType,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  multiline?: boolean;
  secure?: boolean;
  keyboardType?: 'default' | 'url' | 'email-address';
  autoCapitalize?: 'none' | 'sentences';
}) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textDim}
        multiline={multiline}
        secureTextEntry={secure}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize || 'none'}
        autoCorrect={false}
        style={[styles.input, multiline ? { minHeight: 110, textAlignVertical: 'top' } : null]}
      />
    </View>
  );
}

export function PrimaryButton({
  title,
  onPress,
  icon,
  color,
  disabled,
}: {
  title: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  color?: string;
  disabled?: boolean;
}) {
  const c = color || colors.green;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[{
        backgroundColor: disabled ? colors.border : c,
        borderRadius: radius.md,
        paddingVertical: 13,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        opacity: disabled ? 0.6 : 1,
      }]}
    >
      {icon ? <Ionicons name={icon} size={16} color={colors.bg} /> : null}
      <Text style={{ color: colors.bg, fontWeight: '800', fontSize: 14 }}>{title}</Text>
    </Pressable>
  );
}

export function GhostButton({
  title,
  onPress,
  icon,
  danger,
}: {
  title: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  danger?: boolean;
}) {
  const c = danger ? colors.coral : colors.textMuted;
  return (
    <Pressable onPress={onPress} style={styles.ghost}>
      {icon ? <Ionicons name={icon} size={16} color={c} /> : null}
      <Text style={{ color: c, fontWeight: '700', fontSize: 13 }}>{title}</Text>
    </Pressable>
  );
}

export function Empty({
  icon,
  title,
  body,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
}) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={28} color={colors.green} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
    </View>
  );
}

export function Badge({ text, color }: { text: string; color?: string }) {
  const c = color || colors.green;
  return (
    <View style={{ backgroundColor: `${c}22`, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, borderWidth: 1, borderColor: `${c}55` }}>
      <Text style={{ color: c, fontSize: 10, fontWeight: '800', letterSpacing: 0.4 }}>{text}</Text>
    </View>
  );
}

export function Row({
  icon,
  title,
  subtitle,
  right,
  onPress,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  color?: string;
}) {
  const inner = (
    <View style={styles.row}>
      <View style={[styles.rowIcon, { backgroundColor: `${color || colors.green}18` }]}>
        <Ionicons name={icon} size={18} color={color || colors.green} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle} numberOfLines={1}>{title}</Text>
        {subtitle ? <Text style={styles.rowSub} numberOfLines={2}>{subtitle}</Text> : null}
      </View>
      {right}
      {onPress ? <Ionicons name="chevron-forward" size={16} color={colors.textDim} /> : null}
    </View>
  );
  if (onPress) return <Pressable onPress={onPress}>{inner}</Pressable>;
  return inner;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  },
  section: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  action: {
    color: colors.green,
    fontSize: 12,
    fontWeight: '700',
  },
  fieldLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: colors.bgInput,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    color: colors.text,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  ghost: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 28,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.greenBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.greenDim,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptyBody: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  rowSub: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
});

export const textStyles: Record<string, TextStyle> = {};
