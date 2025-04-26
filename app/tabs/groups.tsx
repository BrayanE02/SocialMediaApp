import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, Alert, FlatList, TouchableOpacity, Image } from 'react-native';
import Styles from '../styles/tabsStyle';
import { User } from '../types/Users';
import { getAuth } from 'firebase/auth';
import { collection, doc, onSnapshot, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { db } from '@/config/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import TopBar from '@/components/TopBar';
import { router, useFocusEffect } from 'expo-router';

export default function GroupsScreen() {
    const [search, setSearch] = useState('');
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [groups, setGroups] = useState<any[]>([]);

    const auth = getAuth();
    const currentUser = auth.currentUser;

    // Load users & groups on mount
    useEffect(() => {
        const q = query(collection(db, 'users'));
        const unsubscribeUsers = onSnapshot(q, snapshot => {
            const fetched = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            })) as User[];

            setUsers(fetched.filter(user => user.id !== currentUser?.uid));
        });

        if (!currentUser) return;

        const groupQuery = query(
            collection(db, 'groups'),
            where('members', 'array-contains', currentUser.uid)
        );

        const unsubscribeGroups = onSnapshot(groupQuery, snapshot => {
            const userGroups = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            setGroups(userGroups);
        });

        return () => {
            unsubscribeUsers();
            unsubscribeGroups();
        };
    }, []);

    // Reset screen state on focus
    useFocusEffect(
        useCallback(() => {
            setSearch('');
            setSelectedUsers([]);
        }, [])
    );

    // Add/remove user from the selected list
    const toggleUser = (id: string) => {
        setSelectedUsers(prev =>
            prev.includes(id)
                ? prev.filter(uid => uid !== id)
                : [...prev, id]
        );
    };

    // Navigates to group confirmation screen
    const goToGroupConfirm = () => {
        const selected = users.filter(user => selectedUsers.includes(user.id));

        if (!selected.length) {
            Alert.alert('Select users to create a group.');
            return;
        }

        router.push({
            pathname: '/groups/createGroupConfirm',
            params: {
                selectedUsers: encodeURIComponent(JSON.stringify(selected)),
            },
        });
    };

    // filter users based on search text
    const filteredUsers = users.filter(user =>
        user.username.toLowerCase().includes(search.toLowerCase())
    );

    const filteredGroups = groups.filter(group =>
        group.name?.toLowerCase().includes(search.toLowerCase())
    );

    const combinedSearchResults = [
        ...filteredGroups.map(group => ({ ...group, _type: 'group' })),
        ...filteredUsers.map(user => ({ ...user, _type: 'user' })),
    ];
    return (
        <SafeAreaView style={Styles.safeArea}>
            <TopBar showBell={false} />
            <View style={Styles.container}>
                <TextInput
                    placeholder="Search users..."
                    placeholderTextColor="#888"
                    value={search}
                    onChangeText={setSearch}
                    style={styles.searchBar}
                />

                <FlatList
                    data={search ? combinedSearchResults : groups}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => {
                        if (search) {
                            if (item._type === 'user') {
                                return (
                                    <View style={styles.userItem}>
                                        {item.avatar ? (
                                            <Image source={{ uri: item.avatar }} style={styles.avatar} />
                                        ) : (
                                            <Ionicons name="person-circle-outline" size={50} color="#fff" />
                                        )}
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
                                                        {selectedUsers.includes(item.id) ? 'Added' : 'Add to group'}
                                                    </Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    </View>
                                );
                            } else if (item._type === 'group') {
                                return (
                                    <TouchableOpacity
                                        style={styles.userItem}
                                        onPress={() => router.push(`/groups/${item.id}`)}
                                    >
                                        <Ionicons name="people" size={50} color="#fff" />
                                        <View style={{ marginLeft: 10 }}>
                                            <Text style={styles.username}>{item.name || 'Unnamed Group'}</Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            }
                        } else {
                            // no search: show just groups
                            return (
                                <TouchableOpacity
                                    style={styles.userItem}
                                    onPress={() => {
                                        router.push(`/groups/${item.id}`);
                                    }}                                >
                                    <Ionicons name="people" size={50} color="#fff" />
                                    <View style={{ marginLeft: 10 }}>
                                        <Text style={styles.username}>{item.name || 'Unnamed Group'}</Text>
                                    </View>
                                </TouchableOpacity>

                            );
                        }

                        return null;
                    }}
                    ListEmptyComponent={
                        <Text style={{ color: '#fff', textAlign: 'center', marginTop: 20 }}>
                            {search ? 'No users found' : 'No groups found'}
                        </Text>
                    }
                    contentContainerStyle={{ paddingBottom: 100 }}
                />

                {search.length > 0 && (
                    <TouchableOpacity style={styles.createBtn} onPress={goToGroupConfirm}>
                        <Text style={styles.createText}>Create Group</Text>
                    </TouchableOpacity>
                )}
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