import React from 'react';
import AuthPage from './AuthPage';

export default function Login({ onLoginSuccess }) {
  return <AuthPage defaultTab="login" onLoginSuccess={onLoginSuccess} />;
}
