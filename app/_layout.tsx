import { Slot, Stack } from "expo-router";
import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "../config/firebaseConfig";

export default function RootLayout() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuth(app), (user) => {
      setIsLoggedIn(!!user);
      setAuthChecked(true);
    });
    return unsubscribe;
  }, []);

  if (!authChecked) return null;

  if (!isLoggedIn) {
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="auth/login" />
        <Stack.Screen name="auth/signup" />
      </Stack>
    );
  }

  return <Slot />;
}
