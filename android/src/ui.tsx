import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, ViewStyle } from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import { c, radius, scoreColor, scoreFill } from './theme';

export function Screen({ children }: { children: React.ReactNode }) {
  const insets=useSafeAreaInsets();
  return <ScrollView style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={{ padding: 16, paddingTop:Math.max(16,insets.top), paddingBottom: Math.max(40,insets.bottom+16) }}>{children}</ScrollView>;
}
export function H1({ children }: { children: React.ReactNode }) { return <Text style={s.h1}>{children}</Text>; }
export function H2({ children }: { children: React.ReactNode }) { return <Text style={s.h2}>{children}</Text>; }
export function P({ children, muted, small }: { children: React.ReactNode; muted?: boolean; small?: boolean }) {
  return <Text style={[s.p, muted && { color: c.muted }, small && { fontSize: 13 }]}>{children}</Text>;
}
export function Card({ children, style, onPress }: { children: React.ReactNode; style?: ViewStyle; onPress?: () => void }) {
  if (onPress) return <Pressable accessibilityRole="button" onPress={onPress} android_ripple={{ color: c.primarySoft }} style={[s.card, style]}>{children}</Pressable>;
  return <View style={[s.card, style]}>{children}</View>;
}
export function Button({ label, onPress, kind = 'primary' }: { label: string; onPress: () => void; kind?: 'primary' | 'secondary' | 'danger' }) {
  const bg = kind === 'primary' ? c.primary : c.surface;
  const fg = kind === 'primary' ? c.white : kind === 'danger' ? c.risk : c.primaryDark;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} android_ripple={{ color: c.primarySoft }}
      style={[s.btn, { backgroundColor: bg, borderColor: kind === 'primary' ? c.primary : c.border }]}>
      <Text style={{ color: fg, fontSize: 16, fontWeight: '700' }}>{label}</Text>
    </Pressable>
  );
}
export function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{selected:!!active}} onPress={onPress} style={[s.chip, active && { backgroundColor: c.primary, borderColor: c.primary }]}>
      <Text style={{ color: active ? c.white : c.text, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}
export function Badge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return <View style={[s.badge, { backgroundColor: bg }]}><Text style={{ color, fontSize: 12, fontWeight: '700' }}>{label}</Text></View>;
}
export function Sample() {
  return <Badge label="DEMO DATA" color={c.text} bg={c.accentSoft} />;
}
// Score with a visible uncertainty band
export function RangeBar({ score, lo, hi }: { score: number | null; lo: number; hi: number }) {
  const col = scoreFill(score);
  if(score===null)return <P>Not enough evidence for a score.</P>;
  return (
    <View style={{ height: 22, justifyContent: 'center', marginTop: 8 }}>
      <View style={{ height: 10, borderRadius: 5, backgroundColor: c.track }} />
      <View style={{ position: 'absolute', left: `${lo}%`, width: `${Math.max(hi - lo, 1)}%`, height: 10, borderRadius: 5, backgroundColor: col, opacity: 0.45 }} />
      <View style={{ position: 'absolute', left: `${score}%`, marginLeft: -9, width: 18, height: 18, borderRadius: 9, backgroundColor: c.white, borderWidth: 3, borderColor: col }} />
    </View>
  );
}
export function MiniBar({ value }: { value: number }) {
  return (
    <View style={{ height: 8, borderRadius: 4, backgroundColor: c.track, flex: 1 }}>
      <View style={{ width: `${value}%`, height: 8, borderRadius: 4, backgroundColor: scoreFill(value) }} />
    </View>
  );
}
export function Row({ k, v }: { k: string; v: string }) {
  return (
    <View style={s.row}><Text style={{ color: c.muted, width: 110 }}>{k}</Text><Text style={{ color: c.text, flex: 1, fontWeight: '600' }}>{v}</Text></View>
  );
}
const s = StyleSheet.create({
  h1: { fontSize: 26, fontWeight: '800', color: c.text, marginBottom: 6 },
  h2: { fontSize: 18, fontWeight: '700', color: c.text, marginTop: 18, marginBottom: 8 },
  p: { fontSize: 15, color: c.text, lineHeight: 22, marginBottom: 6 },
  card: { backgroundColor: c.surface, borderRadius: radius, borderWidth: 1, borderColor: c.border, padding: 14, marginBottom: 10 },
  btn: { borderRadius: 12, borderWidth: 1, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  chip: {minHeight:48,justifyContent:'center', borderRadius: 20, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8, marginBottom: 8 },
  badge: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  row: { minHeight:48, flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: c.border },
});
