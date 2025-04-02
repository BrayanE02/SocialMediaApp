import React, { useEffect, useState } from 'react';
import { getAuth } from 'firebase/auth';
import { View, Text, TouchableOpacity, StyleSheet, Image, FlatList, SafeAreaView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
    doc,
    getDoc,
    onSnapshot,
    orderBy,
    query,
    where,
    setDoc,
    serverTimestamp,
    deleteDoc,
    collection
} from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { app, db } from '@/config/firebaseConfig';
import Styles from '../styles/tabsStyle';
import PostItem from '../../components/post';
import TopBar from '@/components/TopBar';

interface Post {
    id: string;
    text: string;
    userId: string;
    mediaUrl?: string;
    likedBy?: string[];
}

export default function ProfileScreen() {
    const { userId: routeUserId } = useLocalSearchParams();
    const auth = getAuth(app);
    const currentUser = auth.currentUser;
    const currentUserId = currentUser?.uid;

    // Decide which profile we're looking at
    const userId = typeof routeUserId === 'string' ? routeUserId : currentUserId;
    const isOwnProfile = userId === currentUserId;

    const [userData, setUserData] = useState<any>(null);
    const [userPosts, setUserPosts] = useState<Post[]>([]);
    const [isFollowing, setIsFollowing] = useState(false);

    const [followersCount, setFollowersCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);

    useEffect(() => {
        if (!userId) return;
        const fetchUserData = async () => {
            try {
                const userDocRef = doc(db, 'users', userId);
                const docSnap = await getDoc(userDocRef);
                if (docSnap.exists()) {
                    setUserData(docSnap.data());
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
            }
        };
        fetchUserData();
    }, [userId]);

    // Listen to the target user's "followers" subcollection in real time
    useEffect(() => {
        if (!userId) return;
        const followersRef = collection(db, 'users', userId, 'followers');
        const unsubscribe = onSnapshot(followersRef, (snapshot) => {
            setFollowersCount(snapshot.size);
            if (currentUser) {
                const isCurrentlyFollowing = snapshot.docs.some((doc) => doc.id === currentUser.uid);
                setIsFollowing(isCurrentlyFollowing);
            }
        });
        return () => unsubscribe();
    }, [userId, currentUser]);


    // Listen to the target user's "following" subcollection in real time
    useEffect(() => {
        if (!userId) return;

        const followingRef = collection(db, 'users', userId, 'following');
        const unsubscribe = onSnapshot(followingRef, (snapshot) => {
            setFollowingCount(snapshot.size);
        });

        return () => unsubscribe();
    }, [userId]);

    // Listen to the target user's public posts
    useEffect(() => {
        if (!userId) return;
        const q = query(
            collection(db, 'posts'),
            where('userId', '==', userId),
            where('public', '==', true),
            orderBy('createdAt', 'desc')
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const postsData = snapshot.docs.map((doc) => {
                const data = doc.data();
                return {
                    id: doc.id,
                    userId: data.userId,
                    text: data.text || '',
                    mediaUrl: data.mediaUrl,
                    likedBy: Array.isArray(data.likedBy) ? data.likedBy : [],
                } as Post;
            });
            setUserPosts(postsData);
        });
        return () => unsubscribe();
    }, [userId]);

    // Follow the user
    async function followUser(targetUserId: string) {
        if (!currentUser) {
            console.error('User is not authenticated');
            return;
        }
        const followerId = currentUser.uid;

        // Write to the followed user's "followers" subcollection
        const followDocRef = doc(db, 'users', targetUserId, 'followers', followerId);

        // Write to the current user's "following" subcollection
        const followingDocRef = doc(db, 'users', followerId, 'following', targetUserId);

        try {
            await setDoc(followDocRef, {
                followerId,
                followedAt: serverTimestamp(),
            });
            await setDoc(followingDocRef, {
                followedUserId: targetUserId,
                followedAt: serverTimestamp(),
            });
            console.log('Follow successful');
        } catch (error) {
            console.error('Error following user:', error);
        }
    }

    // Unfollow the user
    async function unfollowUser(targetUserId: string) {
        if (!currentUser) {
            console.error('User is not authenticated');
            return;
        }
        const followerId = currentUser.uid;

        const followDocRef = doc(db, 'users', targetUserId, 'followers', followerId);
        const followingDocRef = doc(db, 'users', followerId, 'following', targetUserId);

        try {
            await deleteDoc(followDocRef);
            await deleteDoc(followingDocRef);
            console.log('Unfollow successful');
        } catch (error) {
            console.error('Error unfollowing user:', error);
        }
    }

    // Toggle follow/unfollow
    const handleFollowToggle = async () => {
        if (!userId) return;
        if (isFollowing) {
            await unfollowUser(userId);
            setIsFollowing(false);
        } else {
            await followUser(userId);
            setIsFollowing(true);
        }
    };

    const usernameDisplayed = userData?.username || 'No username set';

    return (
        <SafeAreaView style={Styles.container}>
            <TopBar showBell={false} />
            <FlatList
                data={userPosts}
                keyExtractor={(item) => item.id}
                ListHeaderComponent={
                    <>
                        <View style={styles.topSection}>
                            <View style={styles.leftColumn}>
                                {userData?.photoURL ? (
                                    <Image source={{ uri: userData.photoURL }} style={styles.profileImage} />
                                ) : (
                                    <View style={styles.profileImagePlaceholder}>
                                        <Ionicons name="person-circle-outline" size={80} color="#fff" />
                                    </View>
                                )}
                            </View>
                            <View style={styles.rightColumn}>
                                <View style={styles.statsContainer}>
                                    <View style={styles.statItem}>
                                        <Text style={styles.statNumber}>
                                            {userData?.posts ?? userPosts.length}
                                        </Text>
                                        <Text style={styles.statLabel}>Posts</Text>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.statItem}
                                        onPress={() => router.push(`/profile/${userId}/followers`)}
                                    >
                                        <Text style={styles.statNumber}>{followersCount}</Text>
                                        <Text style={styles.statLabel}>Followers</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.statItem}
                                        onPress={() => router.push(`/profile/${userId}/following`)}
                                    >
                                        <Text style={styles.statNumber}>{followingCount}</Text>
                                        <Text style={styles.statLabel}>Following</Text>
                                    </TouchableOpacity>
                                </View>
                                {isOwnProfile ? (
                                    <TouchableOpacity
                                        style={styles.editButton}
                                        onPress={() => router.push(`/profile/${userId}/editProfile`)}
                                    >
                                        <Text style={styles.editButtonText}>Edit Profile</Text>
                                    </TouchableOpacity>
                                ) : (
                                    <TouchableOpacity style={styles.followButton} onPress={handleFollowToggle}>
                                        <Text style={styles.followButtonText}>
                                            {isFollowing ? 'Following' : 'Follow'}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                        <View style={styles.infoSection}>
                            <Text style={styles.username}>{usernameDisplayed}</Text>
                            <Text style={styles.bio}>{userData?.bio || 'No bio set'}</Text>
                        </View>
                        <View style={styles.divider} />
                        {userPosts.length === 0 && (
                            <Text style={styles.noPostsText}>No posts yet</Text>
                        )}
                    </>
                }
                renderItem={({ item }) => (
                    <View style={styles.postWrapper}>
                        <PostItem post={item} currentPlayingId={null} onPlay={() => { }} />
                    </View>
                )}
                contentContainerStyle={{ paddingBottom: 20 }}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    topSection: {
        flexDirection: 'row',
        width: '100%',
        marginVertical: 20,
        alignItems: 'center',
    },
    leftColumn: {
        flex: 1,
        alignItems: 'center',
    },
    rightColumn: {
        flex: 2,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        flex: 1,
    },
    statItem: {
        alignItems: 'center',
        marginHorizontal: 5,
    },
    statNumber: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    statLabel: {
        fontSize: 14,
        color: '#fff',
    },
    editButton: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        paddingVertical: 5,
        paddingHorizontal: 75,
        alignSelf: 'center',
        backgroundColor: '#BFBFBF',
    },
    followButton: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        paddingVertical: 5,
        width: 200,
        alignSelf: 'center',
        backgroundColor: '#BFBFBF',
    },
    editButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
    },
    followButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
    },
    profileImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
    },
    profileImagePlaceholder: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#ccc',
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoSection: {
        marginTop: 10,
        paddingHorizontal: 25,
    },
    username: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 5,
    },
    bio: {
        fontSize: 16,
        color: '#fff',
    },
    divider: {
        height: 1,
        backgroundColor: '#333',
        marginVertical: 10,
    },
    noPostsText: {
        fontSize: 16,
        color: '#fff',
        alignSelf: 'center',
        marginTop: 20,
    },
    postWrapper: {
        width: '100%',
        paddingHorizontal: 10,
    },
});
