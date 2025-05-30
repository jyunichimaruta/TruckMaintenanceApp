// App.js
import 'react-native-gesture-handler';
// import { enableScreens } from 'react-native-screens'; // enableScreens は完全にコメントアウト
// enableScreens(true); // enableScreens は完全にコメントアウト
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

import { NavigationContainer } from '@react-navigation/native'; // useRoute はApp.jsから削除
import { createStackNavigator } from '@react-navigation/stack';

import { db } from './firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, getDoc } from 'firebase/firestore'; 

import RecordsScreen from './RecordsScreen';

const Stack = createStackNavigator();

const App = () => {
  // formDataなどのStateは、App.jsからFormコンポーネントに移す必要があります
  // もしApp.jsがFormコンポーネントを内包するなら、このstateはそのまま。
  // 今回のApp.jsの構成では、handleSubmitが外出しなので、formDataはここに残します。
  // ただし、フォームの入力値は、`Form`スクリーンをレンダリングする関数コンポーネント内で管理します。
  const [formData, setFormData] = useState({
    vehicle_number: '',
    user_name: '',
    vehicle_model: '',
    issue_description: '',
    action_taken: '',
    repair_notes: '',
  });

  const handleChange = (name, value) => {
    setFormData(prevState => ({
      ...prevState,
      [name]: value,
    }));
  };

  // handleSubmitも、Formコンポーネントの内部に移動させるのが望ましいですが、
  // 現状のApp.jsの構造に合わせて、引数を追加して修正します。
  // このhandleSubmit関数は、App.js内のFormスクリーンで定義されるコンポーネントから呼び出されます。
  const handleSubmit = async (currentFormData, currentRecordId, navigation) => { // 引数を変更
    if (!currentFormData.vehicle_number || !currentFormData.user_name || !currentFormData.issue_description || !currentFormData.action_taken) {
      Alert.alert("エラー", "車両番号、ユーザー名、問題点、とった処置は必須項目です。");
      return;
    }

    try {
      if (currentRecordId) { // 編集モードの場合
        const recordRef = doc(db, "records", currentRecordId);
        await updateDoc(recordRef, {
          ...currentFormData,
          updated_at: serverTimestamp(),
        });
        Alert.alert("成功", "記録が更新されました。");
        console.log("記録更新成功:", currentRecordId);
      } else { // 新規作成モードの場合
        await addDoc(collection(db, "records"), {
          ...currentFormData,
          timestamp: serverTimestamp(), // 作成日時を追加
        });
        Alert.alert("成功", "新しい記録が追加されました。");
        console.log("記録追加成功");
      }

      // 送信後にフォームをクリアする必要があるが、これはフォームコンポーネント側で行う
      // そして、Records画面に遷移
      if (Platform.OS === 'web') {
        // Web版ではRecords画面に直接遷移して、URLパラメータを削除
        // Records画面は '/' にあるとして、URLをクリーンにする
        window.location.href = `${window.location.origin}/Records`;
      } else {
        // ネイティブアプリではナビゲーションを使用
        navigation.navigate('Records');
      }

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
            // このコンポーネント内でFormのstateとuseEffectを管理
            const [localFormData, setLocalFormData] = useState({
              vehicle_number: '',
              user_name: '',
              vehicle_model: '',
              issue_description: '',
              action_taken: '',
              repair_notes: '',
            });
            const [isEditingForm, setIsEditingForm] = useState(false);
            const [editingRecordIdForm, setEditingRecordIdForm] = useState(null);

            const handleLocalChange = (name, value) => {
              setLocalFormData(prevState => ({
                ...prevState,
                [name]: value,
              }));
            };

            useEffect(() => {
                const fetchRecordAndSetForm = async () => {
                    let recordData = null;
                    let currentId = null;

                    if (Platform.OS === 'web') {
                        // Web版の場合、URLのクエリパラメータからrecordIdを取得
                        const urlParams = new URLSearchParams(window.location.search);
                        const id = urlParams.get('recordId');
                        if (id) {
                            currentId = id;
                            try {
                                const docRef = doc(db, "records", id);
                                const docSnap = await getDoc(docRef);
                                if (docSnap.exists()) {
                                    recordData = { ...docSnap.data(), id: docSnap.id };
                                    console.log("Web版でFirestoreからレコードデータを取得:", recordData);
                                } else {
                                    console.log("指定された記録が見つかりませんでした。");
                                    Alert.alert("エラー", "指定された記録が見つかりませんでした。");
                                    window.history.replaceState({}, document.title, window.location.pathname); // URLからrecordIdを削除
                                }
                            } catch (error) {
                                console.error("Error fetching document:", error);
                                Alert.alert("エラー", "記録の取得中にエラーが発生しました。");
                                window.history.replaceState({}, document.title, window.location.pathname);
                            }
                        }
                    } else {
                        // ネイティブアプリからの遷移の場合
                        const { recordToEdit } = route.params || {};
                        if (recordToEdit) {
                            recordData = recordToEdit;
                            currentId = recordToEdit.id;
                            console.log("ネイティブアプリからレコードデータを取得:", recordData);
                        }
                    }

                    if (recordData) {
                        // データをフォームにセット
                        setLocalFormData({
                            vehicle_number: recordData.vehicle_number || '',
                            user_name: recordData.user_name || '',
                            vehicle_model: recordData.vehicle_model || '',
                            issue_description: recordData.issue_description || '',
                            action_taken: recordData.action_taken || '',
                            repair_notes: recordData.repair_notes || '',
                        });
                        setIsEditingForm(true);
                        setEditingRecordIdForm(currentId);
                    } else {
                        // 新規作成モード
                        setLocalFormData({ // フォームをクリア
                            vehicle_number: '', user_name: '', vehicle_model: '',
                            issue_description: '', action_taken: '', repair_notes: '',
                        });
                        setIsEditingForm(false);
                        setEditingRecordIdForm(null);
                    }
                };

                fetchRecordAndSetForm();
            // route.paramsを依存配列に入れると、ネイティブアプリで戻るボタンを押した際に
            // 新規作成画面に戻るべきときに再度データがセットされる問題を避けるため、
            // WebのURL変更のみをトリガーにするか、より細かく制御する必要がある。
            // ここでは、WebのURL変更（レコードIDの有無）と、ネイティブアプリのroute.params.recordToEditの有無でトリガー
            }, [route.params?.recordToEdit, window.location.search]); // Webの場合はwindow.location.searchを監視

            const handleFormSubmitAndClear = async () => {
                await handleSubmit(localFormData, editingRecordIdForm, navigation);
                // handleSubmitの成功後にフォームをクリアする
                setLocalFormData({
                    vehicle_number: '', user_name: '', vehicle_model: '',
                    issue_description: '', action_taken: '', repair_notes: '',
                });
                setIsEditingForm(false);
                setEditingRecordIdForm(null);
            };

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
                    value={localFormData.vehicle_number}
                    onChangeText={(text) => handleLocalChange('vehicle_number', text)}
                    autoComplete="off"
                    textContentType="none"
                    keyboardType="default"
                  />

                  <Text style={styles.label}>ユーザー名:</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="例: 山田 太郎"
                    value={localFormData.user_name}
                    onChangeText={(text) => handleLocalChange('user_name', text)}
                    autoComplete="name"
                    textContentType="name"
                    keyboardType="default"
                  />

                  <Text style={styles.label}>車両モデル:</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="例: Toyota Hilux"
                    value={localFormData.vehicle_model}
                    onChangeText={(text) => handleLocalChange('vehicle_model', text)}
                    autoComplete="off"
                    textContentType="none"
                    keyboardType="default"
                  />

                  <Text style={styles.label}>問題点:</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="例: エンジンからの異音"
                    value={localFormData.issue_description}
                    onChangeText={(text) => handleLocalChange('issue_description', text)}
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
                    value={localFormData.action_taken}
                    onChangeText={(text) => handleLocalChange('action_taken', text)}
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
                    value={localFormData.repair_notes}
                    onChangeText={(text) => handleLocalChange('repair_notes', text)}
                    multiline
                    numberOfLines={4}
                    autoComplete="off"
                    textContentType="none"
                    keyboardType="default"
                  />

                  <Button title={isEditingForm ? "更新" : "保存"} onPress={handleFormSubmitAndClear} />
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