// Advanced Report Generation with PDF and Excel Export
import jsPDF from 'jspdf'
// @ts-ignore - jspdf-autotable doesn't have TypeScript definitions
import 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { supabase } from './supabase'

// Extend jsPDF type to include autoTable method
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

export interface ReportData {
  title: string
  dateRange: { from: Date; to: Date }
  data: any[]
  charts?: ChartData[]
  summary?: ReportSummary
}

export interface ChartData {
  type: 'bar' | 'line' | 'pie'
  title: string
  data: any[]
  labels: string[]
}

export interface ReportSummary {
  totalOrders: number
  totalRevenue: number
  averageOrderValue: number
  topPerformingItems: string[]
  growthRate: number
}

// Generate comprehensive PDF report with charts
export const generatePDFReport = async (
  reportType: 'financial' | 'orders' | 'inventory' | 'analytics',
  cafeteriaId?: string,
  dateRange?: { from: Date; to: Date }
): Promise<{ success: boolean; blob?: Blob; error?: string }> => {
  try {
    const pdf = new jsPDF()
    const pageWidth = pdf.internal.pageSize.width
    const pageHeight = pdf.internal.pageSize.height
    
    // Header
    pdf.setFontSize(20)
    pdf.setTextColor(40, 40, 40)
    pdf.text('UniEats Analytics Report', 20, 30)
    
    // Report metadata
    pdf.setFontSize(12)
    pdf.setTextColor(100, 100, 100)
    pdf.text(`Report Type: ${reportType.charAt(0).toUpperCase() + reportType.slice(1)}`, 20, 45)
    pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 55)
    
    if (dateRange) {
      pdf.text(`Period: ${dateRange.from.toLocaleDateString()} - ${dateRange.to.toLocaleDateString()}`, 20, 65)
    }
    
    let yPosition = 80
    
    // Get report data based on type
    const reportData = await getReportData(reportType, cafeteriaId, dateRange)
    
    if (!reportData) {
      return { success: false, error: 'Failed to generate report data' }
    }
    
    // Summary section
    if (reportData.summary) {
      pdf.setFontSize(16)
      pdf.setTextColor(40, 40, 40)
      pdf.text('Executive Summary', 20, yPosition)
      yPosition += 15
      
      pdf.setFontSize(12)
      pdf.setTextColor(60, 60, 60)
      
      const summaryData = [
        ['Total Orders', reportData.summary.totalOrders.toString()],
        ['Total Revenue', `${reportData.summary.totalRevenue.toFixed(2)} EGP`],
        ['Average Order Value', `${reportData.summary.averageOrderValue.toFixed(2)} EGP`],
        ['Growth Rate', `${reportData.summary.growthRate.toFixed(1)}%`]
      ]
      
      // @ts-ignore - jsPDF autoTable types
      pdf.autoTable({
        startY: yPosition,
        head: [['Metric', 'Value']],
        body: summaryData,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] },
        styles: { fontSize: 10 }
      })
      
      // @ts-ignore
      yPosition = pdf.lastAutoTable.finalY + 20
    }
    
    // Data tables
    if (reportData.data && reportData.data.length > 0) {
      pdf.setFontSize(16)
      pdf.setTextColor(40, 40, 40)
      pdf.text('Detailed Data', 20, yPosition)
      yPosition += 15
      
      // Prepare table data based on report type
      let tableHeaders: string[] = []
      let tableData: any[][] = []
      
      switch (reportType) {
        case 'financial':
          tableHeaders = ['Date', 'Orders', 'Revenue', 'Commission', 'Net Amount']
          tableData = reportData.data.map(item => [
            new Date(item.date).toLocaleDateString(),
            item.orders.toString(),
            `${item.revenue.toFixed(2)} EGP`,
            `${item.commission.toFixed(2)} EGP`,
            `${item.netAmount.toFixed(2)} EGP`
          ])
          break
          
        case 'orders':
          tableHeaders = ['Order ID', 'Date', 'Customer', 'Amount', 'Status']
          tableData = reportData.data.map(item => [
            item.id.slice(-8),
            new Date(item.created_at).toLocaleDateString(),
            item.customer_name || 'N/A',
            `${item.total_amount.toFixed(2)} EGP`,
            item.status
          ])
          break
          
        case 'inventory':
          tableHeaders = ['Item', 'Current Stock', 'Min Stock', 'Status', 'Last Updated']
          tableData = reportData.data.map(item => [
            item.name,
            `${item.quantity} ${item.unit}`,
            `${item.min_quantity} ${item.unit}`,
            item.status,
            new Date(item.updated_at).toLocaleDateString()
          ])
          break
          
        case 'analytics':
          tableHeaders = ['Metric', 'Value', 'Change', 'Trend']
          tableData = reportData.data.map(item => [
            item.metric,
            item.value.toString(),
            `${item.change > 0 ? '+' : ''}${item.change.toFixed(1)}%`,
            item.trend
          ])
          break
      }
      
      // @ts-ignore
      pdf.autoTable({
        startY: yPosition,
        head: [tableHeaders],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [52, 152, 219] },
        styles: { fontSize: 9 },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 35 },
          2: { cellWidth: 35 },
          3: { cellWidth: 35 },
          4: { cellWidth: 35 }
        }
      })
      
      // @ts-ignore
      yPosition = pdf.lastAutoTable.finalY + 20
    }
    
    // Charts section (simplified text representation)
    if (reportData.charts && reportData.charts.length > 0) {
      // Check if we need a new page
      if (yPosition > pageHeight - 60) {
        pdf.addPage()
        yPosition = 30
      }
      
      pdf.setFontSize(16)
      pdf.setTextColor(40, 40, 40)
      pdf.text('Charts & Visualizations', 20, yPosition)
      yPosition += 15
      
      reportData.charts.forEach((chart, index) => {
        pdf.setFontSize(14)
        pdf.setTextColor(60, 60, 60)
        pdf.text(chart.title, 20, yPosition)
        yPosition += 10
        
        // Simple text representation of chart data
        pdf.setFontSize(10)
        chart.data.forEach((value, i) => {
          if (chart.labels[i]) {
            pdf.text(`${chart.labels[i]}: ${value}`, 25, yPosition)
            yPosition += 8
          }
        })
        
        yPosition += 10
        
        // Check if we need a new page
        if (yPosition > pageHeight - 40) {
          pdf.addPage()
          yPosition = 30
        }
      })
    }
    
    // Footer
    const totalPages = pdf.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i)
      pdf.setFontSize(8)
      pdf.setTextColor(150, 150, 150)
      pdf.text(`Page ${i} of ${totalPages}`, pageWidth - 30, pageHeight - 10)
      pdf.text('Generated by UniEats Analytics', 20, pageHeight - 10)
    }
    
    const blob = pdf.output('blob')
    return { success: true, blob }
    
  } catch (error) {
    console.error('Error generating PDF report:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Generate advanced Excel export with formatting
export const generateExcelReport = async (
  reportType: 'financial' | 'orders' | 'inventory' | 'analytics',
  cafeteriaId?: string,
  dateRange?: { from: Date; to: Date }
): Promise<{ success: boolean; blob?: Blob; error?: string }> => {
  try {
    const reportData = await getReportData(reportType, cafeteriaId, dateRange)
    
    if (!reportData) {
      return { success: false, error: 'Failed to generate report data' }
    }
    
    const workbook = XLSX.utils.book_new()
    
    // Summary sheet
    if (reportData.summary) {
      const summaryData = [
        ['UniEats Analytics Report'],
        [''],
        ['Report Type', reportType.charAt(0).toUpperCase() + reportType.slice(1)],
        ['Generated', new Date().toLocaleDateString()],
        [''],
        ['EXECUTIVE SUMMARY'],
        [''],
        ['Metric', 'Value'],
        ['Total Orders', reportData.summary.totalOrders],
        ['Total Revenue (EGP)', reportData.summary.totalRevenue],
        ['Average Order Value (EGP)', reportData.summary.averageOrderValue],
        ['Growth Rate (%)', reportData.summary.growthRate],
        [''],
        ['Top Performing Items'],
        ...reportData.summary.topPerformingItems.map(item => ['', item])
      ]
      
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
      
      // Apply formatting
      summarySheet['!cols'] = [{ width: 25 }, { width: 20 }]
      
      // Style the header
      if (summarySheet['A1']) {
        summarySheet['A1'].s = {
          font: { bold: true, sz: 16 },
          alignment: { horizontal: 'center' }
        }
      }
      
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary')
    }
    
    // Data sheet
    if (reportData.data && reportData.data.length > 0) {
      let sheetData: any[][] = []
      
      switch (reportType) {
        case 'financial':
          sheetData = [
            ['Date', 'Orders', 'Revenue (EGP)', 'Commission (EGP)', 'Net Amount (EGP)', 'Growth %'],
            ...reportData.data.map(item => [
              new Date(item.date).toLocaleDateString(),
              item.orders,
              item.revenue,
              item.commission,
              item.netAmount,
              item.growth || 0
            ])
          ]
          break
          
        case 'orders':
          sheetData = [
            ['Order ID', 'Date', 'Customer', 'Amount (EGP)', 'Status', 'Items', 'Payment Method'],
            ...reportData.data.map(item => [
              item.id,
              new Date(item.created_at).toLocaleDateString(),
              item.customer_name || 'N/A',
              item.total_amount,
              item.status,
              item.item_count || 0,
              item.payment_method || 'cash_on_pickup'
            ])
          ]
          break
          
        case 'inventory':
          sheetData = [
            ['Item Name', 'Category', 'Current Stock', 'Unit', 'Min Stock', 'Status', 'Cost per Unit', 'Total Value'],
            ...reportData.data.map(item => [
              item.name,
              item.category,
              item.quantity,
              item.unit,
              item.min_quantity,
              item.status,
              item.cost_per_unit || 0,
              (item.quantity * (item.cost_per_unit || 0))
            ])
          ]
          break
          
        case 'analytics':
          sheetData = [
            ['Metric', 'Current Value', 'Previous Value', 'Change %', 'Trend', 'Target'],
            ...reportData.data.map(item => [
              item.metric,
              item.value,
              item.previousValue || 0,
              item.change,
              item.trend,
              item.target || 'N/A'
            ])
          ]
          break
      }
      
      const dataSheet = XLSX.utils.aoa_to_sheet(sheetData)
      
      // Apply formatting
      const range = XLSX.utils.decode_range(dataSheet['!ref'] || 'A1')
      dataSheet['!cols'] = Array(range.e.c + 1).fill({ width: 15 })
      
      // Style the header row
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col })
        if (dataSheet[cellAddress]) {
          dataSheet[cellAddress].s = {
            font: { bold: true },
            fill: { fgColor: { rgb: "3498DB" } },
            alignment: { horizontal: 'center' }
          }
        }
      }
      
      XLSX.utils.book_append_sheet(workbook, dataSheet, 'Data')
    }
    
    // Charts sheet (data for charts)
    if (reportData.charts && reportData.charts.length > 0) {
      const chartsData = [
        ['Chart Data'],
        [''],
        ...reportData.charts.flatMap(chart => [
          [chart.title],
          ['Label', 'Value'],
          ...chart.labels.map((label, index) => [label, chart.data[index]]),
          ['']
        ])
      ]
      
      const chartsSheet = XLSX.utils.aoa_to_sheet(chartsData)
      XLSX.utils.book_append_sheet(workbook, chartsSheet, 'Charts')
    }
    
    // Generate blob
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    
    return { success: true, blob }
    
  } catch (error) {
    console.error('Error generating Excel report:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Get report data based on type
const getReportData = async (
  reportType: string,
  cafeteriaId?: string,
  dateRange?: { from: Date; to: Date }
): Promise<ReportData | null> => {
  try {
    const startDate = dateRange?.from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const endDate = dateRange?.to || new Date()

    // Process data based on report type
    switch (reportType) {
      case 'financial':
        return await processFinancialData(startDate, endDate, cafeteriaId)
      case 'orders':
        return await processOrdersData(startDate, endDate, cafeteriaId)
      case 'inventory':
        return await processInventoryData(cafeteriaId)
      case 'analytics':
        return await processAnalyticsData(startDate, endDate, cafeteriaId)
      default:
        return null
    }

  } catch (error) {
    console.error('Error getting report data:', error)
    return null
  }
}

// Process financial data for reports
const processFinancialData = async (
  startDate: Date,
  endDate: Date,
  cafeteriaId?: string
): Promise<ReportData> => {
  try {
    // Get orders with transactions
    let ordersQuery = supabase
      .from('orders')
      .select(`
        *,
        transactions(*),
        profiles(full_name, email),
        cafeterias(name)
      `)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false })

    if (cafeteriaId) {
      ordersQuery = ordersQuery.eq('cafeteria_id', cafeteriaId)
    }

    const { data: orders, error } = await ordersQuery

    if (error) throw error

    // Process daily financial data
    const dailyData = (orders || []).reduce((acc, order) => {
      const date = order.created_at.split('T')[0]
      if (!acc[date]) {
        acc[date] = {
          date,
          orders: 0,
          revenue: 0,
          commission: 0,
          serviceFees: 0,
          netAmount: 0
        }
      }

      const transaction = order.transactions?.[0]
      acc[date].orders += 1
      acc[date].revenue += order.total_amount || 0
      acc[date].commission += transaction?.commission || 0
      acc[date].serviceFees += transaction?.service_fee || 0
      acc[date].netAmount += transaction?.net_to_cafeteria || 0

      return acc
    }, {} as Record<string, any>)

    const data = Object.values(dailyData)
    const totalRevenue = data.reduce((sum: number, item: any) => sum + item.revenue, 0)
    const totalOrders = data.reduce((sum: number, item: any) => sum + item.orders, 0)
    const totalCommission = data.reduce((sum: number, item: any) => sum + item.commission, 0)
    const totalServiceFees = data.reduce((sum: number, item: any) => sum + item.serviceFees, 0)

    return {
      title: 'Financial Report',
      dateRange: { from: startDate, to: endDate },
      data,
      summary: {
        totalOrders,
        totalRevenue,
        averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        topPerformingItems: [],
        growthRate: 0
      },
      charts: [
        {
          type: 'line',
          title: 'Daily Revenue',
          data: data.map((item: any) => item.revenue),
          labels: data.map((item: any) => item.date)
        },
        {
          type: 'bar',
          title: 'Revenue Breakdown',
          data: [totalServiceFees, totalCommission],
          labels: ['Service Fees', 'Commissions']
        }
      ]
    }
  } catch (error) {
    console.error('Error processing financial data:', error)
    return {
      title: 'Financial Report',
      dateRange: { from: startDate, to: endDate },
      data: [],
      summary: {
        totalOrders: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        topPerformingItems: [],
        growthRate: 0
      }
    }
  }
}

