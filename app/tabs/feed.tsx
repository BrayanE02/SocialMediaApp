import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function FeedScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Social Media App</Text>
            {/* Feed Content Here */}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'black',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: 'white',
    },
});
