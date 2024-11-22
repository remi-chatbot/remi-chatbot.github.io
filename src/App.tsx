// App.tsx
import { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import ConsolePage from './pages/ConsolePage';  // Assuming you have a homepage
import LoginPage from './pages/LoginPage';
import './App.scss';
import apiService from './lib/apiServer';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './config/firebase';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);  // Track login status
  const [isLoading, setIsLoading] = useState(false);  // Track loading state
  const hasLoadedRef = useRef(false);  // Add this ref
  const [firebaseUser, setFirebaseUser] = useState<any>(null);

  // Simulate authentication (this would normally come from an authentication service)
  const loadClient = async (apiToken: string) => {
    hasLoadedRef.current = true;
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setFirebaseUser(user);
        // You might want to automatically fetch tokens here
        if (!isAuthenticated) {
          loadClient(user.uid);
        }
      } else {
        setFirebaseUser(null);
        setIsAuthenticated(false);
      }
    });

    return () => unsubscribe();
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

  const handleLogout = async () => {
    try {
      await auth.signOut();
      localStorage.clear();
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
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
              <div className="loading-page">Loading...</div>
            ) : (
              <div data-component="App">
                <ConsolePage 
                  onLogout={handleLogout} 
                  apiKey={localStorage.getItem('acnt::oai_key') || (prompt('OpenAI API Key') || '')}
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
