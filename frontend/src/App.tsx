import React, { ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ChakraProvider, Box } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrandDashboard } from './pages/brand/Dashboard';
import { InfluencerDashboard } from './pages/influencer/Dashboard';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { NotFound } from './pages/NotFound';
import { Orders as InfluencerOrders } from './pages/influencer/Orders';
import { CreateOrder } from './pages/brand/CreateOrder';
import { Orders as BrandOrders } from './pages/brand/Orders';
import { MyApplications } from './pages/influencer/MyApplications';
import { Profile } from './pages/Profile';
import { EditProfile } from './pages/EditProfile';
import { Home } from './pages/Home';
import { useAuth } from './contexts/AuthContext';
import { InfluencerList } from './pages/brand/InfluencerList';
import { Messages } from './pages/Messages';
import { Collaborations } from './pages/Collaborations';
import { Settings } from './pages/Settings';
import BrandList from './pages/influencer/BrandList';
import BrandRecommendations from './pages/influencer/BrandRecommendations';
import DashboardLayout from './components/DashboardLayout';
import theme from './theme';
import { UserRole } from './types/user';

// Create a client for React Query
const queryClient = new QueryClient();

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <DashboardLayout role={user.role as UserRole}>{children}</DashboardLayout>; 
};

// Layout Component for public pages
const PublicLayout: React.FC = () => {
  return <Box><Outlet /></Box>;
};

function App() {
  return (
    <ChakraProvider theme={theme}>
      <QueryClientProvider client={queryClient}>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>

            {/* Protected Routes */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile/edit"
              element={
                <ProtectedRoute>
                  <EditProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile/user/:userId"
              element={
                <ProtectedRoute>
                  <Profile isViewMode={true} />
                </ProtectedRoute>
              }
            />

            {/* Protected Brand Routes */}
            <Route
              path="/dashboard/brand"
              element={
                <ProtectedRoute>
                  <BrandDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/brand/create-order"
              element={
                <ProtectedRoute>
                  <CreateOrder />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/brand/edit-order/:orderId"
              element={
                <ProtectedRoute>
                  <CreateOrder isEditMode={true} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/brand/orders"
              element={
                <ProtectedRoute>
                  <BrandOrders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/brand/influencers"
              element={
                <ProtectedRoute>
                  <InfluencerList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/brand/messages"
              element={
                <ProtectedRoute>
                  <Messages />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/brand/collaborations"
              element={
                <ProtectedRoute>
                  <Collaborations />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/brand/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />

            {/* Protected Influencer Routes */}
            <Route
              path="/dashboard/influencer"
              element={
                <ProtectedRoute>
                  <InfluencerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/influencer/orders"
              element={
                <ProtectedRoute>
                  <InfluencerOrders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/influencer/applications"
              element={
                <ProtectedRoute>
                  <MyApplications />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/influencer/brands"
              element={
                <ProtectedRoute>
                  <BrandList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/influencer/recommendations"
              element={
                <ProtectedRoute>
                  <BrandRecommendations />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/influencer/messages"
              element={
                <ProtectedRoute>
                  <Messages />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/influencer/collaborations"
              element={
                <ProtectedRoute>
                  <Collaborations />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/influencer/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />

            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </QueryClientProvider>
    </ChakraProvider>
  );
}

export default App;
