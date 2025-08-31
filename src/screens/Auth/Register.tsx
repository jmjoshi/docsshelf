import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ScrollView } from 'react-native';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../../store/slices/authSlice';

export default function RegisterScreen({ navigation }: any) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumbers, setPhoneNumbers] = useState([{ type: 'mobile', number: '' }]);
  const dispatch = useDispatch();

  const addPhoneNumber = () => {
    setPhoneNumbers([...phoneNumbers, { type: 'home', number: '' }]);
  };

  const updatePhoneNumber = (index: number, field: string, value: string) => {
    const updated = [...phoneNumbers];
    updated[index] = { ...updated[index], [field]: value };
    setPhoneNumbers(updated);
  };

  const handleRegister = () => {
    if (!firstName || !lastName || !email || !password) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    // Simulate registration
    dispatch(loginSuccess({
      id: Date.now().toString(),
      email,
      firstName,
      lastName,
      phoneNumbers: phoneNumbers.filter(p => p.number),
    }));

    Alert.alert('Success', 'Account created successfully');
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Register for DocsShelf</Text>
      <TextInput
        style={styles.input}
        placeholder="First Name"
        value={firstName}
        onChangeText={setFirstName}
      />
      <TextInput
        style={styles.input}
        placeholder="Last Name"
        value={lastName}
        onChangeText={setLastName}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Text style={styles.subtitle}>Phone Numbers</Text>
      {phoneNumbers.map((phone, index) => (
        <View key={index} style={styles.phoneContainer}>
          <TextInput
            style={[styles.input, { flex: 1, marginRight: 10 }]}
            placeholder="Type (e.g., mobile)"
            value={phone.type}
            onChangeText={(value) => updatePhoneNumber(index, 'type', value)}
          />
          <TextInput
            style={[styles.input, { flex: 2 }]}
            placeholder="Number"
            value={phone.number}
            onChangeText={(value) => updatePhoneNumber(index, 'number', value)}
            keyboardType="phone-pad"
          />
        </View>
      ))}
      <Button title="Add Phone Number" onPress={addPhoneNumber} />
      <Button title="Register" onPress={handleRegister} />
      <Button title="Back to Login" onPress={() => navigation.goBack()} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  phoneContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
});
