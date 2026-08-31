import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../lib/store';
import { mono, radius, shadowFor } from '../lib/theme';

/* ------------------------------- primitives ----------------------------- */

export function Card({ children, style, pad = 14 }: { children: React.ReactNode; style?: ViewStyle; pad?: number }) {
  const t = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: t.surface,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: t.border,
          padding: pad,
        },
        shadowFor(t, 1),
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Row({ children, style, gap = 8, align = 'center' }: { children: React.ReactNode; style?: ViewStyle; gap?: number; align?: ViewStyle['alignItems'] }) {
  return <View style={[{ flexDirection: 'row', alignItems: align, gap }, style]}>{children}</View>;
}

export function Divider({ inset = 0 }: { inset?: number }) {
  const t = useTheme();
  return <View style={{ height: 1, backgroundColor: t.border, marginLeft: inset }} />;
}

export function Btn({
  label,
  onPress,
  icon,
  variant = 'soft',
  disabled,
  loading,
  style,
  size = 'md',
}: {
  label: string;
  onPress?: () => void;
  icon?: string;
  variant?: 'primary' | 'soft' | 'ghost' | 'danger' | 'outline';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  size?: 'sm' | 'md';
}) {
  const t = useTheme();
  const bg =
    variant === 'primary'
      ? t.accent
      : variant === 'danger'
        ? t.name === 'dark' ? 'rgba(248,113,113,0.14)' : 'rgba(220,38,38,0.10)'
        : variant === 'soft'
          ? t.accentSoft
          : variant === 'outline'
            ? 'transparent'
            : 'transparent';
  const fg =
    variant === 'primary'
      ? t.onAccent
      : variant === 'danger'
        ? t.danger
        : variant === 'soft' || variant === 'outline'
          ? t.accent
          : t.textDim;
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={isDisabled ? undefined : onPress}
      style={({ pressed }) => [
        {
          backgroundColor: bg,
          borderColor: variant === 'outline' ? t.border : 'transparent',
          borderWidth: variant === 'outline' ? 1 : 0,
          borderRadius: radius.md,
          paddingHorizontal: size === 'sm' ? 10 : 14,
          paddingVertical: size === 'sm' ? 7 : 10,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          opacity: isDisabled ? 0.45 : pressed ? 0.75 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={fg} />
      ) : (
        <>
          {icon ? <MaterialCommunityIcons name={icon as never} size={size === 'sm' ? 15 : 17} color={fg} /> : null}
          <Text style={{ color: fg, fontWeight: '700', fontSize: size === 'sm' ? 12.5 : 14 }}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

export function IconBtn({
  name,
  onPress,
  size = 22,
  color,
  style,
  active,
}: {
  name: string;
  onPress?: () => void;
  size?: number;
  color?: string;
  style?: ViewStyle;
  active?: boolean;
}) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [
        {
          width: size + 18,
          height: size + 18,
          borderRadius: radius.md,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: active ? t.accentSoft : 'transparent',
          opacity: pressed ? 0.6 : 1,
        },
        style,
      ]}
    >
      <MaterialCommunityIcons name={name as never} size={size} color={color ?? t.textDim} />
    </Pressable>
  );
}

export function Chip({
  label,
  onPress,
  selected,
  icon,
  style,
}: {
  label: string;
  onPress?: () => void;
  selected?: boolean;
  icon?: string;
  style?: ViewStyle;
}) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          paddingHorizontal: 11,
          paddingVertical: 7,
          borderRadius: radius.pill,
          borderWidth: 1,
          borderColor: selected ? t.accent : t.border,
          backgroundColor: selected ? t.accentSoft : t.surfaceAlt,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 5,
          opacity: pressed ? 0.7 : 1,
        },
        style,
      ]}
    >
      {icon ? <MaterialCommunityIcons name={icon as never} size={13} color={selected ? t.accent : t.textDim} /> : null}
      <Text style={{ color: selected ? t.accent : t.textDim, fontWeight: '600', fontSize: 12.5 }}>{label}</Text>
    </Pressable>
  );
}

