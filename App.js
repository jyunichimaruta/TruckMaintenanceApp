// App.js
import 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, View, Platform, Button } from 'react-native';

import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import RecordsScreen from './RecordsScreen';
import FormScreen from './FormScreen'; // FormScreenを独立したファイルからインポートする (後述)

const Stack = createStackNavigator();

const App = () => {
  if (Platform.OS === 'web') {
    // Web版の場合: URLパスに基づいてコンポーネントをレンダリング
    // react-router-dom のようなルーターライブラリを使わない、簡易的な実装
    const path = window.location.pathname;
    const urlParams = new URLSearchParams(window.location.search);
    const recordId = urlParams.get('recordId');

    if (path === '/Form' || path === '/Form/') {
      return (
        <View style={styles.webContainer}>
          <FormScreen recordId={recordId} /> {/* recordIdをpropsとして渡す */}
          <StatusBar style="auto" />
        </View>
      );
    } else { // デフォルトは /Records またはその他のパス
      return (
        <View style={styles.webContainer}>
          <RecordsScreen />
          <StatusBar style="auto" />
          {/* Web版のRecordsScreenに新規登録ボタンを明示的に追加する（後述） */}
          {/* <Button title="新規登録" onPress={() => window.location.href = `${window.location.origin}/Form`} /> */}
        </View>
      );
    }
  } else {
    // ネイティブアプリの場合: react-navigationを使用
    return (
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Form"> {/* ネイティブアプリはFormを初期画面 */}
          <Stack.Screen name="Form" component={FormScreen} options={{ title: '記録の登録/編集' }} />
          <Stack.Screen name="Records" component={RecordsScreen} options={{ title: '整備記録' }} />
        </Stack.Navigator>
        <StatusBar style="auto" />
      </NavigationContainer>
    );
  }
};

const styles = StyleSheet.create({
  webContainer: {
    flex: 1,
  },
  // 他のスタイルは必要に応じて維持
});

export default App;