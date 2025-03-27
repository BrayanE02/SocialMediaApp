import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, Image } from 'react-native';
import Styles from '../styles/tabsStyle';
import PostItem from '../../components/post';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { db } from '@/config/firebaseConfig';

export default function FeedScreen() {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    const [userPosts, setUserPosts] = useState<any[]>([]);
    const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);

    // Utility to merge new docs into existing userPosts
    const mergePosts = (existingPosts: any[], newDocs: any[]) => {
        // Convert existing posts to a Map for easy deduplication
        const postMap = new Map(existingPosts.map((p) => [p.id, p]));
        // Insert or overwrite with newDocs
        newDocs.forEach((doc) => postMap.set(doc.id, doc));
        // Convert map back to an array
        let merged = Array.from(postMap.values());
        // Sort by createdAt desc
        merged.sort((a, b) => {
            const timeA = a.createdAt?.seconds || 0;
            const timeB = b.createdAt?.seconds || 0;
            return timeB - timeA;
        });
        return merged;
    };

    // Set up onSnapshot listeners for public + private
    const subscribeToPosts = () => {
        if (!currentUser) return;

        // Public posts: public == true
        const publicQuery = query(
            collection(db, 'posts'),
            where('public', '==', true),
            orderBy('createdAt', 'desc')
        );

        // Private posts: allowedUserIds array-contains currentUser
        const privateQuery = query(
            collection(db, 'posts'),
            where('allowedUserIds', 'array-contains', currentUser.uid),
            orderBy('createdAt', 'desc')
        );

        // Listen to the public query
        const unsubPublic = onSnapshot(publicQuery, (snapshot) => {
            const publicDocs = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            // Merge into our existing userPosts
            setUserPosts((prevPosts) => mergePosts(prevPosts, publicDocs));
        });

        // Return a cleanup function to unsubscribe
        return () => {
            unsubPublic();
        };
    };

    useFocusEffect(
        useCallback(() => {
            const unsubscribe = subscribeToPosts();
            return () => {
                // Cleanup
                if (unsubscribe) unsubscribe();
            };
        }, [currentUser])
    );

    return (
        <SafeAreaView style={Styles.safeArea}>
            <View style={Styles.topBar}>
                <Text style={Styles.title}>pmo.</Text>
            </View>
            <FlatList
                data={userPosts}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <PostItem
                        post={item}
                        currentPlayingId={currentPlayingId}
                        onPlay={setCurrentPlayingId}
                    />
                )}
                contentContainerStyle={{ paddingTop: 5 }}
            />
        </SafeAreaView>
    );
};


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
