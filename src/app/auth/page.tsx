
'use client';

import { useState } from 'react';
import { Logo } from '@/components/icons';
import { LoginForm } from '@/components/login-form';
import { SignUpForm } from '@/components/signup-form';
import { ForgotPasswordForm } from '@/components/forgot-password-form';
import Image from 'next/image';


type AuthScreen = 'login' | 'signup' | 'forgot-password';

export default function AuthPage() {
  const [screen, setScreen] = useState<AuthScreen>('login');

  const handleSetScreen = (newScreen: AuthScreen) => {
    setScreen(newScreen);
  };
  
  const renderScreen = () => {
    switch (screen) {
      case 'signup':
        return <SignUpForm onSwitchToLogin={() => handleSetScreen('login')} />;
      case 'forgot-password':
        return <ForgotPasswordForm onSwitchToLogin={() => handleSetScreen('login')} />;
      case 'login':
      default:
        return (
          <LoginForm
            onSwitchToSignUp={() => handleSetScreen('signup')}
            onSwitchToForgotPassword={() => handleSetScreen('forgot-password')}
          />
        );
    }
  };


  return (
    <div className="flex min-h-screen w-full bg-background">
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center bg-secondary relative">
        <div className="absolute inset-0">
          <Image
            src="https://picsum.photos/seed/mediguide-auth/1200/1800"
            alt="Abstract medical background"
            fill
            className="object-cover"
            data-ai-hint="medical abstract"
          />
          <div className="absolute inset-0 bg-primary/80 mix-blend-multiply" />
        </div>
        <div className="relative z-10 flex flex-col items-center text-center p-8 text-primary-foreground">
          <div className="flex items-center gap-4 mb-4">
             <Logo className="h-16 w-16" />
             <h1 className="font-headline text-5xl font-bold">MediGuide</h1>
          </div>
          <p className="mt-4 text-xl max-w-md">
            Your trusted AI-powered guide for medicine awareness and recommendations.
          </p>
        </div>
      </div>
      <div className="flex w-full lg:w-1/2 items-center justify-center p-4">
        <div className="w-full max-w-sm">
          {renderScreen()}
        </div>
      </div>
    </div>
  );
}
