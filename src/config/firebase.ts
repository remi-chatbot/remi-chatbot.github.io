import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyBoW8AOs7lG8E9gbSQldPp-9wsFhBqwJQs",
    authDomain: "remi-e0b0f.firebaseapp.com",
    projectId: "remi-e0b0f",
    storageBucket: "remi-e0b0f.firebasestorage.app",
    messagingSenderId: "172874904191",
    appId: "1:172874904191:web:8210a34a23fa292ab2054a",
    measurementId: "G-DJE9ZCNP38"
  };
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app); 