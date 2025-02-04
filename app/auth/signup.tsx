import React from 'react';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Styles from '../styles/logRegStyle'
import { app } from '../../config/firebaseConfig';
import { router } from 'expo-router';
import { getFirestore, collection, query, where, getDocs, doc, setDoc } from "firebase/firestore";

// Initialize Firestore
const db = getFirestore(app);

export default function SignUpScreen({ navigation }: { navigation: any }) {

    const auth = getAuth(app);

    const [email, setEmail] = React.useState("");
    const [username, setUsername] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [confirmPassword, setConfirmPassword] = React.useState("");
    const [errors, setErrors] = React.useState<{ [key: string]: string | null }>({});

    const validateInputs = (): boolean => {
        const newErrors: { [key: string]: string | null } = {};

        if (!email.trim()) newErrors.email = "Email is required";
        else if (!/^\S+@\S+\.\S+$/.test(email)) newErrors.email = "Invalid email format";

        if (!username.trim()) newErrors.username = "Username is required";
        else if (username.length < 3) newErrors.username = "Username must be at least 3 characters";

        if (!password) newErrors.password = "Password is required";
        else if (password.length < 8) newErrors.password = "Password must be at least 8 characters";
        else if (!/[A-Z]/.test(password)) newErrors.password = "Password must contain an uppercase letter";
        else if (!/\d/.test(password)) newErrors.password = "Password must contain a number";
        else if (!/[!@#$%^&*]/.test(password)) newErrors.password = "Password must contain a special character";

        if (password !== confirmPassword) newErrors.confirmPassword = "Passwords do not match";

        setErrors(newErrors);

        return Object.keys(newErrors).length === 0;
    };

    // Helper function to check if a username already exists in Firestore
    const checkUsernameExists = async (username: string): Promise<boolean> => {
        const q = query(collection(db, "users"), where("username", "==", username));
        const querySnapshot = await getDocs(q);
        return !querySnapshot.empty;
    };

    const handleSignUp = async () => {
        console.log("Sign Up button pressed"); // Debug log
        //if (!validateInputs()) return;

        // Check if the username is already taken
        if (await checkUsernameExists(username)) {
            setErrors((prevErrors) => ({
                ...prevErrors,
                username: "This username is already taken. Please choose another.",
            }));
            return;
        }

        try {
            // Create the user in Firebase Authentication
            console.log("Creating user with email and password");
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);

            // update the user's display name in Auth
            console.log("User created, updating profile");
            await updateProfile(userCredential.user, { displayName: username });

            // Save the additional user data to Firestore
            console.log("Saving user data to Firestore");
            await setDoc(doc(db, "users", userCredential.user.uid), {
                username,
                email,
                createdAt: new Date(),
            });

            console.log("User created successfully:", userCredential.user);
            // Navigate to Feed or Login page after successful sign-up
            router.push("/tabs/feed");
        } catch (error: any) {
            console.error("Error signing up:", error.message);

            // Check for duplicate email error code
            if (error.code === "auth/email-already-in-use") {
                setErrors((prevErrors) => ({
                    ...prevErrors,
                    email: "This email is already in use. Please use a different email.",
                }));
            } else {
                alert(error.message); // Display the error to the user for any other error
            }
        }
    };

    return (
        <View style={Styles.container}>
            <TouchableOpacity onPress={() => router.back()} style={Styles.backArrow}>
                <Text style={Styles.backColor}>←</Text>
            </TouchableOpacity>

            <Text style={Styles.title}>Social Media App</Text>
            <Text style={Styles.subtitle}>Sign Up</Text>

            <TextInput
                style={Styles.input}
                placeholder="Email"
                placeholderTextColor="#A9A9A9"
                value={email}
                onChangeText={(text) => setEmail(text)}
            />
            {errors.email && <Text style={Styles.errorText}>{errors.email}</Text>}

            <TextInput
                style={Styles.input}
                placeholder="Username"
                placeholderTextColor="#A9A9A9"
                value={username}
                onChangeText={(text) => setUsername(text)}
            />
            {errors.username && <Text style={Styles.errorText}>{errors.username}</Text>}

            <TextInput
                style={Styles.input}
                placeholder="Password"
                placeholderTextColor="#A9A9A9"
                value={password}
                secureTextEntry
                onChangeText={(text) => setPassword(text)}
                textContentType="none"
            />
            {errors.password && <Text style={Styles.errorText}>{errors.password}</Text>}

            <TextInput
                style={Styles.input}
                placeholder="Confirm Password"
                placeholderTextColor="#A9A9A9"
                value={confirmPassword}
                secureTextEntry
                onChangeText={(text) => setConfirmPassword(text)}
                textContentType="none"
            />
            {errors.confirmPassword && <Text style={Styles.errorText}>{errors.confirmPassword}</Text>}

            <TouchableOpacity style={Styles.button} onPress={handleSignUp}>
                <Text style={Styles.buttonText}>Sign Up</Text>
            </TouchableOpacity>
        </View>
    );
}