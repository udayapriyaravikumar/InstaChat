import React, { useState, useEffect, useCallback } from 'react';
import FindFriends from '../components/FindFriends';
import FriendRequests from '../components/FriendRequests';
import FriendsList from '../components/FriendsList';
import styles from '../styles/Chat.module.css';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { ref, onValue, push, set, off } from 'firebase/database';
import { database } from '../firebase';

const ChatPage = () => {
    const [selectedFriend, setSelectedFriend] = useState(null);
    const [user, setUser] = useState(null);
    const [friends, setFriends] = useState({});
    const [filteredFriends, setFilteredFriends] = useState([]);
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState('');
    const [selectedFriendInfo, setSelectedFriendInfo] = useState(null);
    const [friendSearch, setFriendSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const auth = getAuth();

    // Fetch user and friends data
    const fetchUserData = useCallback(() => {
        const currentUser = auth.currentUser;

        if (currentUser) {
            setUser(currentUser);
            console.log('User authenticated:', currentUser.uid);

            // Fetch friends list
            const friendsRef = ref(database, `friends/${currentUser.uid}`);
            const handleFriends = (snapshot) => {
                const data = snapshot.val() || {};
                console.log('Friends data:', data);
                setFriends(data);
                setFilteredFriends(Object.values(data));
                setLoading(false);
            };
            onValue(friendsRef, handleFriends);

            // Fetch user info
            const userRef = ref(database, `users/${currentUser.uid}`);
            onValue(userRef, (snapshot) => {
                const userData = snapshot.val();
                if (userData) {
                    console.log('User data:', userData);
                    setUser((prev) => ({
                        ...prev,
                        displayName: userData.fullName || prev.displayName,
                    }));
                }
            });

            // Cleanup listeners on component unmount
            return () => {
                off(friendsRef);
                off(userRef);
            };
        } else {
            console.log('No authenticated user.');
            setLoading(false);
        }
    }, [auth]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                fetchUserData();
            } else {
                setUser(null);
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, [fetchUserData]);

    // Fetch messages and selected friend info
    useEffect(() => {
        if (user && selectedFriend) {
            console.log('Fetching messages for:', selectedFriend);

            const userMessagesRef = ref(database, `messages/${user.uid}/${selectedFriend}`);
            const friendMessagesRef = ref(database, `messages/${selectedFriend}/${user.uid}`);

            const handleMessages = (snapshot) => {
                const data = snapshot.val() || {};
                console.log('Messages data:', data);
                const messagesList = Object.values(data).sort((a, b) => a.timestamp - b.timestamp);
                setMessages(messagesList);
            };

            onValue(userMessagesRef, handleMessages);
            onValue(friendMessagesRef, handleMessages);

            // Fetch selected friend's info
            const friendInfoRef = ref(database, `users/${selectedFriend}`);
            onValue(friendInfoRef, (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    console.log('Selected friend info:', data);
                    setSelectedFriendInfo({
                        fullName: data.fullName,
                        username: data.username,
                    });
                }
            });

            // Cleanup listeners on unmount or when selectedFriend changes
            return () => {
                off(userMessagesRef);
                off(friendMessagesRef);
                off(friendInfoRef);
            };
        } else {
            console.log('No selected friend or user.');
            setMessages([]);
            setSelectedFriendInfo(null);
        }
    }, [user, selectedFriend]);

    // Handle sending messages
    const handleSend = async () => {
        console.log('Handling send message:', { message, user, selectedFriend });

        if (message.trim() && user && selectedFriend) {
            const newMessage = {
                text: message.trim(),
                userId: user.uid,
                timestamp: Date.now(),
                fullName: user.displayName || 'Unknown',
                username: user.displayName || 'Anonymous',
            };

            try {
                const messageRefUser = push(ref(database, `messages/${user.uid}/${selectedFriend}`));
                await set(messageRefUser, newMessage);

                const messageRefFriend = push(ref(database, `messages/${selectedFriend}/${user.uid}`));
                await set(messageRefFriend, newMessage);

                console.log('Message sent:', newMessage);
                setMessage('');
            } catch (error) {
                console.error('Error sending message:', error);
                setError('Failed to send message.');
            }
        } else {
            console.log('Cannot send message. Ensure message is not empty, user is set, and a friend is selected.');
        }
    };

    // Handle friend selection
    const handleSelectFriend = (friendId) => {
        console.log('Selected friend:', friendId);
        setSelectedFriend(friendId);
    };

    // Handle friend search
    const handleFriendSearch = (e) => {
        setFriendSearch(e.target.value);
        const filtered = Object.values(friends).filter(friend =>
            (friend.username && friend.username.toLowerCase().includes(e.target.value.toLowerCase())) ||
            (friend.fullName && friend.fullName.toLowerCase().includes(e.target.value.toLowerCase()))
        );
        console.log('Filtered friends:', filtered);
        setFilteredFriends(filtered);
    };

    const handleUnfriend = (friendId) => {
        console.log('Unfriending:', friendId);
        // Implement the unfriend logic here
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div className={styles.desktopContainer}>
            <div className={styles.sidebar}>
                <div className={styles.sidebarHeader}>InstaChat</div>
                <button className={styles.backButton} onClick={() => window.history.back()}>
                    ← Back
                </button>
                <div className={styles.section}>
                    <input
                        type="text"
                        placeholder="Search friends..."
                        className={styles.searchInput}
                        value={friendSearch}
                        onChange={handleFriendSearch}
                    />
                    <div className={styles.scrollableSection}>
                        <FriendsList setSelectedFriend={handleSelectFriend} friends={filteredFriends} />
                    </div>
                </div>
                <div className={styles.section}>
                    <div className={styles.scrollableSection}>
                        <FindFriends />
                    </div>
                </div>
                <div className={styles.section}>
                    <div className={styles.scrollableSection}>
                        <FriendRequests />
                    </div>
                </div>
            </div>
            <div className={styles.chatWindow}>
                <div className={styles.chatHeader}>
                    <div className={styles.profile}>
                        <div className={styles.profilePictureSmall}></div>
                        <div className={styles.profileDetails}>
                            <h2 id="chat-username">
                                {selectedFriendInfo ? selectedFriendInfo.fullName : "Select a friend to start chatting."}
                            </h2>
                            {selectedFriendInfo && (
                                <button className={`${styles.elegantButton} ${styles.unfriendButton}`} onClick={() => handleUnfriend(selectedFriend)}>
                                    Unfriend
                                </button>
                            )}
                        </div>
                    </div>
                </div>
                <div className={styles.chatMessages} id="chat-messages">
                    {messages.map((msg, index) => (
                        <div key={index} className={`${styles.message} ${msg.userId === user.uid ? styles.sent : styles.received}`}>
                            <div className={styles.messageContent}>
                                <span className={styles.messageText}>{msg.text}</span>
                                <span className={styles.time}>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                            </div>
                        </div>
                    ))}
                </div>
                <div className={styles.chatInputContainer}>
                    <input
                        type="text"
                        id="message-input"
                        placeholder="Enter your message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className={styles.chatInput}
                    />
                    <button id="send-button" onClick={handleSend} className={styles.elegantButton}>Send</button>
                </div>
            </div>
        </div>
    );
};

export default ChatPage;
