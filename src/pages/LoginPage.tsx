// components/LoginPage.tsx
import "../App.scss";
import { X, LogIn, Zap, ArrowUp, ArrowDown } from 'react-feather';
import { Button } from '../components/button/Button';
import React, { useState } from 'react';
import apiService from '../lib/apiServer';
import { auth } from '../config/firebase';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup
} from 'firebase/auth';

interface LoginPageProps {
    onLogin: (oai_key: string, img_base_url: string, api_token: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [showApiKeyInput, setShowApiKeyInput] = useState(false);

    const handleGoogleSignIn = async () => {
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            setShowApiKeyInput(true); // Show API key input after successful Firebase auth
        } catch (error: any) {
            setError(error.message);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        try {
            let userCredential;
            if (isSignUp) {
                userCredential = await createUserWithEmailAndPassword(auth, email, password);
            } else {
                userCredential = await signInWithEmailAndPassword(auth, email, password);
            }
            setShowApiKeyInput(true); // Show API key input after successful Firebase auth
        } catch (error: any) {
            setError(error.message);
        }
    };

    const handleApiKeySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const user = auth.currentUser;
            if (!user) {
                setError('Please login first');
                return;
            }

            // Verify API key
            const data = await apiService.getTokens(apiKey);
            if (data) {
                onLogin(data.api_key, data.img_base_url, user.uid);
            } else {
                setError('Invalid API key');
            }
        } catch (error: any) {
            setError(error.message);
        }
    };

    if (showApiKeyInput) {
        return (
            <div className="inset-0 flex justify-center items-center p-4 bg-white/30 backdrop-blur-md">
                <form className="px-8 pt-6 pb-8 mb-4" onSubmit={handleApiKeySubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            Enter your Remi Access Key
                        </label>
                        <input
                            className="appearance-none block w-full bg-gray-200 text-gray-700 border rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white"
                            type="text"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            required
                        />
                    </div>

                    {error && (
                        <div className="mb-4 text-red-500 text-sm">
                            {error}
                        </div>
                    )}

                    <Button
                        label="Submit API Key"
                        iconPosition={'end'}
                        icon={LogIn}
                        buttonStyle={'regular'}
                        type="submit"
                    />
                </form>
            </div>
        );
    }

    return (
        <div data-component="ConsolePage">
            <div className="content-top">
                <div className="content-title">
                    <img src="/openai-logomark.svg" />
                    <span>Remi</span>
                </div>
                <div className="content-api-key">
                    <a href="project" className="block mt-4 lg:inline-block lg:mt-0 text-black hover:bg-black hover:text-white px-2 py-1 rounded mr-4">
                        Research
                    </a>
                </div>
                <div className="content-api-key">
                    <a href="https://www.surveymonkey.com/r/VNKG3NS" className="block mt-4 lg:inline-block lg:mt-0 text-black hover:bg-black hover:text-white px-2 py-1 rounded mr-4">
                        Feedback
                    </a>
                </div>
            </div>

            <div className="inset-0 flex justify-center items-center p-4 bg-white/30 backdrop-blur-md">
                <form className="px-8 pt-6 pb-8 mb-4" onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            Email
                        </label>
                        <input
                            className="appearance-none block w-full bg-gray-200 text-gray-700 border rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            Password
                        </label>
                        <input
                            className="appearance-none block w-full bg-gray-200 text-gray-700 border rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {error && (
                        <div className="mb-4 text-red-500 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="flex flex-col gap-4">
                        <Button
                            label={isSignUp ? 'Sign Up' : 'Login'}
                            iconPosition={'end'}
                            icon={LogIn}
                            buttonStyle={'regular'}
                            type="submit"
                        />

                        <Button
                            label="Sign in with Google"
                            buttonStyle={'regular'}
                            onClick={handleGoogleSignIn}
                            type="button"
                        />

                        <button
                            type="button"
                            className="text-sm text-gray-600 hover:text-gray-800"
                            onClick={() => setIsSignUp(!isSignUp)}
                        >
                            {isSignUp ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;

