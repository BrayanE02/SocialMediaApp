import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Styles from '../styles/logRegStyle'

export default function SignUpScreen({ navigation }: { navigation: any }) {

    return (
        <View style={Styles.container}>
            {/* Back Arrow */}
            <TouchableOpacity onPress={() => navigation.goBack()} style={Styles.backArrow}>
                <Text style={Styles.backColor}>←</Text>
            </TouchableOpacity>

            <Text style={Styles.title}>Social Media App</Text>
            <Text style={Styles.subtitle}>Sign Up</Text>

            {/* Text Inputs */}
            <TextInput style={Styles.input} placeholder="Email" placeholderTextColor="#A9A9A9" />
            <TextInput style={Styles.input} placeholder="Username" placeholderTextColor="#A9A9A9" />
            <TextInput
                style={Styles.input}
                placeholder="Password"
                placeholderTextColor="#A9A9A9"
                secureTextEntry
            />
            <TextInput
                style={Styles.input}
                placeholder="Confirm Password"
                placeholderTextColor="#A9A9A9"
                secureTextEntry
            />

            <TouchableOpacity
                style={Styles.button}
                onPress={() => navigation.navigate('Feed')}
            >
                <Text style={Styles.buttonText}>Sign Up</Text>
            </TouchableOpacity>

        </View>
    );
}