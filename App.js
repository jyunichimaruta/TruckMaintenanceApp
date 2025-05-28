// App.js
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
  // Image, // Image を使用しないなら削除しても良いが、今回は残す（RecordsScreenで使うため）
  // ActivityIndicator, // これもRecordsScreenで使うため残す
} from 'react-native';
// import * as ImagePicker from 'expo-image-picker'; // ★削除

import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import { db, storage } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
// import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'; // ★削除

import RecordsScreen from './RecordsScreen';


const Stack = createStackNavigator();


function MaintenanceFormScreen({ navigation }) {
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [userName, setUserName] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [repairNotes, setRepairNotes] = useState('');
  // const [selectedImage, setSelectedImage] = useState(null); // ★削除
  // const [uploadedImageURL, setUploadedImageURL] = useState(null); // ★削除
  // const [uploading, setUploading] = useState(false); // ★削除


  useEffect(() => {
    // (async () => { // ★削除開始
    //   if (Platform.OS !== 'web') {
    //     const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    //     if (status !== 'granted') {
    //       Alert.alert('写真へのアクセス許可が必要です！');
    //     }
    //   }
    // })(); // ★削除終了
    console.log("Firebase initialized and ready to use Firestore.");
  }, []);

  // // 写真選択ボタンの関数 // ★この pickImage 関数全体を削除
  // const pickImage = async () => {
  //   console.log("pickImage 関数が呼び出されました。");
  //   let result = await ImagePicker.launchImageLibraryAsync({
  //     mediaTypes: ImagePicker.MediaType.Images,
  //   });
  //   console.log("ImagePicker の結果: ", JSON.stringify(result, null, 2));
  //   if (!result.canceled) {
  //     console.log("画像が選択されました。URI: ", result.assets[0].uri);
  //     const uri = result.assets[0].uri;
  //     setSelectedImage(uri);
  //     setUploadedImageURL(null);
  //     uploadImage(uri);
  //   } else {
  //     console.log("画像選択がキャンセルされました。");
  //   }
  // };

  // // Firebase Storage に画像をアップロードする関数 // ★この uploadImage 関数全体を削除
  // const uploadImage = async (uri) => {
  //   setUploading(true);
  //   try {
  //     const response = await fetch(uri);
  //     const blob = await response.blob();
  //     const filename = `images/${Date.now()}-${uri.split('/').pop()}`;
  //     const storageRef = ref(storage, filename);
  //     const uploadTask = uploadBytesResumable(storageRef, blob);
  //     uploadTask.on('state_changed',
  //       (snapshot) => {
  //         const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
  //         console.log('Upload is ' + progress + '% done');
  //       },
  //       (error) => {
  //         console.error("画像アップロードエラー: ", error);
  //         Alert.alert('アップロード失敗', '画像のアップロードに失敗しました。');
  //         setUploading(false);
  //         setUploadedImageURL(null);
  //       },
  //       async () => {
  //         const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
  //         console.log('File available at', downloadURL);
  //         setUploadedImageURL(downloadURL);
  //         setUploading(false);
  //         Alert.alert('アップロード完了', '画像が正常にアップロードされました。');
  //       }
  //     );
  //   } catch (e) {
  //     console.error("画像処理エラー: ", e);
  //     Alert.alert('エラー', '画像の処理中に問題が発生しました。' + e.message);
  //     setUploading(false);
  //     setUploadedImageURL(null);
  //   }
  // };


  // 送信ボタンが押された時の処理
  const handleSubmit = async () => {
    // 必須入力項目のチェック
    if (!vehicleNumber || !userName || !issueDescription) {
      Alert.alert('エラー', '車両番号、ユーザー名、問題点は必須入力です。');
      return;
    }
    // ★削除: 画像が選択されているがアップロードが完了していない場合 のチェック
    // if (selectedImage && !uploadedImageURL) {
    //     Alert.alert('待機', '画像のアップロードが完了するまでお待ちください。');
    //     return;
    // }


    try {
      // Firestoreの 'records' コレクションにデータを追加
      const docRef = await addDoc(collection(db, "records"), {
        vehicle_number: vehicleNumber,
        user_name: userName,
        vehicle_model: vehicleModel,
        issue_description: issueDescription,
        action_taken: actionTaken,
        repair_notes: repairNotes,
        // image_url: uploadedImageURL, // ★削除またはnullに設定
        image_url: null, // 画像を保存しない場合はnull
        timestamp: serverTimestamp(), // データの作成日時を記録
      });

      console.log("データ挿入成功: ドキュメントID:", docRef.id);
      Alert.alert('送信完了', '入力内容が記録されました。');

      // 送信後、入力フォームをクリア
      setVehicleNumber('');
      setUserName('');
      setVehicleModel('');
      setIssueDescription('');
      setActionTaken('');
      setRepairNotes('');
      // setSelectedImage(null); // ★削除
      // setUploadedImageURL(null); // ★削除

    } catch (e) {
      console.error("Firestoreへの書き込みエラー: ", e);
      Alert.alert('エラー', 'データの保存に失敗しました。' + e.message);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.title}>トラック整備記録アプリ</Text>

          <Text style={styles.label}>車両番号:</Text>
          <TextInput
            style={styles.input}
            value={vehicleNumber}
            onChangeText={setVehicleNumber}
            placeholder="例: T-001"
          />

          <Text style={styles.label}>ユーザー名:</Text>
          <TextInput
            style={styles.input}
            value={userName}
            onChangeText={setUserName}
            placeholder="例: 山田 太郎"
          />

          <Text style={styles.label}>車両モデル:</Text>
          <TextInput
            style={styles.input}
            value={vehicleModel}
            onChangeText={setVehicleModel}
            placeholder="例: 日野プロフィア"
          />

          <Text style={styles.label}>問題点:</Text>
          <TextInput
            style={styles.textArea}
            value={issueDescription}
            onChangeText={setIssueDescription}
            placeholder="例: エンジンから異音、ブレーキの効きが悪い"
            multiline
          />

          <Text style={styles.label}>とった処置:</Text>
          <TextInput
            style={styles.textArea}
            value={actionTaken}
            onChangeText={setActionTaken}
            placeholder="例: エンジンオイル交換、ブレーキパッド交換"
            multiline
          />

          <Text style={styles.label}>整備メモ:</Text>
          <TextInput
            style={styles.textArea}
            value={repairNotes}
            onChangeText={setRepairNotes}
            placeholder="特記事項や今後の整備予定など"
            multiline
          />

          {/* ★削除開始: 写真関連のUI */}
          {/* <Button title="写真を選択" onPress={pickImage} disabled={uploading} /> */}
          {/* {uploading && <ActivityIndicator size="small" color="#0000ff" style={styles.uploadingIndicator} />} */}
          {/* {selectedImage && !uploading && ( */}
          {/* <Image source={{ uri: selectedImage }} style={styles.image} /> */}
          {/* )} */}
          {/* {uploadedImageURL && !uploading && ( */}
          {/* <Text style={styles.uploadStatusText}>画像アップロード完了！</Text> */}
          {/* )} */}
          {/* ★削除終了: 写真関連のUI */}


          <Button title="送信" onPress={handleSubmit} color="#007bff" /> {/* disabled={uploading} を削除 */}

          <View style={styles.spacer} />
          <Button
            title="過去の記録を見る"
            onPress={() => navigation.navigate('Records')}
            color="#28a745"
          />

          <StatusBar style="auto" />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Form">
        <Stack.Screen
          name="Form"
          component={MaintenanceFormScreen}
          options={{ title: '新規整備記録' }}
        />
        <Stack.Screen
          name="Records"
          component={RecordsScreen}
          options={{ title: '過去の整備記録' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}


// スタイルの定義（追加と変更）
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#333',
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    marginTop: 15,
    color: '#555',
    alignSelf: 'flex-start',
    width: '100%',
  },
  input: {
    width: '100%',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  textArea: {
    width: '100%',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: '#fff',
    minHeight: 80,
    textAlignVertical: 'top',
    fontSize: 16,
  },
  image: { // RecordsScreenで使うため、ここは残しておきます
    width: 200,
    height: 200,
    resizeMode: 'contain',
    marginTop: 20,
    marginBottom: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  spacer: {
    height: 20, // ボタン間のスペース
  },
  // uploadingIndicator: { // ★削除
  //   marginTop: 10,
  //   marginBottom: 10,
  // },
  // uploadStatusText: { // ★削除
  //   marginTop: 10,
  //   marginBottom: 10,
  //   color: 'green',
  //   fontWeight: 'bold',
  // },
});