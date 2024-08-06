//Chat.js
import React, { useEffect, useState } from 'react';
import { getDatabase, ref, onValue, set } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { database } from '../firebase';
import FindFriends from './FindFriends';
import FriendRequests from './FriendRequests';
import FriendsList from './FriendsList';

const Chat = () => {
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState('');
    const [user, setUser] = useState(null);
    const [userInfo, setUserInfo] = useState({ fullName: '', username: '' });
    const [selectedFriend, setSelectedFriend] = useState(null);

    useEffect(() => {
        const auth = getAuth();
        const currentUser = auth.currentUser;
        setUser(currentUser);

        if (currentUser) {
            const userRef = ref(database, 'users/' + (currentUser.displayName || ''));
            onValue(userRef, (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    setUserInfo({ fullName: data.fullName, username: currentUser.displayName });
                }
            });
        }

        const messagesRef = ref(database, 'messages');
        onValue(messagesRef, (snapshot) => {
            const data = snapshot.val();
            const messagesList = [];
            for (const id in data) {
                messagesList.push({ id, ...data[id] });
            }
            setMessages(messagesList);
        });
    }, []);

    const handleSend = async () => {
        if (message.trim() && user && selectedFriend) {
            const newMessage = {
                text: message,
                userId: user.uid,
                timestamp: Date.now(),
                fullName: userInfo.fullName || 'Unknown',
                username: userInfo.username || 'Anonymous'
            };
            const newMessageRef = ref(database, 'messages/' + Date.now());
            await set(newMessageRef, newMessage);
            setMessage('');
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.sidebar}>
                <FindFriends />
                <FriendRequests />
                <FriendsList setSelectedFriend={setSelectedFriend} />
            </div>
            <div style={styles.chatSection}>
                {selectedFriend ? (
                    <>
                        <div style={styles.chatBox}>
                            {messages.filter(msg => msg.userId === selectedFriend).map(msg => (
                                <div key={msg.id}>
                                    <p>
                                        <strong>{msg.fullName} <span style={{ fontSize: '0.8em' }}>({msg.username})</span></strong>
                                        <br />
                                        {msg.text}
                                    </p>
                                </div>
                            ))}
                        </div>
                        <div style={styles.inputContainer}>
                            <input
                                type="text"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Type a message"
                                style={styles.input}
                            />
                            <button onClick={handleSend} style={styles.button}>Send</button>
                        </div>
                    </>
                ) : (
                    <p>Select a friend to start chatting.</p>
                )}
            </div>
        </div>
    );
};

const styles = {
    container: {
        display: 'flex',
        height: '100vh',
        overflow: 'hidden'
    },
    sidebar: {
        width: '300px',
        borderRight: '1px solid #ccc',
        padding: '10px',
        overflowY: 'auto',
        backgroundColor: '#f4f4f4'
    },
    chatSection: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column'
    },
    chatBox: {
        flex: 1,
        overflowY: 'auto',
        padding: '10px'
    },
    inputContainer: {
        display: 'flex',
        alignItems: 'center',
        padding: '10px',
        borderTop: '1px solid #ccc'
    },
    input: {
        flex: 1,
        padding: '10px',
        marginRight: '10px'
    },
    button: {
        padding: '10px 20px'
    }
};

export default Chat;
