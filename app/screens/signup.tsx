import React from 'react';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Styles from '../styles/logRegStyle'
import { app } from '../config/firebaseConfig';

export default function SignUpScreen({ navigation }: { navigation: any }) {

    const auth = getAuth(app);

    const [email, setEmail] = React.useState("");
    const [password, setPassword] = React.useState("");

    const handleSignUp = async (email: string, password: string) => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            console.log("User created successfully:", userCredential.user);
            // Navigate to Feed or Login page after successful sign-up
            navigation.navigate("feed");
        } catch (error: any) {
            console.error("Error signing up:", error.message);
            alert(error.message); // Display the error to the user
        }
    };

    return (
        <View style={Styles.container}>
            {/* Back Arrow */}
            <TouchableOpacity onPress={() => navigation.goBack()} style={Styles.backArrow}>
                <Text style={Styles.backColor}>←</Text>
            </TouchableOpacity>

            <Text style={Styles.title}>Social Media App</Text>
            <Text style={Styles.subtitle}>Sign Up</Text>

            {/* Text Inputs */}
            <TextInput
                style={Styles.input}
                placeholder="Email"
                placeholderTextColor="#A9A9A9"
                value={email}
                onChangeText={(text) => setEmail(text)} />

            <TextInput style={Styles.input} placeholder="Username" placeholderTextColor="#A9A9A9" />
            <TextInput
                style={Styles.input}
                placeholder="Password"
                placeholderTextColor="#A9A9A9"
                value={password}
                secureTextEntry
                onChangeText={(text) => setPassword(text)} />

            <TextInput
                style={Styles.input}
                placeholder="Confirm Password"
                placeholderTextColor="#A9A9A9"
                secureTextEntry />

            <TouchableOpacity
                style={Styles.button}
                onPress={() => handleSignUp(email, password)}
            >
                <Text style={Styles.buttonText}>Sign Up</Text>
            </TouchableOpacity>

        </View>
    );
}