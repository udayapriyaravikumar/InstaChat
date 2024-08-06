import React, { useState, useEffect } from 'react';
import { ref, onValue, remove, set, get } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { database } from '../firebase';
import styles from '../styles/Chat.module.css';

const FriendRequests = () => {
    const [incomingRequests, setIncomingRequests] = useState({});
    const [userDetails, setUserDetails] = useState({});
    const [currentUser, setCurrentUser] = useState(null);
    const [currentUsername, setCurrentUsername] = useState('');
    const [error, setError] = useState('');

    const auth = getAuth();

    useEffect(() => {
        const fetchCurrentUser = async () => {
            const user = auth.currentUser;
            if (user) {
                console.log('Current user:', user.uid);
                setCurrentUser(user.uid);
                setCurrentUsername(user.displayName);
                const incomingRequestsRef = ref(database, `incomingRequests/${user.uid}`);
                onValue(incomingRequestsRef, (snapshot) => {
                    const data = snapshot.val() || {};
                    console.log('Incoming friend requests:', data);
                    setIncomingRequests(data);
                });
            }
        };
        fetchCurrentUser();

        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                console.log('Auth state changed:', user.uid);
                setCurrentUser(user.uid);
                setCurrentUsername(user.displayName);
                const incomingRequestsRef = ref(database, `incomingRequests/${user.uid}`);
                onValue(incomingRequestsRef, (snapshot) => {
                    const data = snapshot.val() || {};
                    console.log('Incoming friend requests:', data);
                    setIncomingRequests(data);
                });
            }
        });

        return () => unsubscribe();
    }, [auth]);

    useEffect(() => {
        if (incomingRequests) {
            const fetchUserDetails = async () => {
                const details = await Promise.all(Object.keys(incomingRequests).map(async (userId) => {
                    const userRef = ref(database, `users/${userId}`);
                    const snapshot = await get(userRef);
                    const userDetails = snapshot.val();
                    return { [userId]: userDetails };
                }));
                const detailsObject = details.reduce((acc, curr) => ({ ...acc, ...curr }), {});
                setUserDetails(detailsObject);
            };
            fetchUserDetails();
        }
    }, [incomingRequests]);

    const handleAcceptRequest = async (userId) => {
        console.log('Accepting friend request from:', userId);
        if (currentUser) {
            try {
                // Add to user's friends list
                const userFriendsRef = ref(database, `friends/${currentUser}/${userId}`);
                await set(userFriendsRef, { status: 'accepted' });

                // Add to sender's friends list
                const senderFriendsRef = ref(database, `friends/${userId}/${currentUser}`);
                await set(senderFriendsRef, { status: 'accepted' });

                // Remove from incoming requests
                const incomingRequestRef = ref(database, `incomingRequests/${currentUser}/${userId}`);
                await remove(incomingRequestRef);

                // Remove from outgoing requests of the sender
                const outgoingRequestRef = ref(database, `friendRequests/${userId}/${currentUser}`);
                await remove(outgoingRequestRef);

                // Update local state
                setIncomingRequests(prev => {
                    const updatedIncoming = { ...prev };
                    delete updatedIncoming[userId];
                    return updatedIncoming;
                });

                console.log(`Friend request from ${userId} accepted`);
            } catch (err) {
                setError('Error accepting friend request.');
                console.error('Error accepting friend request:', err);
            }
        }
    };

    const handleRejectRequest = async (userId) => {
        console.log('Rejecting friend request from:', userId);
        if (currentUser) {
            try {
                // Remove from incoming requests
                const incomingRequestRef = ref(database, `incomingRequests/${currentUser}/${userId}`);
                await remove(incomingRequestRef);

                // Remove from outgoing requests of the sender
                const outgoingRequestRef = ref(database, `friendRequests/${userId}/${currentUser}`);
                await remove(outgoingRequestRef);

                // Update local state
                setIncomingRequests(prev => {
                    const updatedIncoming = { ...prev };
                    delete updatedIncoming[userId];
                    return updatedIncoming;
                });

                console.log(`Friend request from ${userId} rejected`);
            } catch (err) {
                setError('Error rejecting friend request.');
                console.error('Error rejecting friend request:', err);
            }
        }
    };

    return (
        <div className={styles.friendRequestsBox}>
            <h3 className={styles.title}>Friend Requests</h3>
            {error && <p className={styles.error}>{error}</p>}
            {Object.keys(incomingRequests).length > 0 ? (
                Object.keys(incomingRequests).map(userId => (
                    <div key={userId} className={styles.requestItem}>
                        <p>{userDetails[userId] ? `${userDetails[userId].fullName} (${userDetails[userId].username})` : 'Loading...'}</p>
                        <button
                            onClick={() => handleAcceptRequest(userId)}
                            className={styles.acceptButton}
                        >
                            Accept
                        </button>
                        <button
                            onClick={() => handleRejectRequest(userId)}
                            className={styles.rejectButton}
                        >
                            Reject
                        </button>
                    </div>
                ))
            ) : (
                <p>No friend requests.</p>
            )}
        </div>
    );
};

export default FriendRequests;
