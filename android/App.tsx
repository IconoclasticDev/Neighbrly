import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AppProvider, useApp } from './src/store';
import { c } from './src/theme';
import { Welcome, Quiz } from './src/screens/Onboarding';
import { Home } from './src/screens/Home';
import { Report } from './src/screens/Report';
import { Metric, Price, Promoter, Checklist } from './src/screens/Details';
import { MapScreen } from './src/screens/Map';
import { Compare } from './src/screens/Compare';
import { Settings } from './src/screens/Settings';

const Stack = createNativeStackNavigator();
// Override the navigation theme: its default primary colour is blue.
const theme = { ...DefaultTheme, dark: false, colors: { ...DefaultTheme.colors, primary: c.primary, background: c.bg, card: c.bg, text: c.text, border: c.border, notification: c.risk } };

function Root() {
  const { ready, quizDone } = useApp();
  if (!ready) return <View style={{ flex: 1, backgroundColor: c.bg, justifyContent: 'center' }}><ActivityIndicator color={c.primary} size="large" /></View>;
  return (
    <NavigationContainer theme={theme}>
      <Stack.Navigator initialRouteName={quizDone ? 'Home' : 'Welcome'} screenOptions={{ headerStyle: { backgroundColor: c.bg }, headerTintColor: c.primaryDark, headerShadowVisible: false, headerTitleStyle: { color: c.text, fontWeight: '700' }, contentStyle: { backgroundColor: c.bg } }}>
        <Stack.Screen name="Welcome" component={Welcome} options={{ headerShown: false }} />
        <Stack.Screen name="Quiz" component={Quiz} options={{ title: 'Your priorities' }} />
        <Stack.Screen name="Home" component={Home} options={{ title: 'Neighbrly', headerBackVisible: false }} />
        <Stack.Screen name="Report" component={Report} options={{ title: 'Report' }} />
        <Stack.Screen name="Metric" component={Metric} options={{ title: 'Metric detail' }} />
        <Stack.Screen name="Price" component={Price} options={{ title: 'Price check' }} />
        <Stack.Screen name="Promoter" component={Promoter} options={{ title: 'Promoter' }} />
        <Stack.Screen name="Checklist" component={Checklist} options={{ title: 'Visit checklist' }} />
        <Stack.Screen name="Map" component={MapScreen} options={{title:"Explore Mumbai"}} />
        <Stack.Screen name="Compare" component={Compare} options={{ title: 'Compare' }} />
        <Stack.Screen name="Settings" component={Settings} options={{ title: 'Settings' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider><StatusBar style="dark" /><Root /></AppProvider>
    </SafeAreaProvider>
  );
}
