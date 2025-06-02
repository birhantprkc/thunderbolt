import { useCallback, useEffect, useRef, useState } from 'react'

interface UseAutoScrollOptions {
  /** Threshold in pixels from bottom to consider "at bottom" */
  threshold?: number
  /** Dependencies that should trigger a scroll to bottom */
  dependencies?: any[]
  /** Whether to use smooth scrolling */
  smooth?: boolean
  /** Callback when user manually scrolls */
  onUserScroll?: (isAtBottom: boolean) => void
}

interface UseAutoScrollReturn {
  /** Ref to attach to the scrollable container */
  scrollContainerRef: React.RefObject<HTMLDivElement | null>
  /** Ref to attach to the element at the bottom */
  scrollTargetRef: React.RefObject<HTMLDivElement | null>
  /** Whether the user has manually scrolled away from bottom */
  userHasScrolled: boolean
  /** Manually scroll to bottom */
  scrollToBottom: (smooth?: boolean) => void
  /** Reset the user scroll state */
  resetUserScroll: () => void
  /** Event handlers to attach to the scrollable container */
  scrollHandlers: {
    onScroll: () => void
    onWheel: (e: React.WheelEvent) => void
  }
}

export function useAutoScroll({
  threshold = 50,
  dependencies = [],
  smooth = true,
  onUserScroll,
}: UseAutoScrollOptions = {}): UseAutoScrollReturn {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const scrollTargetRef = useRef<HTMLDivElement>(null)
  const [userHasScrolled, setUserHasScrolled] = useState(false)

  const isAtBottom = useCallback(() => {
    if (!scrollContainerRef.current) return true
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current
    return scrollHeight - scrollTop - clientHeight < threshold
  }, [threshold])

  const scrollToBottom = useCallback((smoothScroll: boolean = smooth) => {
    scrollTargetRef.current?.scrollIntoView({ 
      behavior: smoothScroll ? 'smooth' : 'auto' 
    })
  }, [smooth])

  const handleScroll = useCallback(() => {
    const atBottom = isAtBottom()
    setUserHasScrolled(!atBottom)
    onUserScroll?.(atBottom)
  }, [isAtBottom, onUserScroll])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    // Immediately detect upward scroll intent
    if (e.deltaY < 0) {
      setUserHasScrolled(true)
      onUserScroll?.(false)
    }
  }, [onUserScroll])

  const resetUserScroll = useCallback(() => {
    setUserHasScrolled(false)
  }, [])

  // Initial scroll on mount
  useEffect(() => {
    scrollToBottom()
  }, [])

  // Auto-scroll when dependencies change
  useEffect(() => {
    if (!userHasScrolled && dependencies.length > 0) {
      scrollToBottom()
    }
  }, dependencies)

  return {
    scrollContainerRef,
    scrollTargetRef,
    userHasScrolled,
    scrollToBottom,
    resetUserScroll,
    scrollHandlers: {
      onScroll: handleScroll,
      onWheel: handleWheel,
    },
  }
}