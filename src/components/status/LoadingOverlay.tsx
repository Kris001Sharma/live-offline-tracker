import React from 'react';
import { Loading } from './Loading';

interface LoadingOverlayProps {
  label?: string;
}

export function LoadingOverlay({ label = 'Loading...' }: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
      <Loading label={label} />
    </div>
  );
}
