import React, { useState } from 'react';
import { getAuth } from 'firebase/auth';
import { ref, get, remove } from 'firebase/database';
import { useRouter } from 'next/router';
import { database } from '../firebase';
import styles from '../styles/VerifyEmail.module.css';

const VerifyEmail = () => {
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const auth = getAuth();
    const router = useRouter();

    const handleVerify = async () => {
        try {
            const user = auth.currentUser;
            if (user) {
                const verificationRef = ref(database, 'verificationCodes/' + user.uid);
                const snapshot = await get(verificationRef);

                if (snapshot.exists()) {
                    const { code: storedCode } = snapshot.val();

                    if (code === storedCode) {
                        await remove(verificationRef);

                        setSuccess('Verification successful!');
                        setTimeout(() => {
                            router.push('/setup-username');
                        }, 2000);
                    } else {
                        setError('Invalid verification code.');
                    }
                } else {
                    setError('No verification code found.');
                }
            } else {
                setError('User not authenticated.');
            }
        } catch (error) {
            setError('Error verifying code.');
            console.error('Error verifying code:', error);
        }
    };

    return (
        <div className={styles.fullHeight}>
            <div className={styles.container}>
                <h1 className={styles.title}>Enter Verification Code</h1>
                <input
                    type="text"
                    placeholder="Verification Code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className={styles.input}
                />
                <button onClick={handleVerify} className={styles.button}>Verify</button>
                {error && <p className={styles.error}>{error}</p>}
                {success && <p className={styles.success}>{success}</p>}
            </div>
        </div>
    );
};

export default VerifyEmail;
