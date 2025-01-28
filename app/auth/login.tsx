import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import Styles from '../styles/logRegStyle';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { app, auth } from '../../config/firebaseConfig';
import { router } from 'expo-router';

export default function Login({ navigation }: { navigation: any }) {

    const [email, setEmail] = React.useState("");
    const [password, setPassword] = React.useState("");

    const handleLogin = async () => {
        if (!email || !password) {
            alert("Please fill in all fields.");
            return;
        }

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            console.log("User logged in successfully:", userCredential.user);

            // Navigate to Feed after successful login
            router.push("/tabs/feed");
        } catch (error: any) {
            console.error("Error logging in:", error.message);
            alert(error.message);
        }
    };

    return (
        <View style={Styles.container}>
            <Text style={Styles.title}>Social Media App</Text>
            <Text style={Styles.subtitle}>Log In</Text>

            <TextInput
                style={Styles.input}
                placeholder="Enter Email"
                placeholderTextColor="#A9A9A9"
                value={email}
                onChangeText={(text) => setEmail(text)}
            />

            <TextInput
                style={Styles.input}
                placeholder="Enter Password"
                placeholderTextColor="#A9A9A9"
                value={password}
                secureTextEntry
                onChangeText={(text) => setPassword(text)}
            />

            <TouchableOpacity
                style={Styles.button}
                onPress={handleLogin}>
                <Text style={Styles.buttonText}>Log In</Text>
            </TouchableOpacity>
            <TouchableOpacity
                onPress={() => router.push("/auth/signup")}>
                <Text style={Styles.link}>Create New Account?</Text>
            </TouchableOpacity>
        </View>
    );
}
