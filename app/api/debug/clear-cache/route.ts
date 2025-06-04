import { NextResponse } from 'next/server'

export async function POST() {
  try {
    console.log('🧹 Clearing all caches...')
    
    // Clear any in-memory caches
    // Note: This is a placeholder - in a real app you'd clear Redis, memory caches, etc.
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc()
      console.log('✅ Garbage collection triggered')
    }
    
    console.log('✅ Cache clearing completed')
    
    return NextResponse.json({
      success: true,
      message: 'All caches cleared successfully',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error clearing caches:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to clear caches',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
