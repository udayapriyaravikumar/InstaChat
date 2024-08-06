import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/router';
import { auth, database } from '../firebase';
import { ref, get } from 'firebase/database';
import styles from '../styles/Login.module.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleLogin = async () => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            if (user.emailVerified) {
                const userSnapshot = await get(ref(database, 'users/' + user.uid));
                const userDetails = userSnapshot.val();

                if (userDetails && userDetails.username) {
                    router.push('/chat');
                } else {
                    router.push('/setup-username');
                }
            } else {
                setError('Please verify your email before logging in.');
            }
        } catch (error) {
            setError(error.message);
        }
    };

    return (
        <div className={styles.fullHeight}>
            <div className={styles.container}>
                <h1 className={styles.title}>Login</h1>
                {error && <p className={styles.error}>{error}</p>}
                <input type="email" placeholder="Email" onChange={(e) => setEmail(e.target.value)} className={styles.input} />
                <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} className={styles.input} />
                <button onClick={handleLogin} className={styles.button}>Login</button>
            </div>
        </div>
    );
};

export default Login;
