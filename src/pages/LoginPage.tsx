// components/LoginPage.tsx
import "../App.scss";
import { X, LogIn, Zap, ArrowUp, ArrowDown } from 'react-feather';
import { Button } from '../components/button/Button';
import React, { useState } from 'react';
import apiService from '../lib/apiServer';

interface LoginPageProps {
    onLogin: (oai_key: string, img_base_url: string, api_token: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
    const [password, setPassword] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        // Add your login logic here (validate credentials)
        const data = await apiService.getTokens(password);
        if (data != undefined) {
            const oai_key = data.api_key;
            console.log(`get oai_key: ${oai_key.slice(0, 6)}...`);
            onLogin(oai_key, data.img_base_url, password);  // Trigger login and update the app state
        } else {
            // Display an error notification using alert
            console.log('ERROR: Invalid password. Please try again.');
            window.alert('Invalid password. Please try again.');
        }
    };
    return (
        // <main className="flex h-screen flex-col">
        <div data-component="ConsolePage">
        <div className="content-top">
            <div className="content-title">
                <img src="/openai-logomark.svg" />
                <span>A-CONECT</span>
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
            <form className="px-8 pt-6 pb-8 mb-4" onSubmit={handleLogin}>
                {/* <div> */}
                <label className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2">
                Auth Token:
                </label>
                <input 
                    className="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white focus:border-gray-500" 
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                />
                <div className="text-gray-600 text-xs italic w-full">Request a key by emailing to the project administrator (<a href="mailto:jyhong@utexas.edu">Junyuan Hong</a>).</div>
                {/* </div> */}
                {/* <button type="submit" className="w-full md:w-1/3 px-3 mb-6 md:mb-0 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" >Login</button> */}
                <Button
                    label={'Login'}
                    iconPosition={'end'}
                    icon={LogIn}
                    buttonStyle={'regular'}
                    // onClick={
                    //     isConnected ? disconnectConversation : connectConversation
                    // }
                />
            </form>
        </div>
        {/* </main> */}
        </div>
    );
};

export default LoginPage;

