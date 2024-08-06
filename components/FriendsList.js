import React, { useState, useEffect } from 'react';
import { ref, get, remove } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { database } from '../firebase';
import styles from '../styles/Chat.module.css';

const FriendsList = ({ setSelectedFriend }) => {
    const [friends, setFriends] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentUser, setCurrentUser] = useState(null);

    const auth = getAuth();

    useEffect(() => {
        // Check authentication state on mount
        const handleAuthStateChange = (user) => {
            if (user) {
                console.log("Auth state changed:", user.uid);
                setCurrentUser(user.uid);
            } else {
                console.log("No authenticated user.");
                setCurrentUser(null);
            }
        };

        const unsubscribe = auth.onAuthStateChanged(handleAuthStateChange);
        return () => unsubscribe();
    }, [auth]);

    useEffect(() => {
        const fetchFriends = async () => {
            if (currentUser) {
                console.log("Current user ID:", currentUser);
                const friendsRef = ref(database, `friends/${currentUser}`);

                try {
                    const snapshot = await get(friendsRef);
                    const data = snapshot.val();
                    console.log("Snapshot Data:", data);

                    if (data) {
                        const friendIds = Object.keys(data);
                        console.log("Friend IDs:", friendIds);

                        const friendDataPromises = friendIds.map(async (friendId) => {
                            const friendRef = ref(database, `users/${friendId}`);
                            try {
                                const friendSnapshot = await get(friendRef);
                                const friendData = friendSnapshot.val();
                                console.log(`Friend Data for ${friendId}:`, friendData);
                                return { id: friendId, ...friendData };
                            } catch (error) {
                                console.error(`Error fetching data for ${friendId}:`, error);
                                return null;
                            }
                        });

                        const friendsData = (await Promise.all(friendDataPromises)).filter(Boolean);
                        console.log("Friends Data:", friendsData);
                        setFriends(friendsData);
                    } else {
                        console.log("No friends data found.");
                        setFriends([]);
                    }
                } catch (error) {
                    console.error("Error fetching friends:", error);
                    setError('Failed to load friends.');
                } finally {
                    setLoading(false);
                }
            } else {
                console.log("Current user is not set.");
                setLoading(false);
            }
        };

        fetchFriends();
    }, [currentUser]);

    const unfriend = async (friendId) => {
        if (currentUser) {
            try {
                const friendsRef = ref(database, `friends/${currentUser}/${friendId}`);
                const reverseFriendsRef = ref(database, `friends/${friendId}/${currentUser}`);
                await remove(friendsRef);
                await remove(reverseFriendsRef);
                // Remove from state
                setFriends((prevFriends) => prevFriends.filter(friend => friend.id !== friendId));
            } catch (error) {
                console.error("Error removing friend:", error);
                setError('Failed to unfriend.');
            }
        }
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div className={styles.friendsListBox}>
            <h3>Friends List</h3>
            {friends.length > 0 ? (
                <ul className={styles.friendsList}>
                    {friends.map(friend => (
                        <li key={friend.id} className={styles.friendItem}>
                            <span>{friend.fullName} ({friend.username})</span>
                            <button className={styles.chatButton} onClick={() => setSelectedFriend(friend.id)}>Chat</button>
                        </li>
                    ))}
                </ul>
            ) : (
                <p>No friends found.</p>
            )}
        </div>
    );
};

export default FriendsList;
