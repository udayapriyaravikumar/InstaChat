import React, { useState, useEffect } from 'react';
import { ref, onValue, set, get, remove } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { database } from '../firebase';
import styles from '../styles/Chat.module.css';

const FindFriends = () => {
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [outgoingRequests, setOutgoingRequests] = useState({});
    const [incomingRequests, setIncomingRequests] = useState({});
    const [friends, setFriends] = useState({});
    const [currentUser, setCurrentUser] = useState(null);
    const [currentUsername, setCurrentUsername] = useState('');
    const [currentFullName, setCurrentFullName] = useState('');
    const [error, setError] = useState('');

    const auth = getAuth();

    useEffect(() => {
        const fetchCurrentUser = async () => {
            const user = auth.currentUser;
            if (user) {
                console.log('Current user:', user.uid);
                setCurrentUser(user.uid);
                const userRef = ref(database, 'users/' + user.uid);
                onValue(userRef, (snapshot) => {
                    const data = snapshot.val();
                    if (data) {
                        console.log('User data:', data);
                        setCurrentUsername(data.username || '');
                        setCurrentFullName(data.fullName || '');
                    }
                });
            }
        };
        fetchCurrentUser();

        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                console.log('Auth state changed:', user.uid);
                setCurrentUser(user.uid);
                const userRef = ref(database, 'users/' + user.uid);
                onValue(userRef, (snapshot) => {
                    const data = snapshot.val();
                    if (data) {
                        console.log('User data:', data);
                        setCurrentUsername(data.username || '');
                        setCurrentFullName(data.fullName || '');
                    }
                });
            }
        });

        return () => unsubscribe();
    }, [auth]);

    useEffect(() => {
        const fetchUsers = () => {
            const usersRef = ref(database, 'users');
            onValue(usersRef, (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    console.log('Fetched users:', data);
                    const usersList = Object.keys(data).map(key => ({
                        uid: key,
                        ...data[key]
                    }));
                    setUsers(usersList);
                }
            });
        };
        fetchUsers();
    }, []);

    useEffect(() => {
        if (currentUser) {
            const outgoingRequestsRef = ref(database, `friendRequests/${currentUser}`);
            onValue(outgoingRequestsRef, (snapshot) => {
                const data = snapshot.val() || {};
                console.log('Outgoing friend requests:', data);
                setOutgoingRequests(data);
            });

            const incomingRequestsRef = ref(database, `incomingRequests/${currentUser}`);
            onValue(incomingRequestsRef, (snapshot) => {
                const data = snapshot.val() || {};
                console.log('Incoming friend requests:', data);
                setIncomingRequests(data);
            });

            const friendsRef = ref(database, `friends/${currentUser}`);
            onValue(friendsRef, (snapshot) => {
                const data = snapshot.val() || {};
                console.log('Friends:', data);
                setFriends(data);
            });
        }
    }, [currentUser]);

    useEffect(() => {
        if (searchTerm) {
            setFilteredUsers(users.filter(user => 
                user.username.toLowerCase().includes(searchTerm.toLowerCase()) && user.uid !== currentUser
            ));
        } else {
            setFilteredUsers([]);
        }
    }, [searchTerm, users, currentUser]);

    const handleAddFriend = async (userUid) => {
        console.log('Attempting to add friend:', userUid);
        if (currentUser) {
            try {
                // Optimistically update local state
                setOutgoingRequests(prev => ({ ...prev, [userUid]: { status: 'pending' } }));

                const requestRef = ref(database, `friendRequests/${currentUser}/${userUid}`);
                const requestSnapshot = await get(requestRef);

                if (!requestSnapshot.exists()) {
                    const userDetails = (await get(ref(database, `users/${currentUser}`))).val();
                    console.log('Sending friend request to:', userUid);
                    await set(requestRef, { status: 'pending' });

                    // Add to recipient's incoming requests
                    const incomingRequestsRef = ref(database, `incomingRequests/${userUid}/${currentUser}`);
                    await set(incomingRequestsRef, { 
                        status: 'pending', 
                        fullName: userDetails.fullName, 
                        username: userDetails.username 
                    });

                    console.log(`Friend request sent to ${userUid}`);
                } else {
                    console.log(`Friend request already exists to ${userUid}`);
                }

            } catch (err) {
                setError('Error sending friend request.');
                console.error('Error sending friend request:', err);
            }
        } else {
            console.log('Current user is not set.');
        }
    };

    const handleCancelRequest = async (userUid) => {
        console.log('Attempting to cancel friend request:', userUid);
        if (currentUser) {
            try {
                // Optimistically update local state
                setOutgoingRequests(prev => {
                    const updatedOutgoing = { ...prev };
                    delete updatedOutgoing[userUid];
                    return updatedOutgoing;
                });

                const requestRef = ref(database, `friendRequests/${currentUser}/${userUid}`);
                await remove(requestRef);

                // Remove from recipient's incoming requests
                const incomingRequestsRef = ref(database, `incomingRequests/${userUid}/${currentUser}`);
                await remove(incomingRequestsRef);

                console.log(`Friend request to ${userUid} canceled`);

            } catch (err) {
                setError('Error canceling friend request.');
                console.error('Error canceling friend request:', err);
            }
        } else {
            console.log('Current user is not set.');
        }
    };

    const handleRequestClick = async (userUid) => {
        if (isOutgoingRequestPending(userUid)) {
            await handleCancelRequest(userUid);
        } else {
            await handleAddFriend(userUid);
        }
    };

    const isOutgoingRequestPending = (userUid) => {
        return outgoingRequests[userUid] && outgoingRequests[userUid].status === 'pending';
    };

    const isFriend = (userUid) => {
        return friends[userUid] && friends[userUid].status === 'accepted';
    };

    return (
        <div className={styles.findFriendsBox}>
            <h3 className={styles.title}>Find Friends</h3>
            <input
                type="text"
                placeholder="Search by username"
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
            />
            {error && <p className={styles.error}>{error}</p>}
            <div className={styles.userList}>
                {searchTerm && filteredUsers.length > 0 ? (
                    filteredUsers.map(user => (
                        <div key={user.uid} className={styles.userItem}>
                            <p>{user.fullName} ({user.username})</p>
                            {isFriend(user.uid) ? (
                                <button 
                                    disabled
                                    className={styles.addButton}
                                >
                                    Friends
                                </button>
                            ) : (
                                <button 
                                    onClick={() => handleRequestClick(user.uid)}
                                    className={styles.addButton}
                                >
                                    {isOutgoingRequestPending(user.uid) ? 'Cancel Request' : 'Add Friend'}
                                </button>
                            )}
                        </div>
                    ))
                ) : (
                    searchTerm ? <p>No users found.</p> : null
                )}
            </div>
        </div>
    );
};

export default FindFriends;
