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

            // Web版のデータ取得ロジック
            useEffect(() => {
                if (Platform.OS === 'web') {
                    const fetchRecordForWeb = async () => {
                        const urlParams = new URLSearchParams(window.location.search);
                        const id = urlParams.get('recordId');

                        if (id) {
                            try {
                                const docRef = doc(db, "records", id);
                                const docSnap = await getDoc(docRef);
                                if (docSnap.exists()) {
                                    const recordData = { ...docSnap.data(), id: docSnap.id };
                                    setLocalFormData({
                                        vehicle_number: recordData.vehicle_number || '',
                                        user_name: recordData.user_name || '',
                                        vehicle_model: recordData.vehicle_model || '',
                                        issue_description: recordData.issue_description || '',
                                        action_taken: recordData.action_taken || '',
                                        repair_notes: recordData.repair_notes || '',
                                    });
                                    setIsEditingForm(true);
                                    setEditingRecordIdForm(id);
                                    console.log("Web版でFirestoreからレコードデータを取得 (編集モード):", recordData);
                                } else {
                                    console.log("指定された記録がWeb版で見つかりませんでした。新規作成モードへ移行。");
                                    Alert.alert("情報", "指定された記録が見つからなかったため、新規作成画面になりました。");
                                    // URLからrecordIdを削除して新規作成モードにする
                                    window.history.replaceState({}, document.title, window.location.pathname); 
                                    setLocalFormData({ /* フォームクリア */ vehicle_number: '', user_name: '', vehicle_model: '', issue_description: '', action_taken: '', repair_notes: '' });
                                    setIsEditingForm(false);
                                    setEditingRecordIdForm(null);
                                }
                            } catch (error) {
                                console.error("Web版での記録取得エラー: ", error);
                                Alert.alert("エラー", "記録の取得中にエラーが発生しました。新規作成モードへ移行。");
                                window.history.replaceState({}, document.title, window.location.pathname);
                                setLocalFormData({ /* フォームクリア */ vehicle_number: '', user_name: '', vehicle_model: '', issue_description: '', action_taken: '', repair_notes: '' });
                                setIsEditingForm(false);
                                setEditingRecordIdForm(null);
                            }
                        } else {
                            // recordIdがない場合は新規作成モードに確実に戻す
                            setLocalFormData({ /* フォームクリア */ vehicle_number: '', user_name: '', vehicle_model: '', issue_description: '', action_taken: '', repair_notes: '' });
                            setIsEditingForm(false);
                            setEditingRecordIdForm(null);
                            console.log("Web版でレコードIDなし (新規作成モード)");
                        }
                    };
                    fetchRecordForWeb();
                }
            }, [Platform.OS === 'web' ? window.location.search : null]); // Web版のみwindow.location.searchを監視

            // ネイティブアプリ版のデータ取得ロジック
            useEffect(() => {
                if (Platform.OS !== 'web') {
                    const { recordToEdit } = route.params || {};
                    if (recordToEdit) {
                        setLocalFormData({
                            vehicle_number: recordToEdit.vehicle_number || '',
                            user_name: recordToEdit.user_name || '',
                            vehicle_model: recordToEdit.vehicle_model || '',
                            issue_description: recordToEdit.issue_description || '',
                            action_taken: recordToEdit.action_taken || '',
                            repair_notes: recordToEdit.repair_notes || '',
                        });
                        setIsEditingForm(true);
                        setEditingRecordIdForm(recordToEdit.id);
                        console.log("ネイティブアプリからレコードデータを取得 (編集モード):", recordToEdit);
                    } else {
                        // パラメータがない場合は新規作成モード
                        setLocalFormData({ /* フォームクリア */ vehicle_number: '', user_name: '', vehicle_model: '', issue_description: '', action_taken: '', repair_notes: '' });
                        setIsEditingForm(false);
                        setEditingRecordIdForm(null);
                        console.log("ネイティブアプリでレコードデータなし (新規作成モード)");
                    }
                }
            }, [route.params?.recordToEdit]); // ネイティブアプリ版のみroute.params.recordToEditを監視

            const handleFormSubmitAndClear = async () => {
                await handleSubmit(localFormData, editingRecordIdForm, navigation);
                // handleSubmitの成功後にフォームをクリアする
                // （ナビゲーションで画面を離れるので、厳密にはこのクリアは次の画面で新しいフォームが表示されるときに意味を持つ）
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
                    autoCapitalize="none"
                    autoCorrect={false}
                  />

                  <Text style={styles.label}>ユーザー名:</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="例: 山田 太郎"
                    value={localFormData.user_name}
                    onChangeText={(text) => handleLocalChange('user_name', text)}
                    autoCapitalize="words"
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
                    autoCapitalize="sentences"
                    autoCorrect={true}
                    textAlignVertical="top"
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