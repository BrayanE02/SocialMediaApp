import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, TextInput, Alert } from 'react-native';
import { EmailAuthProvider, getAuth, reauthenticateWithCredential, signOut, updateEmail, updatePassword } from 'firebase/auth';
import { app, db } from '../../config/firebaseConfig';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker'; // Import Expo Image Picker
import Styles from '../styles/tabsStyle'; // Shared tab styles
import { collection, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';


const EditProfileScreen = () => {
    const auth = getAuth(app);
    const currentUser = auth.currentUser;

    // State for profile information
    const [username, setUsername] = useState('');
    const [bio, setBio] = useState('');
    const [profileImage, setProfileImage] = useState('https://via.placeholder.com/100');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [currentPassword, setCurrentPassword] = useState(''); // Required for reauthentication

    // Fetch the current user's data from Firestore
    useEffect(() => {
        const fetchData = async () => {
            if (currentUser) {
                try {
                    const userDocRef = doc(db, 'users', currentUser.uid);
                    const docSnap = await getDoc(userDocRef);
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        setUsername(data.displayName || currentUser.displayName || '');
                        setBio(data.bio || '');
                        setProfileImage(data.photoURL || currentUser.photoURL || 'https://via.placeholder.com/100');
                        setEmail(data.email || currentUser.email || "");
                    } else {
                        // If no Firestore doc exists, fallback to Auth data if available.
                        setUsername(currentUser.displayName || '');
                        setProfileImage(currentUser.photoURL || 'https://via.placeholder.com/100');
                    }
                } catch (error: any) {
                    console.error('Error fetching user data:', error.message);
                }
            }
        };

        fetchData();
    }, [currentUser]);

    // Function to handle logout (remove if not needed on this screen)
    const handleLogout = async () => {
        try {
            await signOut(auth);
            console.log('User logged out successfully.');
            router.push('/auth/login');
        } catch (error: any) {
            console.error('Error logging out:', error.message);
            alert('An error occurred while logging out.');
        }
    };

    // Function to navigate back to the Profile screen
    const goBack = () => {
        router.push('/tabs/profile');
    };

    // Function to pick a new profile image using Expo Image Picker
    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: 'images',
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            // Use the first asset's uri
            setProfileImage(result.assets[0].uri);
        }
    };

    // Function to check if the username is already taken by another user
    const isUsernameTaken = async (): Promise<boolean> => {
        if (!username.trim()) return false;

        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('displayName', '==', username));
        const querySnapshot = await getDocs(q);

        let taken = false;
        querySnapshot.forEach((docSnap) => {
            if (docSnap.id !== currentUser?.uid) {
                taken = true;
            }
        });

        return taken;
    };

    // Function to validate email using a simple regex
    const isValidEmail = (email: string) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };

    // Function to validate password: at least 8 characters, one number, and one special character.
    const isValidPassword = (pwd: string): boolean => {
        // This regex checks for:
        // - At least one digit (?=.*[0-9])
        // - At least one special character (?=.*[!@#$%^&*])
        // - And a total length of at least 8 characters [A-Za-z0-9!@#$%^&*]{8,}
        const re = /^(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z0-9!@#$%^&*]{8,}$/;
        return re.test(pwd);
    };

    // Function to save profile changes to Firestore and update Auth credentials
    const saveChanges = async () => {
        if (currentUser) {
            // Validate email if it has been changed
            if (email && email !== currentUser.email && !isValidEmail(email)) {
                Alert.alert('Invalid Email', 'Please enter a valid email address.');
                return;
            }

            // Validate password only if a new password is provided
            if (password.trim() !== '' && !isValidPassword(password.trim())) {
                Alert.alert(
                    'Invalid Password',
                    'Password must be at least 8 characters long and contain at least one number and one special character.'
                );
                return;
            }

            // If updating email or password, ensure the user has provided their current password
            if ((email !== currentUser.email || password.trim() !== '') && currentPassword.trim() === '') {
                Alert.alert('Reauthentication Required', 'Please enter your current password to update sensitive information.');
                return;
            }

            try {
                // Check if the username is taken
                const usernameTaken = await isUsernameTaken();
                if (usernameTaken) {
                    Alert.alert('Username Unavailable', 'This username is already in use. Please choose another one.');
                    return;
                }

                // Reauthenticate if updating email or password
                if ((email !== currentUser.email || password.trim() !== '') && currentPassword.trim() !== '') {
                    const credential = EmailAuthProvider.credential(currentUser.email!, currentPassword);
                    await reauthenticateWithCredential(currentUser, credential);
                }

                // Update email in Auth if it has changed
                if (email && email !== currentUser.email) {
                    await updateEmail(currentUser, email);
                }

                // Update password in Auth if a new password is provided
                if (password.trim() !== '') {
                    await updatePassword(currentUser, password);
                }

                // Update Firestore document with the new profile data
                const userDocRef = doc(db, 'users', currentUser.uid);
                await updateDoc(userDocRef, {
                    displayName: username,
                    bio: bio,
                    photoURL: profileImage,
                    email: email,
                });

                console.log('Profile updated successfully');
                router.push('/tabs/profile');
            } catch (error: any) {
                console.error('Error updating profile:', error.message);
                Alert.alert('Update Error', 'An error occurred while saving changes.');
            }
        }
    };

    return (
        <View style={Styles.container}>
            {/* Header with go back arrow and title */}
            <View style={styles.header}>
                <TouchableOpacity onPress={goBack} style={styles.backButton}>
                    <Text style={styles.backButtonText}>←</Text>
                </TouchableOpacity>
                <Text style={[Styles.title, styles.headerTitle]}>Edit Profile</Text>
            </View>

            {/* Profile Image */}
            <View style={styles.imageContainer}>
                <Image source={{ uri: profileImage }} style={styles.profileImage} />
            </View>

            {/* Button to change profile image */}
            <TouchableOpacity onPress={pickImage} style={styles.changeImageButton}>
                <Text style={styles.changeImageButtonText}>Change Profile Image</Text>
            </TouchableOpacity>

            {/* Username Input */}
            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Username</Text>
                <TextInput
                    value={username}
                    onChangeText={setUsername}
                    style={styles.textInput}
                    placeholder="Enter new username"
                    placeholderTextColor="#888"
                />
            </View>
            {/* Bio Input */}
            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Bio</Text>
                <TextInput
                    value={bio}
                    onChangeText={setBio}
                    style={[styles.textInput, styles.bioInput]}
                    placeholder="Enter your bio"
                    placeholderTextColor="#888"
                    multiline
                />
            </View>

            {/* Email Input */}
            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                    value={email}
                    onChangeText={setEmail}
                    style={styles.textInput}
                    placeholder="Enter new email"
                    placeholderTextColor="#888"
                    keyboardType="email-address"
                    autoCapitalize="none"
                />
            </View>

            {/* Current Password Input (required for updating email or password) */}
            {(email !== currentUser?.email || password.trim() !== '') && (
                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Current Password</Text>
                    <TextInput
                        value={currentPassword}
                        onChangeText={setCurrentPassword}
                        style={styles.textInput}
                        placeholder="Enter your current password"
                        placeholderTextColor="#888"
                        secureTextEntry
                    />
                </View>
            )}

            {/* Password Input */}
            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>New Password</Text>
                <TextInput
                    value={password}
                    onChangeText={setPassword}
                    style={styles.textInput}
                    placeholder="Enter new password"
                    placeholderTextColor="#888"
                    secureTextEntry
                />
            </View>

            {/* Button to save changes */}
            <TouchableOpacity onPress={saveChanges} style={styles.saveButton}>
                <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
        </View>
    );
};