export function Badge({ label, tone = 'dim' }: { label: string; tone?: 'accent' | 'info' | 'warn' | 'danger' | 'dim' | 'ok' }) {
  const t = useTheme();
  const map: Record<string, string> = {
    accent: t.accent,
    info: t.info,
    warn: t.warn,
    danger: t.danger,
    ok: t.ok,
    dim: t.textFaint,
  };
  const c = map[tone];
  return (
    <View style={{ paddingHorizontal: 7, paddingVertical: 3, borderRadius: radius.sm, backgroundColor: c + '22' }}>
      <Text style={{ color: c, fontSize: 10.5, fontWeight: '800', letterSpacing: 0.4 }}>{label.toUpperCase()}</Text>
    </View>
  );
}

export function Meter({ value, tone }: { value: number; tone?: string }) {
  const t = useTheme();
  const pct = Math.max(0, Math.min(1, value));
  return (
    <View style={{ height: 6, borderRadius: 3, backgroundColor: t.surfaceHigh, overflow: 'hidden' }}>
      <View style={{ width: `${pct * 100}%`, height: '100%', backgroundColor: tone ?? t.accent, borderRadius: 3 }} />
    </View>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  secure,
  keyboardType,
  multiline,
  hint,
  maxLength,
  autoCapitalize,
  onSubmitEditing,
  style,
}: {
  label?: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  secure?: boolean;
  keyboardType?: KeyboardTypeOptions;
  multiline?: boolean;
  hint?: string;
  maxLength?: number;
  autoCapitalize?: 'none' | 'sentences' | 'words';
  onSubmitEditing?: () => void;
  style?: ViewStyle;
}) {
  const t = useTheme();
  const [hidden, setHidden] = React.useState(true);
  return (
    <View style={[{ gap: 6 }, style]}>
      {label ? (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: t.textDim, fontSize: 11.5, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase' }}>{label}</Text>
          {hint ? <Text style={{ color: t.textFaint, fontSize: 11 }}>{hint}</Text> : null}
        </View>
      ) : null}
      <View
        style={{
          flexDirection: 'row',
          alignItems: multiline ? 'flex-start' : 'center',
          backgroundColor: t.surfaceAlt,
          borderWidth: 1,
          borderColor: t.border,
          borderRadius: radius.md,
          paddingHorizontal: 12,
          paddingVertical: multiline ? 10 : Platform.OS === 'ios' ? 11 : 6,
        }}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={t.textFaint}
          secureTextEntry={secure ? hidden : false}
          keyboardType={keyboardType}
          multiline={multiline}
          maxLength={maxLength}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          onSubmitEditing={onSubmitEditing}
          style={{
            flex: 1,
            color: t.text,
            fontSize: 14.5,
            minHeight: multiline ? 96 : undefined,
            textAlignVertical: multiline ? 'top' : 'center',
            paddingTop: multiline ? 2 : 0,
          }}
        />
        {secure ? (
          <Pressable onPress={() => setHidden((h) => !h)} hitSlop={8}>
            <MaterialCommunityIcons name={hidden ? 'eye-off' : 'eye'} size={18} color={t.textFaint} />
          </Pressable>
        ) : null}
      </View>
      {maxLength ? (
        <Text style={{ color: t.textFaint, fontSize: 10.5, textAlign: 'right' }}>
          {value.length.toLocaleString('id-ID')} / {maxLength.toLocaleString('id-ID')} karakter
        </Text>
      ) : null}
    </View>
  );
}

export function Toggle({ value, onValueChange }: { value: boolean; onValueChange: (v: boolean) => void }) {
  const t = useTheme();
  return <Switch value={value} onValueChange={onValueChange} trackColor={{ true: t.accent, false: t.surfaceHigh }} thumbColor={t.name === 'dark' ? '#fff' : '#fff'} />;
}

