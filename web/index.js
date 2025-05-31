// web/index.js
import { AppRegistry, Platform } from 'react-native';
import App from '../App'; // ルートのApp.jsをインポート
import { name as appName } from '../app.json';

// Web版専用のルーティングコンポーネント
// ここでwindow.location.pathnameを直接見て、表示するコンポーネントを切り替える
const WebApp = () => {
  const path = window.location.pathname;
  const urlParams = new URLSearchParams(window.location.search);
  const recordId = urlParams.get('recordId');

  if (path === '/Form' || path === '/Form/') {
    return <App screen="Form" recordId={recordId} />; // Appにpropsとして渡す
  } else { // デフォルトは /Records またはその他のパス
    return <App screen="Records" />; // Appにpropsとして渡す
  }
};

if (Platform.OS === 'web') {
  AppRegistry.registerComponent(appName, () => WebApp); // WebAppを登録
  AppRegistry.runApplication(appName, {
    rootTag: document.getElementById('root'),
  });
}