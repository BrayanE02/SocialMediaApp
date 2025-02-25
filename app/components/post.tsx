import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';

interface Post {
    id: string;
    text?: string;
    mediaUrl?: string;
    userPhotoUrl?: string;
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

    // Pause video if it's not the currently playing video
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

    // Determine if mediaUrl is a video by checking for common video extensions.
    const isVideo =
        post.mediaUrl &&
        (post.mediaUrl.includes('.mov') || post.mediaUrl.includes('.mp4'));

    return (
        <View style={styles.postContainer}>
            <View style={styles.headerRow}>
                <View style={styles.profileContainer}>
                    {post.userPhotoUrl ? (
                        <Image source={{ uri: post.userPhotoUrl }} style={styles.profileImage} />
                    ) : (
                        <Ionicons name="person-circle-outline" size={40} color="#fff" />
                    )}
                </View>
                <View style={styles.textContainer}>
                    {post.text && <Text style={styles.postText}>{post.text}</Text>}
                </View>
            </View>
            {post.mediaUrl && isVideo ? (
                <TouchableOpacity onPress={togglePlay} style={styles.videoContainer}>
                    <Video
                        ref={videoRef}
                        source={{ uri: post.mediaUrl }}
                        style={styles.video}
                        resizeMode={ResizeMode.CONTAIN}
                        shouldPlay={false}
                        isLooping={false}
                        useNativeControls
                        onError={(error) => console.log('Video error:', error)}
                    />
                    {/* Overlay play icon if not playing */}
                    {!isPlaying && (
                        <View style={styles.iconOverlay}>
                            <Ionicons name="play-circle-outline" size={48} color="#fff" />
                        </View>
                    )}
                </TouchableOpacity>
            ) : post.mediaUrl ? (
                <Image source={{ uri: post.mediaUrl }} style={styles.postImage} />
            ) : null
            }
        </View >
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
        height: 40,
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
        justifyContent: 'center',
    },
    postText: {
        color: '#fff',
        fontSize: 16,

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
});

export default PostItem;
