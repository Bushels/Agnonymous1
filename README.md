# Agnonymous is a web application that allows users to submit anonymous tips about corruption in the agriculture sector. The platform features topic-based organization, admin approval workflow, tip rating system, and an anonymous daily chat.

## Features

- **Anonymous Tip Submission**: Users can submit tips without revealing their identity
- **Topic-Based Organization**: Tips are categorized by topic for easy navigation
- **Admin Approval Workflow**: Administrators review tips before they're published
- **Tip Rating System**: Users can rate tips as helpful, inaccurate, or add more information
- **Daily Anonymous Chat**: A chat room that resets daily at midnight for privacy
- **Responsive Design**: Works on both desktop and mobile devices

## Technology Stack

- **Frontend**: React.js with React Router for navigation
- **Backend**: Firebase (Firestore, Authentication, Storage, Cloud Functions)
- **Hosting**: Firebase Hosting

## Setup Instructions

### Prerequisites

- Node.js (v14 or later)
- npm (v6 or later)
- Firebase CLI (`npm install -g firebase-tools`)
- A Firebase project

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/Bushels/Agnonymous1.git
   cd Agnonymous1
   ```

2. Install dependencies:
   ```
   npm install
   cd functions
   npm install
   cd ..
   ```

3. Create a `.env` file in the root directory with your Firebase configuration:
   ```
   REACT_APP_FIREBASE_API_KEY=your-api-key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=your-project-id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
   REACT_APP_FIREBASE_APP_ID=your-app-id
   ```

4. Initialize Firebase:
   ```
   firebase login
   firebase init
   ```
   Select the following features:
   - Firestore
   - Storage
   - Hosting
   - Functions
   - Emulators (optional, for local development)

### Setting up Firebase

1. Create an Admin user in Firebase Authentication:
   - Go to Firebase Console > Authentication > Add User
   - Create a user with email and password

2. Set up the Admin role in Firestore:
   - Create a `users` collection
   - Add a document with the admin user's UID
   - Add a field `role` with value `admin`

3. Deploy Firestore Rules:
   ```
   firebase deploy --only firestore:rules
   ```

4. Deploy Storage Rules:
   ```
   firebase deploy --only storage:rules
   ```

5. Deploy Cloud Functions:
   ```
   firebase deploy --only functions
   ```

### Running Locally

```
npm start
```

The application will be available at http://localhost:3000

### Deployment

```
npm run deploy
```

This will build the React application and deploy it to Firebase Hosting.

## Project Structure

- `/public`: Static files
- `/src`: React application source code
  - `/components`: UI components organized by feature
  - `/contexts`: React contexts for state management
  - `/firebase`: Firebase configuration and utilities
  - `/styles`: CSS files for styling components
- `/functions`: Firebase Cloud Functions
- `/firestore.rules`: Security rules for Firestore
- `/storage.rules`: Security rules for Firebase Storage
- `/firebase.json`: Firebase configuration

## Admin Guide

### Managing Topics

1. Log in as an admin user
2. Navigate to the Admin Dashboard
3. Click on "Create New Topic" to add a new corruption topic
4. To edit a topic, find it in the Recent Topics list and click "Edit"

### Reviewing Tips

1. From the Admin Dashboard, click on "Review Tips"
2. Approve or reject submitted tips
3. Tips are only displayed to users after admin approval

### Managing Feedback

1. From the Admin Dashboard, click on "Review Feedback"
2. Approve or reject user feedback on tips
3. Approved feedback will be displayed alongside the original tip

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For questions or issues, please open an issue on GitHub or contact the repository owner.
