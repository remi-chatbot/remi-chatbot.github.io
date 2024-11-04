// App.tsx
import { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import ConsolePage from './pages/ConsolePage';  // Assuming you have a homepage
import LoginPage from './pages/LoginPage';
import './App.scss';
import { Theme } from './lib/themes';
import apiService from './lib/apiServer';

const generateRandomInt = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);  // Track login status
  const [isLoading, setIsLoading] = useState(false);  // Track loading state
  const isFetchingRef = useRef(false);  // Add this ref

  // Simulate authentication (this would normally come from an authentication service)
  const fetchTheme = async (apiToken: string) => {
    const _themeId = String(generateRandomInt(1, 95)).padStart(3, '0');
    const theme = (await apiService.getTheme(apiToken, _themeId)).theme as Theme;
    localStorage.setItem('theme', JSON.stringify(theme));
    console.log(`## set theme id: ${_themeId}`);
    setIsLoading(false);
    isFetchingRef.current = false;  // Reset the ref when done
  };

  useEffect(() => {
    const loggedIn = localStorage.getItem('isAuthenticated');
    const currentAuthState = loggedIn === 'true';
    
    if (isAuthenticated !== currentAuthState) {
      setIsAuthenticated(currentAuthState);

      if ((isAuthenticated !== currentAuthState) && currentAuthState && !isFetchingRef.current) {
        isFetchingRef.current = true;
        setIsLoading(true);
        console.log('## loading....')
        fetchTheme(localStorage.getItem('api_token') ?? "");
      }
    }
  }, []);

  const handleLogin = async (oai_key: string, img_base_url: string, api_token: string) => {
    // Store credentials
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('oai_key', oai_key);
    localStorage.setItem('imgBaseUrl', img_base_url);
    localStorage.setItem('api_token', api_token);
    setIsAuthenticated(true);
    // Theme will be fetched by useEffect after authentication state changes
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('oai_key');
    localStorage.removeItem('imgBaseUrl');
    localStorage.removeItem('api_token');
    localStorage.removeItem('theme');
    setIsAuthenticated(false);
  };

  return (
    <Router>
      <Routes>
        {/* Redirect / to /chat if authenticated, otherwise to /login */}
        <Route path="/" element={<NavigateTo isAuthenticated={isAuthenticated} />} />

        {/* Redirect /login to /chat if authenticated */}
        <Route path="/login" element={isAuthenticated ? <Navigate to="/chat" /> : <LoginPage onLogin={handleLogin} />} />

        {/* Redirect /chat to /login if not authenticated and not loading */}
        <Route 
          path="/chat" 
          element={
            !isAuthenticated ? (
              <Navigate to="/login" />
            ) : isLoading ? (
              <div className="loading-page">Loading theme...</div>
            ) : (
              <div data-component="App">
                <ConsolePage 
                  onLogout={handleLogout} 
                  apiKey={localStorage.getItem('oai_key') || (prompt('OpenAI API Key') || '')} 
                />
              </div>
            )
          } 
        />
      </Routes>
    </Router>
  );
}

// Component to handle redirect for "/" route
const NavigateTo = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
  const location = useLocation();

  if (location.pathname === "/" || location.pathname === "/chat") {
    return isAuthenticated ? <Navigate to="/chat" /> : <Navigate to="/login" />;
  }

  return null;
};

export default App;