export function Segmented({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', backgroundColor: t.surfaceAlt, borderRadius: radius.md, padding: 3, gap: 3 }}>
      {options.map((o) => {
        const sel = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            style={{
              flex: 1,
              paddingVertical: 8,
              borderRadius: radius.sm + 2,
              backgroundColor: sel ? t.surface : 'transparent',
              alignItems: 'center',
              borderWidth: sel ? 1 : 0,
              borderColor: t.border,
            }}
          >
            <Text style={{ color: sel ? t.text : t.textDim, fontWeight: '700', fontSize: 13 }}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  actionLabel,
  onAction,
}: {
  icon: string;
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const t = useTheme();
  return (
    <View style={{ alignItems: 'center', paddingVertical: 40, paddingHorizontal: 28, gap: 10 }}>
      <View
        style={{
          width: 62,
          height: 62,
          borderRadius: 22,
          backgroundColor: t.accentSoft,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <MaterialCommunityIcons name={icon as never} size={30} color={t.accent} />
      </View>
      <Text style={{ color: t.text, fontSize: 16.5, fontWeight: '800', marginTop: 4 }}>{title}</Text>
      <Text style={{ color: t.textDim, fontSize: 13.5, textAlign: 'center', lineHeight: 19 }}>{body}</Text>
      {actionLabel ? <Btn label={actionLabel} onPress={onAction} variant="soft" style={{ marginTop: 8 }} /> : null}
    </View>
  );
}

/* --------------------------------- header -------------------------------- */

export function ScreenHeader({
  title,
  subtitle,
  onBack,
  right,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
}) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        paddingTop: insets.top + 6,
        paddingBottom: 12,
        paddingHorizontal: 12,
        backgroundColor: t.bg,
        borderBottomWidth: 1,
        borderBottomColor: t.border,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
      }}
    >
      {onBack ? <IconBtn name="chevron-left" onPress={onBack} size={26} color={t.text} /> : <View style={{ width: 8 }} />}
      <View style={{ flex: 1 }}>
        <Text style={{ color: t.text, fontSize: 17, fontWeight: '800' }} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={{ color: t.textDim, fontSize: 12, marginTop: 1 }} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
    </View>
  );
}

/* --------------------------------- sheet --------------------------------- */

export function Sheet({
  visible,
  onClose,
  title,
  children,
  footer,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' }}
      >
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View
          style={{
            backgroundColor: t.bg,
            borderTopLeftRadius: radius.xl,
            borderTopRightRadius: radius.xl,
            borderTopWidth: 1,
            borderColor: t.border,
            maxHeight: '88%',
            paddingBottom: Math.max(insets.bottom, 12),
          }}
        >
          <View style={{ alignItems: 'center', paddingTop: 10 }}>
            <View style={{ width: 42, height: 4, borderRadius: 2, backgroundColor: t.surfaceHigh }} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10 }}>
            <Text style={{ flex: 1, color: t.text, fontSize: 16.5, fontWeight: '800' }}>{title}</Text>
            <IconBtn name="close" onPress={onClose} size={20} />
          </View>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16, gap: 14 }} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
          {footer ? (
            <View style={{ paddingHorizontal: 16, paddingTop: 10, borderTopWidth: 1, borderTopColor: t.border, flexDirection: 'row', gap: 10 }}>
              {footer}
            </View>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function SectionTitle({ text, right }: { text: string; right?: React.ReactNode }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
      <Text style={{ color: t.textDim, fontSize: 11.5, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' }}>{text}</Text>
      {right}
    </View>
  );
}

export function ListRow({
  icon,
  iconTint,
  title,
  subtitle,
  right,
  onPress,
  badge,
}: {
  icon?: string;
  iconTint?: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  badge?: React.ReactNode;
}) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 12,
        opacity: pressed && onPress ? 0.65 : 1,
      })}
    >
      {icon ? (
        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            backgroundColor: (iconTint ?? t.accent) + '1F',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MaterialCommunityIcons name={icon as never} size={20} color={iconTint ?? t.accent} />
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ color: t.text, fontSize: 14.5, fontWeight: '700' }} numberOfLines={1}>
            {title}
          </Text>
          {badge}
        </View>
        {subtitle ? (
          <Text style={{ color: t.textDim, fontSize: 12.5, marginTop: 2 }} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ?? <MaterialCommunityIcons name="chevron-right" size={20} color={t.textFaint} />}
    </Pressable>
  );
}

export function Mono({ children, size = 12, color }: { children: React.ReactNode; size?: number; color?: string }) {
  const t = useTheme();
  return <Text style={[{ fontFamily: mono, fontSize: size, color: color ?? t.textDim } as TextStyle]}>{children}</Text>;
}

export function Scroll({ children, contentStyle }: { children: React.ReactNode; contentStyle?: ViewStyle }) {
  const t = useTheme();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.bg }}
      contentContainerStyle={[{ padding: 16, paddingBottom: 40, gap: 14 }, contentStyle]}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}
