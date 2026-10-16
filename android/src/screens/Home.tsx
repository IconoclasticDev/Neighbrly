import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Screen, H1, H2, P, Card, Button, Sample } from '../ui';
import { c, scoreColor, scoreLabel } from '../theme';
import { AREAS } from '../data';
import { computeScore } from '../score';
import { useApp } from '../store';

export function Home({ navigation }: any) {
  const { weights, quizDone, saved } = useApp();
  return (
    <Screen>
      <H1>Where are you looking?</H1>
      <Sample />
      <View style={{ height: 10 }} />
      {!quizDone && (
        <Card style={{ backgroundColor: c.accentSoft, borderColor: c.accent }}>
          <P>Scores use equal weights until you set your priorities.</P>
          <Button label="Take the 7-question quiz" onPress={() => navigation.navigate('Quiz')} />
        </Card>
      )}
      <Button kind="secondary" label="Explore on the Leaflet map" onPress={() => navigation.navigate('Map')} />
      <H2>Areas</H2>
      {AREAS.map(a => {
        const s = computeScore(a, weights);
        return (
          <Card key={a.id} onPress={() => navigation.navigate('Report', { id: a.id })}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 17, fontWeight: '700', color: c.text }}>{a.name}</Text>
                <P muted small>{a.tagline}{saved.includes(a.id) ? '  •  Saved' : ''}</P>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 28, fontWeight: '800', color: scoreColor(s.score) }}>{s.score ?? "—"}</Text><P small>{scoreLabel(s.score)}</P>
                <P muted small>{s.used} of {s.total} · {s.coverage}% weight covered</P>
              </View>
            </View>
          </Card>
        );
      })}
      <Button kind="secondary" label="Compare two areas" onPress={() => navigation.navigate('Compare')} />
      <Pressable accessibilityRole="button" accessibilityLabel="Settings" onPress={() => navigation.navigate('Settings')} style={{ alignSelf: 'center', padding: 14 }}>
        <Text style={{ color: c.primaryDark, fontWeight: '700' }}>Settings</Text>
      </Pressable>
    </Screen>
  );
}
