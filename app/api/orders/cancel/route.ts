import { NextRequest, NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json({ message: 'Order cancel API working' })
}
