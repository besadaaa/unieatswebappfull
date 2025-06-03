import React, { memo } from 'react'

interface OptimizedLoadingProps {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'spinner' | 'dots' | 'pulse'
  className?: string
}

const OptimizedLoading = memo<OptimizedLoadingProps>(({ 
  size = 'md', 
  variant = 'spinner',
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8', 
    lg: 'w-12 h-12'
  }

  if (variant === 'spinner') {
    return (
      <div className={`${sizeClasses[size]} ${className}`}>
        <div className="animate-spin rounded-full border-2 border-gray-300 border-t-orange-500"></div>
      </div>
    )
  }

  if (variant === 'dots') {
    return (
      <div className={`flex space-x-1 ${className}`}>
        <div className={`${sizeClasses[size]} bg-orange-500 rounded-full animate-bounce`} style={{ animationDelay: '0ms' }}></div>
        <div className={`${sizeClasses[size]} bg-orange-500 rounded-full animate-bounce`} style={{ animationDelay: '150ms' }}></div>
        <div className={`${sizeClasses[size]} bg-orange-500 rounded-full animate-bounce`} style={{ animationDelay: '300ms' }}></div>
      </div>
    )
  }

  if (variant === 'pulse') {
    return (
      <div className={`${sizeClasses[size]} bg-orange-500 rounded-full animate-pulse ${className}`}></div>
    )
  }

  return null
})

OptimizedLoading.displayName = 'OptimizedLoading'

export { OptimizedLoading }

// Skeleton loading component
interface SkeletonProps {
  className?: string
  variant?: 'text' | 'rectangular' | 'circular'
  width?: string | number
  height?: string | number
}

const Skeleton = memo<SkeletonProps>(({ 
  className = '',
  variant = 'text',
  width,
  height 
}) => {
  const baseClasses = 'loading-shimmer rounded'
  
  const variantClasses = {
    text: 'h-4',
    rectangular: 'h-20',
    circular: 'rounded-full w-10 h-10'
  }

  const style = {
    width: width || (variant === 'text' ? '100%' : undefined),
    height: height || undefined
  }

  return (
    <div 
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
    />
  )
})

Skeleton.displayName = 'Skeleton'

export { Skeleton }

// Optimized card skeleton
const CardSkeleton = memo(() => (
  <div className="modern-card p-6 space-y-4">
    <div className="flex items-center space-x-4">
      <Skeleton variant="circular" />
      <div className="space-y-2 flex-1">
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="text" width="40%" />
      </div>
    </div>
    <Skeleton variant="rectangular" />
    <div className="space-y-2">
      <Skeleton variant="text" />
      <Skeleton variant="text" width="80%" />
    </div>
  </div>
))

CardSkeleton.displayName = 'CardSkeleton'

export { CardSkeleton }

// Table skeleton
const TableSkeleton = memo<{ rows?: number; columns?: number }>(({ 
  rows = 5, 
  columns = 4 
}) => (
  <div className="space-y-3">
    {/* Header */}
    <div className="flex space-x-4">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} variant="text" width="100px" />
      ))}
    </div>
    
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="flex space-x-4">
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton key={colIndex} variant="text" width="100px" />
        ))}
      </div>
    ))}
  </div>
))

TableSkeleton.displayName = 'TableSkeleton'

export { TableSkeleton }
