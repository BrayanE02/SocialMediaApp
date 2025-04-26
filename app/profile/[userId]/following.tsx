import React, { useEffect, useState } from 'react';
import { getAuth } from 'firebase/auth';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Image } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import {
    collection,
    doc,
    getDoc,
    onSnapshot,
    setDoc,
    serverTimestamp,
    deleteDoc
} from 'firebase/firestore';
import { db, app } from '../../../config/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';

interface UserInfo {
    id: string;
    username?: string;
    photoURL?: string;
    isFollowing?: boolean;
}

export default function FollowingScreen() {
    const { userId } = useLocalSearchParams<{ userId: string }>();
    const auth = getAuth(app);
    const currentUser = auth.currentUser;
    const [followingList, setFollowingList] = useState<UserInfo[]>([]);

    useEffect(() => {
        if (!userId) return;

        // Listen to the "following" subcollection
        const followingRef = collection(db, 'users', userId, 'following');
        const unsubscribe = onSnapshot(followingRef, async (snapshot) => {
            // Each doc.id is the userId of a followed user
            const followedUserIds = snapshot.docs.map(doc => doc.id);

            const fetchedUsers: UserInfo[] = [];
            for (const followedUid of followedUserIds) {
                const userDocRef = doc(db, 'users', followedUid);
                const userSnap = await getDoc(userDocRef);
                if (userSnap.exists()) {
                    const data = userSnap.data();
                    fetchedUsers.push({
                        id: followedUid,
                        username: data.username,
                        photoURL: data.photoURL,
                        isFollowing: true,
                    });
                }
            }
            setFollowingList(fetchedUsers);
        });

        return () => unsubscribe();
    }, [userId]);

    async function followUser(targetUserId: string) {
        if (!currentUser) return;
        const followerId = currentUser.uid;

        const followDocRef = doc(db, 'users', targetUserId, 'followers', followerId);
        const followingDocRef = doc(db, 'users', followerId, 'following', targetUserId);

        await setDoc(followDocRef, {
            followerId,
            followedAt: serverTimestamp(),
        });
        await setDoc(followingDocRef, {
            followedUserId: targetUserId,
            followedAt: serverTimestamp(),
        });
        console.log("Follow successful");
    }

    async function unfollowUser(targetUserId: string) {
        if (!currentUser) return;
        const followerId = currentUser.uid;

        const followDocRef = doc(db, 'users', targetUserId, 'followers', followerId);
        const followingDocRef = doc(db, 'users', followerId, 'following', targetUserId);

        await deleteDoc(followDocRef);
        await deleteDoc(followingDocRef);
        console.log("Unfollow successful");
    }

    function renderFollowingItem({ item }: { item: UserInfo }) {
        return (
            <View style={styles.itemContainer}>
                {item.photoURL ? (
                    <Image source={{ uri: item.photoURL }} style={styles.avatar} />
                ) : (
                    <Ionicons name="person-circle-outline" size={50} color="#fff" />
                )}
                <View style={{ marginLeft: 10 }}>
                    <Text style={styles.nameText}>{item.username || 'No name'}</Text>
                    {currentUser && currentUser.uid !== item.id && (
                        <View style={{ flexDirection: 'row', marginTop: 5 }}>
                            {currentUser && currentUser.uid !== item.id && (
                                <TouchableOpacity
                                    style={item.isFollowing ? styles.unfollowButton : styles.followButton}
                                    onPress={() => item.isFollowing ? unfollowUser(item.id) : followUser(item.id)}
                                >
                                    <Text style={styles.buttonText}>
                                        {item.isFollowing ? 'Unfollow' : 'Follow'}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                </View>
            </View>
        );
    }

    return (
        <View style={styles.screenContainer}>
            <Text style={styles.title}>Following</Text>
            <FlatList
                data={followingList}
                keyExtractor={(item) => item.id}
                renderItem={renderFollowingItem}
                ListEmptyComponent={
                    <Text style={{ color: '#fff', textAlign: 'center', marginTop: 20 }}>
                        Not following anyone yet
                    </Text>
                }
            />
            <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/tabs/profile')}>
                <Text style={styles.backButtonText}>Go Back</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    screenContainer: {
        flex: 1,
        backgroundColor: '#111',
        padding: 20,
    },
    title: {
        color: '#fff',
        fontSize: 20,
        marginBottom: 10,
        textAlign: 'center',
    },
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#222',
        marginBottom: 10,
        padding: 10,
        borderRadius: 6,
    },
    nameText: {
        color: '#fff',
        fontSize: 16,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    followButton: {
        backgroundColor: '#333',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 4,
        marginRight: 5,
    },
    unfollowButton: {
        backgroundColor: 'red',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 4,
    },
    buttonText: {
        color: '#fff',
    },
    backButton: {
        backgroundColor: '#444',
        padding: 10,
        borderRadius: 5,
        marginTop: 10,
        alignSelf: 'center',
    },
    backButtonText: {
        color: '#fff',
    },
});
