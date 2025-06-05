// Business Hours Management API Endpoint
import { NextRequest, NextResponse } from 'next/server'
import { 
  updateBusinessHours, 
  getBusinessHours, 
  isCafeteriaOpen, 
  addHoliday, 
  getHolidays,
  addSpecialHours,
  getBusinessHoursSummary
} from '@/lib/business-hours'
import { withRateLimit } from '@/lib/rate-limiting'

async function getHandler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const cafeteriaId = searchParams.get('cafeteriaId')
    const action = searchParams.get('action')

    if (!cafeteriaId) {
      return NextResponse.json(
        { error: 'Cafeteria ID is required' },
        { status: 400 }
      )
    }

    switch (action) {
      case 'status':
        const status = await isCafeteriaOpen(cafeteriaId)
        return NextResponse.json({
          success: true,
          data: status
        })

      case 'holidays':
        const year = searchParams.get('year')
        const holidays = await getHolidays(cafeteriaId, year ? parseInt(year) : undefined)
        return NextResponse.json({
          success: true,
          data: holidays
        })

      case 'summary':
        const summary = await getBusinessHoursSummary(cafeteriaId)
        return NextResponse.json({
          success: true,
          data: summary
        })

      default:
        const businessHours = await getBusinessHours(cafeteriaId)
        return NextResponse.json({
          success: true,
          data: businessHours
        })
    }

  } catch (error) {
    console.error('Error in business hours GET API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function postHandler(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, cafeteriaId } = body

    if (!cafeteriaId) {
      return NextResponse.json(
        { error: 'Cafeteria ID is required' },
        { status: 400 }
      )
    }

    switch (action) {
      case 'update_hours':
        const { businessHours } = body
        if (!businessHours) {
          return NextResponse.json(
            { error: 'Business hours data is required' },
            { status: 400 }
          )
        }

        const updateResult = await updateBusinessHours(cafeteriaId, businessHours)
        if (!updateResult.success) {
          return NextResponse.json(
            { error: updateResult.error },
            { status: 400 }
          )
        }

        return NextResponse.json({
          success: true,
          message: 'Business hours updated successfully'
        })

      case 'add_holiday':
        const { holiday } = body
        if (!holiday) {
          return NextResponse.json(
            { error: 'Holiday data is required' },
            { status: 400 }
          )
        }

        const holidayResult = await addHoliday(cafeteriaId, holiday)
        if (!holidayResult.success) {
          return NextResponse.json(
            { error: holidayResult.error },
            { status: 400 }
          )
        }

        return NextResponse.json({
          success: true,
          message: 'Holiday added successfully'
        })

      case 'add_special_hours':
        const { specialHours } = body
        if (!specialHours) {
          return NextResponse.json(
            { error: 'Special hours data is required' },
            { status: 400 }
          )
        }

        const specialResult = await addSpecialHours(cafeteriaId, specialHours)
        if (!specialResult.success) {
          return NextResponse.json(
            { error: specialResult.error },
            { status: 400 }
          )
        }

        return NextResponse.json({
          success: true,
          message: 'Special hours added successfully'
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Error in business hours POST API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const GET = withRateLimit('api')(getHandler)
export const POST = withRateLimit('api')(postHandler)
