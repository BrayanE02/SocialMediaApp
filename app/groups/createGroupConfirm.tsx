import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, FlatList, Image, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { User } from '../types/Users';
import { Ionicons } from '@expo/vector-icons';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/config/firebaseConfig';
import { getAuth } from 'firebase/auth';

export default function CreateGroupConfirm() {
    const { selectedUsers } = useLocalSearchParams();
    const router = useRouter();
    const auth = getAuth();
    const currentUser = auth.currentUser;

    const parsedUsers: User[] = JSON.parse(selectedUsers as string);
    const [groupName, setGroupName] = useState('');

    const handleCreateGroup = async () => {
        if (!groupName.trim()) {
            Alert.alert('Please enter a group name');
            return;
        }

        try {
            const groupId = `${currentUser?.uid}_${Date.now()}`;
            const memberIds = [...parsedUsers.map(u => u.id), currentUser?.uid];

            await setDoc(doc(db, 'groups', groupId), {
                id: groupId,
                name: groupName,
                createdBy: currentUser?.uid,
                members: memberIds,
                createdAt: serverTimestamp(),
            });

            Alert.alert('Group created!');
            router.replace('/tabs/groups'); // 👈 Go back to main group screen
        } catch (err) {
            console.error('Group creation failed', err);
            Alert.alert('Failed to create group');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Name Your Group</Text>

            <TextInput
                style={styles.input}
                placeholder="Enter group name..."
                placeholderTextColor="#aaa"
                value={groupName}
                onChangeText={setGroupName}
            />

            <Text style={styles.subTitle}>Selected Users</Text>
            <FlatList
                data={parsedUsers}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={styles.userItem}>
                        {item.avatar ? (
                            <Image source={{ uri: item.avatar }} style={styles.avatar} />
                        ) : (
                            <Ionicons name="person-circle-outline" size={40} color="#fff" />
                        )}
                        <Text style={styles.username}>{item.username}</Text>
                    </View>
                )}
                style={{ marginTop: 10 }}
            />

            <TouchableOpacity style={styles.button} onPress={handleCreateGroup}>
                <Text style={styles.buttonText}>Create Group</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#111',
        padding: 20,
    },
    title: {
        fontSize: 24,
        color: '#fff',
        fontWeight: 'bold',
        marginBottom: 15,
    },
    subTitle: {
        fontSize: 18,
        color: '#fff',
        marginTop: 20,
    },
    input: {
        backgroundColor: '#222',
        color: '#fff',
        padding: 12,
        borderRadius: 8,
        fontSize: 16,
    },
    userItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 8,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
    },
    username: {
        color: '#fff',
        fontSize: 16,
    },
    button: {
        backgroundColor: '#444',
        marginTop: 30,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
