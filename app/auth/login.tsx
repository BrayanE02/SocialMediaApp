import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
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
            // Handle common Firebase Auth errors
            let errorMessage = "";
            switch (error.code) {
                case "auth/invalid-credential":
                    errorMessage = "Invalid credentials provided. Please check your email and password.";
                    break;
                case "auth/invalid-email":
                    errorMessage = "The email address is not valid.";
                    break;
                case "auth/user-disabled":
                    errorMessage = "This user account has been disabled.";
                    break;
                case "auth/user-not-found":
                    errorMessage = "There is no account for this email.";
                    break;
                case "auth/wrong-password":
                    errorMessage = "The password is incorrect.";
                    break;
                case "auth/too-many-requests":
                    errorMessage = "Too many unsuccessful login attempts. Please try again later.";
                    break;
                default:
                    errorMessage = error.message;
                    break;
            }
            // Display the error message in an alert
            Alert.alert("Login Error", errorMessage);
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
