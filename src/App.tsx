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
  const hasLoadedRef = useRef(false);  // Add this ref

  // Simulate authentication (this would normally come from an authentication service)
  const loadClient = async (apiToken: string) => {
    hasLoadedRef.current = true;
    const _themeId = String(generateRandomInt(1, 95)).padStart(3, '0'); // random theme
    const theme = (await apiService.getTheme(apiToken, _themeId)).theme as Theme;
    localStorage.setItem('acnt::theme', JSON.stringify(theme));
    console.log(`## set theme id: ${_themeId}`);
    setIsLoading(false);
  };

  useEffect(() => {
    const loggedIn = localStorage.getItem('acnt::isAuthenticated');
    const currentAuthState = loggedIn === 'true';
    
    if (isAuthenticated !== currentAuthState) {
      setIsAuthenticated(currentAuthState);

      if ((isAuthenticated !== currentAuthState) && currentAuthState && !hasLoadedRef.current) {
        // hasLoadedRef.current = true;
        setIsLoading(true);
        console.log('## loading....')
        loadClient(localStorage.getItem('acnt::api_token') ?? "");
      }
    }
  }, []);

  const handleLogin = async (oai_key: string, img_base_url: string, api_token: string) => {
    // Store credentials
    localStorage.setItem('acnt::isAuthenticated', 'true');
    localStorage.setItem('acnt::oai_key', oai_key);
    localStorage.setItem('acnt::imgBaseUrl', img_base_url);
    localStorage.setItem('acnt::api_token', api_token);
    // Theme will be fetched by useEffect after authentication state changes
    await loadClient(api_token);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.clear();
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
                  apiKey={localStorage.getItem('acnt::oai_key') || (prompt('OpenAI API Key') || '')}
                  theme={JSON.parse(localStorage.getItem('acnt::theme') ?? "")} 
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
