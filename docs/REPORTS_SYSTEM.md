# Reports System Documentation

This document explains the comprehensive reports system implemented in the UniEats admin dashboard.

## Overview

The reports system provides administrators with the ability to generate, view, and download detailed reports about various aspects of the UniEats platform. All reports use real data from Supabase and include actual calculations based on the established revenue model.

## Features

- **Real-time Data**: All reports use live data from Supabase
- **Multiple Report Types**: Revenue, Orders, Users, Performance, and Feedback reports
- **Flexible Time Periods**: Today, Yesterday, This Week, This Month, Last Month, This Year
- **Multiple Formats**: CSV, JSON, and PDF (text) downloads
- **Audit Logging**: All report generation and downloads are logged
- **Search and Filter**: Easy searching and filtering of generated reports

## Report Types

### 1. Revenue Reports
**Purpose**: Track financial performance and revenue streams

**Data Included**:
- Order details with revenue breakdown
- User service fees (4% capped at 20 EGP)
- Cafeteria commissions (10%)
- Admin revenue calculations
- Total revenue metrics
- Average order values

**Summary Metrics**:
- Total Revenue
- User Service Fees
- Cafeteria Commissions
- Total Orders
- Average Order Value

### 2. Orders Reports
**Purpose**: Analyze order patterns and status distribution

**Data Included**:
- Complete order details
- Customer information
- Cafeteria information
- Order status tracking
- Payment methods
- Item counts per order

**Summary Metrics**:
- Total Orders
- Completed Orders
- Cancelled Orders
- Pending Orders

### 3. Users Reports
**Purpose**: Track user registration and demographics

**Data Included**:
- User profiles and details
- Registration dates
- User roles (student, cafeteria_manager, admin)
- Contact information
- University and year information

**Summary Metrics**:
- Total Users
- Students Count
- Cafeteria Managers Count
- Admins Count

### 4. Performance Reports
**Purpose**: Evaluate cafeteria performance metrics

**Data Included**:
- Cafeteria details and status
- Orders per cafeteria
- Revenue per cafeteria
- Activity status
- Location information

**Summary Metrics**:
- Total Cafeterias
- Active Cafeterias
- Revenue per Cafeteria

### 5. Feedback Reports
**Purpose**: Analyze customer satisfaction and reviews

**Data Included**:
- Customer ratings (1-5 stars)
- Review comments
- Customer and cafeteria information
- Review dates

**Summary Metrics**:
- Total Reviews
- Average Rating
- Rating Distribution (1-5 stars)

## Time Periods

- **Today**: Current day's data
- **Yesterday**: Previous day's data
- **This Week**: Current week (Monday to Sunday)
- **This Month**: Current calendar month
- **Last Month**: Previous calendar month
- **This Year**: Current calendar year

## File Formats

### CSV Format
- Structured tabular data
- Includes detailed records and summary section
- Compatible with Excel and other spreadsheet applications
- Best for data analysis and manipulation

### JSON Format
- Complete structured data export
- Includes all metadata and nested information
- Best for programmatic access and API integration
- Preserves data types and relationships

### PDF (Text) Format
- Human-readable summary report
- Includes key metrics and overview
- Best for presentations and documentation
- Contains executive summary information

## API Endpoints

### GET /api/reports
Retrieves list of generated reports

**Parameters**:
- `limit`: Number of reports to return (default: 50)

**Response**:
```json
{
  "success": true,
  "reports": [
    {
      "id": "uuid",
      "name": "Revenue Report - This Month",
      "type": "Revenue",
      "period": "This Month",
      "format": "CSV",
      "generated": "12/28/2024",
      "file_url": "/api/reports/download/revenue-1234567890.csv",
      "total_records": 150,
      "generated_by": "Admin User"
    }
  ],
  "total": 10
}
```

### POST /api/reports
Generates a new report

**Request Body**:
```json
{
  "reportType": "Revenue",
  "reportPeriod": "This Month",
  "reportFormat": "CSV"
}
```

**Response**:
```json
{
  "success": true,
  "report": {
    "id": "uuid",
    "name": "Revenue Report - This Month",
    "type": "Revenue",
    "period": "This Month",
    "format": "CSV",
    "file_url": "/api/reports/download/revenue-1234567890.csv",
    "total_records": 150,
    "generated": "12/28/2024"
  }
}
```

### GET /api/reports/download/[filename]
Downloads a generated report file

**Parameters**:
- `filename`: The report filename (e.g., "revenue-1234567890.csv")

**Response**: File download with appropriate content type

## Revenue Model Integration

The reports system uses the established UniEats revenue model:

- **User Service Fee**: 4% of order total, capped at 20 EGP
- **Cafeteria Commission**: 10% of order total
- **Admin Revenue**: User service fee + cafeteria commission

All revenue calculations are performed in real-time using actual order data stored in the database.

## Usage Instructions

### Generating Reports

1. Navigate to Admin Dashboard → Reports
2. Click "Generate New Report"
3. Select report type (Revenue, Orders, Users, Performance, Feedback)
4. Choose time period (Today, This Week, This Month, etc.)
5. Select format (CSV, JSON, PDF)
6. Click "Generate"
7. Wait for processing to complete
8. Report will appear in the reports list

### Downloading Reports

1. Find the desired report in the reports list
2. Click the "Download" button
3. File will be downloaded to your device
4. Open with appropriate application (Excel for CSV, text editor for JSON, etc.)

### Searching and Filtering

- Use the search box to find reports by name, type, or period
- Use the type filter dropdown to show only specific report types
- Reports are sorted by generation date (newest first)

## Security and Audit

- All report generation is logged in the audit system
- All downloads are tracked with user information
- Access is restricted to admin users only
- IP addresses and user agents are logged for security

## Database Schema

### generated_reports Table
```sql
- id: UUID (Primary Key)
- name: TEXT (Report display name)
- type: TEXT (Report type: revenue, orders, users, performance, feedback)
- period: TEXT (Time period)
- format: TEXT (File format: csv, json, pdf)
- status: TEXT (Generation status)
- file_url: TEXT (Download URL)
- file_size: BIGINT (File size in bytes)
- generated_by: UUID (Foreign key to profiles)
- created_at: TIMESTAMP WITH TIME ZONE
- updated_at: TIMESTAMP WITH TIME ZONE
- metadata: JSONB (Additional report metadata)
- report_data: JSONB (Actual report data)
```

## Error Handling

The system includes comprehensive error handling for:
- Invalid report parameters
- Database connection issues
- Data processing errors
- File generation failures
- Download errors

All errors are logged and user-friendly messages are displayed.

## Performance Considerations

- Reports are generated asynchronously to prevent UI blocking
- Large datasets are processed efficiently with proper indexing
- File downloads use streaming for better performance
- Generated reports are cached in the database for quick re-download

This reports system provides comprehensive analytics capabilities for the UniEats platform, enabling data-driven decision making and operational insights.
