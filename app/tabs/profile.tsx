import React from 'react';
import { getAuth, signOut } from "firebase/auth";
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Styles from '../styles/logRegStyle';
import { app } from '../../config/firebaseConfig';
import { router } from 'expo-router';

export default function ProfileScreen({ navigation }: { navigation: any }) {
    const auth = getAuth(app);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            console.log("User logged out successfully.");
            // Navigate back to Login screen after logout
            router.push("/auth/login");
        } catch (error: any) {
            console.error("Error logging out:", error.message);
            alert("An error occurred while logging out.");

        }
    };

    return (
        <View style={Styles.container}>
            <Text style={Styles.title}>Profile</Text>

            {/* Logout Button */}
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.logoutButtonText}>Log Out</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    logoutButton: {
        marginTop: 20,
        backgroundColor: '#FF6347',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    logoutButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
