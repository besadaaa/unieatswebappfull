# UniEats Web App 🍕

A modern, full-stack food ordering platform for university students. Built with Next.js 14, TypeScript, Tailwind CSS, and Supabase.

## 🚀 Features

### 🔐 Multi-Role Authentication
- **Students**: Browse cafeterias, order food, track orders
- **Cafeteria Owners**: Manage menus, process orders, view analytics
- **Admins**: Oversee platform, manage users, view system analytics

### 🎨 Modern UI/UX
- **Dark Theme**: Beautiful dark mode design
- **Responsive**: Works perfectly on desktop, tablet, and mobile
- **Animations**: Smooth transitions and micro-interactions
- **Modern Design**: 2025-style UI with gradients and glass effects

### 📊 Analytics & Dashboards
- **Real-time Charts**: Beautiful analytics with Chart.js
- **Interactive Dashboards**: For admins and cafeteria owners
- **Performance Metrics**: Revenue, orders, user analytics
- **Export Functionality**: Download reports and data

### 🍕 Food Ordering System
- **Browse Cafeterias**: Discover campus dining options
- **Menu Management**: Rich menu system with categories
- **Shopping Cart**: Persistent cart with order customization
- **Order Tracking**: Real-time order status updates
- **Payment Integration**: Secure payment processing

## 🛠️ Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + Custom Components
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Charts**: Chart.js with React Chart.js 2
- **Icons**: Lucide React
- **Deployment**: Vercel

## 📦 Installation

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account

### Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/besadaaa/unieatswebappfull.git
   cd unieatswebappfull
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Setup**:
   Create a `.env.local` file:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Database Setup**:
   - Create a new Supabase project
   - Run the SQL migrations (see `/database` folder)
   - Configure Row Level Security (RLS) policies

5. **Run the development server**:
   ```bash
   npm run dev
   ```

6. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Project Structure

```
├── app/                    # Next.js 14 App Router
│   ├── admin/             # Admin portal pages
│   ├── cafeteria/         # Cafeteria owner portal
│   ├── auth/              # Authentication pages
│   └── (main)/            # Student-facing pages
├── components/            # Reusable UI components
│   ├── ui/                # Base UI components
│   ├── admin/             # Admin-specific components
│   ├── cafeteria/         # Cafeteria-specific components
│   └── charts/            # Chart components
├── contexts/              # React contexts
├── lib/                   # Utility functions
├── hooks/                 # Custom React hooks
└── styles/                # Global styles
```

## 🎯 Key Features

### Student Portal
- **Home**: Browse cafeterias and featured items
- **Menu**: View detailed menus with search and filters
- **Cart**: Manage orders with customization options
- **Orders**: Track order history and status
- **Profile**: Manage account settings

### Cafeteria Portal
- **Dashboard**: Analytics and performance metrics
- **Menu Management**: Add, edit, and organize menu items
- **Orders**: Process and manage incoming orders
- **Analytics**: Revenue and sales insights

### Admin Portal
- **Dashboard**: System-wide analytics and metrics
- **User Management**: Manage students and cafeteria owners
- **Cafeteria Management**: Approve and manage cafeterias
- **Analytics**: Comprehensive platform insights
- **System Settings**: Platform configuration

## 🎨 Design System

### Colors
- **Primary**: Orange (#fb923c)
- **Secondary**: Emerald (#10b981)
- **Tertiary**: Purple (#8b5cf6)
- **Background**: Dark (#0f1424)
- **Surface**: Slate (#1e293b)

### Typography
- **Font**: Inter (system font stack)
- **Headings**: Bold weights with gradient effects
- **Body**: Regular weights with proper contrast

### Components
- **Glass Effect**: Backdrop blur with transparency
- **Modern Cards**: Rounded corners with shadows
- **Gradient Buttons**: Smooth color transitions
- **Animated Elements**: Smooth micro-interactions

## 🔧 Configuration

### Environment Variables
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: Analytics
NEXT_PUBLIC_ANALYTICS_ID=your_analytics_id
```

### Database Schema
The app uses Supabase with the following main tables:
- `profiles` - User profiles and roles
- `cafeterias` - Cafeteria information
- `menu_items` - Food items and menus
- `orders` - Order management
- `order_items` - Order line items

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment
```bash
npm run build
npm start
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 📱 Mobile App

This web app has a companion React Native mobile app built with Expo. Check the mobile app repository for the complete mobile experience.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Next.js Team** for the amazing framework
- **Supabase Team** for the backend infrastructure
- **Tailwind CSS** for the utility-first CSS framework
- **Radix UI** for accessible component primitives

## 📞 Support

For support, email support@unieats.com or join our Discord server.

---

**Built with ❤️ for university students** 🎓

## 🔗 Links

- **Live Demo**: [https://unieatswebappfull.vercel.app](https://unieatswebappfull.vercel.app)
- **Mobile App**: [Link to mobile app repository]
- **Documentation**: [Link to docs]
- **API Reference**: [Link to API docs]
