import React from 'react';
import AuthPage from './AuthPage';

export default function Signup({ onSignupSuccess }) {
  return <AuthPage defaultTab="signup" onLoginSuccess={onSignupSuccess} />;
}
