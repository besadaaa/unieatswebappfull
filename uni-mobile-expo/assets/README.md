# Assets Directory

This directory contains all the static assets for the UniEats mobile app.

## Required Assets

To complete the app setup, you'll need to add the following assets:

### App Icons
- `icon.png` - App icon (1024x1024px)
- `adaptive-icon.png` - Android adaptive icon (1024x1024px)
- `favicon.png` - Web favicon (32x32px)

### Splash Screen
- `splash.png` - Splash screen image (1284x2778px for iPhone 13 Pro Max)

## Asset Guidelines

### App Icon
- Size: 1024x1024 pixels
- Format: PNG with transparency
- Design: Should represent the UniEats brand
- Colors: Use the app's primary colors (#fb923c, #10b981)

### Splash Screen
- Size: 1284x2778 pixels (iPhone 13 Pro Max)
- Format: PNG
- Background: Use the app's dark background color (#0f1424)
- Content: UniEats logo and branding

### Adaptive Icon (Android)
- Size: 1024x1024 pixels
- Format: PNG with transparency
- Design: Should work well with different Android icon shapes
- Safe area: Keep important content within the center 66% of the image

## Temporary Assets

For development, you can use placeholder assets:

1. Create a simple colored square for the icon
2. Use a solid color background for the splash screen
3. Add the UniEats logo text

## Asset Generation Tools

You can use these tools to generate assets:
- [App Icon Generator](https://appicon.co/)
- [Expo Asset Generator](https://docs.expo.dev/guides/app-icons/)
- [Figma](https://figma.com) for custom designs

## Installation

Once you have the assets:

1. Place them in this `assets/` directory
2. Update `app.json` if needed
3. Run `expo start` to see the changes

The app will automatically use these assets for the icon, splash screen, and favicon.
