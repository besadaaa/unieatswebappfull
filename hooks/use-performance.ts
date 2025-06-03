import React, { useCallback, useMemo, useRef, useEffect, useState } from 'react'

// Debounce hook for search inputs
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// Throttle hook for scroll events
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const throttleRef = useRef<boolean>(false)

  return useCallback(
    ((...args: Parameters<T>) => {
      if (!throttleRef.current) {
        callback(...args)
        throttleRef.current = true
        setTimeout(() => {
          throttleRef.current = false
        }, delay)
      }
    }) as T,
    [callback, delay]
  )
}

// Memoized component wrapper
export function useMemoizedComponent<T>(
  component: React.ComponentType<T>,
  props: T,
  deps: React.DependencyList
) {
  return useMemo(() => {
    return React.createElement(component, props)
  }, deps)
}

// Performance monitoring
export function usePerformanceMonitor(componentName: string) {
  const renderCount = useRef(0)
  const startTime = useRef<number>(0)

  useEffect(() => {
    renderCount.current += 1
    startTime.current = performance.now()
    
    return () => {
      const endTime = performance.now()
      const renderTime = endTime - startTime.current
      
      if (renderTime > 16) { // More than 16ms (60fps threshold)
        console.warn(`${componentName} render took ${renderTime.toFixed(2)}ms (render #${renderCount.current})`)
      }
    }
  })

  return {
    renderCount: renderCount.current,
    logPerformance: () => {
      console.log(`${componentName} has rendered ${renderCount.current} times`)
    }
  }
}

// Intersection Observer hook for lazy loading
export function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting)
      },
      {
        threshold: 0.1,
        ...options
      }
    )

    observer.observe(element)

    return () => {
      observer.unobserve(element)
    }
  }, [elementRef, options])

  return isIntersecting
}

// Virtual scrolling hook for large lists
export function useVirtualScroll<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) {
  const [scrollTop, setScrollTop] = useState(0)

  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight)
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    )

    return {
      startIndex,
      endIndex,
      items: items.slice(startIndex, endIndex),
      totalHeight: items.length * itemHeight,
      offsetY: startIndex * itemHeight
    }
  }, [items, itemHeight, containerHeight, scrollTop])

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  return {
    visibleItems,
    handleScroll,
    totalHeight: visibleItems.totalHeight,
    offsetY: visibleItems.offsetY
  }
}

// Optimized state updates
export function useOptimizedState<T>(initialValue: T) {
  const [state, setState] = useState<T>(initialValue)
  const stateRef = useRef<T>(initialValue)

  const setOptimizedState = useCallback((newValue: T | ((prev: T) => T)) => {
    const nextValue = typeof newValue === 'function' 
      ? (newValue as (prev: T) => T)(stateRef.current)
      : newValue

    if (Object.is(nextValue, stateRef.current)) {
      return // Skip update if value hasn't changed
    }

    stateRef.current = nextValue
    setState(nextValue)
  }, [])

  return [state, setOptimizedState] as const
}
