import React, { useState, useEffect } from 'react';
import { getAuth, updateProfile } from 'firebase/auth';
import { ref, set, get } from 'firebase/database';
import { useRouter } from 'next/router';
import { database } from '../firebase';
import styles from '../styles/SetupUsername.module.css';

const SetupUsername = () => {
    const [username, setUsername] = useState('');
    const [fullName, setFullName] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const router = useRouter();
    const auth = getAuth();

    useEffect(() => {
        const user = auth.currentUser;

        if (user) {
            if (user.emailVerified && user.displayName) {
                router.push('/chat');
            } else if (!user.emailVerified) {
                router.push('/check-email');
            }
        } else {
            router.push('/login');
        }
    }, [auth, router]);

    const handleSetup = async () => {
        if (!username.trim() || !fullName.trim()) {
            setError('Both username and full name are required.');
            return;
        }

        if (!validateInput(username) || !validateInput(fullName)) {
            setError('Username and full name can only contain alphanumeric characters and spaces.');
            return;
        }

        const sanitizedUsername = sanitizeUsername(username);
        const user = auth.currentUser;

        try {
            const userRef = ref(database, 'users/' + user.uid);
            const snapshot = await get(userRef);

            if (snapshot.exists()) {
                setError('Username is taken, try again.');
                return;
            }

            await updateProfile(user, { displayName: sanitizedUsername });
            await set(userRef, {
                fullName,
                username: sanitizedUsername,
                email: user.email
            });

            setSuccessMessage('Setup successful! Redirecting...');
            setTimeout(() => router.push('/chat'), 2000); // Redirect after 2 seconds
        } catch (error) {
            setError('Error updating profile. Please try again.');
        }
    };

    const validateInput = (input) => /^[a-zA-Z0-9 ]*$/.test(input);

    const sanitizeUsername = (username) => username.replace(/[.#$[\]]/g, '');

    return (
        <div className={styles.fullHeight}>
            <div className={styles.container}>
                <h1 className={styles.title}>Setup Your Username and Full Name</h1>
                {error && <p className={styles.error}>{error}</p>}
                {successMessage && <p className={styles.successMessage}>{successMessage}</p>}
                <input 
                    type="text" 
                    placeholder="Full Name" 
                    onChange={(e) => setFullName(e.target.value)} 
                    value={fullName}
                    className={styles.input}
                />
                <input 
                    type="text" 
                    placeholder="Username" 
                    onChange={(e) => setUsername(e.target.value)} 
                    value={username}
                    className={styles.input}
                />
                <button onClick={handleSetup} className={styles.button}>Start InstaChat-ing!!!</button>
            </div>
        </div>
    );
};

export default SetupUsername;
