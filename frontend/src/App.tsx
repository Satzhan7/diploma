import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ChakraProvider, Center, Spinner, VStack, Text } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AppShell from './components/AppShell';
import theme from './theme';
import { UserRole } from './types/user';

// One chunk per page; the shell and the auth flow stay in the main bundle.
const page = <K extends string>(load: () => Promise<Record<K, React.ComponentType<any>>>, name: K) =>
  lazy(() => load().then((m) => ({ default: m[name] })));

const Landing = page(() => import('./pages/Landing'), 'default');
const Auth = page(() => import('./pages/Auth'), 'Auth');
const BrandDashboard = page(() => import('./pages/brand/Dashboard'), 'BrandDashboard');
const InfluencerDashboard = page(() => import('./pages/influencer/Dashboard'), 'InfluencerDashboard');
const Feed = page(() => import('./pages/influencer/Feed'), 'Feed');
const Apply = page(() => import('./pages/influencer/Apply'), 'Apply');
const Briefs = page(() => import('./pages/brand/Briefs'), 'Briefs');
const BriefWizard = page(() => import('./pages/brand/BriefWizard'), 'BriefWizard');
const Applicants = page(() => import('./pages/brand/Applicants'), 'Applicants');
const LatestApplicants = page(() => import('./pages/brand/Applicants'), 'LatestApplicants');
const MyApplications = page(() => import('./pages/influencer/MyApplications'), 'MyApplications');
const Profile = page(() => import('./pages/Profile'), 'Profile');
const EditProfile = page(() => import('./pages/EditProfile'), 'EditProfile');
const Messages = page(() => import('./pages/Messages'), 'Messages');
const Settings = page(() => import('./pages/Settings'), 'Settings');
const Deals = page(() => import('./pages/Deals'), 'Deals');
const Deal = page(() => import('./pages/Deal'), 'Deal');
const NotFound = page(() => import('./pages/NotFound'), 'NotFound');

/** Where each role lands after login. */
const homeFor = (role?: UserRole) => (role === UserRole.BRAND ? '/brand/dashboard' : '/influencer/briefs');

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
    },
  },
});

const FullScreenLoader: React.FC<{ minH?: string }> = ({ minH = '100vh' }) => {
  const { t } = useTranslation();
  return (
    <Center minH={minH}>
      <VStack spacing={4}>
        <Spinner size="lg" color="primary" thickness="3px" />
        <Text color="fg.muted" fontSize="sm">
          {t('common:state.loading')}
        </Text>
      </VStack>
    </Center>
  );
};

interface ProtectedRouteProps {
  children: React.ReactElement;
  roles?: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, roles }) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return <FullScreenLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to={homeFor(user.role)} replace />;
  }

  return children;
};

function App() {
  return (
    <ChakraProvider theme={theme}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
            <Suspense fallback={<FullScreenLoader />}>
              <AppRoutes />
            </Suspense>
          </Router>
        </AuthProvider>
      </QueryClientProvider>
    </ChakraProvider>
  );
}

function AppRoutes() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <FullScreenLoader />;
  }

  const shell = (role: UserRole, routes: React.ReactNode) => (
    <ProtectedRoute roles={[role]}>
      <AppShell role={user?.role}>
        <Suspense fallback={<FullScreenLoader minH="60vh" />}>
          <Routes>
            {routes}
            <Route path="messages" element={<Messages />} />
            <Route path="deals" element={<Deals />} />
            <Route path="deals/:dealId" element={<Deal />} />
            <Route path="profile/:userId" element={<Profile isViewMode={true} />} />
            <Route path="profile" element={<Profile />} />
            <Route path="profile/edit" element={<EditProfile />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </AppShell>
    </ProtectedRoute>
  );

  return (
    <Routes>
      <Route path="/" element={!isAuthenticated ? <Landing /> : <Navigate to={homeFor(user?.role)} replace />} />
      <Route path="/login" element={!isAuthenticated ? <Auth mode="login" /> : <Navigate to="/" replace />} />
      <Route path="/register" element={!isAuthenticated ? <Auth mode="register" /> : <Navigate to="/" replace />} />

      <Route
        path="/brand/*"
        element={shell(
          UserRole.BRAND,
          <>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<BrandDashboard />} />
            <Route path="briefs" element={<Briefs />} />
            <Route path="briefs/new" element={<BriefWizard />} />
            <Route path="briefs/:id/edit" element={<BriefWizard />} />
            <Route path="briefs/:id/applicants" element={<Applicants />} />
            <Route path="applicants" element={<LatestApplicants />} />
          </>,
        )}
      />

      <Route
        path="/influencer/*"
        element={shell(
          UserRole.INFLUENCER,
          <>
            <Route index element={<Navigate to="briefs" replace />} />
            <Route path="dashboard" element={<InfluencerDashboard />} />
            <Route path="briefs" element={<Feed />} />
            <Route path="briefs/:id" element={<Apply />} />
            <Route path="applications" element={<MyApplications />} />
          </>,
        )}
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
