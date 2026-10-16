import React from 'react';
import {View} from 'react-native';
import {WebView} from 'react-native-webview';
import {Screen,H1,P,Sample} from '../ui';
import {mapHtml} from '../mapHtml';
export function MapScreen({navigation}:any){return <Screen><H1>Explore Mumbai</H1><Sample/><P>Tap demo marker A, B or C to open a report. Markers are illustrative; they are not verified neighbourhood measurements.</P><View style={{height:440,borderRadius:14,overflow:'hidden'}}><WebView source={{html:mapHtml}} originWhitelist={['about:*']} javaScriptEnabled domStorageEnabled={false} onShouldStartLoadWithRequest={r=>r.url==='about:blank'} onMessage={e=>{try{const m=JSON.parse(e.nativeEvent.data);if(['a','b','c'].includes(m.id))navigation.navigate('Report',{id:m.id});}catch{}}}/></View><P muted small>Ward boundaries: Sanjana, mumbai_spatial_data, CC BY 4.0. Boundaries are simplified for this overview.</P></Screen>;}
