import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ChakraProvider, Box } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrandDashboard } from './pages/brand/Dashboard';
import { InfluencerDashboard } from './pages/influencer/Dashboard';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { NotFound } from './pages/NotFound';
import { Orders } from './pages/influencer/Orders';
import { CreateOrder } from './pages/brand/CreateOrder';
import { Profile } from './pages/Profile';
import { Home } from './pages/Home';
import { Header } from './components/Header';
import { useAuth } from './contexts/AuthContext';
import theme from './theme';

// Create a client for React Query
const queryClient = new QueryClient();

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles: string[] }> = ({
  children,
  allowedRoles,
}) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={`/dashboard/${user.role}`} />;
  }

  return <>{children}</>;
};

// Layout Component
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Box>
      <Header />
      <Box pt="16">{children}</Box>
    </Box>
  );
};

function App() {
  return (
    <ChakraProvider theme={theme}>
      <QueryClientProvider client={queryClient}>
        <Router>
          <Layout>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected Routes */}
              <Route
                path="/profile"
                element={
                  <ProtectedRoute allowedRoles={['brand', 'influencer']}>
                    <Profile />
                  </ProtectedRoute>
                }
              />

              {/* Protected Brand Routes */}
              <Route
                path="/dashboard/brand"
                element={
                  <ProtectedRoute allowedRoles={['brand']}>
                    <BrandDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/brand/create-order"
                element={
                  <ProtectedRoute allowedRoles={['brand']}>
                    <CreateOrder />
                  </ProtectedRoute>
                }
              />

              {/* Protected Influencer Routes */}
              <Route
                path="/dashboard/influencer"
                element={
                  <ProtectedRoute allowedRoles={['influencer']}>
                    <InfluencerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/influencer/orders"
                element={
                  <ProtectedRoute allowedRoles={['influencer']}>
                    <Orders />
                  </ProtectedRoute>
                }
              />

              {/* 404 Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </Router>
      </QueryClientProvider>
    </ChakraProvider>
  );
}

export default App;
