# UniEats Mobile App 📱

A React Native Expo mobile application for the UniEats food ordering platform. Built with TypeScript, React Native Paper, and Supabase.

## 🚀 Features

### 🔐 Authentication
- User registration and login
- Secure token storage with Expo SecureStore
- Profile management
- Demo accounts for testing

### 🍕 Food Ordering
- Browse cafeterias and menus
- Search functionality
- Shopping cart with persistence
- Order placement and tracking
- Order history

### 🎨 Modern UI/UX
- Dark theme design
- Smooth animations with React Native Animatable
- Material Design components
- Responsive layout for all screen sizes
- Beautiful gradients and shadows

### 📱 Mobile-Optimized
- Pull-to-refresh functionality
- Loading states and skeletons
- Push notifications
- Offline cart storage
- Native navigation

## 🛠️ Tech Stack

- **Framework**: React Native with Expo SDK 50
- **Language**: TypeScript
- **UI Library**: React Native Paper (Material Design)
- **Navigation**: React Navigation 6
- **Backend**: Supabase
- **Animations**: React Native Animatable
- **Storage**: Expo SecureStore
- **Notifications**: Expo Notifications
- **Image Picker**: Expo Image Picker

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Expo CLI
- iOS Simulator (for iOS development)
- Android Studio (for Android development)

### Setup

1. **Clone and navigate to the mobile app directory**:
   ```bash
   cd uni-mobile-expo
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Supabase**:
   - Edit `src/services/supabase.ts`
   - Add your Supabase project URL and anon key:
   ```typescript
   const supabaseUrl = 'https://your-project-url.supabase.co';
   const supabaseAnonKey = 'your-anon-key-here';
   ```

4. **Add app assets** (optional for development):
   - Add `icon.png`, `splash.png`, and `favicon.png` to the `assets/` directory
   - See `assets/README.md` for specifications

5. **Start the development server**:
   ```bash
   npx expo start
   ```

## 📱 Running the App

### Development
```bash
# Start Expo development server
npx expo start

# Run on iOS simulator
npx expo start --ios

# Run on Android emulator
npx expo start --android

# Run on web browser
npx expo start --web
```

### Building for Production
```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Configure EAS
eas build:configure

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
├── contexts/           # React contexts (Auth, Cart, Notifications)
├── navigation/         # Navigation configuration
├── screens/           # Screen components
│   ├── auth/          # Authentication screens
│   └── main/          # Main app screens
├── services/          # API services (Supabase)
├── theme/             # Theme configuration
└── types/             # TypeScript type definitions
```

## 🎯 Key Screens

### Authentication
- **SplashScreen**: Animated loading screen
- **LoginScreen**: User login with demo accounts
- **RegisterScreen**: User registration

### Main App
- **HomeScreen**: Cafeteria listings with search
- **CafeteriaScreen**: Cafeteria details and menu preview
- **MenuScreen**: Full menu with item details
- **CartScreen**: Shopping cart and checkout
- **OrdersScreen**: Order history and tracking
- **OrderDetailsScreen**: Detailed order information
- **ProfileScreen**: User profile and settings
- **SearchScreen**: Global search functionality
- **NotificationsScreen**: Push notifications and settings

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:
```env
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### App Configuration
Edit `app.json` to customize:
- App name and slug
- Bundle identifiers
- App icons and splash screen
- Build configurations

## 🎨 Theming

The app uses a consistent dark theme with:
- **Primary**: Orange (#fb923c)
- **Secondary**: Emerald (#10b981)
- **Tertiary**: Purple (#8b5cf6)
- **Background**: Dark blue (#0f1424)
- **Surface**: Slate (#1e293b)

Theme configuration is in `src/theme/theme.ts`.

## 📱 Demo Accounts

For testing, use these demo accounts:

**Student Account**:
- Email: `student@unieats.com`
- Password: `password123`

**Admin Account**:
- Email: `admin@unieats.com`
- Password: `password123`

## 🔄 Integration with Web App

The mobile app shares the same backend with the web application:
- Same Supabase database
- Same user authentication
- Same order management
- Consistent data synchronization

## 🚀 Deployment

### Expo Application Services (EAS)
1. Install EAS CLI: `npm install -g @expo/eas-cli`
2. Login: `eas login`
3. Configure: `eas build:configure`
4. Build: `eas build --platform all`
5. Submit: `eas submit --platform all`

### App Stores
- **iOS**: Submit to Apple App Store via EAS Submit
- **Android**: Submit to Google Play Store via EAS Submit

## 🐛 Troubleshooting

### Common Issues

1. **Metro bundler issues**:
   ```bash
   npx expo start --clear
   ```

2. **iOS simulator not opening**:
   ```bash
   npx expo install --fix
   ```

3. **Android build errors**:
   - Check Android Studio setup
   - Verify SDK versions in `app.json`

4. **Supabase connection issues**:
   - Verify URL and keys in `src/services/supabase.ts`
   - Check network connectivity

## 📄 License

This project is part of the UniEats platform. All rights reserved.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For support and questions:
- Check the troubleshooting section
- Review Expo documentation
- Contact the development team

---

**Built with ❤️ for university students** 🎓
