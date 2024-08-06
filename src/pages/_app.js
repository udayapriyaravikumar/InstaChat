//src/pages/_app.js
import '../styles/globals.css'; // Ensure you have some global styles or import an empty file
import '../styles/Chat.module.css'; // Adjust the path as needed
import { useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/router';

function MyApp({ Component, pageProps }) {
    const router = useRouter();
    const auth = getAuth();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (!user && router.pathname !== '/login' && router.pathname !== '/signup') {
                router.push('/login');
            }
        });
        return () => unsubscribe();
    }, [auth, router]);

    return <Component {...pageProps} />;
}

export default MyApp;
