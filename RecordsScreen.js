// RecordsScreen.js
import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Alert, TouchableOpacity, ScrollView, Platform, Modal, Pressable, TextInput } from 'react-native';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, orderBy, where } from 'firebase/firestore';
import { db } from './firebase'; // firebase.jsからdbをインポート

const RecordsScreen = ({ navigation }) => {
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [userName, setUserName] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [problemDescription, setProblemDescription] = useState('');
  const [solution, setSolution] = useState('');
  const [maintenanceMemo, setMaintenanceMemo] = useState('');

  const [records, setRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState(''); // 検索クエリの状態
  const [isEditing, setIsEditing] = useState(false); // 編集モードの状態

  // recordsコレクションへの参照
  const recordsCollectionRef = collection(db, 'records');

  // データ取得関数
  const getRecords = async () => {
    try {
      const q = query(recordsCollectionRef, orderBy('createdAt', 'desc')); // 作成日で降順ソート
      const data = await getDocs(q);
      const fetchedRecords = data.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setRecords(fetchedRecords);
    } catch (error) {
      console.error("データの取得中にエラーが発生しました: ", error);
      Alert.alert("エラー", "データの取得に失敗しました。");
    }
  };

  useEffect(() => {
    getRecords();
  }, []);

  // 検索機能
  const handleSearch = async () => {
    try {
      let q;
      if (searchQuery.trim() === '') {
        // 検索クエリが空の場合は全件取得（作成日降順）
        q = query(recordsCollectionRef, orderBy('createdAt', 'desc'));
      } else {
        // 車両番号で部分一致検索（Firebaseでは部分一致検索が難しいので、完全一致を想定）
        q = query(recordsCollectionRef, where('vehicle_number', '==', searchQuery.trim()));
      }
      const data = await getDocs(q);
      const searchedRecords = data.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setRecords(searchedRecords);
    } catch (error) {
      console.error("検索中にエラーが発生しました: ", error);
      Alert.alert("エラー", "検索に失敗しました。");
    }
  };

  // 記録の削除
  const handleDeleteRecord = async (id) => {
    Alert.alert(
      "確認",
      "この整備記録を削除してもよろしいですか？",
      [
        {
          text: "キャンセル",
          style: "cancel"
        },
        {
          text: "削除",
          onPress: async () => {
            try {
              const recordDoc = doc(db, "records", id);
              await deleteDoc(recordDoc);
              Alert.alert("成功", "記録が削除されました。");
              getRecords(); // 削除後にリストを更新
            } catch (error) {
              console.error("記録の削除中にエラーが発生しました: ", error);
              Alert.alert("エラー", "記録の削除に失敗しました。");
            }
          }
        }
      ]
    );
  };

  // 記録の編集（ネイティブアプリのモーダルから呼び出されることを想定）
  const handleEditRecord = (record) => {
    // Web版ではこの関数は直接ナビゲーションに繋がっているので、ここでの処理はネイティブ用
    // ネイティブアプリではモーダルを閉じてフォームのデータをセットする
    if (Platform.OS !== 'web') {
        setSelectedRecord(record);
        setVehicleNumber(record.vehicle_number);
        setUserName(record.user_name);
        setVehicleModel(record.vehicle_model);
        setProblemDescription(record.problem_description);
        setSolution(record.solution);
        setMaintenanceMemo(record.maintenance_memo);
        setIsEditing(true); // 編集モードに設定
        setModalVisible(false); // 詳細モーダルを閉じる
        // ここからFormScreenへのナビゲーションが必要なら追加
        // navigation.navigate('Form', { recordToEdit: record });
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.recordItemContainer}>
      <TouchableOpacity
        style={styles.recordItemContent}
        onPress={() => {
          if (Platform.OS === 'web') {
            // Web版の場合（PCでもスマホのブラウザでも）は直接Form画面へ遷移
            console.log("Web (PC/Mobile) でリスト項目がタップされました。Formへ遷移します。");
            navigation.navigate('Form', { recordToEdit: item });
          } else {
            // ネイティブアプリ（iOS/AndroidのExpo Goアプリ）の場合、詳細モーダルを表示
            console.log("ネイティブアプリでリスト項目がタップされました。詳細モーダルを表示します。");
            setSelectedRecord(item); // 詳細表示用のstateをセット
            setModalVisible(true);  // モーダルを表示
          }
        }}
      >
        <Text style={styles.itemTitle}>車両番号: {item.vehicle_number}</Text>
        <Text style={styles.itemText}>ユーザー名: {item.user_name}</Text>
        <Text style={styles.itemText}>車両モデル: {item.vehicle_model}</Text>
        {/* createdAtが存在し、Dateオブジェクトの場合のみ表示 */}
        {item.createdAt && item.createdAt.toDate && (
          <Text style={styles.itemDate}>
            記録日: {item.createdAt.toDate().toLocaleDateString('ja-JP')}
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteRecord(item.id)}
      >
        <Text style={styles.deleteButtonText}>削除</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <StatusBar style="auto" />
      <Text style={styles.title}>過去の整備記録</Text>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="車両番号で検索"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch} // Enterキーで検索
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>検索</Text>
        </TouchableOpacity>
      </View>

      {records.length === 0 ? (
        <Text style={styles.noRecordsText}>記録がありません。</Text>
      ) : (
        records.map(item => renderItem({ item }))
      )}

      {/* 詳細モーダル (ネイティブアプリ用 - Web版ではレンダリングしない) */}
      {Platform.OS !== 'web' && selectedRecord && modalVisible && ( // modalVisibleも条件に追加
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(!modalVisible)}
        >
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              <Text style={styles.modalTitle}>整備記録詳細</Text>
              <Text style={styles.modalText}>車両番号: {selectedRecord.vehicle_number}</Text>
              <Text style={styles.modalText}>ユーザー名: {selectedRecord.user_name}</Text>
              <Text style={styles.modalText}>車両モデル: {selectedRecord.vehicle_model}</Text>
              <Text style={styles.modalText}>問題点: {selectedRecord.problem_description}</Text>
              <Text style={styles.modalText}>とった処置: {selectedRecord.solution}</Text>
              <Text style={styles.modalText}>整備メモ: {selectedRecord.maintenance_memo}</Text>
              {selectedRecord.createdAt && selectedRecord.createdAt.toDate && (
                <Text style={styles.modalText}>
                  記録日: {selectedRecord.createdAt.toDate().toLocaleDateString('ja-JP')}
                </Text>
              )}
              
              <View style={styles.modalButtonContainer}>
                {/* 編集ボタンを追加（ネイティブアプリ用） */}
                <Pressable
                  style={[styles.button, styles.buttonEdit]}
                  onPress={() => {
                    handleEditRecord(selectedRecord); // ネイティブアプリでの編集処理
                    // ネイティブアプリではここでmodalVisibleがfalseになるはず
                    // Web版ではこのボタンは表示されない
                  }}
                >
                  <Text style={styles.textStyle}>編集</Text>
                </Pressable>

                <Pressable
                  style={[styles.button, styles.buttonClose]}
                  onPress={() => {
                    setModalVisible(!modalVisible);
                    setSelectedRecord(null); // 選択レコードをクリア
                  }}
                >
                  <Text style={styles.textStyle}>閉じる</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginRight: 10,
    backgroundColor: '#fff',
  },
  searchButton: {
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  recordItemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  recordItemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  itemText: {
    fontSize: 16,
    color: '#555',
    marginBottom: 3,
  },
  itemDate: {
    fontSize: 14,
    color: '#888',
    marginTop: 5,
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    marginLeft: 10,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  noRecordsText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 18,
    color: '#888',
  },
  // モーダルスタイル
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)', // 半透明の背景
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '80%', // モーダルの幅を調整
    maxHeight: '80%', // モーダルの最大高さを設定
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  modalText: {
    marginBottom: 10,
    fontSize: 16,
    textAlign: 'center',
    color: '#555',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    marginTop: 20,
  },
  button: {
    borderRadius: 10,
    padding: 10,
    elevation: 2,
    marginHorizontal: 10,
  },
  buttonClose: {
    backgroundColor: '#2196F3',
  },
  buttonEdit: { // 編集ボタンのスタイル
    backgroundColor: '#ffc107',
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default RecordsScreen;