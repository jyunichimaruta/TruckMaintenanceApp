// App.js
import 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, View, Platform } from 'react-native'; // ButtonはRecordsScreenに移動したので削除

import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import RecordsScreen from './RecordsScreen';
import FormScreen from './FormScreen';

const Stack = createStackNavigator();

// screen prop を受け取るように変更
const App = ({ screen, recordId }) => { // recordIdも受け取る
  if (Platform.OS === 'web') {
    // Web版の場合: web/index.js から渡された screen prop に応じてコンポーネントをレンダリング
    if (screen === 'Form') {
      return (
        <View style={styles.webContainer}>
          <FormScreen recordId={recordId} /> {/* recordIdをFormScreenに渡す */}
          <StatusBar style="auto" />
        </View>
      );
    } else { // screen === 'Records' またはその他
      return (
        <View style={styles.webContainer}>
          <RecordsScreen />
          <StatusBar style="auto" />
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