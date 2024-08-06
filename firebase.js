//firebase.js
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCw-xqMEcBaLOXgcMz8tJzUrzqlaATSt7Q",
  authDomain: "instachat-2e1f7.firebaseapp.com",
  databaseURL: "https://instachat-2e1f7-default-rtdb.firebaseio.com",
  projectId: "instachat-2e1f7",
  storageBucket: "instachat-2e1f7.appspot.com",
  messagingSenderId: "233532080921",
  appId: "1:233532080921:web:e60aba24a5201888813b88"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

export { database, auth };