// Process orders data for reports
const processOrdersData = async (
  startDate: Date,
  endDate: Date,
  cafeteriaId?: string
): Promise<ReportData> => {
  try {
    // Get orders with related data
    let ordersQuery = supabase
      .from('orders')
      .select(`
        *,
        order_items(
          *,
          menu_items(name, category, price)
        ),
        profiles(full_name, email),
        cafeterias(name)
      `)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false })

    if (cafeteriaId) {
      ordersQuery = ordersQuery.eq('cafeteria_id', cafeteriaId)
    }

    const { data: orders, error } = await ordersQuery

    if (error) throw error

    const data = (orders || []).map(order => ({
      id: order.id,
      created_at: order.created_at,
      customer_name: order.profiles?.full_name || 'Unknown',
      customer_email: order.profiles?.email || 'N/A',
      cafeteria_name: order.cafeterias?.name || 'Unknown',
      total_amount: order.total_amount,
      status: order.status,
      item_count: order.order_items?.length || 0,
      pickup_time: order.pickup_time,
      rating: order.rating
    }))

    // Calculate status breakdown
    const statusBreakdown = (orders || []).reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Get popular items
    const itemCounts = (orders || []).flatMap(order =>
      order.order_items?.map((item: any) => ({
        name: item.menu_items?.name || 'Unknown',
        quantity: item.quantity
      })) || []
    )

    const popularItems = itemCounts.reduce((acc, item) => {
      acc[item.name] = (acc[item.name] || 0) + item.quantity
      return acc
    }, {} as Record<string, number>)

    const topPerformingItems = Object.entries(popularItems)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name]) => name)

    return {
      title: 'Orders Report',
      dateRange: { from: startDate, to: endDate },
      data,
      summary: {
        totalOrders: orders?.length || 0,
        totalRevenue: (orders || []).reduce((sum, order) => sum + (order.total_amount || 0), 0),
        averageOrderValue: orders?.length ?
          (orders.reduce((sum, order) => sum + (order.total_amount || 0), 0) / orders.length) : 0,
        topPerformingItems,
        growthRate: 0
      },
      charts: [
        {
          type: 'pie',
          title: 'Order Status Distribution',
          data: Object.values(statusBreakdown),
          labels: Object.keys(statusBreakdown)
        },
        {
          type: 'bar',
          title: 'Top Menu Items',
          data: Object.entries(popularItems).slice(0, 5).map(([, count]) => count),
          labels: Object.entries(popularItems).slice(0, 5).map(([name]) => name)
        }
      ]
    }
  } catch (error) {
    console.error('Error processing orders data:', error)
    return {
      title: 'Orders Report',
      dateRange: { from: startDate, to: endDate },
      data: [],
      summary: {
        totalOrders: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        topPerformingItems: [],
        growthRate: 0
      }
    }
  }
}

