import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text } from 'react-native';
import FeedScreen from '../app/screens/feed';
import ProfileScreen from '../app/screens/profile';
import GroupsScreen from '../app/screens/groups';
import CreatePostScreen from '../app/screens/createPost';
import { Ionicons } from '@expo/vector-icons'; // For icons

const Tab = createBottomTabNavigator();

export default function TabsNavigator() {
    return (
        <Tab.Navigator
            screenOptions={{
                tabBarStyle: { backgroundColor: 'black', borderTopWidth: 0 },
                tabBarActiveTintColor: 'white',
                tabBarInactiveTintColor: 'gray',
            }}>
            <Tab.Screen
                name="Home"
                component={FeedScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size} />,
                    headerShown: false,
                }}
            />
            <Tab.Screen
                name="Create"
                component={CreatePostScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <Ionicons name="add-circle" color={color} size={size} />,
                    headerShown: false,
                }}
            />
            <Tab.Screen
                name="Groups"
                component={GroupsScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <Ionicons name="people" color={color} size={size} />,
                    headerShown: false,
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <Ionicons name="person" color={color} size={size} />,
                    headerShown: false,
                }}
            />
        </Tab.Navigator>
    );
}
