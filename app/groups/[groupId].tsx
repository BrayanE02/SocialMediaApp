import { useLocalSearchParams, router } from 'expo-router';
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { FlatList, SafeAreaView, StyleSheet, View } from 'react-native';
import { getAuth } from 'firebase/auth';
import { db } from '@/config/firebaseConfig';
import PostItem from '@/components/post';
import TopBar from '@/components/TopBar';

export default function GroupFeedScreen() {
    const { groupId } = useLocalSearchParams();
    const auth = getAuth();
    const currentUser = auth.currentUser;

    const [posts, setPosts] = useState<any[]>([]);
    const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);

    useEffect(() => {
        if (!groupId || !currentUser) return;

        const postsRef = query(
            collection(db, 'posts'),
            where('groupId', '==', groupId),
            orderBy('createdAt', 'desc')
        );

        const unsub = onSnapshot(postsRef, (snapshot) => {
            const docs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            setPosts(docs);
        });

        return () => unsub();
    }, [groupId, currentUser]);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: 'black' }}>
            <TopBar title="Group Feed" showBell={false} showBack={true} onBackPress={() => router.replace('/tabs/groups')} />
            <FlatList
                data={posts}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <PostItem
                        post={item}
                        currentPlayingId={currentPlayingId}
                        onPlay={setCurrentPlayingId}
                    />
                )}
                contentContainerStyle={{ paddingTop: 10 }}
            />
        </SafeAreaView>
    );
}