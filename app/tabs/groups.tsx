import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, Alert, FlatList, TouchableOpacity, Image } from 'react-native';
import Styles from '../styles/tabsStyle';
import { User } from '../types/Users';
import { getAuth } from 'firebase/auth';
import { collection, doc, onSnapshot, query, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/config/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import TopBar from '@/components/TopBar';

export default function GroupsScreen() {
    const [search, setSearch] = useState('');
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const auth = getAuth();
    const currentUser = auth.currentUser;
    // Real time listener to fetch all users from Firestore
    useEffect(() => {
        const q = query(collection(db, 'users'));

        const unsubscribe = onSnapshot(q, snapshot => {
            const fetched = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            })) as User[];

            // Filter out the current user from the list
            setUsers(fetched.filter(user => user.id !== currentUser?.uid));
        });

        // Clean up listener on unmount
        return () => unsubscribe();
    }, []);

    // Add/remove user from the selected list
    const toggleUser = (id: string) => {
        setSelectedUsers(prev =>
            prev.includes(id)
                ? prev.filter(uid => uid !== id)
                : [...prev, id]
        );
    };

    // Create group document in Firestore
    const createGroup = async () => {
        if (!selectedUsers.length) {
            Alert.alert('Select users to create a group.');
            return;
        }

        try {
            const groupId = `${currentUser?.uid}_${Date.now()}`; // unique group ID

            await setDoc(doc(db, 'groups', groupId), {
                createdBy: currentUser?.uid,
                members: [...selectedUsers, currentUser?.uid], // include yourself
                createdAt: serverTimestamp(),
            });

            Alert.alert('Group created!');
            setSelectedUsers([]); // clear selected users after group creation
        } catch (error: any) {
            console.error('Error creating group:', error.message);
            Alert.alert('Failed to create group');
        }
    };

    // filter users based on search text
    const filteredUsers = users.filter(user =>
        user.username.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <SafeAreaView style={Styles.safeArea}>
            {/* Header */}
            <TopBar showBell={false} />

            <View style={Styles.container}>

                {/* Search */}
                <TextInput
                    placeholder="Search users..."
                    placeholderTextColor="#888"
                    value={search}
                    onChangeText={setSearch}
                    style={styles.searchBar}
                />

                {/* List of users */}
                <FlatList
                    data={filteredUsers}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <View style={styles.userItem}>
                            {/* Avatar or default icon */}
                            {item.avatar ? (
                                <Image source={{ uri: item.avatar }} style={styles.avatar} />
                            ) : (
                                <Ionicons name="person-circle-outline" size={50} color="#fff" />
                            )}

                            {/* Username & Add/Added button */}
                            <View style={{ marginLeft: 10, flex: 1 }}>
                                <Text style={styles.username}>{item.username || 'Unknown'}</Text>

                                {currentUser && currentUser.uid !== item.id && (
                                    <TouchableOpacity
                                        style={[
                                            styles.addButton,
                                            selectedUsers.includes(item.id) && styles.added,
                                        ]}
                                        onPress={() => toggleUser(item.id)}
                                    >
                                        <Text style={styles.addButtonText}>
                                            {selectedUsers.includes(item.id) ? 'Added to group' : 'Add to group'}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    )}
                    ListEmptyComponent={
                        <Text style={{ color: '#fff', textAlign: 'center', marginTop: 20 }}>
                            No users found
                        </Text>
                    }
                    contentContainerStyle={{ paddingBottom: 100 }}
                />

                {/* Create Group Button */}
                <TouchableOpacity style={styles.createBtn} onPress={createGroup}>
                    <Text style={styles.createText}>Create Group</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    searchBar: {
        backgroundColor: '#1a1a1a',
        color: '#fff',
        borderRadius: 10,
        padding: 12,
        marginTop: 20,
        fontSize: 16,
        marginBottom: 10,
    },
    userItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#222',
        marginBottom: 10,
        padding: 10,
        borderRadius: 6,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    username: {
        color: '#fff',
        fontSize: 16,
    },
    addButton: {
        backgroundColor: '#444',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 4,
        marginTop: 5,
        alignSelf: 'flex-start',
    },
    added: {
        backgroundColor: '#666',
    },
    addButtonText: {
        color: '#fff',
    },
    createBtn: {
        marginTop: 20,
        backgroundColor: '#333',
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    createText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
