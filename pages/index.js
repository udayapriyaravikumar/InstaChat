import React from 'react';
import Link from 'next/link';
import styles from '../styles/Index.module.css';

const Home = () => {
    return (
        <div className={styles.fullHeight}>
            <div className={styles.container}>
                <h1 className={styles.title}>Welcome to InstaChat</h1>
                <Link href="/login" passHref>
                    <button className={styles.button}>Login</button>
                </Link>
                <Link href="/signup" passHref>
                    <button className={styles.button}>Sign Up</button>
                </Link>
            </div>
        </div>
    );
};

export default Home;
