import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView } from 'react-native';
import { getAuth } from 'firebase/auth';
import { collection, query, where, getDocs, updateDoc, doc, orderBy, onSnapshot, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebaseConfig';
import TopBar from '@/components/TopBar';
import { router } from 'expo-router';
import { formatDistanceToNow } from 'date-fns';


interface Notification {
    id: string;
    type: 'like';
    postId: string;
    fromUserId: string;
    toUserId: string;
    createdAt: any;
    read: boolean;
    senderUsername?: string;
    timestamp?: Date;
}

export default function ActivityCenterScreen() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [users, setUsers] = useState<{ [key: string]: any }>({});
    const auth = getAuth();
    const currentUser = auth.currentUser;

    useEffect(() => {
        if (!currentUser) return;

        const q = query(
            collection(db, 'notifications'),
            where('toUserId', '==', currentUser.uid),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const notifsWithSender = await Promise.all(
                snapshot.docs.map(async (docSnap) => {
                    const data = docSnap.data() as Omit<Notification, 'id'>;

                    const notif: Notification = {
                        ...data,
                        id: docSnap.id
                    };

                    const senderSnap = await getDoc(doc(db, 'users', notif.fromUserId));
                    const senderData = senderSnap.exists() ? senderSnap.data() : { username: 'Unknown' };

                    return {
                        ...notif,
                        senderUsername: senderData.username || 'Unknown',
                        timestamp: notif.createdAt?.toDate()
                    };
                })
            );

            setNotifications(notifsWithSender);
        });

        return () => unsubscribe();
    }, [currentUser]);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
            <TopBar
                title="Activity"
                showBell={false}
                showBack={true}
                onBackPress={() => router.back()}
            />
            <FlatList
                data={notifications.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds)}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ padding: 16 }}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <Text style={styles.text}>
                            @{item.senderUsername} liked your post.
                        </Text>
                        {item.timestamp && (
                            <Text style={styles.timestamp}>
                                {formatDistanceToNow(item.timestamp, { addSuffix: true })}
                            </Text>
                        )}
                    </View>
                )}
                ListEmptyComponent={
                    <Text style={{ color: '#aaa', textAlign: 'center', marginTop: 20 }}>
                        No activity yet.
                    </Text>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#111',
        padding: 12,
        marginBottom: 10,
        borderRadius: 8,
        borderColor: '#333',
        borderWidth: 1,
    },
    text: {
        color: 'white',
        fontSize: 16,
    },
    timestamp: {
        color: '#aaa',
        fontSize: 13,
        marginTop: 4,
    }
});
