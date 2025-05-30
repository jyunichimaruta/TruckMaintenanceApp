// App.js (修正箇所)
import 'react-native-gesture-handler';
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

import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import { db } from './firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore'; 

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

  const handleChange = (name, value) => {
    setFormData(prevState => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (recordId = null) => {
    if (!formData.vehicle_number || !formData.user_name || !formData.issue_description || !formData.action_taken) {
      Alert.alert("エラー", "車両番号、ユーザー名、問題点、とった処置は必須項目です。");
      return;
    }

    try {
      if (recordId) {
        const recordRef = doc(db, "records", recordId);
        await updateDoc(recordRef, {
          ...formData,
          updated_at: serverTimestamp(),
        });
        Alert.alert("成功", "記録が更新されました。");
        console.log("記録更新成功:", recordId);
      } else {
        await addDoc(collection(db, "records"), {
          ...formData,
          timestamp: serverTimestamp(),
        });
        Alert.alert("成功", "新しい記録が追加されました。");
        console.log("記録追加成功");
      }
      setFormData({
        vehicle_number: '',
        user_name: '',
        vehicle_model: '',
        issue_description: '',
        action_taken: '',
        repair_notes: '',
      });
    } catch (error) {
      console.error("記録の保存エラー: ", error);
      Alert.alert("エラー", "記録の保存中に問題が発生しました: " + error.message);
    }
  };

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Form">
        {/* Form画面の定義を Records の前に持ってきてもよいですが、initialRouteNameが優先されます */}
        <Stack.Screen name="Form" options={{ title: '記録の登録/編集' }}>
          {({ route, navigation }) => {
            const { recordToEdit } = route.params || {};
            const [currentRecordId, setCurrentRecordId] = useState(null);

            useEffect(() => {
              if (recordToEdit) {
                setFormData({
                  vehicle_number: recordToEdit.vehicle_number || '',
                  user_name: recordToEdit.user_name || '',
                  vehicle_model: recordToEdit.vehicle_model || '',
                  issue_description: recordToEdit.issue_description || '',
                  action_taken: recordToEdit.action_taken || '',
                  repair_notes: recordToEdit.repair_notes || '',
                });
                setCurrentRecordId(recordToEdit.id);
              } else {
                setFormData({
                  vehicle_number: '',
                  user_name: '',
                  vehicle_model: '',
                  issue_description: '',
                  action_taken: '',
                  repair_notes: '',
                });
                setCurrentRecordId(null);
              }
            }, [recordToEdit]);

            const handleFormSubmitAndNavigate = async () => {
              await handleSubmit(currentRecordId);
              navigation.navigate('Records');
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

                  <Button title="保存" onPress={handleFormSubmitAndNavigate} />
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