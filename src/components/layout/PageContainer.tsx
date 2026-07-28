import React, { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
}

export function PageContainer({ children, className = '' }: Props) {
  return (
    <div className={`p-4 max-w-7xl mx-auto w-full ${className}`}>
      {children}
    </div>
  );
}
