// App.js
import 'react-native-gesture-handler';
import { enableScreens } from 'react-native-screens';
// enableScreens(true); // この行をコメントアウトまたは削除
import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Button,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';

import { NavigationContainer, useRoute } from '@react-navigation/native'; // useRoute をインポート
import { createStackNavigator } from '@react-navigation/stack';

import { db } from './firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, getDoc } from 'firebase/firestore'; // getDoc を追加

import RecordsScreen from './RecordsScreen';

const Stack = createStackNavigator();

const App = () => {
  const [formData, setFormData] = useState({
    vehicle_number: '',
    user_name: '',
    vehicle_model: '',
    issue_description: '',
    action_taken: '',
    repair_notes: '',
  });

  // 編集モードかどうかの状態と編集中のレコードID
  const [isEditing, setIsEditing] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState(null);

  const handleChange = (name, value) => {
    setFormData(prevState => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (navigation) => { // navigationを引数に追加
    if (!formData.vehicle_number || !formData.user_name || !formData.issue_description || !formData.action_taken) {
      Alert.alert("エラー", "車両番号、ユーザー名、問題点、とった処置は必須項目です。");
      return;
    }

    try {
      if (isEditing && editingRecordId) { // 編集モードの場合
        const recordRef = doc(db, "records", editingRecordId);
        await updateDoc(recordRef, {
          ...formData,
          updated_at: serverTimestamp(),
        });
        Alert.alert("成功", "記録が更新されました。");
        console.log("記録更新成功:", editingRecordId);
      } else { // 新規作成モードの場合
        await addDoc(collection(db, "records"), {
          ...formData,
          timestamp: serverTimestamp(), // 作成日時を追加
        });
        Alert.alert("成功", "新しい記録が追加されました。");
        console.log("記録追加成功");
      }

      // 送信後にフォームをクリアして新規作成モードに戻る
      setFormData({
        vehicle_number: '',
        user_name: '',
        vehicle_model: '',
        issue_description: '',
        action_taken: '',
        repair_notes: '',
      });
      setIsEditing(false);
      setEditingRecordId(null);
      
      // Web版でURLのクエリパラメータを削除してURLをクリーンにする
      if (Platform.OS === 'web') {
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      // 過去の記録を見る画面に戻る
      navigation.navigate('Records');
    } catch (error) {
      console.error("記録の保存エラー: ", error);
      Alert.alert("エラー", "記録の保存中に問題が発生しました: " + error.message);
    }
  };

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Form">
        {/* Form画面の定義 */}
        <Stack.Screen name="Form" options={{ title: '記録の登録/編集' }}>
          {({ route, navigation }) => {
            const routeParams = route.params || {}; // ネイティブアプリからの遷移用
            const [recordIdFromUrl, setRecordIdFromUrl] = useState(null); // Web版からの遷移用

            useEffect(() => {
              // Web版の場合、URLのクエリパラメータからrecordIdを取得
              if (Platform.OS === 'web') {
                const urlParams = new URLSearchParams(window.location.search);
                const id = urlParams.get('recordId');
                if (id) {
                  setRecordIdFromUrl(id);
                } else {
                  // recordIdがない場合は新規作成モードを確実に設定
                  setIsEditing(false);
                  setEditingRecordId(null);
                  setFormData({ // フォームもクリア
                    vehicle_number: '', user_name: '', vehicle_model: '',
                    issue_description: '', action_taken: '', repair_notes: '',
                  });
                }
              }
            }, [routeParams]); // route.params の変更も監視 (ネイティブアプリの戻るボタンなど)

            useEffect(() => {
              const fetchRecord = async () => {
                let recordData = null;
                let currentRecordId = null;

                // ネイティブアプリからの遷移の場合
                if (routeParams.recordToEdit && Platform.OS !== 'web') {
                  recordData = routeParams.recordToEdit;
                  currentRecordId = routeParams.recordToEdit.id;
                  console.log("ネイティブアプリからレコードデータを取得:", recordData);
                } else if (recordIdFromUrl && Platform.OS === 'web') {
                  // Web版でURLからIDが渡された場合
                  console.log("Web版でURLからレコードIDを取得:", recordIdFromUrl);
                  currentRecordId = recordIdFromUrl;
                  try {
                    const docRef = doc(db, "records", recordIdFromUrl);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                      recordData = { ...docSnap.data(), id: docSnap.id };
                      console.log("Web版でFirestoreからレコードデータを取得:", recordData);
                    } else {
                      console.log("No such document! 指定された記録が見つかりませんでした。");
                      Alert.alert("エラー", "指定された記録が見つかりませんでした。");
                      // 見つからない場合は新規作成モードに移行
                      if (Platform.OS === 'web') {
                         window.history.replaceState({}, document.title, window.location.pathname); // URLからrecordIdを削除
                      }
                      setIsEditing(false);
                      setEditingRecordId(null);
                      setFormData({ // フォームもクリア
                        vehicle_number: '', user_name: '', vehicle_model: '',
                        issue_description: '', action_taken: '', repair_notes: '',
                      });
                      return;
                    }
                  } catch (error) {
                    console.error("Error fetching document:", error);
                    Alert.alert("エラー", "記録の取得中にエラーが発生しました。");
                     if (Platform.OS === 'web') {
                        window.history.replaceState({}, document.title, window.location.pathname);
                     }
                    setIsEditing(false);
                    setEditingRecordId(null);
                    setFormData({ // フォームもクリア
                        vehicle_number: '', user_name: '', vehicle_model: '',
                        issue_description: '', action_taken: '', repair_notes: '',
                    });
                    return;
                  }
                }

                if (recordData) {
                  // データをフォームにセット
                  setFormData({
                    vehicle_number: recordData.vehicle_number || '',
                    user_name: recordData.user_name || '',
                    vehicle_model: recordData.vehicle_model || '',
                    issue_description: recordData.issue_description || '',
                    action_taken: recordData.action_taken || '',
                    repair_notes: recordData.repair_notes || '',
                  });
                  setIsEditing(true); // 編集モード
                  setEditingRecordId(currentRecordId); // 編集中のIDを保持
                } else {
                  // 新規作成モード (URLにrecordIdがない場合など)
                  setIsEditing(false);
                  setEditingRecordId(null);
                  // フォームをクリア (既に上のuseEffectで実施済みだが念のため)
                  setFormData({
                    vehicle_number: '', user_name: '', vehicle_model: '',
                    issue_description: '', action_taken: '', repair_notes: '',
                  });
                }
              };

              fetchRecord();
            }, [recordIdFromUrl, routeParams.recordToEdit]); // recordIdFromUrlとroute.params.recordToEditを依存配列に追加


            return (
              <KeyboardAvoidingView
                style={styles.keyboardAvoidingView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              >
                <ScrollView contentContainerStyle={styles.scrollContainer}>
                  <Text style={styles.label}>車両番号:</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="例: ABC-123"
                    value={formData.vehicle_number}
                    onChangeText={(text) => handleChange('vehicle_number', text)}
                    autoComplete="off"
                    textContentType="none"
                    keyboardType="default"
                  />

                  <Text style={styles.label}>ユーザー名:</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="例: 山田 太郎"
                    value={formData.user_name}
                    onChangeText={(text) => handleChange('user_name', text)}
                    autoComplete="name"
                    textContentType="name"
                    keyboardType="default"
                  />

                  <Text style={styles.label}>車両モデル:</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="例: Toyota Hilux"
                    value={formData.vehicle_model}
                    onChangeText={(text) => handleChange('vehicle_model', text)}
                    autoComplete="off"
                    textContentType="none"
                    keyboardType="default"
                  />

                  <Text style={styles.label}>問題点:</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="例: エンジンからの異音"
                    value={formData.issue_description}
                    onChangeText={(text) => handleChange('issue_description', text)}
                    multiline
                    numberOfLines={4}
                    autoComplete="off"
                    textContentType="none"
                    keyboardType="default"
                  />

                  <Text style={styles.label}>とった処置:</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="例: エンジンオイル交換、点火プラグ清掃"
                    value={formData.action_taken}
                    onChangeText={(text) => handleChange('action_taken', text)}
                    multiline
                    numberOfLines={4}
                    autoComplete="off"
                    textContentType="none"
                    keyboardType="default"
                  />

                  <Text style={styles.label}>整備メモ:</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="追加のメモ"
                    value={formData.repair_notes}
                    onChangeText={(text) => handleChange('repair_notes', text)}
                    multiline
                    numberOfLines={4}
                    autoComplete="off"
                    textContentType="none"
                    keyboardType="default"
                  />

                  <Button title={isEditing ? "更新" : "保存"} onPress={() => handleSubmit(navigation)} />
                </ScrollView>
              </KeyboardAvoidingView>
            );
          }}
        </Stack.Screen>

        {/* RecordsScreenの定義 */}
        <Stack.Screen name="Records" options={{ title: '整備記録' }}>
          {(props) => <RecordsScreen {...props} />}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    marginTop: 10,
    fontWeight: 'bold',
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  container: { // このスタイルはAppコンポーネント全体のもので、Form画面のScrollViewには直接適用されません
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: { // このスタイルもAppコンポーネント全体のもので、Form画面のテキストには直接適用されません
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});

export default App;