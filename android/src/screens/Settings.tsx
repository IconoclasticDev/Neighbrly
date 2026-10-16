import React from 'react';
import { Alert } from 'react-native';
import { Screen, H1, H2, P, Card, Button, Chip } from '../ui';
import { useApp } from '../store';

export function Settings({ navigation }: any) {
  const { reset } = useApp();
  return (
    <Screen>
      <H1>Settings</H1>
      <H2>Priorities</H2>
      <Button kind="secondary" label="Retake the 7-question quiz" onPress={() => navigation.navigate('Quiz')} />
      <H2>Language</H2>
      <Card>
        <Chip label="English" active onPress={() => {}} />
        <P muted small>Hindi and Marathi are planned for a later version.</P>
      </Card>
      <H2>About the data</H2>
      <Card><P>This build uses DEMO data so you can try the flow. No real measurements, listings or promoters are shown. Scoring will move to the Neighbrly server.</P></Card>
      <H2>Privacy</H2>
      <Card><P>Your quiz answers stay on this phone. No account, no location tracking in this version.</P></Card>
      <Button kind="danger" label="Clear saved data" onPress={() => Alert.alert('Clear data?', 'This removes your priorities and saved reports.', [{ text: 'Cancel' }, { text: 'Clear', style: 'destructive', onPress: () => { reset(); navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] }); } }])} />
    </Screen>
  );
}
