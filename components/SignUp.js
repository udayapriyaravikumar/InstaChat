import React, { useState } from 'react';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { useRouter } from 'next/router';
import { auth } from '../firebase';
import styles from '../styles/Signup.module.css';

const SignUp = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSignUp = async () => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await sendEmailVerification(userCredential.user);
            router.push('/check-email');
        } catch (error) {
            setError(error.message);
        }
    };

    return (
        <div className={styles.fullHeight}>
            <div className={styles.container}>
                <h1 className={styles.title}>Sign Up</h1>
                {error && <p className={styles.error}>{error}</p>}
                <input type="email" placeholder="Email" onChange={(e) => setEmail(e.target.value)} className={styles.input} />
                <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} className={styles.input} />
                <button onClick={handleSignUp} className={styles.button}>Sign Up</button>
            </div>
        </div>
    );
};

export default SignUp;
