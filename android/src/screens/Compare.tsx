import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Screen, H1, H2, P, Card, Chip, Sample } from '../ui';
import { c, scoreColor } from '../theme';
import { AREAS, METRICS } from '../data';
import { computeScore } from '../score';
import { useApp } from '../store';

export function Compare() {
  const { weights } = useApp();
  const [a, setA] = useState(AREAS[0].id);
  const [b, setB] = useState(AREAS[1].id);
  const A = AREAS.find(x => x.id === a)!; const B = AREAS.find(x => x.id === b)!;
  const sa = computeScore(A, weights); const sb = computeScore(B, weights);
  const cell = (v: number | null, other: number | null) => (
    <Text style={{ flex: 1, textAlign: 'center', fontWeight: v !== null && other !== null && v > other ? '800' : '500', color: v === null ? c.muted : scoreColor(v) }}>{v === null ? 'No data' : `${v} · ${v>=75?'Strong':v>=55?'Mixed':'Weak'}`}</Text>
  );
  return (
    <Screen>
      <H1>Compare</H1>
      <Sample />
      <H2>First area</H2>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{AREAS.map(x => <Chip key={x.id} label={x.name.replace('Demo ', '')} active={a === x.id} onPress={() => setA(x.id)} />)}</View>
      <H2>Second area</H2>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{AREAS.map(x => <Chip key={x.id} label={x.name.replace('Demo ', '')} active={b === x.id} onPress={() => setB(x.id)} />)}</View>
      <Card style={{ marginTop: 12 }}>
        <View style={{ flexDirection: 'row', paddingBottom: 8 }}>
          <Text style={{ flex: 1.4 }} />
          <Text style={{ flex: 1, textAlign: 'center', fontWeight: '700', color: c.text }}>{A.name.replace('Demo ', '')}</Text>
          <Text style={{ flex: 1, textAlign: 'center', fontWeight: '700', color: c.text }}>{B.name.replace('Demo ', '')}</Text>
        </View>
        <View style={{ flexDirection: 'row', paddingVertical: 8, borderTopWidth: 1, borderColor: c.border }}>
          <Text style={{ flex: 1.4, fontWeight: '700', color: c.text }}>Your score</Text>
          {cell(sa.score, sb.score)}{cell(sb.score, sa.score)}
        </View>
        <P muted small>Missing-data bounds: {sa.lo}–{sa.hi} vs {sb.lo}–{sb.hi}. These are sensitivity bounds, not statistical confidence intervals.</P>
        {METRICS.map(m => (
          <View key={m.id} style={{ flexDirection: 'row', paddingVertical: 8, borderTopWidth: 1, borderColor: c.border }}>
            <Text style={{ flex: 1.4, color: c.text }}>{m.label}</Text>
            {cell(A.entries[m.id].value, B.entries[m.id].value)}{cell(B.entries[m.id].value, A.entries[m.id].value)}
          </View>
        ))}
      </Card>
    </Screen>
  );
}
