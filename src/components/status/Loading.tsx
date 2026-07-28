import React from 'react';
import { Loader2 } from 'lucide-react';

interface Props {
  label?: string;
}

export function Loading({ label = 'Loading...' }: Props) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center h-full">
      <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-4" />
      <p className="text-gray-500 font-medium">{label}</p>
    </div>
  );
}
