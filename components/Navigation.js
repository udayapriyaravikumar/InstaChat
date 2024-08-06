//Navigation.js
import React from 'react';
import Link from 'next/link';
import { getAuth, signOut } from 'firebase/auth';

const Navigation = () => {
    const auth = getAuth();

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            window.location.href = '/'; // Redirect to home page
        } catch (error) {
            console.error('Error signing out: ', error);
        }
    };

    return (
        <nav>
            <Link href="/chat">Chat</Link>
            <button onClick={handleSignOut}>Sign Out</button>
        </nav>
    );
};

export default Navigation;
