// Advanced Business Hours Management System
import { supabase } from './supabase'

export interface BusinessHours {
  [key: string]: {
    open: string
    close: string
    closed: boolean
    breaks?: { start: string; end: string }[]
  }
}

export interface Holiday {
  id: string
  name: string
  date: string
  type: 'full_day' | 'partial'
  hours?: { open: string; close: string }
  recurring: boolean
  cafeteria_id: string
}

export interface SpecialHours {
  id: string
  date: string
  hours: { open: string; close: string }
  reason: string
  cafeteria_id: string
}

// Default business hours template
export const DEFAULT_BUSINESS_HOURS: BusinessHours = {
  monday: { open: '08:00', close: '20:00', closed: false },
  tuesday: { open: '08:00', close: '20:00', closed: false },
  wednesday: { open: '08:00', close: '20:00', closed: false },
  thursday: { open: '08:00', close: '20:00', closed: false },
  friday: { open: '08:00', close: '20:00', closed: false },
  saturday: { open: '09:00', close: '18:00', closed: false },
  sunday: { open: '10:00', close: '16:00', closed: false }
}

// Update business hours for a cafeteria
export const updateBusinessHours = async (
  cafeteriaId: string,
  businessHours: BusinessHours
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Validate business hours
    const validation = validateBusinessHours(businessHours)
    if (!validation.valid) {
      return { success: false, error: validation.error }
    }

    // Update or insert cafeteria settings
    const { data: existingSettings } = await supabase
      .from('cafeteria_settings')
      .select('id')
      .eq('cafeteria_id', cafeteriaId)
      .single()

    if (existingSettings) {
      // Update existing settings
      const { error } = await supabase
        .from('cafeteria_settings')
        .update({
          business_hours: businessHours,
          updated_at: new Date().toISOString()
        })
        .eq('cafeteria_id', cafeteriaId)

      if (error) throw error
    } else {
      // Create new settings
      const { error } = await supabase
        .from('cafeteria_settings')
        .insert([{
          cafeteria_id: cafeteriaId,
          business_hours: businessHours
        }])

      if (error) throw error
    }

    return { success: true }
  } catch (error) {
    console.error('Error updating business hours:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

// Get business hours for a cafeteria
export const getBusinessHours = async (
  cafeteriaId: string
): Promise<BusinessHours> => {
  try {
    const { data: settings } = await supabase
      .from('cafeteria_settings')
      .select('business_hours')
      .eq('cafeteria_id', cafeteriaId)
      .single()

    return settings?.business_hours || DEFAULT_BUSINESS_HOURS
  } catch (error) {
    console.error('Error getting business hours:', error)
    return DEFAULT_BUSINESS_HOURS
  }
}

// Check if cafeteria is currently open
export const isCafeteriaOpen = async (
  cafeteriaId: string,
  checkTime?: Date
): Promise<{ isOpen: boolean; nextOpenTime?: string; reason?: string }> => {
  try {
    const now = checkTime || new Date()
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'lowercase' })
    const currentTime = now.toTimeString().slice(0, 5) // HH:MM format

    // Get business hours
    const businessHours = await getBusinessHours(cafeteriaId)
    const dayHours = businessHours[currentDay]

    if (!dayHours || dayHours.closed) {
      const nextOpenDay = getNextOpenDay(businessHours, currentDay)
      return {
        isOpen: false,
        reason: 'Closed today',
        nextOpenTime: nextOpenDay ? `${nextOpenDay.day} at ${nextOpenDay.time}` : undefined
      }
    }

    // Check if current time is within business hours
    const isWithinHours = isTimeInRange(currentTime, dayHours.open, dayHours.close)

    // Check for breaks
    if (isWithinHours && dayHours.breaks) {
      for (const breakTime of dayHours.breaks) {
        if (isTimeInRange(currentTime, breakTime.start, breakTime.end)) {
          return {
            isOpen: false,
            reason: `On break until ${breakTime.end}`,
            nextOpenTime: breakTime.end
          }
        }
      }
    }

    // Check for holidays
    const isHoliday = await checkHoliday(cafeteriaId, now)
    if (isHoliday.isHoliday) {
      return {
        isOpen: false,
        reason: `Closed for ${isHoliday.name}`,
        nextOpenTime: isHoliday.nextOpenTime
      }
    }

    // Check for special hours
    const specialHours = await getSpecialHours(cafeteriaId, now)
    if (specialHours) {
      const isWithinSpecialHours = isTimeInRange(currentTime, specialHours.hours.open, specialHours.hours.close)
      return {
        isOpen: isWithinSpecialHours,
        reason: specialHours.reason,
        nextOpenTime: isWithinSpecialHours ? undefined : specialHours.hours.open
      }
    }

    if (!isWithinHours) {
      const nextOpenTime = currentTime < dayHours.open ? dayHours.open : getNextOpenDay(businessHours, currentDay)?.time
      return {
        isOpen: false,
        reason: 'Outside business hours',
        nextOpenTime: nextOpenTime || undefined
      }
    }

    return { isOpen: true }
  } catch (error) {
    console.error('Error checking if cafeteria is open:', error)
    return { isOpen: false, reason: 'Unable to determine status' }
  }
}

