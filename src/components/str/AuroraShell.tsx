import React from 'react';
import { cn } from '@/lib/utils';

/** Animated cosmic backdrop for auth, loading, and full-screen shells */
export const AuroraShell: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <div className={cn('str-aurora-shell min-h-screen w-full relative overflow-hidden', className)}>
    <div className="str-aurora-orb str-aurora-orb--1" aria-hidden />
    <div className="str-aurora-orb str-aurora-orb--2" aria-hidden />
    <div className="str-aurora-orb str-aurora-orb--3" aria-hidden />
    <div className="str-aurora-grid" aria-hidden />
    <div className="str-aurora-noise" aria-hidden />
    <div className="relative z-10">{children}</div>
  </div>
);

/** Glass panel for login / setup forms */
export const AuroraAuthCard: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <div className={cn('str-auth-card', className)}>{children}</div>
);
