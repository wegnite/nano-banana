/**
 * Character Figure Loading States Component
 * 
 * Problem: Users need visual feedback during loading and generation
 * Solution: Skeleton screens and animated loading states
 */

'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { Loader2, Sparkles, ImageOff } from 'lucide-react';

export function GeneratorSkeleton() {
  return (
    <div className="grid lg:grid-cols-2 gap-8">
      {/* Left Panel Skeleton */}
      <div className="space-y-6">
        <Card className="p-6">
          <Skeleton className="h-8 w-40 mb-4" />
          <Skeleton className="h-64 w-full" />
          <div className="mt-4 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-20 w-full" />
          </div>
        </Card>
        
        <Card className="p-6">
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="grid grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </Card>
      </div>
      
      {/* Right Panel Skeleton */}
      <Card className="p-6 min-h-[600px]">
        <Skeleton className="h-8 w-40 mb-4" />
        <Skeleton className="h-96 w-full" />
      </Card>
    </div>
  );
}

export function GallerySkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <Skeleton className="aspect-square w-full" />
          <div className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <Skeleton className="w-8 h-8 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
            <div className="flex gap-4 mt-3">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-12" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

interface GeneratingStateProps {
  progress?: number;
  message?: string;
}

export function GeneratingState({ progress = 0, message = 'Generating your character figure...' }: GeneratingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <div className="relative">
        {/* Animated background circle */}
        <div className="absolute inset-0 w-32 h-32 bg-gradient-to-r from-orange-400 to-yellow-400 rounded-full blur-3xl animate-pulse" />
        
        {/* Main loader */}
        <div className="relative w-32 h-32 flex items-center justify-center">
          <Loader2 className="w-16 h-16 text-orange-500 animate-spin" />
          <Sparkles className="absolute w-8 h-8 text-yellow-500 animate-pulse" />
        </div>
      </div>
      
      {/* Progress bar */}
      {progress > 0 && (
        <div className="w-full max-w-xs mt-8">
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-orange-500 to-yellow-500 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-2">
            {progress}% Complete
          </p>
        </div>
      )}
      
      {/* Message */}
      <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mt-6 text-center">
        {message}
      </p>
      
      {/* Tips */}
      <div className="mt-8 text-sm text-gray-500 dark:text-gray-400 text-center max-w-md">
        <p className="mb-2">💡 Tip: High-quality generations typically take 10-15 seconds</p>
        <p>Your image will appear automatically when ready</p>
      </div>
    </div>
  );
}

interface ErrorStateProps {
  error: string;
  onRetry?: () => void;
}

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6">
        <svg 
          className="w-10 h-10 text-red-500" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
          />
        </svg>
      </div>
      
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        Generation Failed
      </h3>
      
      <p className="text-gray-600 dark:text-gray-400 text-center max-w-md mb-6">
        {error || 'Something went wrong while generating your character figure. Please try again.'}
      </p>
      
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ message = 'No results found' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
        <ImageOff className="w-12 h-12 text-gray-400" />
      </div>
      <p className="text-lg text-gray-600 dark:text-gray-400">{message}</p>
    </div>
  );
}