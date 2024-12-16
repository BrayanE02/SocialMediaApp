import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import LoginScreen from './screens/login';
import SignUpScreen from './screens/signup';
import TabsNavigator from '../components/TabNavigator';

const Stack = createStackNavigator();

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" component={LoginScreen} />
        <Stack.Screen name="signup" component={SignUpScreen} />
        <Stack.Screen name="feed" component={TabsNavigator} />
      </Stack.Navigator>
    </GestureHandlerRootView>
  );
}