// Add holiday
export const addHoliday = async (
  cafeteriaId: string,
  holiday: Omit<Holiday, 'id' | 'cafeteria_id'>
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('holidays')
      .insert([{
        ...holiday,
        cafeteria_id: cafeteriaId
      }])

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Error adding holiday:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

// Get holidays for a cafeteria
export const getHolidays = async (
  cafeteriaId: string,
  year?: number
): Promise<Holiday[]> => {
  try {
    let query = supabase
      .from('holidays')
      .select('*')
      .eq('cafeteria_id', cafeteriaId)

    if (year) {
      const startDate = `${year}-01-01`
      const endDate = `${year}-12-31`
      query = query.gte('date', startDate).lte('date', endDate)
    }

    const { data: holidays, error } = await query

    if (error) throw error
    return holidays || []
  } catch (error) {
    console.error('Error getting holidays:', error)
    return []
  }
}

// Add special hours
export const addSpecialHours = async (
  cafeteriaId: string,
  specialHours: Omit<SpecialHours, 'id' | 'cafeteria_id'>
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('special_hours')
      .insert([{
        ...specialHours,
        cafeteria_id: cafeteriaId
      }])

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Error adding special hours:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

// Validate business hours
const validateBusinessHours = (businessHours: BusinessHours): { valid: boolean; error?: string } => {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  
  for (const day of days) {
    const dayHours = businessHours[day]
    if (!dayHours) {
      return { valid: false, error: `Missing hours for ${day}` }
    }

    if (!dayHours.closed) {
      // Validate time format
      if (!isValidTimeFormat(dayHours.open) || !isValidTimeFormat(dayHours.close)) {
        return { valid: false, error: `Invalid time format for ${day}` }
      }

      // Validate that open time is before close time
      if (dayHours.open >= dayHours.close) {
        return { valid: false, error: `Open time must be before close time for ${day}` }
      }

      // Validate breaks
      if (dayHours.breaks) {
        for (const breakTime of dayHours.breaks) {
          if (!isValidTimeFormat(breakTime.start) || !isValidTimeFormat(breakTime.end)) {
            return { valid: false, error: `Invalid break time format for ${day}` }
          }

          if (breakTime.start >= breakTime.end) {
            return { valid: false, error: `Break start time must be before end time for ${day}` }
          }

          // Check if break is within business hours
          if (breakTime.start < dayHours.open || breakTime.end > dayHours.close) {
            return { valid: false, error: `Break time must be within business hours for ${day}` }
          }
        }
      }
    }
  }

  return { valid: true }
}

// Helper functions
const isValidTimeFormat = (time: string): boolean => {
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
  return timeRegex.test(time)
}

const isTimeInRange = (currentTime: string, startTime: string, endTime: string): boolean => {
  return currentTime >= startTime && currentTime <= endTime
}

const getNextOpenDay = (businessHours: BusinessHours, currentDay: string): { day: string; time: string } | null => {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  const currentIndex = days.indexOf(currentDay)
  
  for (let i = 1; i <= 7; i++) {
    const nextIndex = (currentIndex + i) % 7
    const nextDay = days[nextIndex]
    const nextDayHours = businessHours[nextDay]
    
    if (nextDayHours && !nextDayHours.closed) {
      return { day: nextDay, time: nextDayHours.open }
    }
  }
  
  return null
}

const checkHoliday = async (cafeteriaId: string, date: Date): Promise<{ isHoliday: boolean; name?: string; nextOpenTime?: string }> => {
  try {
    const dateString = date.toISOString().split('T')[0]
    
    const { data: holidays } = await supabase
      .from('holidays')
      .select('*')
      .eq('cafeteria_id', cafeteriaId)
      .eq('date', dateString)

    if (holidays && holidays.length > 0) {
      const holiday = holidays[0]
      return {
        isHoliday: true,
        name: holiday.name,
        nextOpenTime: holiday.type === 'partial' && holiday.hours ? holiday.hours.open : undefined
      }
    }

    return { isHoliday: false }
  } catch (error) {
    console.error('Error checking holiday:', error)
    return { isHoliday: false }
  }
}

const getSpecialHours = async (cafeteriaId: string, date: Date): Promise<SpecialHours | null> => {
  try {
    const dateString = date.toISOString().split('T')[0]
    
    const { data: specialHours } = await supabase
      .from('special_hours')
      .select('*')
      .eq('cafeteria_id', cafeteriaId)
      .eq('date', dateString)
      .single()

    return specialHours || null
  } catch (error) {
    return null
  }
}

// Generate business hours summary
export const getBusinessHoursSummary = async (cafeteriaId: string): Promise<{
  currentStatus: { isOpen: boolean; reason?: string; nextOpenTime?: string }
  todayHours: { open: string; close: string; closed: boolean }
  weeklyHours: BusinessHours
  upcomingHolidays: Holiday[]
  specialHours: SpecialHours[]
}> => {
  try {
    const now = new Date()
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'lowercase' })
    
    const [currentStatus, weeklyHours, upcomingHolidays, specialHours] = await Promise.all([
      isCafeteriaOpen(cafeteriaId),
      getBusinessHours(cafeteriaId),
      getHolidays(cafeteriaId, now.getFullYear()),
      getSpecialHours(cafeteriaId, now)
    ])

    return {
      currentStatus,
      todayHours: weeklyHours[currentDay],
      weeklyHours,
      upcomingHolidays: upcomingHolidays.filter(h => new Date(h.date) >= now).slice(0, 5),
      specialHours: specialHours ? [specialHours] : []
    }
  } catch (error) {
    console.error('Error getting business hours summary:', error)
    return {
      currentStatus: { isOpen: false, reason: 'Unable to determine status' },
      todayHours: { open: '08:00', close: '20:00', closed: false },
      weeklyHours: DEFAULT_BUSINESS_HOURS,
      upcomingHolidays: [],
      specialHours: []
    }
  }
}
