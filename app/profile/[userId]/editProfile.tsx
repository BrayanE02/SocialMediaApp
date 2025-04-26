import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, TextInput, Alert, SafeAreaView, ScrollView } from 'react-native';
import { EmailAuthProvider, getAuth, reauthenticateWithCredential, signOut, updateEmail, updatePassword } from 'firebase/auth';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker'; // Import Expo Image Picker
import { collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import Styles from '../../styles/tabsStyle';
import { app, db } from '@/config/firebaseConfig';


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

    const uploadProfileImage = async (uri: string) => {
        try {
            const storage = getStorage(app);
            const response = await fetch(uri);
            const blob = await response.blob();
            const storageRef = ref(storage, `profilePictures/${currentUser?.uid}/profileImage.jpg`);

            await uploadBytes(storageRef, blob);  // Upload image
            const downloadURL = await getDownloadURL(storageRef);  // Get public URL
            console.log("Image uploaded. URL:", downloadURL);
            return downloadURL;
        } catch (error) {
            console.error("Upload error:", error);  // If permission denied, check Storage rules
            throw error;
        }
    };

    // Function to pick a new profile image using Expo Image Picker
    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: 'images',
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });

        if (!result.canceled && result.assets?.length > 0) {
            const downloadURL = await uploadProfileImage(result.assets[0].uri);  // Upload and get URL
            setProfileImage(downloadURL);  // Set the URL for Firestore update
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
        console.log("user presses save changes")

        if (!currentUser) return;

        await currentUser.reload();
        const normalizedCurrentEmail = currentUser.email?.trim().toLowerCase() ?? '';
        const normalizedEnteredEmail = email.trim().toLowerCase();

        const isEmailChanged = normalizedEnteredEmail !== normalizedCurrentEmail;
        const isPasswordChanged = password.trim() !== '';

        // Step 1: Reauthenticate ONLY if email or password is changing
        if ((isEmailChanged || isPasswordChanged) && currentPassword.trim() === '') {
            Alert.alert('Reauthentication Required', 'Enter your current password to change email or password.');
            return;
        }

        try {
            // Reauthenticate if needed
            if ((isEmailChanged || isPasswordChanged) && currentPassword.trim() !== '') {
                const credential = EmailAuthProvider.credential(currentUser.email!, currentPassword);
                await reauthenticateWithCredential(currentUser, credential);
                console.log("User reauthenticated.");
            }

            // Is username taken
            if (isEmailChanged) {
                if (!isValidEmail(email)) {
                    Alert.alert('Invalid Email', 'Please enter a valid email address.');
                    return;
                }
                await updateEmail(currentUser, email);
                console.log("Email updated.");
            }

            // Step 3: Handle email update
            if (isEmailChanged) {
                if (!isValidEmail(email)) {
                    Alert.alert('Invalid Email', 'Please enter a valid email address.');
                    return;
                }
                await updateEmail(currentUser, email);
                console.log("Email updated.");
            }

            // Step 4: Handle password update
            if (isPasswordChanged) {
                if (!isValidPassword(password.trim())) {
                    Alert.alert('Invalid Password', 'Password must be at least 8 characters long and contain at least one number and one special character.');
                    return;
                }
                await updatePassword(currentUser, password);
                console.log("Password updated.");
            }

            // Step 5: Refresh token if sensitive info changed
            if (isEmailChanged || isPasswordChanged) {
                await currentUser.getIdToken(true);
                await currentUser.reload();
                console.log("Token refreshed and user reloaded.");
            }

            // Step 6: Update Firestore profile (for profile image, username, bio)
            const userDocRef = doc(db, 'users', currentUser.uid);
            console.log("Updating Firestore document:", userDocRef.path);

            await updateDoc(userDocRef, {
                displayName: username,
                bio,
                photoURL: profileImage,  // Profile image can be updated without reauth
            });
            router.push(`/tabs/profile`);

        } catch (error: any) {
            console.error('Error updating profile:', error.message);
            Alert.alert('Update Error', error.message);
        }
    };


    return (
        <SafeAreaView style={Styles.safeArea}>
            <View style={Styles.topBar}>
                <Text style={Styles.title}>pmo.</Text>
                {/* Header with go back arrow and title */}
                <TouchableOpacity onPress={goBack} style={styles.backButton}>
                    <Text style={styles.backButtonText}>←</Text>
                </TouchableOpacity>
            </View>
            <ScrollView>
                <View style={Styles.container}>

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

                    {/* Logout Button */}
                    <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                        <Text style={styles.logoutButtonText}>Log Out</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

export default EditProfileScreen;

const styles = StyleSheet.create({
    header: {
        height: 50,
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
    logoutButton: {
        alignSelf: 'center',
        backgroundColor: '#fff',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        marginVertical: 20,
    },
    logoutButtonText: {
        color: '#000',
        fontSize: 16,
        fontWeight: 'bold',
    },
});