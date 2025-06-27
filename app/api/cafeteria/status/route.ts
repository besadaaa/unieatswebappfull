import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ message: 'Cafeteria status API working' })
}

export async function POST() {
  return NextResponse.json({ message: 'Cafeteria status update API working' })
}
