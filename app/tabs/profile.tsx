import React, { useEffect, useRef, useState } from 'react';
import { getAuth, signOut } from "firebase/auth";
import { View, Text, TouchableOpacity, StyleSheet, Image, FlatList, SafeAreaView, ScrollView } from 'react-native';
import Styles from '../styles/tabsStyle';
import { app, db } from '../../config/firebaseConfig';
import { router, useFocusEffect } from 'expo-router';
import { collection, doc, getDoc, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { Video } from 'expo-av';
import PostItem from '../components/post';
import { Ionicons } from '@expo/vector-icons';


export default function ProfileScreen() {
    const auth = getAuth(app);
    const currentUser = auth.currentUser;
    const [userData, setUserData] = useState<any>(null);

    // State for posts
    const [userPosts, setUserPosts] = useState<any[]>([]);

    const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);


    const fetchUserData = async () => {
        if (currentUser) {
            const userDocRef = doc(db, 'users', currentUser.uid);
            const docSnap = await getDoc(userDocRef);
            if (docSnap.exists()) {
                setUserData(docSnap.data());
            }
        }
    };

    // Real-time listener for the user's posts
    const fetchUserPosts = () => {
        if (!currentUser) return;

        const q = query(
            collection(db, 'posts'),
            where('userId', '==', currentUser.uid),
            orderBy('createdAt', 'desc')
        );

        // Listen for real-time updates
        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const postsData = await Promise.all(
                snapshot.docs.map(async (postDoc) => {
                    const postData = postDoc.data();

                    // Fetch the user's profile photo from Firestore
                    const userDocRef = doc(db, 'users', postData.userId);
                    const userSnap = await getDoc(userDocRef);

                    return {
                        id: postDoc.id,
                        ...postData,
                        userPhotoUrl: userSnap.exists() ? userSnap.data().photoURL : null,
                    };
                })
            );
            setUserPosts(postsData);
        });

        return () => unsubscribe(); // Cleanup listener on unmount
    };


    // Use focus effect to refresh data whenever the screen is in focus
    useFocusEffect(
        React.useCallback(() => {
            // Fetch profile info once
            fetchUserData();
            // Start real-time listener for posts
            const unsubscribe = fetchUserPosts();
            return () => {
                // Cleanup the subscription if it exists
                if (unsubscribe) unsubscribe();
            };
        }, [])
    );

    // Navigate to the Edit Profile screen
    const handleEditProfile = () => {
        router.push('/profile/editProfile');
    };

    // Use a fallback: if Firestore doesn't have the displayName, use the one from auth.
    const usernameDisplayed = userData?.displayName || currentUser?.displayName || 'No username set';

    return (
        <SafeAreaView style={Styles.safeArea}>
            <View style={Styles.topBar}>
                <Text style={Styles.title}>pmo.</Text>
            </View>
            <FlatList
                data={userPosts}
                keyExtractor={(item) => item.id}
                ListHeaderComponent={
                    <>
                        {/* Top section: Profile image & stats */}
                        <View style={styles.topSection}>
                            <View style={styles.leftColumn}>
                                {userData?.photoURL ? (
                                    <Image source={{ uri: userData.photoURL }} style={styles.profileImage} />
                                ) : (
                                    <View style={styles.profileImagePlaceholder}>
                                        <Ionicons name="person-circle-outline" size={40} color="#fff" />
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
                                    <View style={styles.statItem}>
                                        <Text style={styles.statNumber}>{userData?.followers ?? 0}</Text>
                                        <Text style={styles.statLabel}>Followers</Text>
                                    </View>
                                    <View style={styles.statItem}>
                                        <Text style={styles.statNumber}>{userData?.following ?? 0}</Text>
                                        <Text style={styles.statLabel}>Following</Text>
                                    </View>
                                </View>
                                <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
                                    <Text style={styles.editButtonText}>Edit Profile</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        {/* Info Section: Username and Bio */}
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
                        <PostItem
                            post={item}
                            currentPlayingId={currentPlayingId}
                            onPlay={setCurrentPlayingId}
                        />
                    </View>
                )}
                contentContainerStyle={{ paddingBottom: 20 }} // Optional: extra spacing at the bottom
            />
        </SafeAreaView >
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
        backgroundColor: "#BFBFBF",

    },
    editButtonText: {
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
    placeholderText: {
        color: '#666',
        fontSize: 12,
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
        height: 1,           // Thickness of the line
        backgroundColor: '#333',  // Color of the line
        marginVertical: 10,  // Spacing above/below the line
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
    postText: {
        color: '#fff',
        fontSize: 16,
        marginBottom: 8,
    },
    postImage: {
        width: '100%',
        height: 200,
        resizeMode: 'contain',
        borderRadius: 4,
    },
    postVideo: {
        width: '100%',
        height: 200,
        resizeMode: 'contain',
        borderRadius: 4,
    },
});