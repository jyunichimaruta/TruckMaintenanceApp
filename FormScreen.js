// FormScreen.js
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
} from 'react-native';
import { db } from './firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, getDoc } from 'firebase/firestore'; 

// PropsとしてrecordIdを受け取るように変更
const FormScreen = ({ route, navigation, recordId: propRecordId }) => { // recordIdはWebから直接受け取る場合
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

  const handleChange = (name, value) => {
    setLocalFormData(prevState => ({
      ...prevState,
      [name]: value,
    }));
  };

  // ネイティブアプリからのデータ取得ロジック
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
            setLocalFormData({ vehicle_number: '', user_name: '', vehicle_model: '', issue_description: '', action_taken: '', repair_notes: '' });
            setIsEditingForm(false);
            setEditingRecordIdForm(null);
            console.log("ネイティブアプリでレコードデータなし (新規作成モード)");
        }
    }
  }, [route.params?.recordToEdit]);

  // Web版からのデータ取得ロジック
  useEffect(() => {
    if (Platform.OS === 'web') {
        const fetchRecordForWeb = async () => {
            const id = propRecordId; // propsからrecordIdを取得
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
                        window.history.replaceState({}, document.title, window.location.pathname); 
                        setLocalFormData({ vehicle_number: '', user_name: '', vehicle_model: '', issue_description: '', action_taken: '', repair_notes: '' });
                        setIsEditingForm(false);
                        setEditingRecordIdForm(null);
                    }
                } catch (error) {
                    console.error("Web版での記録取得エラー: ", error);
                    Alert.alert("エラー", "記録の取得中にエラーが発生しました。新規作成モードへ移行。");
                    window.history.replaceState({}, document.title, window.location.pathname);
                    setLocalFormData({ vehicle_number: '', user_name: '', vehicle_model: '', issue_description: '', action_taken: '', repair_notes: '' });
                    setIsEditingForm(false);
                    setEditingRecordIdForm(null);
                }
            } else {
                setLocalFormData({ vehicle_number: '', user_name: '', vehicle_model: '', issue_description: '', action_taken: '', repair_notes: '' });
                setIsEditingForm(false);
                setEditingRecordIdForm(null);
                console.log("Web版でレコードIDなし (新規作成モード)");
            }
        };
        fetchRecordForWeb();
    }
  }, [propRecordId]); // Web版ではpropRecordIdを監視

  const handleSubmit = async () => { // navigationはpropsで受け取らないので削除
    if (!localFormData.vehicle_number || !localFormData.user_name || !localFormData.issue_description || !localFormData.action_taken) {
      Alert.alert("エラー", "車両番号、ユーザー名、問題点、とった処置は必須項目です。");
      return;
    }

    try {
      if (isEditingForm && editingRecordIdForm) { // 編集モードの場合
        const recordRef = doc(db, "records", editingRecordIdForm);
        await updateDoc(recordRef, {
          ...localFormData,
          updated_at: serverTimestamp(),
        });
        Alert.alert("成功", "記録が更新されました。");
        console.log("記録更新成功:", editingRecordIdForm);
      } else { // 新規作成モードの場合
        await addDoc(collection(db, "records"), {
          ...localFormData,
          timestamp: serverTimestamp(), // 作成日時を追加
        });
        Alert.alert("成功", "新しい記録が追加されました。");
        console.log("記録追加成功");
      }

      // 送信後に Records 画面に遷移
      if (Platform.OS === 'web') {
        window.location.href = `${window.location.origin}/Records`; // Web版ではRecords画面に直接遷移
      } else {
        navigation.navigate('Records'); // ネイティブアプリではナビゲーションを使用
      }

    } catch (error) {
      console.error("記録の保存エラー: ", error);
      Alert.alert("エラー", "記録の保存中に問題が発生しました: " + error.message);
    }
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
          onChangeText={(text) => handleChange('vehicle_number', text)}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={styles.label}>ユーザー名:</Text>
        <TextInput
          style={styles.input}
          placeholder="例: 山田 太郎"
          value={localFormData.user_name}
          onChangeText={(text) => handleChange('user_name', text)}
          autoCapitalize="words"
          autoCorrect={false}
        />

        <Text style={styles.label}>車両モデル:</Text>
        <TextInput
          style={styles.input}
          placeholder="例: Toyota Hilux"
          value={localFormData.vehicle_model}
          onChangeText={(text) => handleChange('vehicle_model', text)}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={styles.label}>問題点:</Text>
        <TextInput
          style={styles.input}
          placeholder="例: エンジンからの異音"
          value={localFormData.issue_description}
          onChangeText={(text) => handleChange('issue_description', text)}
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
          onChangeText={(text) => handleChange('action_taken', text)}
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
          onChangeText={(text) => handleChange('repair_notes', text)}
          multiline
          numberOfLines={4}
          autoCapitalize="sentences"
          autoCorrect={true}
          textAlignVertical="top"
        />

        <Button title={isEditingForm ? "更新" : "保存"} onPress={handleSubmit} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
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
});

export default FormScreen;