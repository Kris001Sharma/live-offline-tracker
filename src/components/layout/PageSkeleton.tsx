import React, { ReactNode } from 'react';
import { PageContainer } from './PageContainer';

interface PageSkeletonProps {
  title: string;
  subtitle?: string;
  primaryContent: ReactNode;
  secondaryContent?: ReactNode;
  bottomActionArea?: ReactNode;
  className?: string;
}

export function PageSkeleton({
  title,
  subtitle,
  primaryContent,
  secondaryContent,
  bottomActionArea,
  className = ''
}: PageSkeletonProps) {
  return (
    <PageContainer className={`flex flex-col min-h-full ${className}`}>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </header>

      <div className="flex-1 flex flex-col space-y-6">
        <section className="w-full">
          {primaryContent}
        </section>

        {secondaryContent && (
          <section className="w-full">
            {secondaryContent}
          </section>
        )}
      </div>

      {bottomActionArea && (
        <div className="mt-8 sticky bottom-4 z-10 w-full">
          {bottomActionArea}
        </div>
      )}
    </PageContainer>
  );
}
