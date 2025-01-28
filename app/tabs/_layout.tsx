import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function Layout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: { backgroundColor: "#000" },
        tabBarActiveTintColor: "#fff",
        tabBarInactiveTintColor: "#888",
        headerShown: false,
      }}
    >
      {/* Home Tab */}
      <Tabs.Screen
        name="feed"
        options={{
          tabBarLabel: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" style={{ fontSize: size, color }} />
          ),
        }}
      />

      {/* Post Tab */}
      <Tabs.Screen
        name="createPost"
        options={{
          tabBarLabel: "Post",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add-circle-outline" style={{ fontSize: size, color }} />
          ),
        }}
      />

      {/* Groups Tab */}
      <Tabs.Screen
        name="groups"
        options={{
          tabBarLabel: "Groups",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" style={{ fontSize: size, color }} />
          ),
        }}
      />

      {/* Profile Tab */}
      <Tabs.Screen
        name="profile"
        options={{
          tabBarLabel: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" style={{ fontSize: size, color }} />
          ),
        }}
      />
    </Tabs>
  );
}