export default EditProfileScreen;

const styles = StyleSheet.create({
    header: {
        height: 75,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    backButton: {
        position: 'absolute',
        left: 10,
        top: 15,
    },
    backButtonText: {
        color: '#fff',
        fontSize: 24,
    },
    headerTitle: {
        textAlign: 'center',
        marginTop: 5, // Lowers the title a bit for alignment with the back arrow
        fontSize: 24,
        color: '#fff',
    },
    imageContainer: {
        alignItems: 'center',
        marginBottom: 10,
    },
    profileImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    changeImageButton: {
        backgroundColor: '#444',
        padding: 10,
        borderRadius: 5,
        marginBottom: 15,
        alignSelf: 'center',
    },
    changeImageButtonText: {
        color: '#fff',
        textAlign: 'center',
    },
    inputGroup: {
        marginBottom: 15,
    },
    inputLabel: {
        color: '#fff',
        marginBottom: 5,
        fontSize: 16,
    },
    textInput: {
        backgroundColor: '#222',
        color: '#fff',
        padding: 10,
        borderRadius: 5,
        fontSize: 16,
    },
    bioInput: {
        height: 80,
        textAlignVertical: 'top',
    },
    saveButton: {
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
    },
    saveButtonText: {
        color: '#000',
        fontSize: 16,
        fontWeight: 'bold',
    },
});