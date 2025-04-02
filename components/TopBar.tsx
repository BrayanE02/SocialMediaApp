import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TopBarProps {
    title?: string;
    showBell?: boolean;
    showBack?: boolean;
    onBellPress?: () => void;
    onBackPress?: () => void;
    hasUnread?: boolean;
}


const TopBar: React.FC<TopBarProps> = ({
    title = 'pmo.',
    showBell = true,
    onBellPress,
    hasUnread = false,
    showBack = false,
    onBackPress
}) => {

    return (
        <View style={{
            borderBottomColor: '#333',
            borderBottomWidth: 1,
            backgroundColor: 'black',
            paddingVertical: 12,
        }}>
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                paddingHorizontal: 16,
                height: 50,
            }}>
                {showBack ? (
                    <TouchableOpacity onPress={onBackPress}>
                        <Ionicons name="chevron-back" size={24} color="white" />
                    </TouchableOpacity>
                ) : (
                    <View style={{ width: 36 }} />
                )}
                <Text style={{ color: 'white', fontSize: 28, fontWeight: 'bold', textAlign: 'center', flex: 1 }}>{title}</Text>
                {showBell ? (
                    <TouchableOpacity onPress={onBellPress} style={{ position: 'relative' }}>
                        <Ionicons name="notifications-outline" size={24} color="white" />
                        {hasUnread && (
                            <View style={{
                                position: 'absolute',
                                right: -4,
                                top: -4,
                                backgroundColor: 'red',
                                borderRadius: 8,
                                width: 16,
                                height: 16,
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}>
                                <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>•</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                ) : <View style={{ width: 24 }} />}
            </View>
        </View>
    );
};

export default TopBar;
