// index.js
import { AppRegistry } from 'react-native';
import App from './App'; // ルートのApp.jsをインポート
import { name as appName } from './app.json';

// ネイティブアプリ専用のエントリーポイント
AppRegistry.registerComponent(appName, () => App);