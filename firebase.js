// firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// ★あなたのFirebase設定情報を貼り付ける
const firebaseConfig = {
  apiKey: "AIzaSyAmPUV0d-zmXFhD95B_jFYbaHDroc00RC4",
  authDomain: "truckmaintenanceapp.firebaseapp.com",
  projectId: "truckmaintenanceapp",
  storageBucket: "truckmaintenanceapp.firebasestorage.app",
  messagingSenderId: "336368488406",
  appId: "1:336368488406:web:167ee734f08e1fce7ade77",
  measurementId: "G-FKFST0PJP9"
};

// Firebaseアプリの初期化
const app = initializeApp(firebaseConfig);
// Firestoreデータベースサービスを取得
const db = getFirestore(app);
const storage = getStorage(app);

// dbインスタンスをエクスポートして他のファイルで利用可能にする
export { db, storage };