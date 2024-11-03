// App.tsx
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import ConsolePage from './pages/ConsolePage';  // Assuming you have a homepage
import LoginPage from './pages/LoginPage';
import './App.scss';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);  // Track login status

  // Simulate authentication (this would normally come from an authentication service)
  useEffect(() => {
    const loggedIn = localStorage.getItem('isAuthenticated');
    setIsAuthenticated(loggedIn === 'true');
  }, []);

  const handleLogin = (vapi_key: string, img_base_url: string, api_token: string) => {
    // On login, set the authenticated state and store it
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('vapiKey', vapi_key);
    localStorage.setItem('imgBaseUrl', img_base_url);
    localStorage.setItem('api_token', api_token);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('vapiKey');
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

        {/* Redirect /chat to /login if not authenticated */}
        <Route path="/chat" element={isAuthenticated ? <div data-component="App"> <ConsolePage onLogout={handleLogout} /> </div> : <Navigate to="/login" />} />
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