// Process inventory data for reports
const processInventoryData = async (cafeteriaId?: string): Promise<ReportData> => {
  let query = supabase.from('inventory_items').select('*')
  
  if (cafeteriaId) {
    query = query.eq('cafeteria_id', cafeteriaId)
  }
  
  const { data: inventory } = await query
  
  return {
    title: 'Inventory Report',
    dateRange: { from: new Date(), to: new Date() },
    data: inventory || [],
    summary: {
      totalOrders: 0,
      totalRevenue: 0,
      averageOrderValue: 0,
      topPerformingItems: [],
      growthRate: 0
    }
  }
}

// Process analytics data for reports
const processAnalyticsData = async (
  startDate: Date,
  endDate: Date,
  cafeteriaId?: string
): Promise<ReportData> => {
  try {
    // Get comprehensive analytics data
    const [ordersResult, usersResult, cafeteriasResult] = await Promise.all([
      // Orders data
      supabase
        .from('orders')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString()),

      // Users data
      supabase
        .from('profiles')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString()),

      // Cafeterias data
      supabase
        .from('cafeterias')
        .select('*')
    ])

    const orders = ordersResult.data || []
    const users = usersResult.data || []
    const cafeterias = cafeteriasResult.data || []

    // Calculate metrics
    const totalOrders = orders.length
    const totalRevenue = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0)
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
    const completedOrders = orders.filter(o => o.status === 'completed').length
    const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0

    // User metrics
    const totalUsers = users.length
    const studentUsers = users.filter(u => u.role === 'student').length
    const cafeteriaManagers = users.filter(u => u.role === 'cafeteria_manager').length
    const adminUsers = users.filter(u => u.role === 'admin').length

    // Cafeteria metrics
    const totalCafeterias = cafeterias.length
    const activeCafeterias = cafeterias.filter(c => c.approval_status === 'approved').length

    const metrics = [
      { metric: 'Total Orders', value: totalOrders, change: 0, trend: 'up', target: 'N/A' },
      { metric: 'Total Revenue (EGP)', value: totalRevenue, change: 0, trend: 'up', target: 'N/A' },
      { metric: 'Average Order Value (EGP)', value: averageOrderValue, change: 0, trend: 'stable', target: 'N/A' },
      { metric: 'Order Completion Rate (%)', value: completionRate, change: 0, trend: 'up', target: '95%' },
      { metric: 'Total Users', value: totalUsers, change: 0, trend: 'up', target: 'N/A' },
      { metric: 'Student Users', value: studentUsers, change: 0, trend: 'up', target: 'N/A' },
      { metric: 'Cafeteria Managers', value: cafeteriaManagers, change: 0, trend: 'stable', target: 'N/A' },
      { metric: 'Admin Users', value: adminUsers, change: 0, trend: 'stable', target: 'N/A' },
      { metric: 'Total Cafeterias', value: totalCafeterias, change: 0, trend: 'up', target: 'N/A' },
      { metric: 'Active Cafeterias', value: activeCafeterias, change: 0, trend: 'up', target: 'N/A' }
    ]

    return {
      title: 'Analytics Report',
      dateRange: { from: startDate, to: endDate },
      data: metrics,
      summary: {
        totalOrders,
        totalRevenue,
        averageOrderValue,
        topPerformingItems: [],
        growthRate: 0
      },
      charts: [
        {
          type: 'bar',
          title: 'User Distribution',
          data: [studentUsers, cafeteriaManagers, adminUsers],
          labels: ['Students', 'Cafeteria Managers', 'Admins']
        },
        {
          type: 'pie',
          title: 'Cafeteria Status',
          data: [activeCafeterias, totalCafeterias - activeCafeterias],
          labels: ['Active', 'Inactive']
        }
      ]
    }
  } catch (error) {
    console.error('Error processing analytics data:', error)
    return {
      title: 'Analytics Report',
      dateRange: { from: startDate, to: endDate },
      data: [],
      summary: {
        totalOrders: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        topPerformingItems: [],
        growthRate: 0
      }
    }
  }
}
