import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Screen, H1, P, Button, Card } from '../ui';
import { c } from '../theme';
import { QUIZ } from '../data';
import { MetricId } from '../data';
import { weightsFromAnswers } from '../score';
import { useApp } from '../store';

export function Welcome({ navigation }: any) {
  return (
    <Screen>
      <View style={{ height: 24 }} />
      <Text style={{ fontSize: 40, fontWeight: '800', color: c.primaryDark }}>Neighbrly</Text>
      <P muted>Know the neighbourhood before you sign.</P>
      <View style={{ height: 16 }} />
      {['Independent: no builder or broker input in any score', 'Transparent: every number shows its source, date and coverage', 'Honest: missing data is shown, never guessed'].map(t => (
        <Card key={t}><P>{t}</P></Card>
      ))}
      <Button label="Set my priorities (7 quick questions)" onPress={() => navigation.navigate('Quiz')} />
      <Button kind="secondary" label="Skip for now" onPress={() => navigation.reset({index:0,routes:[{name:'Home'}]})} />
    </Screen>
  );
}
export function Quiz({ navigation }: any) {
  const [i, setI] = useState(0);
  const [ans, setAns] = useState<MetricId[]>([]);
  const { setWeights } = useApp();
  const q = QUIZ[i];
  const pick = (m: MetricId) => {
    const next = [...ans, m];
    if (i === QUIZ.length - 1) { setWeights(weightsFromAnswers(next)); navigation.reset({index:0,routes:[{name:'Home'}]}); }
    else { setAns(next); setI(i + 1); }
  };
  return (
    <Screen>
      <P muted>Question {i + 1} of {QUIZ.length}</P>
      <View style={{ height: 8, borderRadius: 4, backgroundColor: c.track, marginBottom: 20 }}>
        <View style={{ width: `${((i + 1) / QUIZ.length) * 100}%`, height: 8, borderRadius: 4, backgroundColor: c.primary }} />
      </View>
      <H1>{q.q}</H1>
      <Card onPress={() => pick(q.a.m)}><Text style={{ fontSize: 18, fontWeight: '700', color: c.text }}>{q.a.label}</Text></Card>
      <Card onPress={() => pick(q.b.m)}><Text style={{ fontSize: 18, fontWeight: '700', color: c.text }}>{q.b.label}</Text></Card>
      <P muted small>Your answers stay on this phone and set your own weights.</P>
    </Screen>
  );
}
