import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, FlatList, Image, Alert, ScrollView, KeyboardAvoidingView, SafeAreaView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { User } from '../types/Users';
import { Ionicons } from '@expo/vector-icons';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/config/firebaseConfig';
import { getAuth } from 'firebase/auth';
import TopBar from '@/components/TopBar';

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
            router.replace('/tabs/groups');
        } catch (err) {
            console.error('Group creation failed', err);
            Alert.alert('Failed to create group');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <TopBar
                title="New Group"
                showBell={false}
                showBack={true}
                onBackPress={() => router.replace('/tabs/groups')}
            />

            <View style={styles.inner}>
                <Text style={styles.label}>Group Name</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter group name..."
                    placeholderTextColor="#aaa"
                    value={groupName}
                    onChangeText={setGroupName}
                />

                <Text style={styles.label}>Selected Users</Text>
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
                    ListEmptyComponent={
                        <Text style={{ color: '#aaa', marginTop: 10 }}>No users selected.</Text>
                    }
                    style={styles.userList}
                />

                <TouchableOpacity style={styles.button} onPress={handleCreateGroup}>
                    <Text style={styles.buttonText}>Create Group</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    inner: {
        flex: 1,
        padding: 16,
    },
    label: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 8,
        marginTop: 16,
    },
    input: {
        backgroundColor: '#1a1a1a',
        color: '#fff',
        padding: 12,
        borderRadius: 8,
        fontSize: 16,
    },
    userList: {
        marginTop: 10,
        marginBottom: 20,
    },
    userItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
    },
    username: {
        color: '#fff',
        fontSize: 16,
    },
    button: {
        backgroundColor: '#333',
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 'auto',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});