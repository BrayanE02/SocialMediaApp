import React, { useCallback, useState } from 'react';
import { View, Text, TextInput, Button, Image, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { getAuth } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp, doc, getDoc, getDocs } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native'; // React Navigation hook
import { db, storage } from '../../config/firebaseConfig';
import Styles from '../styles/tabsStyle';
import { router, useFocusEffect } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import Video from 'expo-av/build/Video';
import { ResizeMode } from 'expo-av';
import TopBar from '@/components/TopBar';

export default function CreatePostScreen() {
    const navigation = useNavigation();
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) {
        Alert.alert("Authentication error", "You must be logged in to upload an image.");
        return;
    }
    // Local state
    const [postText, setPostText] = useState('');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [videoUri, setVideoUri] = useState<string | null>(null);
    const [visibility, setVisibility] = useState<'Public' | 'Followers' | 'Groups'>('Public');
    const [uploading, setUploading] = useState(false);
    const [userData, setUserData] = useState<any>(null);

    const fetchUserData = async () => {
        if (currentUser) {
            try {
                const userDocRef = doc(db, 'users', currentUser.uid);
                const docSnap = await getDoc(userDocRef);
                if (docSnap.exists()) {
                    setUserData(docSnap.data());
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
            }
        }
    };

    useFocusEffect(() => {
        fetchUserData();
        return () => { };
    });



    // Pick an image from the library
    const pickMedia = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
            Alert.alert('Permission required', 'Permission to access the camera roll is required!');
            return;
        }
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            quality: 1,
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
            const asset = result.assets[0];
            console.log("Selected media URI:", asset.uri);
            if (asset.uri.endsWith('.mov') || asset.uri.endsWith('.mp4')) {
                setVideoUri(asset.uri);
                setSelectedImage(null);
            } else {
                setSelectedImage(asset.uri);
                setVideoUri(null);
            }
        }
    };

    // Upload image to Firebase Storage
    const uploadImageAsync = async (uri: string, userId: string): Promise<string> => {
        if (!userId) throw new Error("User is not authenticated.");

        const response = await fetch(uri);
        const blob = await response.blob();
        const filename = `${userId}/${Date.now()}.jpg`; // Store images under the user ID
        const storageRef = ref(storage, `images/${filename}`);

        await uploadBytes(storageRef, blob);
        return getDownloadURL(storageRef);
    };

    // Upload video to Firebase Storage
    const uploadVideoAsync = async (uri: string, userId: string): Promise<string> => {
        if (!userId) throw new Error("User is not authenticated.");

        const response = await fetch(uri);
        const blob = await response.blob();
        const filename = `${userId}/${Date.now()}.mp4`; // Store videos under the user ID
        const storageRef = ref(storage, `videos/${filename}`);

        await uploadBytes(storageRef, blob);
        return getDownloadURL(storageRef);
    };

    async function getFollowers(ownerUid: string): Promise<string[]> {
        // Query the /followers/ownerUid/following/ subcollection
        // Return an array of user IDs
        const snapshot = await getDocs(collection(db, "Followers ", ownerUid, "following"));
        return snapshot.docs.map(doc => doc.id);
    }

    async function getGroupMembers(groupId: string): Promise<string[]> {
        const snapshot = await getDocs(collection(db, "groups", groupId, "members"));
        return snapshot.docs.map(doc => doc.id);
    }

    // Submit the post
    const handlePost = async () => {
        if (!postText.trim()) {
            Alert.alert("Please enter some text for your post.");
            return;
        }
        if (!currentUser) {
            Alert.alert("You must be logged in to create a post.");
            return;
        }

        setUploading(true);

        try {
            // Upload image or video if there is one
            let mediaUrl: string | null = null;
            if (selectedImage) {
                mediaUrl = await uploadImageAsync(selectedImage, currentUser.uid);
            } else if (videoUri) {
                mediaUrl = await uploadVideoAsync(videoUri, currentUser.uid);
            }

            // Determine if the post is public
            const isPublic = visibility === "Public";

            // Build the allowedUserIds array (owner always included)
            let allowedUserIds = [currentUser.uid];
            if (visibility === "Followers") {
                const followers = await getFollowers(currentUser.uid);
                allowedUserIds = [...allowedUserIds, ...followers];
            } else if (visibility === "Groups") {
                // fetch group members for the chosen group if needed
                // allowedUserIds = [...allowedUserIds, ...groupMembers];
            }

            // Create the new post document
            const newPost = {
                userId: currentUser.uid,
                text: postText,
                mediaUrl: mediaUrl,
                public: isPublic,
                allowedUserIds: allowedUserIds,
                createdAt: serverTimestamp(),
            };

            // Save the document (only one addDoc call)
            await addDoc(collection(db, "posts"), newPost);
            Alert.alert("Post created successfully!");
            router.push("/tabs/feed");
        } catch (error) {
            console.error("Error creating post:", error);
            Alert.alert("Error creating post. Please try again.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <TopBar showBell={false} />
                <View style={styles.container}>

                    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>

                        {/* User row with avatar and username */}
                        <View style={styles.userRow}>
                            {userData?.photoURL ? (
                                <Image
                                    source={{ uri: userData.photoURL }}
                                    style={styles.profileImage}
                                />
                            ) : (
                                <View style={styles.profileImagePlaceholder}>
                                    <Ionicons name="person-circle-outline" size={40} color="#fff" />
                                </View>
                            )}
                            {userData?.username && (
                                <Text style={styles.username}>{userData.username}</Text>
                            )}
                        </View>

                        {/* post preview */}
                        <View style={styles.textInputContainer}>
                            <TextInput
                                style={styles.postText}
                                placeholder="Text..."
                                placeholderTextColor="#888"
                                multiline
                                value={postText}
                                onChangeText={setPostText}
                            />
                            {/* Image icon inside the TextInput container */}
                            <TouchableOpacity onPress={pickMedia} style={styles.imageIconOverlay}>
                                <Ionicons name="image-outline" size={25} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        {/* Image preview if selected */}
                        {selectedImage && (
                            <Image source={{ uri: selectedImage }} style={styles.selectedImagePreview} resizeMode="contain" />
                        )}

                        {/* Video preview if selected */}
                        {videoUri && (
                            <Video source={{ uri: videoUri }} rate={1.0} volume={1.0} isMuted={false} resizeMode={ResizeMode.CONTAIN}
                                shouldPlay={true} // auto-play 
                                useNativeControls style={styles.selectedVideoPreview} />
                        )}

                        {/* Actual privacy dropdown (below the text area) */}
                        <View style={styles.dropdownContainer}>
                            <Text style={styles.label}>Privacy Settings</Text>
                            <View style={styles.pickerWrapper}>
                                <Picker
                                    selectedValue={visibility}
                                    onValueChange={(value) => setVisibility(value as 'Public' | 'Followers' | 'Groups')}
                                    style={styles.picker}
                                >
                                    <Picker.Item label="Public" value="Public" color='#fff' />
                                    <Picker.Item label="Followers" value="Followers" color='#fff' />
                                    <Picker.Item label="Groups" value="Groups" color='#fff' />
                                </Picker>
                            </View>
                        </View>

                        {/* POST button under the text area & dropdown */}
                        <TouchableOpacity
                            style={styles.postButton}
                            onPress={handlePost}
                            disabled={uploading}
                        >
                            <Text style={styles.postButtonText}>
                                {uploading ? 'Uploading...' : 'Post'}
                            </Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#000',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        // If you want extra spacing at the bottom so the button is never obscured
        paddingBottom: 50,
    },
    container: {
        flex: 1,
        backgroundColor: '#000',
        padding: 10,
    },
    /* Custom top bar */
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#000',
        borderBottomWidth: 1,
        borderBottomColor: '#333',
        justifyContent: 'space-between',
    },
    topBarTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    /* User row styles */
    userRow: {
        flexDirection: 'row',       // side-by-side layout
        alignItems: 'center',       // vertically center
        margin: 16,
    },
    profileImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    profileImagePlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    textContainer: {
        flex: 1,

    },
    username: {
        color: '#fff',
        fontWeight: 'bold',
        marginLeft: 10,
    },
    /* Text input container with image icon overlay */
    textInputContainer: {
        marginHorizontal: 16,
        marginTop: 16,
        position: 'relative', // Allows absolute positioning of the icon within this container
    },
    postText: {
        color: '#fff',
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#444',
        borderRadius: 8,
        padding: 10,
        minHeight: 100,
        backgroundColor: '#111',
        textAlignVertical: 'top',
    },
    imageIconOverlay: {
        position: 'absolute',
        right: 10,
        bottom: 10,
        padding: 6,
    },
    imageIcon: {
        width: 24,
        height: 24,
        tintColor: '#fff',
    },
    /* Image preview if user picks one */
    selectedImagePreview: {
        width: '90%',
        height: 325,
        marginHorizontal: 16,
        marginTop: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#444',
    },
    /* Video preview if user picks one */
    selectedVideoPreview: {
        width: '90%',
        height: 325,
        marginHorizontal: 16,
        marginTop: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#444',
    },
    /* Dropdown below the text area */
    dropdownContainer: {
        marginTop: 16,
        marginHorizontal: 16,
    },
    label: {
        color: '#fff',
        fontSize: 16,
        marginBottom: 8,
    },
    pickerWrapper: {
        borderWidth: 1,
        borderColor: '#444',
        borderRadius: 8,
        backgroundColor: '#111',
    },
    picker: {
        color: '#fff',
    },
    /* POST button at the bottom */
    postButton: {
        backgroundColor: '#333',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginHorizontal: 16,
        marginTop: 16,
    },
    postButtonText: {
        color: '#fff',
        fontSize: 16,
    },
});