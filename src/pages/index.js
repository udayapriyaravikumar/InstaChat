import React from 'react';
import Link from 'next/link';
import styles from '../styles/Index.module.css';

const Home = () => {
    return (
        <div className={styles.fullHeight}>
            <div className={styles.container}>
                <h1 className={styles.title}>Welcome to InstaChat</h1>
                <Link href="/login">
                    <a className={styles.button}>Login</a>
                </Link>
                <Link href="/signup">
                    <a className={styles.button}>Sign Up</a>
                </Link>
            </div>
        </div>
    );
};

export default Home;
