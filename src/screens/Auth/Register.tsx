import React, { useState } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { Text, TextInput, Button, Card, Title } from 'react-native-paper';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../../store/slices/authSlice';
import { AuthService } from '../../services/auth';

interface RegisterScreenProps {
  navigation: {
    navigate: (screen: string) => void;
    goBack: () => void;
  };
}

export default function RegisterScreen({ navigation }: RegisterScreenProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumbers, setPhoneNumbers] = useState([
    { type: 'mobile', number: '' },
  ]);
  const dispatch = useDispatch();

  const addPhoneNumber = () => {
    setPhoneNumbers([...phoneNumbers, { type: 'home', number: '' }]);
  };

  const updatePhoneNumber = (index: number, field: string, value: string) => {
    const updated = [...phoneNumbers];
    updated[index] = { ...updated[index], [field]: value };
    setPhoneNumbers(updated);
  };

  const handleRegister = async () => {
    if (!firstName || !lastName || !email || !password) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    try {
      const user = await AuthService.register({
        firstName,
        lastName,
        email,
        password,
        phoneNumbers: phoneNumbers.filter((p) => p.number),
      });

      dispatch(loginSuccess(user));
      Alert.alert('Success', 'Account created successfully!');
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Registration failed'
      );
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>Register for DocsShelf</Title>
          <TextInput
            label="First Name"
            value={firstName}
            onChangeText={setFirstName}
            style={styles.input}
          />
          <TextInput
            label="Last Name"
            value={lastName}
            onChangeText={setLastName}
            style={styles.input}
          />
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />
          <TextInput
            label="Password (min 12 chars, uppercase, lowercase, number, symbol)"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
          />
          <Text style={styles.subtitle}>Phone Numbers</Text>
          {phoneNumbers.map((phone, index) => (
            <View key={index} style={styles.phoneContainer}>
              <TextInput
                label="Type (e.g., mobile)"
                value={phone.type}
                onChangeText={(value) =>
                  updatePhoneNumber(index, 'type', value)
                }
                style={[styles.input, { flex: 1, marginRight: 10 }]}
              />
              <TextInput
                label="Number"
                value={phone.number}
                onChangeText={(value) =>
                  updatePhoneNumber(index, 'number', value)
                }
                keyboardType="phone-pad"
                style={[styles.input, { flex: 2 }]}
              />
            </View>
          ))}
          <Button
            mode="outlined"
            onPress={addPhoneNumber}
            style={styles.button}
          >
            Add Phone Number
          </Button>
          <Button
            mode="contained"
            onPress={handleRegister}
            style={styles.button}
          >
            Register
          </Button>
          <Button
            mode="text"
            onPress={() => navigation.goBack()}
            style={styles.button}
          >
            Back to Login
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  card: {
    padding: 10,
  },
  title: {
    textAlign: 'center',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 10,
    marginTop: 10,
  },
  input: {
    marginBottom: 10,
  },
  phoneContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  button: {
    marginTop: 10,
  },
});
