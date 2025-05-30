// RecordsScreen.js
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
} from 'react-native';

import { Dialog, Button as ElementsButton } from 'react-native-elements'; 

import DateTimePicker from '@react-native-community/datetimepicker'; 

import { collection, query, orderBy, getDocs, doc, deleteDoc, where, Timestamp } from 'firebase/firestore';
import { db } from './firebase';

const RecordsScreen = ({ navigation }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedRecordId, setSelectedRecordId] = useState(null);

  const [searchVehicleNumber, setSearchVehicleNumber] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState('date');
  const [pickingFor, setPickingFor] = useState(null);

  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || new Date();
    if (Platform.OS === 'ios') {
      setShowDatePicker(false); 
    }
    if (pickingFor === 'start') {
      setStartDate(currentDate);
    } else if (pickingFor === 'end') {
      setEndDate(currentDate);
    }
  };

  const showMode = (currentMode, forWhichDate) => {
    setShowDatePicker(true);
    setDatePickerMode(currentMode);
    setPickingFor(forWhichDate);
  };

  const showStartDatePicker = () => {
    showMode('date', 'start');
  };

  const showEndDatePicker = () => {
    showMode('date', 'end');
  };

  const fetchRecords = async (vehicleNum = searchVehicleNumber, startDt = startDate, endDt = endDate) => {
    console.log("fetchRecords: 記録の取得を開始します。");
    setLoading(true);
    setRefreshing(true);
    try {
      let recordsCollection = collection(db, 'records');
      let q = query(recordsCollection, orderBy('timestamp', 'desc'));

      const queryConditions = [];

      if (vehicleNum) {
        queryConditions.push(where('vehicle_number', '==', vehicleNum));
      }

      if (startDt) {
        queryConditions.push(where('timestamp', '>=', Timestamp.fromDate(startDt)));
      }
      if (endDt) {
        const nextDay = new Date(endDt);
        nextDay.setDate(nextDay.getDate() + 1);
        nextDay.setHours(0, 0, 0, 0);
        queryConditions.push(where('timestamp', '<', Timestamp.fromDate(nextDay)));
      }

      if (queryConditions.length > 0) {
        q = query(recordsCollection, ...queryConditions, orderBy('timestamp', 'desc')); 
      }

      const querySnapshot = await getDocs(q);
      const fetchedRecords = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRecords(fetchedRecords);
      console.log("fetchRecords: 記録の取得に成功しました。取得件数:", fetchedRecords.length);
    } catch (error) {
      console.error("fetchRecords: 記録の取得エラー: ", error);
      Platform.OS === 'web'
        ? window.alert("エラー: 記録の読み込み中に問題が発生しました。\n" + error.message)
        : Alert.alert("エラー", "記録の読み込み中に問題が発生しました。\n" + error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
      console.log("fetchRecords: 記録の取得処理を終了しました。");
    }
  };

  const handleSearch = () => {
    fetchRecords();
  };

  const handleClearFilters = () => {
    setSearchVehicleNumber('');
    setStartDate(null);
    setEndDate(null);
    fetchRecords('', null, null);
  };

  useEffect(() => {
    fetchRecords();
    const unsubscribe = navigation.addListener('focus', () => {
      fetchRecords();
    });

    return unsubscribe;
  }, [navigation]);

  const handleDeleteRecord = async (id) => {
    console.log("1. handleDeleteRecordが呼び出されました。ID:", id); 

    if (Platform.OS === 'web') {
      setSelectedRecordId(id);
      setShowDeleteDialog(true);
    } else {
      Alert.alert(
        "記録の削除",
        "この記録を本当に削除しますか？",
        [
          {
            text: "キャンセル",
            style: "cancel",
            onPress: () => {
              console.log("2. 削除アラート：キャンセルが選択されました。"); 
            }
          },
          {
            text: "削除",
            onPress: async () => {
              console.log("3. 削除アラート：削除が選択されました。"); 
              try {
                console.log("4. Firestoreドキュメント削除開始。コレクション: records, ID:", id); 
                await deleteDoc(doc(db, "records", id));
                console.log("5. Firestoreドキュメント削除成功。ID:", id); 
                Alert.alert("成功", "記録が削除されました。");
                fetchRecords();
              } catch (error) {
                console.error("6. 記録の削除中にエラーが発生しました:", error); 
                Alert.alert("エラー", "記録の削除に失敗しました: " + error.message);
              }
            },
            style: "destructive"
          }
        ],
        { cancelable: false }
      );
    }
  };

  const deleteRecordConfirmed = async () => {
    setShowDeleteDialog(false);
    if (!selectedRecordId) return;

    console.log("3. 削除ダイアログ：削除が選択されました。"); 
    try {
      console.log("4. Firestoreドキュメント削除開始。コレクション: records, ID:", selectedRecordId); 
      await deleteDoc(doc(db, "records", selectedRecordId));
      console.log("5. Firestoreドキュメント削除成功。ID:", selectedRecordId); 
      window.alert("成功: 記録が削除されました。");
      fetchRecords();
    } catch (error) {
      console.error("6. 記録の削除中にエラーが発生しました:", error); 
      window.alert("エラー: 記録の削除に失敗しました: " + error.message);
    } finally {
      setSelectedRecordId(null);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.recordItemContainer}>
      <TouchableOpacity
        style={styles.recordItemContent} 
        onPress={() => {
          console.log("スマホのWebブラウザで項目がタップされました！"); // ★追加
          navigation.navigate('Form', { recordToEdit: item });
        }}
      >
        <Text style={styles.itemTitle}>車両番号: {item.vehicle_number}</Text>
        <Text style={styles.itemText}>ユーザー名: {item.user_name}</Text>
        <Text style={styles.itemText}>車両モデル: {item.vehicle_model}</Text>
        <Text style={styles.itemText}>問題点: {item.issue_description}</Text>
        <Text style={styles.itemText}>とった処置: {item.action_taken}</Text>
        <Text style={styles.itemText}>整備メモ: {item.repair_notes}</Text>
        {item.timestamp && (
          <Text style={styles.itemDate}>
            日時: {new Date(item.timestamp.seconds * 1000).toLocaleString('ja-JP')}
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>記録を読み込み中...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        <TextInput
          style={styles.textInput}
          placeholder="車両番号で検索"
          value={searchVehicleNumber}
          onChangeText={setSearchVehicleNumber}
        />
        <View style={styles.datePickerRow}>
          <ElementsButton
            title={startDate ? startDate.toLocaleDateString('ja-JP') : "開始日を選択"}
            onPress={showStartDatePicker}
            type="outline"
            containerStyle={styles.dateButtonContainer}
            buttonStyle={styles.dateButton}
            titleStyle={styles.dateButtonTitle}
          />
          <Text style={styles.dateRangeText}> ～ </Text>
          <ElementsButton
            title={endDate ? endDate.toLocaleDateString('ja-JP') : "終了日を選択"}
            onPress={showEndDatePicker}
            type="outline"
            containerStyle={styles.dateButtonContainer}
            buttonStyle={styles.dateButton}
            titleStyle={styles.dateButtonTitle}
          />
        </View>
        <View style={styles.filterButtons}>
          <ElementsButton
            title="検索"
            onPress={handleSearch}
            containerStyle={styles.searchButtonContainer}
            buttonStyle={styles.searchButton}
            titleStyle={styles.searchButtonTitle}
          />
          <ElementsButton
            title="クリア"
            onPress={handleClearFilters}
            type="outline"
            containerStyle={styles.clearButtonContainer}
            buttonStyle={styles.clearButton}
            titleStyle={styles.clearButtonTitle}
          />
        </View>
      </View>

      {showDatePicker && (
        <DateTimePicker
          testID="dateTimePicker"
          value={pickingFor === 'start' ? (startDate || new Date()) : (endDate || new Date())}
          mode={datePickerMode}
          is24Hour={true}
          display="default"
          onChange={onDateChange}
        />
      )}

      {records.length === 0 ? (
        <Text style={styles.noRecordsText}>該当する記録がありません。</Text> 
      ) : (
        <FlatList
          data={records}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={fetchRecords} />
          }
        />
      )}

      {Platform.OS === 'web' && (
        <Dialog
          isVisible={showDeleteDialog}
          onBackdropPress={() => setShowDeleteDialog(false)}
        >
          <Dialog.Title title="記録の削除" />
          <Text>この記録を本当に削除しますか？</Text>
          <Dialog.Actions>
            <ElementsButton
              title="キャンセル"
              type="clear"
              onPress={() => {
                console.log("2. 削除ダイアログ：キャンセルが選択されました。");
                setShowDeleteDialog(false);
                setSelectedRecordId(null);
              }}
            />
            <ElementsButton
              title="削除"
              buttonStyle={{ backgroundColor: '#dc3545' }}
              onPress={deleteRecordConfirmed}
            />
          </Dialog.Actions>
        </Dialog>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  textInput: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  datePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  dateButtonContainer: {
    flex: 1,
    marginHorizontal: 5,
  },
  dateButton: {
    borderColor: '#007bff',
    borderWidth: 1,
  },
  dateButtonTitle: {
    color: '#007bff',
  },
  dateRangeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
  },
  filterButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  searchButtonContainer: {
    flex: 1,
    marginRight: 5,
  },
  searchButton: {
    backgroundColor: '#007bff',
  },
  searchButtonTitle: {
    color: '#fff',
  },
  clearButtonContainer: {
    flex: 1,
    marginLeft: 5,
  },
  clearButton: {
    borderColor: '#6c757d',
    borderWidth: 1,
  },
  clearButtonTitle: {
    color: '#6c757d',
  },
  recordItemContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recordItemContent: {
    flex: 1,
    marginRight: 10,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  itemText: {
    fontSize: 15,
    marginBottom: 3,
    color: '#555',
  },
  itemDate: {
    fontSize: 13,
    color: '#888',
    marginTop: 5,
    textAlign: 'right',
  },
  noRecordsText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 50,
    color: '#777',
  },
  deleteButton: { 
    backgroundColor: '#dc3545',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default RecordsScreen;