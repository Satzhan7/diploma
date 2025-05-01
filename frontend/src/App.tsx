import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import DashboardLayout from './components/DashboardLayout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import Landing from './pages/Landing';
import { BrandDashboard } from './pages/brand/Dashboard';
import { InfluencerDashboard } from './pages/influencer/Dashboard';
import { Orders as InfluencerOrders } from './pages/influencer/Orders';
import { CreateOrder } from './pages/brand/CreateOrder';
import BrandOrders from './pages/brand/Orders';
import { MyApplications } from './pages/influencer/MyApplications';
import { Profile } from './pages/Profile';
import { EditProfile } from './pages/EditProfile';
import { InfluencerList } from './pages/brand/InfluencerList';
import BrandList from './pages/influencer/BrandList';
import BrandRecommendations from './pages/influencer/BrandRecommendations';
import { Messages } from './pages/Messages';
import { Settings } from './pages/Settings';
import { Collaborations } from './pages/Collaborations';
import theme from './theme';
import { UserRole } from './types/user';

const queryClient = new QueryClient();

interface ProtectedRouteProps {
  children: React.ReactElement;
  roles?: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, roles }) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to={user.role === UserRole.BRAND ? "/brand/dashboard" : "/influencer/dashboard"} replace />;
  }

  return children;
};

function App() {
  return (
    <ChakraProvider theme={theme}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
            <AppRoutes />
          </Router>
        </AuthProvider>
      </QueryClientProvider>
    </ChakraProvider>
  );
}

function AppRoutes() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>App Loading...</div>;
  }

  return (
    <Routes>
      <Route 
        path="/" 
        element={!isAuthenticated ? <Landing /> : <Navigate to={user?.role === UserRole.BRAND ? '/brand/dashboard' : '/influencer/dashboard'} replace />} 
      />
      <Route 
        path="/login" 
        element={!isAuthenticated ? <Login /> : <Navigate to="/" replace />} 
      />
      <Route 
        path="/register" 
        element={!isAuthenticated ? <Register /> : <Navigate to="/" replace />} 
      />

      <Route
        path="/brand/*"
        element={
          <ProtectedRoute roles={[UserRole.BRAND]}>
            <DashboardLayout role={user?.role}>
              <Routes>
                <Route path="dashboard" element={<BrandDashboard />} />
                <Route path="orders" element={<BrandOrders />} />
                <Route path="orders/create" element={<CreateOrder />} />
                <Route path="influencers" element={<InfluencerList />} />
                <Route path="messages" element={<Messages />} />
                <Route path="collaborations" element={<Collaborations />} />
                <Route path="profile/:userId" element={<Profile />} />
                <Route path="profile/edit" element={<EditProfile />} />
                <Route path="settings" element={<Settings />} />
                <Route path="/" element={<Navigate to="dashboard" replace />} /> 
              </Routes>
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/influencer/*"
        element={
          <ProtectedRoute roles={[UserRole.INFLUENCER]}>
            <DashboardLayout role={user?.role}>
              <Routes>
                <Route path="dashboard" element={<InfluencerDashboard />} />
                <Route path="orders" element={<InfluencerOrders />} />
                <Route path="applications" element={<MyApplications />} />
                <Route path="brands" element={<BrandList />} />
                <Route path="recommendations" 
                  element={user?.id ? <BrandRecommendations influencerId={user.id} /> : <div>Loading User...</div>}
                /> 
                <Route path="messages" element={<Messages />} />
                <Route path="collaborations" element={<Collaborations />} />
                <Route path="profile/:userId" element={<Profile />} />
                <Route path="profile/edit" element={<EditProfile />} />
                <Route path="settings" element={<Settings />} />
                <Route path="/" element={<Navigate to="dashboard" replace />} /> 
              </Routes>
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      
      <Route path="*" element={<div>404 Not Found</div>} />

    </Routes>
  );
}

export default App;
