import React, { useLayoutEffect, useState } from 'react';
import { View, Text, TextInput, Button, Image, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { getAuth } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native'; // React Navigation hook
import { db, storage } from '../../config/firebaseConfig';
import Styles from '../styles/tabsStyle';
import { router } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import Video from 'expo-av/build/Video';
import { ResizeMode } from 'expo-av';

export default function CreatePostScreen() {
    const navigation = useNavigation();
    const auth = getAuth();
    const currentUser = auth.currentUser;

    // Local state
    const [postText, setPostText] = useState('');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [videoUri, setVideoUri] = useState<string | null>(null);
    const [visibility, setVisibility] = useState<'Everyone' | 'Followers' | 'Groups'>('Everyone');
    const [uploading, setUploading] = useState(false);

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
    const uploadImageAsync = async (uri: string): Promise<string> => {
        const response = await fetch(uri);
        const blob = await response.blob();
        const filename = uri.substring(uri.lastIndexOf('/') + 1);
        const storageRef = ref(storage, `images/${filename}`);
        await uploadBytes(storageRef, blob);
        return getDownloadURL(storageRef);
    };

    // Upload video to Firebase Storage
    const uploadVideoAsync = async (uri: string): Promise<string> => {
        const response = await fetch(uri);
        const blob = await response.blob();
        const filename = uri.substring(uri.lastIndexOf('/') + 1);
        const storageRef = ref(storage, `videos/${filename}`);
        await uploadBytes(storageRef, blob);
        return getDownloadURL(storageRef);
    };



    // Submit the post
    const handlePost = async () => {
        if (!postText.trim()) {
            Alert.alert('Please enter some text for your post.');
            return;
        }
        if (!currentUser) {
            Alert.alert('You must be logged in to create a post.');
            return;
        }

        setUploading(true);
        try {
            let mediaUrl: string | null = null;
            if (selectedImage) {
                mediaUrl = await uploadImageAsync(selectedImage);
            } else if (videoUri) {
                mediaUrl = await uploadVideoAsync(videoUri);
            }

            const newPost = {
                userId: currentUser.uid,
                text: postText,
                mediaUrl: mediaUrl,
                visibility: visibility,
                createdAt: serverTimestamp(),
            };

            await addDoc(collection(db, 'posts'), newPost);
            Alert.alert('Post created successfully!');
            router.push('/tabs/feed'); // e.g., go to feed, adjust as needed
        } catch (error) {
            console.error(error);
            Alert.alert('Error creating post. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    //  user avatar
    const userAvatarUri = currentUser?.photoURL || 'https://via.placeholder.com/150';

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                {/* Custom top bar: "Social Media App" on the left */}
                <View style={Styles.topBar}>
                    <Text style={Styles.title}>pmo.</Text>
                </View>
                <View style={styles.container}>

                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContent}
                    >

                        {/* User row with avatar and visibility label 
                        <View style={styles.userRow}>
                            <Image source={{ uri: userAvatarUri }} style={styles.avatar} />
                        </View>
                        */}

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
                                    onValueChange={(value) => setVisibility(value as 'Everyone' | 'Followers' | 'Groups')}
                                    style={styles.picker}
                                    dropdownIconColor="#fff"
                                >
                                    <Picker.Item label="Everyone" value="Everyone" />
                                    <Picker.Item label="Followers" value="Followers" />
                                    <Picker.Item label="Groups" value="Groups" />
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
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginTop: 12,
        marginBottom: 10,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
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