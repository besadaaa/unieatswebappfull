'use client'

import React, { useState, useRef, memo } from 'react'
import Image from 'next/image'
import { useIntersectionObserver } from '@/hooks/use-performance'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
  fallback?: string
  onLoad?: () => void
  onError?: () => void
}

const OptimizedImage = memo<OptimizedImageProps>(({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  placeholder = 'empty',
  blurDataURL,
  fallback = '/placeholder.svg',
  onLoad,
  onError
}) => {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [imageSrc, setImageSrc] = useState(src)
  const imageRef = useRef<HTMLDivElement>(null)
  
  // Only load image when it's in viewport (unless priority is true)
  const isInView = useIntersectionObserver(imageRef, {
    threshold: 0.1,
    rootMargin: '50px'
  })

  const shouldLoad = priority || isInView

  const handleLoad = () => {
    setIsLoading(false)
    onLoad?.()
  }

  const handleError = () => {
    setHasError(true)
    setIsLoading(false)
    setImageSrc(fallback)
    onError?.()
  }

  return (
    <div ref={imageRef} className={`relative overflow-hidden ${className}`}>
      {shouldLoad ? (
        <>
          {isLoading && (
            <div className="absolute inset-0 bg-gray-200 animate-pulse rounded" />
          )}
          
          <Image
            src={hasError ? fallback : imageSrc}
            alt={alt}
            width={width}
            height={height}
            priority={priority}
            placeholder={placeholder}
            blurDataURL={blurDataURL}
            className={`transition-opacity duration-300 ${
              isLoading ? 'opacity-0' : 'opacity-100'
            }`}
            onLoad={handleLoad}
            onError={handleError}
            style={{
              objectFit: 'cover',
              width: '100%',
              height: '100%'
            }}
          />
        </>
      ) : (
        <div className="w-full h-full bg-gray-200 animate-pulse rounded" />
      )}
    </div>
  )
})

OptimizedImage.displayName = 'OptimizedImage'

export { OptimizedImage }

// Avatar component with optimized loading
interface AvatarProps {
  src?: string
  alt: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  fallback?: string
  className?: string
}

const Avatar = memo<AvatarProps>(({
  src,
  alt,
  size = 'md',
  fallback,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  }

  const initials = alt
    .split(' ')
    .map(name => name.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)

  if (!src) {
    return (
      <div className={`
        ${sizeClasses[size]} 
        ${className}
        rounded-full 
        bg-gradient-to-br from-orange-400 to-orange-600
        flex items-center justify-center
        text-white font-medium
        text-sm
      `}>
        {initials}
      </div>
    )
  }

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      className={`${sizeClasses[size]} ${className} rounded-full`}
      fallback={fallback}
    />
  )
})

Avatar.displayName = 'Avatar'

export { Avatar }
