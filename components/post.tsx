import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ResizeMode, Video } from 'expo-av';
import { addDoc, arrayRemove, arrayUnion, collection, doc, getDoc, Timestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebaseConfig';
import { getAuth } from 'firebase/auth';
import { router } from 'expo-router';

interface Post {
    id: string;
    text?: string;
    mediaUrl?: string;
    userId: string;
    likedBy?: string[];
    groupId?: string;
}

interface PostItemProps {
    post: Post;
    currentPlayingId: string | null;
    onPlay: (id: string) => void;
}

const PostItem: React.FC<PostItemProps> = ({ post, currentPlayingId, onPlay }) => {
    // For video handling
    const videoRef = useRef<Video>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    // Local state for the user’s profile data
    const [userProfile, setUserProfile] = useState<{
        photoURL?: string;
        username?: string;
    }>({});
    const [groupName, setGroupName] = useState<string | null>(null);

    // State for like functionality
    const auth = getAuth();
    const currentUser = auth.currentUser;
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);

    // Fetch user profile data based on post.userId
    useEffect(() => {
        const fetchUserProfile = async () => {
            if (post.userId) {
                try {
                    const userDocRef = doc(db, 'users', post.userId);
                    const userSnap = await getDoc(userDocRef);
                    if (userSnap.exists()) {
                        const data = userSnap.data();
                        setUserProfile(data);
                    }
                } catch (error) {
                    console.error('Error fetching user profile:', error);
                }
            }
        };

        fetchUserProfile();
    }, [post.userId]);

    useEffect(() => {
        const fetchGroupName = async () => {
            if (post.groupId) {
                try {
                    const groupDocRef = doc(db, 'groups', post.groupId);
                    const docSnap = await getDoc(groupDocRef);
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        setGroupName(data.name || 'Unnamed Group');
                    }
                } catch (error) {
                    console.error('Error fetching group name:', error);
                }
            }
        };

        fetchGroupName();
    }, [post.groupId]);


    // Update like state whenever the post's likedBy field changes
    useEffect(() => {
        if (post.likedBy && currentUser) {
            setLiked(post.likedBy.includes(currentUser.uid));
            setLikeCount(post.likedBy.length);
        } else {
            setLiked(false);
            setLikeCount(0);
        }
    }, [post.likedBy, currentUser]);

    // Pause the video if this post is no longer the currentPlayingId
    useEffect(() => {
        if (currentPlayingId !== post.id && isPlaying) {
            videoRef.current?.pauseAsync();
            setIsPlaying(false);
        }
    }, [currentPlayingId]);

    const togglePlay = async () => {
        if (videoRef.current) {
            if (isPlaying) {
                await videoRef.current.pauseAsync();
                setIsPlaying(false);
            } else {
                onPlay(post.id);
                await videoRef.current.playAsync();
                setIsPlaying(true);
            }
        }
    };

    // Handle toggling likes for the post
    const handleLike = async () => {
        if (!currentUser) return;
        const postRef = doc(db, 'posts', post.id);

        try {
            if (liked) {
                // Remove like
                await updateDoc(postRef, {
                    likedBy: arrayRemove(currentUser.uid),
                });
            } else {
                // Add like
                await updateDoc(postRef, {
                    likedBy: arrayUnion(currentUser.uid),
                });

                // Write notification only if not liking your own post
                if (currentUser.uid !== post.userId) {
                    await addDoc(collection(db, 'notifications'), {
                        type: 'like',
                        postId: post.id,
                        fromUserId: currentUser.uid,
                        toUserId: post.userId,
                        createdAt: Timestamp.now(),
                        read: false
                    });
                }
            }
        } catch (error) {
            console.error('Error updating like or writing notification:', error);
        }
    };



    // Check if the media is a video
    const isVideo =
        post.mediaUrl &&
        (post.mediaUrl.includes('.mov') || post.mediaUrl.includes('.mp4'));

    return (
        <View style={styles.postContainer}>
            {/* Header Row: user profile image + username */}
            <View style={styles.headerRow}>
                <View style={styles.profileContainer}>
                    {userProfile.photoURL ? (
                        <Image
                            source={{ uri: userProfile.photoURL }}
                            style={styles.profileImage}
                        />
                    ) : (
                        <Ionicons name="person-circle-outline" size={40} color="#fff" />
                    )}
                </View>
                <View style={styles.textContainer}>
                    {userProfile.username && (
                        <TouchableOpacity
                            onPress={() => {
                                const currentUserId = currentUser?.uid;

                                if (post.userId === currentUserId) {
                                    // Go to your own profile tab
                                    router.push('/tabs/profile');
                                } else {
                                    // Go to another user's profile (still using the same screen)
                                    router.push({
                                        pathname: '/tabs/profile',
                                        params: { userId: post.userId },
                                    });
                                }
                            }}
                        >
                            <Text style={styles.username}>{userProfile.username}</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {groupName && (
                <View style={styles.groupTag}>
                    <Ionicons name="people-outline" size={16} color="#fff" />
                    <Text style={styles.groupName}>{groupName}</Text>
                </View>
            )}

            {/* Post text (if any) */}
            {post.text && <Text style={styles.postText}>{post.text}</Text>}

            {/* Media (video or image) */}
            {post.mediaUrl && isVideo ? (
                <TouchableOpacity onPress={togglePlay} style={styles.videoContainer}>
                    <Video
                        ref={videoRef}
                        source={{ uri: post.mediaUrl }}
                        style={styles.video}
                        resizeMode={ResizeMode.CONTAIN}
                        shouldPlay={false}
                        isLooping={true}
                        useNativeControls
                        onError={(error) => console.log('Video error:', error)}
                    />
                    {!isPlaying && (
                        <View style={styles.iconOverlay}>
                            <Ionicons name="play-circle-outline" size={48} color="#fff" />
                        </View>
                    )}
                </TouchableOpacity>
            ) : post.mediaUrl ? (
                <Image source={{ uri: post.mediaUrl }} style={styles.postImage} />
            ) : null}

            {/* Like button and count */}
            <View style={styles.likeContainer}>
                <TouchableOpacity onPress={handleLike}>
                    <Ionicons
                        name={liked ? 'heart' : 'heart-outline'}
                        size={24}
                        color={liked ? 'red' : '#fff'}
                    />
                </TouchableOpacity>
                <Text style={styles.likeText}>{likeCount}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    postContainer: {
        marginBottom: 16,
        backgroundColor: '#111',
        borderRadius: 8,
        padding: 12,
        borderColor: '#333',
        borderWidth: 1,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    profileContainer: {
        marginRight: 8,
        width: 40,
        height: 40,
        borderRadius: 20,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    textContainer: {
        flex: 1,
    },
    username: {
        color: '#fff',
        fontWeight: 'bold',
    },
    groupTag: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
        backgroundColor: '#333',
        paddingVertical: 2,
        paddingHorizontal: 8,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    groupName: {
        color: '#fff',
        marginLeft: 6,
        fontSize: 14,
        fontWeight: '500',
    },
    postText: {
        color: '#fff',
        fontSize: 16,
        marginBottom: 8,
        marginLeft: 25
    },
    postImage: {
        width: '100%',
        height: 200,
        resizeMode: 'contain',
        borderRadius: 8,
    },
    videoContainer: {
        position: 'relative',
        width: '100%',
        height: 200,
        borderRadius: 8,
        overflow: 'hidden',
    },
    video: {
        width: '100%',
        height: '100%',
    },
    iconOverlay: {
        position: 'absolute',
        top: '39%',
        left: '42%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    likeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    likeText: {
        color: '#fff',
        marginLeft: 8,
        fontSize: 16,
    },
});

export default PostItem;