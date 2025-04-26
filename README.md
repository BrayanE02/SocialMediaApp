# pmo.

## Overview

pmo. is a social media mobile application that focuses on giving users control over their content visibility and privacy. Users can create posts with text, images, or videos, and choose who can view each post (public, followers-only, or group-specific). The app also allows for group creation, profile management, and tracking post engagement through a real-time activity center.

This project was developed as a senior capstone project to demonstrate mobile development skills, backend integration, and user-centered design.

## Technologies Used

- React Native (Frontend)
- Expo (React Native framework)
- Firebase Authentication (User registration and login)
- Firebase Firestore (Real-time NoSQL database for posts, users, and groups)
- Firebase Storage (Media uploads: images and videos)

## Features

- User Registration and Login
- Create Posts (text, images, and videos)
- Post Visibility Options (Public, Followers-Only, Group-Specific)
- Group Creation
- User Profile Management (Edit Bio, Profile Picture, Password)
- Real-Time Likes and Activity Center
- Mobile-first Design with Bottom Tab Navigation

## Setup Instructions

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/pmo.git
   ```

2. Navigate into the project directory:

   ```bash
   cd pmo
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Start the Expo development server:

   ```bash
   npm start
   ```

5. Scan the QR code using Expo Go (on iOS/Android) to run the app.

> **Note:** You must configure your own Firebase project and update the Firebase configuration files inside the project before running.

## Firebase Setup (Required)

- Create a Firebase project at [firebase.google.com](https://firebase.google.com/)
- Enable Authentication (Email/Password)
- Set up Firestore Database
- Enable Firebase Storage for media uploads
- Copy your Firebase config into your app's Firebase initialization file

## Author

Brayan Escamilla Reyes  
Senior Capstone Project 2025
