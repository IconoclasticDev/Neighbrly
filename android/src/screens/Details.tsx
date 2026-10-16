import React from 'react';
import { Text, View } from 'react-native';
import { Screen, H1, H2, P, Card, Row, Sample, Badge } from '../ui';
import { c, scoreColor, scoreLabel } from '../theme';
import { METRICS, getArea, DATE, SOURCE } from '../data';
import { checklist } from '../score';
import { useApp } from '../store';

export function Metric({ route }: any) {
  const area = getArea(route.params.id);
  const m = METRICS.find(x => x.id === route.params.metric)!;
  const e = area.entries[m.id];
  return (
    <Screen>
      <H1>[{route.params.n}] {m.label}</H1>
      <Sample />
      <P muted>{m.blurb}</P>
      {e.value === null ? (
        <Card style={{ backgroundColor: c.accentSoft, borderColor: c.accent }}>
          <H2>No data yet</H2>
          <P>{e.note}</P>
          <P>We show gaps instead of guessing. This metric is left out of the score and widens the range.</P>
          <P><Text style={{ fontWeight: '700' }}>Verify on your visit: </Text>{m.verify}</P>
        </Card>
      ) : (
        <Card>
          <Text style={{ fontSize: 48, fontWeight: '800', color: scoreColor(e.value) }}>{e.value} · {scoreLabel(e.value)}</Text>
          <Row k="Reading" v={e.raw} />
          <Row k="Source" v={SOURCE} />
          <Row k="Date" v={DATE} />
          <Row k="Coverage" v={e.coverage} />
          <Row k="Area" v={area.name} />
        </Card>
      )}
    </Screen>
  );
}
export function Price({ route }: any) {
  const a = getArea(route.params.id);
  if (!a.price) return <Screen><H1>Price Reality Check</H1><Sample/><Card><H2>No data yet</H2><P>Not enough suitable registered transactions. No price estimate is shown.</P></Card></Screen>;
  const gap = Math.round(((a.price.asking - a.price.median) / a.price.median) * 100);
  const w = Math.min(100, (a.price.median / a.price.asking) * 100);
  return (
    <Screen>
      <H1>Asking-Price Reality Check</H1>
      <Sample />
      <Card style={{ marginTop: 12 }}>
        <P>Registered median (₹ per sq ft)</P>
        <View style={{ height: 22, borderRadius: 6, backgroundColor: c.primary, width: `${w}%` }} />
        <Text style={{ fontWeight: '700', color: c.text, marginBottom: 12 }}>₹{a.price.median.toLocaleString('en-IN')}</Text>
        <P>Seller’s asking price</P>
        <View style={{ height: 22, borderRadius: 6, backgroundColor: gap > 8 ? c.risk : c.caution }} />
        <Text style={{ fontWeight: '700', color: c.text }}>₹{a.price.asking.toLocaleString('en-IN')}</Text>
      </Card>
      <P muted small>Source: {SOURCE}, {DATE}. Coverage: {a.price.deals} sample deals.</P>
      <Card>
        <Text style={{ fontSize: 20, fontWeight: '800', color: gap > 8 ? c.risk : c.text }}>{gap >= 0 ? `About ${gap}% above` : `About ${-gap}% below`} registered deals nearby</Text>
        <P muted small>Based on {a.price.deals} registered deals, {a.price.period}. Asking price is not a sale price: negotiate with evidence.</P>
      </Card>
    </Screen>
  );
}
export function Promoter({ route }: any) {
  const a = getArea(route.params.id);
  const p = a.promoter;
  if(!p)return <Screen><H1>Promoter record</H1><Sample/><Card><H2>No matched promoter</H2><P>No confirmed project-to-promoter match. We cannot attribute another builder’s record to this property.</P></Card></Screen>;
  const cell = (k: string, v: string, bad?: boolean) => (
    <Card style={{ flex: 1, margin: 4 }}><Text style={{ fontSize: 28, fontWeight: '800', color: bad ? c.risk : c.text }}>{v}</Text><P muted small>{k}</P></Card>
  );
  return (
    <Screen>
      <H1>Promoter track record</H1>
      <Sample />
      <H2>{p.name}</H2>
      <View style={{ flexDirection: 'row' }}>{cell('RERA projects', String(p.projects))}{cell('Delayed', `${p.delayed} of ${p.projects}`, p.delayed > 1)}</View>
      <View style={{ flexDirection: 'row' }}>{cell('Avg delay', `${p.avgDelayMonths} mo`, p.avgDelayMonths > 9)}{cell('Complaints', String(p.complaints), p.complaints > 5)}</View>
      <P muted small>Counts all of this promoter’s registered projects, not just this one. Source: {SOURCE}, {DATE}.</P>
    </Screen>
  );
}
export function Checklist({ route }: any) {
  const a = getArea(route.params.id);
  const { weights } = useApp();
  return (
    <Screen>
      <H1>What to verify on your visit</H1><Sample/>
      <P muted>Data cannot confirm everything. Take this list with you.</P>
      {checklist(a, weights).map((t, i) => (
        <Card key={i}><View style={{ flexDirection: 'row' }}><Text style={{ color: c.primary, fontWeight: '800', marginRight: 10 }}>{i + 1}</Text><View style={{ flex: 1 }}><P>{t}</P></View></View></Card>
      ))}
    </Screen>
  );
}
