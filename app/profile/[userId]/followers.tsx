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

export default function FollowersScreen() {
    const { userId } = useLocalSearchParams<{ userId: string }>();
    const auth = getAuth(app);
    const currentUser = auth.currentUser;
    const [followerList, setFollowerList] = useState<UserInfo[]>([]);

    useEffect(() => {
        if (!userId || !currentUser) return;

        const followersRef = collection(db, 'users', userId, 'followers');

        const unsubscribe = onSnapshot(followersRef, async (snapshot) => {
            const docs = snapshot.docs.map(doc => doc.id);
            const fetchedUsers: UserInfo[] = [];

            for (const followerUid of docs) {
                const userDocRef = doc(db, 'users', followerUid);
                const userSnap = await getDoc(userDocRef);

                if (userSnap.exists()) {
                    const data = userSnap.data();

                    // Check if current user is following this person
                    const currentUserFollowingDoc = doc(
                        db,
                        'users',
                        currentUser.uid,
                        'following',
                        followerUid
                    );
                    const followingSnap = await getDoc(currentUserFollowingDoc);

                    fetchedUsers.push({
                        id: followerUid,
                        username: data.username,
                        photoURL: data.photoURL,
                        isFollowing: followingSnap.exists(), // follow status
                    });
                }
            }

            setFollowerList(fetchedUsers);
        });

        return () => unsubscribe();
    }, [userId]);

    // Follow or Unfollow logic
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
    }

    async function unfollowUser(targetUserId: string) {
        if (!currentUser) return;
        const followerId = currentUser.uid;

        const followDocRef = doc(db, 'users', targetUserId, 'followers', followerId);
        const followingDocRef = doc(db, 'users', followerId, 'following', targetUserId);

        await deleteDoc(followDocRef);
        await deleteDoc(followingDocRef);
    }

    // Renders each follower in the list
    function renderFollowerItem({ item }: { item: UserInfo }) {
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
                            <TouchableOpacity
                                style={item.isFollowing ? styles.unfollowButton : styles.followButton}
                                onPress={() => item.isFollowing ? unfollowUser(item.id) : followUser(item.id)}
                            >
                                <Text style={styles.buttonText}>
                                    {item.isFollowing ? 'Unfollow' : 'Follow'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        );
    }

    return (
        <View style={styles.screenContainer}>
            <Text style={styles.title}>Followers</Text>
            <FlatList
                data={followerList}
                keyExtractor={(item) => item.id}
                renderItem={renderFollowerItem}
                ListEmptyComponent={
                    <Text style={{ color: '#fff', textAlign: 'center', marginTop: 20 }}>
                        No followers yet
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
