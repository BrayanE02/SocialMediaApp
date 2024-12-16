import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import Styles from '../styles/logRegStyle'

export default function LoginScreen({ navigation }: { navigation: any }) {
    return (
        <View style={Styles.container}>
            <Text style={Styles.title}>Social Media App</Text>
            <Text style={Styles.subtitle}>Log In</Text>
            <TextInput
                style={Styles.input}
                placeholder="Enter Email"
                placeholderTextColor="#A9A9A9"
            />
            <TextInput
                style={Styles.input}
                placeholder="Enter Password"
                placeholderTextColor="#A9A9A9"
                secureTextEntry
            />
            <TouchableOpacity
                style={Styles.button}
                onPress={() => navigation.navigate('feed')}>
                <Text style={Styles.buttonText}>Log In</Text>
            </TouchableOpacity>
            <TouchableOpacity
                onPress={() => navigation.navigate('signup')}>
                <Text style={Styles.link}>Create New Account?</Text>
            </TouchableOpacity>
        </View>
    );
}
