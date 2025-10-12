// Import React Query utilities for data fetching and caching
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Import React Router components for client-side routing
import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
} from 'react-router-dom';

// Import Wagmi (Web3 hooks library) for Ethereum wallet and blockchain connection
import { useAccount, WagmiProvider } from 'wagmi';

// Import custom ErrorBoundary component to catch rendering errors
import ErrorBoundary from './components/UI/ErrorBoundary';

// Import Wagmi configuration (networks, connectors, etc.)
import config from './config/wagmi';

// Import all application pages
import CreateEvent from './pages/CreateEvent';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import MintBadge from './pages/MintBadge';
import VerifyBadge from './pages/VerifyBadge';

// Import the BackToTop component (scroll-to-top button)
import BackToTop from './components/Layout/BackToTop';

// Initialize a new QueryClient instance for React Query
const queryClient = new QueryClient();

/**
 * AppContent
 * ----------
 * This component contains all the routes and UI logic that depend on
 * the user's wallet connection status (isConnected).
 */
function AppContent() {
  const { isConnected } = useAccount(); // Check if the user is connected to a wallet

  return (
    <Router>
      {/* Global BackToTop button visible on all pages */}
      <BackToTop showAt={200} />

      <Routes>
        {/* Redirect to dashboard if connected, otherwise show the Login page */}
        <Route
          path="/"
          element={
            isConnected ? <Navigate to="/dashboard" replace /> : <Login />
          }
        />

        {/* Dashboard page — accessible only if connected */}
        <Route
          path="/dashboard"
          element={isConnected ? <Dashboard /> : <Navigate to="/" replace />}
        />

        {/* Create Event page — accessible only if connected */}
        <Route
          path="/create-event"
          element={isConnected ? <CreateEvent /> : <Navigate to="/" replace />}
        />

        {/* Mint Badge page — accessible only if connected */}
        <Route
          path="/mint"
          element={isConnected ? <MintBadge /> : <Navigate to="/" replace />}
        />

        {/* Verify Badge page — accessible only if connected */}
        <Route
          path="/verify"
          element={isConnected ? <VerifyBadge /> : <Navigate to="/" replace />}
        />

        {/* Fallback route — redirects any unknown path */}
        <Route
          path="*"
          element={<Navigate to={isConnected ? '/dashboard' : '/'} replace />}
        />
      </Routes>
    </Router>
  );
}

/**
 * App
 * ----
 * Main application wrapper:
 * - Provides error boundaries
 * - Configures Web3 (WagmiProvider)
 * - Sets up React Query client
 * - Loads all routes via AppContent
 */
function App() {
  return (
    <ErrorBoundary>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <AppContent />
        </QueryClientProvider>
      </WagmiProvider>
    </ErrorBoundary>
  );
}

export default App;
