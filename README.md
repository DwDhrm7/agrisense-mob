# AgriSense Mobile 🌾📱

AgriSense Mobile is a React Native iOS and Android application designed for real-time agricultural monitoring and greenhouse management. With a clean, modern, and intuitive user interface, AgriSense provides farmers and agriculturists with critical environmental data, plant recommendations, weather insights, and remote actuator control.

## 🚀 Features

*   **Real-time Sensor Monitoring**: Monitor live data such as Temperature, Humidity, Soil Moisture, and Light Intensity using MQTT (`paho-mqtt`).
*   **Actuator Control**: Remotely turn on/off pumps, fans, and grow lights directly from the app.
*   **Weather Insights**: Integrated with Open-Meteo for accurate, localized weather data tailored for agricultural needs.
*   **Smart AI Recommendations**: Powered by Gemini AI, receive actionable advice on crop health and greenhouse optimization.
*   **Historical Data Tracking & Charts**: Visualize sensor trends over time using interactive graphs (`react-native-chart-kit`).
*   **System Alerts & Logs**: Keep track of events, connection statuses, and critical alerts natively in the app.
*   **Premium Custom UI**: An elegant, visually appealing interface designed specifically for agricultural workflows.

## 🛠️ Technology Stack

*   [React Native](https://reactnative.dev/) (Version 0.84+) - Core framework
*   [Paho MQTT](https://eclipse.dev/paho/index.php?page=clients/js/index.php) - Real-time communication protocol
*   [React Native Chart Kit](https://github.com/indiespirit/react-native-chart-kit) - Data visualization
*   [TypeScript](https://www.typescriptlang.org/) - Type checking and robust code maintenance

## ⚙️ Getting Started

### Prerequisites

*   Node.js (>= 22.11.0)
*   npm or yarn
*   Ruby and CocoaPods (for iOS)
*   Xcode (for iOS development)
*   Android Studio (for Android development)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/DwDhrm7/agrisense-mob.git
    cd agrisense-mob
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Install iOS Pods:**
    *(Only required if developing for iOS on macOS)*
    ```bash
    cd ios && pod install && cd ..
    ```

### Running the Application

**For Android:**
```bash
npm run android
```

**For iOS:**
```bash
npm run ios
```

**Start Metro Bundler directly:**
```bash
npm start
```

## 📂 Project Structure

*   `src/components/`: Reusable UI components (Sensor Cards, Buttons, Charts)
*   `src/screens/`: Main application screens (Dashboard, History, Settings, etc.)
*   `src/services/`: Services for API integration (MQTT, Weather, Gemini AI)
*   `src/utils/`: Configuration files and utility helper functions
*   `src/hooks/`: Custom React hooks (e.g., MQTT connection management)

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the issues page if you want to contribute.

## 📜 License
This project is proprietary and intended for internal or specific use.
