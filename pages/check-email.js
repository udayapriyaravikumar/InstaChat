import React from 'react';
import Link from 'next/link';
import styles from '../styles/CheckEmail.module.css';

const CheckEmail = () => {
    return (
        <div className={styles.fullHeight}>
            <div className={styles.container}>
                <h1 className={styles.title}>Verification Email Sent</h1>
                <p>We have sent a verification email to your inbox. Please check your email and follow the instructions to verify your account.</p>
                <div>
                    <Link href="/" passHref>
                        <span className={styles.link}>Go to Homepage</span>
                    </Link>
                    <span> | </span>
                    <Link href="/login" passHref>
                        <span className={styles.link}>Login</span>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default CheckEmail;
