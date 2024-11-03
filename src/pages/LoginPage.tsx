// components/LoginPage.tsx
import "../App.scss";
import React, { useState } from 'react';
import apiService from '../lib/apiServer';

interface LoginPageProps {
    onLogin: (vapi_key: string, img_base_url: string, api_token: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
    const [password, setPassword] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        // Add your login logic here (validate credentials)
        const data = await apiService.getTokens(password);
        if (data != undefined) {
            const vapi_key = data.api_key;
            console.log(`get vapi_key: ${vapi_key}`);
            onLogin(vapi_key, data.img_base_url, password);  // Trigger login and update the app state
        } else {
            // Display an error notification using alert
            window.alert('Invalid password. Please try again.');
        }
    };
    return (
        <main className="flex h-screen flex-col">
        <nav className="flex items-center justify-between flex-wrap bg-transparent p-6">
            <div className="flex items-center flex-shrink-0 text-white mr-6">
                {/* <svg className="fill-current h-8 w-8 mr-2" width="54" height="54" viewBox="0 0 54 54" xmlns="http://www.w3.org/2000/svg"><path d="M13.5 22.1c1.8-7.2 6.3-10.8 13.5-10.8 10.8 0 12.15 8.1 17.55 9.45 3.6.9 6.75-.45 9.45-4.05-1.8 7.2-6.3 10.8-13.5 10.8-10.8 0-12.15-8.1-17.55-9.45-3.6-.9-6.75.45-9.45 4.05zM0 38.3c1.8-7.2 6.3-10.8 13.5-10.8 10.8 0 12.15 8.1 17.55 9.45 3.6.9 6.75-.45 9.45-4.05-1.8 7.2-6.3 10.8-13.5 10.8-10.8 0-12.15-8.1-17.55-9.45-3.6-.9-6.75.45-9.45 4.05z" /></svg> */}
                <span className="font-semibold text-2xl tracking-tight">A-CONECT</span>
            </div>
            <div className="block lg:hidden">
                <button className="flex items-center px-3 py-2 border rounded text-teal-200 border-teal-400 hover:text-white hover:border-white">
                    <svg className="fill-current h-3 w-3" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><title>Menu</title><path d="M0 3h20v2H0V3zm0 6h20v2H0V9zm0 6h20v2H0v-2z" /></svg>
                </button>
            </div>
            <div className="w-full block flex-grow lg:flex lg:items-center lg:w-auto">
                <div className="text-lg lg:flex-grow">
                    <a href="project" className="block mt-4 lg:inline-block lg:mt-0 text-white hover:bg-white hover:bg-opacity-30 hover:text-white px-2 py-1 rounded mr-4">
                        Research
                    </a>
                </div>
                <div>
                    <a href="https://www.surveymonkey.com/r/VNKG3NS" className="inline-block text-lg px-4 py-2 leading-none border rounded text-white border-white hover:border-transparent hover:text-teal-500 hover:bg-white mt-4 lg:mt-0">Feedback</a>
                </div>
            </div>
        </nav>

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
                <button type="submit" className="w-full md:w-1/3 px-3 mb-6 md:mb-0 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" >Login</button>
            </form>
        </div>
        </main>
    );
};

export default LoginPage;

