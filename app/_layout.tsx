import { Stack, Tabs } from "expo-router";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { app } from "../config/firebaseConfig";
import { Ionicons } from "@expo/vector-icons";

export default function Layout() {

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user); // Set logged-in state if there's a user
    });
    return unsubscribe; // Clean up the listener on unmount
  }, []);

  if (!isLoggedIn) {
    // Show Stack layout for login/signup (not logged in)
    return (
      <Stack initialRouteName="auth/login" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="auth/login" />
        <Stack.Screen name="auth/signup" />
      </Stack>
    );
  }

  // Once login show tabs
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="tabs" />
    </Stack>
  );
}