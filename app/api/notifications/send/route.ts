﻿import { NextRequest, NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json({ message: 'Notifications API working' })
}
