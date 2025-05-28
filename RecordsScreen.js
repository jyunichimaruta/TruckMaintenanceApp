// RecordsScreen.js
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Button,
  FlatList, // リスト表示に使う
  ActivityIndicator, // 読み込み中の表示
  Platform,
  SafeAreaView,
  TouchableOpacity, // 詳細表示用
  Modal, // ポップアップ表示用
  ScrollView, // モーダル内のスクロール
  Image // 画像表示用
} from 'react-native';
import { collection, query, where, getDocs, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase'; // firebase.jsからdbインスタンスをインポート

export default function RecordsScreen() {
  const [searchVehicleNumber, setSearchVehicleNumber] = useState('');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null); // 詳細表示用
  const [modalVisible, setModalVisible] = useState(false); // モーダルの表示/非表示

  const fetchRecords = async () => {
    if (!searchVehicleNumber.trim()) {
      alert('車両番号を入力してください。');
      return;
    }

    setLoading(true);
    setRecords([]); // 検索前にクリア

    try {
      // 'records' コレクションから、指定されたvehicle_numberに一致するドキュメントを検索
      // timestampで新しい順にソート
      const q = query(
        collection(db, "records"),
        where("vehicle_number", "==", searchVehicleNumber.trim()),
        orderBy("timestamp", "desc") // 新しい順にソート
      );
      const querySnapshot = await getDocs(q);
      const fetchedRecords = [];
      querySnapshot.forEach((doc) => {
        // ドキュメントIDを含めてデータを取得
        fetchedRecords.push({ id: doc.id, ...doc.data() });
      });
      setRecords(fetchedRecords);

      if (fetchedRecords.length === 0) {
        alert('指定された車両番号の記録は見つかりませんでした。');
      }

    } catch (e) {
      console.error("記録の取得エラー: ", e);
      alert('記録の取得に失敗しました: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  // 詳細表示モーダルを開く
  const openRecordDetails = (record) => {
    setSelectedRecord(record);
    setModalVisible(true);
  };

  // 日付のフォーマット関数
  const formatDate = (timestamp) => {
    if (!timestamp) return '日付不明';
    // FirestoreのTimestampオブジェクトをDateオブジェクトに変換
    const date = timestamp.toDate();
    return date.toLocaleString(); // ロケールに合わせた形式で表示
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity onPress={() => openRecordDetails(item)} style={styles.recordItem}>
      <Text style={styles.itemTitle}>車両番号: {item.vehicle_number}</Text>
      <Text>ユーザー名: {item.user_name}</Text>
      <Text>問題点: {item.issue_description.substring(0, 50)}...</Text>
      <Text style={styles.itemDate}>記録日時: {formatDate(item.timestamp)}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>過去の整備記録</Text>

        <Text style={styles.label}>車両番号で検索:</Text>
        <TextInput
          style={styles.input}
          value={searchVehicleNumber}
          onChangeText={setSearchVehicleNumber}
          placeholder="検索する車両番号を入力"
        />
        <Button title="検索" onPress={fetchRecords} />

        {loading ? (
          <ActivityIndicator size="large" color="#0000ff" style={styles.loadingIndicator} />
        ) : (
          <FlatList
            data={records}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={<Text style={styles.emptyListText}>記録がありません。</Text>}
          />
        )}

        {/* 詳細表示モーダル */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => {
            setModalVisible(!modalVisible);
          }}
        >
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              <ScrollView style={styles.modalScrollView}>
                {selectedRecord && (
                  <>
                    <Text style={styles.modalTitle}>整備記録詳細</Text>
                    <Text style={styles.modalLabel}>車両番号:</Text>
                    <Text style={styles.modalText}>{selectedRecord.vehicle_number}</Text>
                    <Text style={styles.modalLabel}>ユーザー名:</Text>
                    <Text style={styles.modalText}>{selectedRecord.user_name}</Text>
                    <Text style={styles.modalLabel}>車両モデル:</Text>
                    <Text style={styles.modalText}>{selectedRecord.vehicle_model || 'N/A'}</Text>
                    <Text style={styles.modalLabel}>問題点:</Text>
                    <Text style={styles.modalText}>{selectedRecord.issue_description}</Text>
                    <Text style={styles.modalLabel}>とった処置:</Text>
                    <Text style={styles.modalText}>{selectedRecord.action_taken || 'N/A'}</Text>
                    <Text style={styles.modalLabel}>整備メモ:</Text>
                    <Text style={styles.modalText}>{selectedRecord.repair_notes || 'N/A'}</Text>
                    {/* ★変更: image_uri を image_url に変更 */}
                    {selectedRecord.image_url && (
                      <>
                        <Text style={styles.modalLabel}>添付画像:</Text>
                        <Image source={{ uri: selectedRecord.image_url }} style={styles.modalImage} />
                      </>
                    )}
                    <Text style={styles.modalLabel}>記録日時:</Text>
                    <Text style={styles.modalText}>{formatDate(selectedRecord.timestamp)}</Text>
                  </>
                )}
              </ScrollView>
              <Button title="閉じる" onPress={() => setModalVisible(!modalVisible)} />
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
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
  loadingIndicator: {
    marginTop: 20,
  },
  listContainer: {
    width: '100%',
    marginTop: 20,
  },
  recordItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  itemDate: {
    fontSize: 12,
    color: '#888',
    marginTop: 5,
    textAlign: 'right',
  },
  emptyListText: {
    marginTop: 50,
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
  },
  // モーダルスタイル
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
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
    width: '90%',
    maxHeight: '80%',
  },
  modalScrollView: {
    width: '100%',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    alignSelf: 'flex-start',
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
    color: '#555',
    alignSelf: 'flex-start',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
    alignSelf: 'flex-start',
  },
  modalImage: {
    width: '100%',
    height: 200,
    resizeMode: 'contain',
    marginTop: 10,
    marginBottom: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
});