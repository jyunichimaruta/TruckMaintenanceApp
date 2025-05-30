// App.js
import 'react-native-gesture-handler';
// import { enableScreens } from 'react-native-screens'; // この行は引き続きコメントアウトまたは削除したままでOK
// enableScreens(true); // この行も同様にコメントアウトまたは削除したままでOK
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
  Platform, // Platform をインポート
  SafeAreaView,
} from 'react-native';

import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import { db } from './firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, getDoc } from 'firebase/firestore'; 

import RecordsScreen from './RecordsScreen';

const Stack = createStackNavigator();

const App = () => {
  const handleSubmit = async (currentFormData, currentRecordId, navigation) => {
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

      // 送信後に Records 画面に遷移
      if (Platform.OS === 'web') {
        // Web版ではRecords画面に直接遷移して、URLパラメータを削除（クリーンにする）
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
                                    console.log("指定された記録がWeb版で見つかりませんでした。新規作成モードへ移行。");
                                    Alert.alert("情報", "指定された記録が見つからなかったため、新規作成画面になりました。");
                                    // 見つからない場合はURLからrecordIdを削除して新規作成モードにする
                                    window.history.replaceState({}, document.title, window.location.pathname); 
                                }
                            } catch (error) {
                                console.error("Web版での記録取得エラー: ", error);
                                Alert.alert("エラー", "記録の取得中にエラーが発生しました。新規作成モードへ移行。");
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
            // 依存配列はPlatform.OSで分岐
            // Web版の場合はURLのクエリパラメータの変化を監視（直接読み取って変化を検知）
            // ネイティブアプリの場合はroute.paramsの変化を監視
            }, [Platform.OS === 'web' ? window.location.search : route.params?.recordToEdit]); 
            // 注意: window.location.search はオブジェクトではなく文字列なので、
            // そのまま依存配列に入れても問題ありません。
            // route.params?.recordToEdit はオブジェクトなので、中身が同じでも参照が異なる場合があるため、
            // オブジェクト全体ではなく、その中の特定のプロパティ (例: recordToEdit.id) を依存配列に入れることも検討できますが、
            // 今回はシンプルに recordToEdit の有無で判断しているので、このままで。

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
                    autoCapitalize="none" // オートコンプリートを無効化
                    autoCorrect={false} // オートコレクトを無効化
                  />

                  <Text style={styles.label}>ユーザー名:</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="例: 山田 太郎"
                    value={localFormData.user_name}
                    onChangeText={(text) => handleLocalChange('user_name', text)}
                    autoCapitalize="words" // 名前の入力なので単語の先頭を大文字に
                    autoCorrect={false}
                  />

                  <Text style={styles.label}>車両モデル:</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="例: Toyota Hilux"
                    value={localFormData.vehicle_model}
                    onChangeText={(text) => handleLocalChange('vehicle_model', text)}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />

                  <Text style={styles.label}>問題点:</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="例: エンジンからの異音"
                    value={localFormData.issue_description}
                    onChangeText={(text) => handleLocalChange('issue_description', text)}
                    multiline
                    numberOfLines={4}
                    autoCapitalize="sentences" // 文の先頭を大文字に
                    autoCorrect={true}
                    textAlignVertical="top" // Androidでのテキストの垂直方向の開始位置
                  />

                  <Text style={styles.label}>とった処置:</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="例: エンジンオイル交換、点火プラグ清掃"
                    value={localFormData.action_taken}
                    onChangeText={(text) => handleLocalChange('action_taken', text)}
                    multiline
                    numberOfLines={4}
                    autoCapitalize="sentences"
                    autoCorrect={true}
                    textAlignVertical="top"
                  />

                  <Text style={styles.label}>整備メモ:</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="追加のメモ"
                    value={localFormData.repair_notes}
                    onChangeText={(text) => handleLocalChange('repair_notes', text)}
                    multiline
                    numberOfLines={4}
                    autoCapitalize="sentences"
                    autoCorrect={true}
                    textAlignVertical="top"
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
    // input の高さが multiline で変わる場合があるので、textAreaと同じく textAlignVertical を追加
    textAlignVertical: 'top', 
  },
  container: { 
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: { 
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});

export default App;