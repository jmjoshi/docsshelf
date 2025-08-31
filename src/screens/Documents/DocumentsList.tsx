import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';

export default function DocumentsListScreen() {
  const documents = useSelector((state: RootState) => state.documents.documents);

  return (
    <View style={styles.container}>
      <Text>Documents Screen</Text>
      <Text>Total Documents: {documents.length}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
