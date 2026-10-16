import React from 'react';
import { Share, Text, View } from 'react-native';
import { Screen, H1, H2, P, Card, Button, RangeBar, MiniBar, Sample, Badge } from '../ui';
import { c, scoreColor, scoreLabel } from '../theme';
import { METRICS, getArea, DATE, SOURCE } from '../data';
import { computeScore, summarise } from '../score';
import { useApp } from '../store';

export function Report({ route, navigation }: any) {
  const area = getArea(route.params.id);
  const { weights, saved, toggleSaved } = useApp();
  const s = computeScore(area, weights);
  const lines = summarise(area, weights);
  const share = () => Share.share({
    message: `Neighbrly report: ${area.name}\nObserved score ${s.score ?? 'unavailable'}, missing-data bounds ${s.lo}–${s.hi} (not a confidence interval), ${s.used} of ${s.total} metrics.\nDEMO DATA — invented observations, ${DATE}.\n${lines.map(l=>`${l.text} [${l.ref}]`).join('\n')}\nSource: Invented demonstration dataset. Verify independently.`,
  });
  return (
    <Screen>
      <H1>{area.name}</H1>
      <Sample />
      <Card style={{ marginTop: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
          <Text accessibilityLabel={`${s.score ?? "Unavailable"}, ${scoreLabel(s.score)}, missing-data bounds ${s.lo} to ${s.hi}`} style={{ fontSize: 56, fontWeight: '800', color: scoreColor(s.score) }}>{s.score ?? "—"}</Text>
          <Text style={{ fontSize: 18, color: c.muted, marginLeft: 8 }}></Text>
        </View>
        <P>{scoreLabel(s.score)} match for your priorities · {s.used} of {s.total} metrics</P>
        <RangeBar score={s.score} lo={s.lo} hi={s.hi} />
        <P muted small>Missing-data bounds: {s.lo}–{s.hi}. Missing scores are assigned 0 or 100. This is not a confidence interval and does not capture measurement uncertainty.</P>
      </Card>

      <H2>Summary</H2>
      <Card>
        {lines.map(l => (
          <P key={l.ref}>{l.text} <Text style={{ color: c.primaryDark, fontWeight: '700' }}>[{l.ref}]</Text></P>
        ))}
        <P muted small>Every sentence cites a metric below. Source: {SOURCE}, {DATE}.</P>
      </Card>

      <H2>Metrics</H2>
      {METRICS.map((m, i) => {
        const e = area.entries[m.id];
        return (
          <Card key={m.id} onPress={() => navigation.navigate('Metric', { id: area.id, metric: m.id, n: i + 1 })}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ fontWeight: '700', color: c.text }}>[{i + 1}] {m.label}</Text>
              {e.value === null ? <Badge label="No data yet" color={c.text} bg={c.accentSoft} /> : <Text style={{ fontWeight: '700', color: scoreColor(e.value) }}>{e.value} · {scoreLabel(e.value)}</Text>}
            </View>
            {e.value !== null && <MiniBar value={e.value} />}
          </Card>
        );
      })}

      <H2>Go deeper</H2>
      <Button kind="secondary" label="Asking-Price Reality Check" onPress={() => navigation.navigate('Price', { id: area.id })} />
      <Button kind="secondary" label="Promoter track record" onPress={() => navigation.navigate('Promoter', { id: area.id })} />
      <Button label="What to verify on your visit" onPress={() => navigation.navigate('Checklist', { id: area.id })} />
      <Button kind="secondary" label={saved.includes(area.id) ? 'Remove from saved' : 'Save this report'} onPress={() => toggleSaved(area.id)} />
      <Button kind="secondary" label="Share" onPress={share} />
    </Screen>
  );
}
