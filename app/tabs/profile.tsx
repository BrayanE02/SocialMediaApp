import React, { useEffect, useState } from 'react';
import { getAuth, signOut } from "firebase/auth";
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import Styles from '../styles/tabsStyle';
import { app, db } from '../../config/firebaseConfig';
import { router, useFocusEffect } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';

export default function ProfileScreen() {
    const auth = getAuth(app);
    const currentUser = auth.currentUser;
    const [userData, setUserData] = useState<any>(null);

    const fetchUserData = async () => {
        if (currentUser) {
            const userDocRef = doc(db, 'users', currentUser.uid);
            const docSnap = await getDoc(userDocRef);
            if (docSnap.exists()) {
                setUserData(docSnap.data());
            }
        }
    };

    useFocusEffect(
        React.useCallback(() => {
            fetchUserData();
        }, [])
    );

    // Navigate to the Edit Profile screen
    const handleEditProfile = () => {
        router.push('/profile/editProfile');
    };

    // Use a fallback: if Firestore doesn't have the displayName, use the one from auth.
    const usernameDisplayed = userData?.displayName || currentUser?.displayName || 'No username set';

    return (
        <View style={Styles.container}>
            <Text style={Styles.title}>Profile</Text>

            {/* Top section: Profile image on the left and stats + edit button on the right */}
            <View style={styles.topSection}>
                <View style={styles.leftColumn}>
                    {userData?.photoURL ? (
                        <Image source={{ uri: userData.photoURL }} style={styles.profileImage} />
                    ) : (
                        <View style={styles.profileImagePlaceholder}>
                            <Text style={styles.placeholderText}>No Image</Text>
                        </View>
                    )}
                </View>

                <View style={styles.rightColumn}>
                    <View style={styles.statsContainer}>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>{userData?.posts ?? 0}</Text>
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
                <Text style={styles.username}>
                    {usernameDisplayed}
                </Text>
                <Text style={styles.bio}>
                    {userData?.bio || 'No bio set'}
                </Text>
            </View>
        </View>
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
        flex: 1, // Approximately 1/3 of the width
        alignItems: 'center',
    },
    rightColumn: {
        flex: 2, // Approximately 2/3 of the width
    },
    statsAndEditRow: {
        flexDirection: 'row',
        alignItems: 'flex-start', // Align the top of the stats with the button
        justifyContent: 'space-between',
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
        color: '#fff', // White color for the numbers
    },
    statLabel: {
        fontSize: 14,
        color: '#fff', // White color for the labels
    },
    editButton: {
        marginLeft: 10,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: "#BFBFBF"
    },
    editButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
        textAlign: 'center',
    },
    profileImage: {
        width: 80,
        height: 80,
        borderRadius: 40, // Circular image
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
        paddingHorizontal: 10,
    },
    username: {
        fontSize: 16,
        color: '#fff', // White text for username
        marginBottom: 5,
    },
    bio: {
        fontSize: 14,
        color: '#fff', // White text for bio
    },
});