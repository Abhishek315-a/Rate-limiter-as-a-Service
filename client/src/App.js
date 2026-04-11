import React from 'react';
import { BrowserRouter, Switch, Route, Redirect } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './pages/DashboardLayout';

function PrivateRoute({ children, ...rest }) {
  const { user } = useAuth();
  return (
    <Route {...rest} render={() => (user ? children : <Redirect to="/login" />)} />
  );
}

function PublicRoute({ children, ...rest }) {
  const { user } = useAuth();
  return (
    <Route {...rest} render={() => (!user ? children : <Redirect to="/" />)} />
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Switch>
          <PublicRoute path="/login">
            <LoginPage />
          </PublicRoute>
          <PrivateRoute path="/">
            <DashboardLayout />
          </PrivateRoute>
        </Switch>
      </BrowserRouter>
    </AuthProvider>
  );
}
