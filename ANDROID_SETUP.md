# Android (Kotlin) Setup Guide

Complete step-by-step guide for setting up native Android development with Kotlin, Jetpack Compose, Dagger Hilt, and API integration.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Development Environment Setup](#development-environment-setup)
3. [Project Structure](#project-structure)
4. [Gradle Configuration](#gradle-configuration)
5. [Dependencies Setup](#dependencies-setup)
6. [Jetpack Compose Basics](#jetpack-compose-basics)
7. [Dagger Hilt Setup](#dagger-hilt-setup)
8. [Retrofit API Client](#retrofit-api-client)
9. [Authentication & JWT](#authentication--jwt)
10. [Navigation Structure](#navigation-structure)
11. [UI Components](#ui-components)
12. [Testing](#testing)
13. [Build & Run](#build--run)
14. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements

- **RAM**: Minimum 8GB (16GB recommended)
- **Disk Space**: Minimum 10GB
- **OS**: Windows 10+, macOS 10.15+, or Ubuntu 20.04+

### Required Software

1. **Java Development Kit (JDK) 11+**

```bash
# macOS (using Homebrew)
brew install openjdk@11
brew link openjdk@11

# Windows: Download from oracle.com or use Chocolatey
choco install openjdk11

# Verify installation
java -version
```

2. **Android Studio** (Flamingo or newer)
   - Download from: https://developer.android.com/studio
   - Install IDE, SDK, and emulator during setup
   - Minimum SDK Level: **23** (Target: **34+**)

3. **Android SDK**

After installing Android Studio:
1. Open Settings → Appearance & Behavior → System Settings → Android SDK
2. Install:
   - SDK Platforms: Android 34, 33, 32 (API levels)
   - SDK Tools: Build Tools 34.x, NDK, CMake
3. Environment variable: `ANDROID_SDK_ROOT=/Users/username/Library/Android/sdk` (macOS) or `C:\\Users\\username\\AppData\\Local\\Android\\Sdk` (Windows)

### Verify Setup

```bash
# Check Android SDK
echo $ANDROID_SDK_ROOT

# Check emulator exists
emulator -list-avds

# Check ADB
adb --version
```

---

## Development Environment Setup

### Step 1: Create Android Project

In Android Studio:
1. File → New → New Android Project
2. Select "Empty Activity" template
3. Configure:
   - **Name**: RentFlow
   - **Package**: com.rentflow.android
   - **Save location**: `/path/to/android` folder
   - **Language**: Kotlin
   - **Minimum SDK**: API 23
   - **Target SDK**: API 34

### Step 2: Project Structure After Creation

```
android/
├── app/src/
│   ├── main/
│   │   ├── java/com/rentflow/android/
│   │   │   ├── MainActivity.kt
│   │   │   ├── ui/
│   │   │   │   ├── screens/
│   │   │   │   │   ├── auth/
│   │   │   │   │   │   ├── LoginScreen.kt
│   │   │   │   │   │   ├── RegisterScreen.kt
│   │   │   │   │   │   └── ForgotPasswordScreen.kt
│   │   │   │   │   ├── main/
│   │   │   │   │   │   ├── DashboardScreen.kt
│   │   │   │   │   │   ├── PropertiesScreen.kt
│   │   │   │   │   │   └── ProfileScreen.kt
│   │   │   │   │   └── ...
│   │   │   │   ├── components/
│   │   │   │   │   ├── CustomButton.kt
│   │   │   │   │   ├── CustomTextField.kt
│   │   │   │   │   └── ...
│   │   │   │   ├── theme/
│   │   │   │   │   ├── Theme.kt
│   │   │   │   │   ├── Color.kt
│   │   │   │   │   └── Type.kt
│   │   │   │   └── navigation/
│   │   │   │       └── NavGraph.kt
│   │   │   ├── data/
│   │   │   │   ├── api/
│   │   │   │   │   ├── ApiService.kt
│   │   │   │   │   ├── AuthService.kt
│   │   │   │   │   ├── PropertyService.kt
│   │   │   │   │   └── ...
│   │   │   │   ├── models/
│   │   │   │   │   ├── User.kt
│   │   │   │   │   ├── Property.kt
│   │   │   │   │   └── ...
│   │   │   │   ├── repository/
│   │   │   │   │   ├── AuthRepository.kt
│   │   │   │   │   ├── PropertyRepository.kt
│   │   │   │   │   └── ...
│   │   │   │   └── local/
│   │   │   │       ├── SharedPreferencesManager.kt
│   │   │   │       └── TokenManager.kt
│   │   │   ├── viewmodel/
│   │   │   │   ├── AuthViewModel.kt
│   │   │   │   ├── PropertyViewModel.kt
│   │   │   │   ├── LeaseViewModel.kt
│   │   │   │   └── ...
│   │   │   ├── di/
│   │   │   │   ├── ApiModule.kt
│   │   │   │   ├── RepositoryModule.kt
│   │   │   │   └── AppModule.kt
│   │   │   ├── utils/
│   │   │   │   ├── Constants.kt
│   │   │   │   ├── Extensions.kt
│   │   │   │   └── TokenInterceptor.kt
│   │   │   └── RentFlowApp.kt
│   │   └── res/
│   │       ├── drawable/
│   │       ├── mipmap/
│   │       ├── values/
│   │       │   ├── strings.xml
│   │       │   └── colors.xml
│   │       └── AndroidManifest.xml
│   ├── test/
│   │   └── java/com/rentflow/android/
│   │       └── *Test.kt
│   └── androidTest/
│       └── java/com/rentflow/android/
│           └── *Test.kt
├── build.gradle.kts (project level)
├── build.gradle.kts (app level)
├── settings.gradle.kts
├── gradle.properties
├── proguard-rules.pro
└── local.properties (generated)
```

---

## Gradle Configuration

### Step 1: Project-level build.gradle.kts

Edit `android/build.gradle.kts`:

```kotlin
plugins {
    id("com.android.application") version "8.0.0" apply false
    id("com.android.library") version "8.0.0" apply false
    id("org.jetbrains.kotlin.android") version "1.8.0" apply false
    id("com.google.dagger.hilt.android") version "2.45" apply false
}

allprojects {
    repositories {
        google()
        mavenCentral()
    }
}

task<Delete>("clean") {
    delete(rootProject.buildDir)
}
```

### Step 2: App-level build.gradle.kts

Edit `android/app/build.gradle.kts`:

```kotlin
plugins {
    id("com.android.application")
    id("kotlin-android")
    id("kotlin-kapt")
    id("dagger.hilt.android.plugin")
}

android {
    namespace = "com.rentflow.android"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.rentflow.android"
        minSdk = 23
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }

        // API Configuration
        buildConfigField("String", "API_BASE_URL", "\"http://192.168.1.x:3000\"")
        buildConfigField("String", "API_TIMEOUT_SECONDS", "30")
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            buildConfigField("String", "API_BASE_URL", "\"https://api.rentflow.app\"")
        }
        debug {
            isDebuggable = true
            buildConfigField("String", "API_BASE_URL", "\"http://10.0.2.2:3000\"") // Android emulator
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }

    kotlinOptions {
        jvmTarget = "11"
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }

    composeOptions {
        kotlinCompilerExtensionVersion = "1.4.2"
    }

    packagingOptions {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

dependencies {
    // Kotlin
    implementation("org.jetbrains.kotlin:kotlin-stdlib-jdk8:1.8.0")
    
    // Core Android
    implementation("androidx.core:core-ktx:1.10.1")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.6.1")
    implementation("androidx.activity:activity-compose:1.7.2")
    
    // Jetpack Compose
    val composeVersion = "1.5.0"
    implementation("androidx.compose.ui:ui:${composeVersion}")
    implementation("androidx.compose.ui:ui-graphics:${composeVersion}")
    implementation("androidx.compose.ui:ui-tooling-preview:${composeVersion}")
    implementation("androidx.compose.material3:material3:1.0.1")
    implementation("androidx.compose.material:material-icons-extended:${composeVersion}")
    implementation("androidx.navigation:navigation-compose:2.6.0")
    
    // Lifecycle & ViewModel
    val lifecycleVersion = "2.6.1"
    implementation("androidx.lifecycle:lifecycle-viewmodel-ktx:${lifecycleVersion}")
    implementation("androidx.lifecycle:lifecycle-livedata-ktx:${lifecycleVersion}")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:${lifecycleVersion}")
    
    // Dagger Hilt
    val hiltVersion = "2.45"
    implementation("com.google.dagger:hilt-android:${hiltVersion}")
    kapt("com.google.dagger:hilt-compiler:${hiltVersion}")
    implementation("androidx.hilt:hilt-navigation-compose:1.0.0")
    
    // Retrofit & OkHttp
    val retrofitVersion = "2.9.0"
    implementation("com.squareup.retrofit2:retrofit:${retrofitVersion}")
    implementation("com.squareup.retrofit2:converter-gson:${retrofitVersion}")
    implementation("com.squareup.okhttp3:okhttp:4.10.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.10.0")
    
    // JSON Parsing
    implementation("com.google.code.gson:gson:2.10.1")
    
    // Coroutines
    val coroutinesVersion = "1.7.1"
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:${coroutinesVersion}")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:${coroutinesVersion}")
    
    // Data Store (Secure SharedPreferences replacement)
    implementation("androidx.datastore:datastore-preferences:1.0.0")
    
    // Room Database (future use)
    val roomVersion = "2.5.2"
    implementation("androidx.room:room-runtime:${roomVersion}")
    kapt("androidx.room:room-compiler:${roomVersion}")
    implementation("androidx.room:room-ktx:${roomVersion}")
    
    // Image Loading (Coil)
    implementation("io.coil-kt:coil-compose:2.2.2")
    
    // Logging
    implementation("com.jakewharton.timber:timber:5.0.1")
    
    // Testing
    testImplementation("junit:junit:4.13.2")
    testImplementation("org.mockito.kotlin:mockito-kotlin:4.1.0")
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:${coroutinesVersion}")
    
    androidTestImplementation("androidx.test.ext:junit:1.1.5")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.5.1")
    androidTestImplementation("androidx.compose.ui:ui-test-junit4:${composeVersion}")
    androidTestImplementation("androidx.compose.ui:ui-tooling:${composeVersion}")
}
```

### Step 3: gradle.properties

Add to `android/gradle.properties`:

```properties
# Android properties
android.useAndroidX=true
android.nonTransitiveRClass=true
android.enableJetifier=true

# Gradle performance
org.gradle.jvmargs=-Xmx4096m
org.gradle.parallel=true
org.gradle.configureondemand=true

# Kotlin
kotlin.code.style=official

# Build features
android.defaults.buildfeatures.buildconfig=true
```

---

## Dependencies Setup

### Step 1: Sync Gradle

In Android Studio:
1. Click "Sync Now" when prompted
2. Wait for gradle build to complete
3. View output in "Build" tab

### Step 2: Verify Dependencies

```bash
# List all dependencies
./gradlew dependencies

# Check for conflicts
./gradlew dependencies --configuration debugCompileClasspath
```

---

## Jetpack Compose Basics

### Step 1: Create Eco-Modern Theme

Create `android/app/src/main/java/com/rentflow/android/ui/theme/Color.kt`:

```kotlin
package com.rentflow.android.ui.theme

import androidx.compose.ui.graphics.Color

// Primary Colors - Eco-Modern
val ForestGreen = Color(0xFF184A45)
val ForestGreen50 = Color(0xFFF0F4F3)
val ForestGreen100 = Color(0xFFD5E5E2)
val ForestGreen200 = Color(0xFFB0CCC5)
val ForestGreen300 = Color(0xFF8AB3A8)
val ForestGreen400 = Color(0xFF679299)
val ForestGreen500 = Color(0xFF51808A)
val ForestGreen600 = Color(0xFF3B6E7E)
val ForestGreen700 = Color(0xFF2D5A70)
val ForestGreen800 = Color(0xFF184A45)
val ForestGreen900 = Color(0xFF0F3E39)

// Secondary Colors
val SageGreen = Color(0xFF84A98C)
val SageGreen50 = Color(0xFFF5F7F5)
val SageGreen100 = Color(0xFFE8EDE9)
val SageGreen500 = Color(0xFF84A98C)

// Accent Colors
val TanAccent = Color(0xFFE7D8C9)
val TanAccent100 = Color(0xFFFAF8F5)
val TanAccent500 = Color(0xFFE7D8C9)

// Neutral Colors
val CharcoalGray = Color(0xFF2F2F2F)
val CharcoalGray100 = Color(0xFFF9F9F9)
val CharcoalGray500 = Color(0xFF6B6B6B)
val CharcoalGray700 = Color(0xFF2F2F2F)

// Status Colors
val Success = Color(0xFF22C55E)
val Error = Color(0xFFEF4444)
val Warning = Color(0xFFF59E0B)
val Info = Color(0xFF3B82F6)
```

Create `android/app/src/main/java/com/rentflow/android/ui/theme/Type.kt`:

```kotlin
package com.rentflow.android.ui.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import com.rentflow.android.R

private val InterFontFamily = FontFamily(
    Font(R.font.inter_regular, FontWeight.Normal),
    Font(R.font.inter_medium, FontWeight.Medium),
    Font(R.font.inter_semibold, FontWeight.SemiBold),
    Font(R.font.inter_bold, FontWeight.Bold),
)

val RentFlowTypography = Typography(
    displayLarge = TextStyle(
        fontFamily = InterFontFamily,
        fontWeight = FontWeight.Bold,
        fontSize = 57.sp,
        lineHeight = 64.sp,
        letterSpacing = (-0.25).sp,
    ),
    displayMedium = TextStyle(
        fontFamily = InterFontFamily,
        fontWeight = FontWeight.Bold,
        fontSize = 45.sp,
        lineHeight = 52.sp,
    ),
    displaySmall = TextStyle(
        fontFamily = InterFontFamily,
        fontWeight = FontWeight.Bold,
        fontSize = 36.sp,
        lineHeight = 44.sp,
    ),
    headlineLarge = TextStyle(
        fontFamily = InterFontFamily,
        fontWeight = FontWeight.SemiBold,
        fontSize = 32.sp,
        lineHeight = 40.sp,
    ),
    headlineMedium = TextStyle(
        fontFamily = InterFontFamily,
        fontWeight = FontWeight.SemiBold,
        fontSize = 28.sp,
        lineHeight = 36.sp,
    ),
    headlineSmall = TextStyle(
        fontFamily = InterFontFamily,
        fontWeight = FontWeight.SemiBold,
        fontSize = 24.sp,
        lineHeight = 32.sp,
    ),
    titleLarge = TextStyle(
        fontFamily = InterFontFamily,
        fontWeight = FontWeight.SemiBold,
        fontSize = 22.sp,
        lineHeight = 28.sp,
    ),
    titleMedium = TextStyle(
        fontFamily = InterFontFamily,
        fontWeight = FontWeight.Medium,
        fontSize = 16.sp,
        lineHeight = 24.sp,
        letterSpacing = 0.15.sp,
    ),
    titleSmall = TextStyle(
        fontFamily = InterFontFamily,
        fontWeight = FontWeight.Medium,
        fontSize = 14.sp,
        lineHeight = 20.sp,
        letterSpacing = 0.1.sp,
    ),
    bodyLarge = TextStyle(
        fontFamily = InterFontFamily,
        fontWeight = FontWeight.Normal,
        fontSize = 16.sp,
        lineHeight = 24.sp,
        letterSpacing = 0.5.sp,
    ),
    bodyMedium = TextStyle(
        fontFamily = InterFontFamily,
        fontWeight = FontWeight.Normal,
        fontSize = 14.sp,
        lineHeight = 20.sp,
        letterSpacing = 0.25.sp,
    ),
    bodySmall = TextStyle(
        fontFamily = InterFontFamily,
        fontWeight = FontWeight.Normal,
        fontSize = 12.sp,
        lineHeight = 16.sp,
        letterSpacing = 0.4.sp,
    ),
    labelLarge = TextStyle(
        fontFamily = InterFontFamily,
        fontWeight = FontWeight.Medium,
        fontSize = 14.sp,
        lineHeight = 20.sp,
        letterSpacing = 0.1.sp,
    ),
    labelMedium = TextStyle(
        fontFamily = InterFontFamily,
        fontWeight = FontWeight.Medium,
        fontSize = 12.sp,
        lineHeight = 16.sp,
        letterSpacing = 0.5.sp,
    ),
    labelSmall = TextStyle(
        fontFamily = InterFontFamily,
        fontWeight = FontWeight.Medium,
        fontSize = 11.sp,
        lineHeight = 16.sp,
        letterSpacing = 0.5.sp,
    ),
)
```

Create `android/app/src/main/java/com/rentflow/android/ui/theme/Theme.kt`:

```kotlin
package com.rentflow.android.ui.theme

import android.app.Activity
import android.os.Build
import androidx.compose.foundation.isSystemInDarkMode
import androidx.compose.material3.ColorScheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val LightColorScheme = lightColorScheme(
    primary = ForestGreen,
    onPrimary = Color.White,
    primaryContainer = ForestGreen100,
    onPrimaryContainer = ForestGreen900,
    secondary = SageGreen,
    onSecondary = Color.White,
    secondaryContainer = SageGreen100,
    onSecondaryContainer = ForestGreen900,
    tertiary = TanAccent,
    onTertiary = ForestGreen900,
    tertiaryContainer = TanAccent100,
    onTertiaryContainer = ForestGreen900,
    error = Error,
    onError = Color.White,
    errorContainer = Error.copy(alpha = 0.1f),
    onErrorContainer = Error,
    background = Color.White,
    onBackground = CharcoalGray,
    surface = ForestGreen50,
    onSurface = CharcoalGray,
)

private val DarkColorScheme = darkColorScheme(
    primary = ForestGreen400,
    onPrimary = ForestGreen900,
    primaryContainer = ForestGreen700,
    onPrimaryContainer = ForestGreen100,
    secondary = SageGreen,
    onSecondary = ForestGreen900,
    secondaryContainer = SageGreen500,
    onSecondaryContainer = SageGreen100,
    tertiary = TanAccent,
    onTertiary = ForestGreen900,
    tertiaryContainer = TanAccent500,
    onTertiaryContainer = TanAccent100,
    error = Error,
    onError = Color.White,
    errorContainer = Error.copy(alpha = 0.1f),
    onErrorContainer = Error,
    background = ForestGreen900,
    onBackground = ForestGreen50,
    surface = ForestGreen800,
    onSurface = ForestGreen50,
)

@Composable
fun RentFlowTheme(
    darkTheme: Boolean = isSystemInDarkMode(),
    dynamicColor: Boolean = true,
    content: @Composable () -> Unit,
) {
    val colorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            val context = LocalContext.current
            if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        }

        darkTheme -> DarkColorScheme
        else -> LightColorScheme
    }

    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = colorScheme.primary.toArgb()
            WindowCompat.getInsetsController(window, view)?.isAppearanceLightStatusBars =
                !darkTheme
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = RentFlowTypography,
        content = content,
    )
}
```

### Step 2: Create MainActivity

Create/Update `android/app/src/main/java/com/rentflow/android/MainActivity.kt`:

```kotlin
package com.rentflow.android

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.navigation.NavHostController
import androidx.navigation.compose.rememberNavController
import com.rentflow.android.ui.nav.NavGraph
import com.rentflow.android.ui.theme.RentFlowTheme
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        setContent {
            RentFlowTheme {
                val navController = rememberNavController()
                Scaffold(
                    modifier = Modifier.fillMaxSize(),
                    content = { paddingValues ->
                        NavGraph(navController = navController)
                    }
                )
            }
        }
    }
}
```

---

## Dagger Hilt Setup

### Step 1: Create Application Class

Create `android/app/src/main/java/com/rentflow/android/RentFlowApp.kt`:

```kotlin
package com.rentflow.android

import android.app.Application
import dagger.hilt.android.HiltAndroidApp
import timber.log.Timber

@HiltAndroidApp
class RentFlowApp : Application() {
    override fun onCreate() {
        super.onCreate()
        
        // Setup Timber logging
        if (BuildConfig.DEBUG) {
            Timber.plant(Timber.DebugTree())
        }
    }
}
```

### Step 2: Update AndroidManifest.xml

Edit `android/app/src/main/AndroidManifest.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />

    <application
        android:name=".RentFlowApp"
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:theme="@style/AppTheme">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>

</manifest>
```

### Step 3: Create Hilt Modules

Create `android/app/src/main/java/com/rentflow/android/di/AppModule.kt`:

```kotlin
package com.rentflow.android.di

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.preferencesDataStore
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

private const val PREFERENCES_NAME = "rentflow_preferences"

val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = PREFERENCES_NAME)

@Module
@InstallIn(SingletonComponent::class)
object AppModule {

    @Provides
    @Singleton
    fun provideDataStore(
        @ApplicationContext context: Context
    ): DataStore<Preferences> = context.dataStore
}
```

Create `android/app/src/main/java/com/rentflow/android/di/ApiModule.kt`:

```kotlin
package com.rentflow.android.di

import android.content.Context
import com.google.gson.Gson
import com.google.gson.GsonBuilder
import com.rentflow.android.BuildConfig
import com.rentflow.android.data.api.AuthService
import com.rentflow.android.data.api.PropertyService
import com.rentflow.android.data.local.DataStoreManager
import com.rentflow.android.utils.TokenInterceptor
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import timber.log.Timber
import java.util.concurrent.TimeUnit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object ApiModule {

    @Provides
    @Singleton
    fun provideGson(): Gson = GsonBuilder().setLenient().create()

    @Provides
    @Singleton
    fun provideHttpLoggingInterceptor(): HttpLoggingInterceptor =
        HttpLoggingInterceptor { message ->
            Timber.tag("OkHttp").d(message)
        }.apply {
            level = if (BuildConfig.DEBUG) {
                HttpLoggingInterceptor.Level.BODY
            } else {
                HttpLoggingInterceptor.Level.NONE
            }
        }

    @Provides
    @Singleton
    fun provideTokenInterceptor(dataStoreManager: DataStoreManager): TokenInterceptor =
        TokenInterceptor(dataStoreManager)

    @Provides
    @Singleton
    fun provideOkHttpClient(
        httpLoggingInterceptor: HttpLoggingInterceptor,
        tokenInterceptor: TokenInterceptor,
    ): OkHttpClient = OkHttpClient.Builder()
        .apply {
            if (BuildConfig.DEBUG) {
                addInterceptor(httpLoggingInterceptor)
            }
        }
        .addInterceptor(tokenInterceptor)
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .writeTimeout(30, TimeUnit.SECONDS)
        .build()

    @Provides
    @Singleton
    fun provideRetrofit(
        okHttpClient: OkHttpClient,
        gson: Gson,
    ): Retrofit = Retrofit.Builder()
        .baseUrl(BuildConfig.API_BASE_URL)
        .client(okHttpClient)
        .addConverterFactory(GsonConverterFactory.create(gson))
        .build()

    @Provides
    @Singleton
    fun provideAuthService(retrofit: Retrofit): AuthService =
        retrofit.create(AuthService::class.java)

    @Provides
    @Singleton
    fun providePropertyService(retrofit: Retrofit): PropertyService =
        retrofit.create(PropertyService::class.java)
}
```

Create `android/app/src/main/java/com/rentflow/android/di/RepositoryModule.kt`:

```kotlin
package com.rentflow.android.di

import com.rentflow.android.data.api.AuthService
import com.rentflow.android.data.api.PropertyService
import com.rentflow.android.data.local.DataStoreManager
import com.rentflow.android.data.repository.AuthRepository
import com.rentflow.android.data.repository.PropertyRepository
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object RepositoryModule {

    @Provides
    @Singleton
    fun provideAuthRepository(
        authService: AuthService,
        dataStoreManager: DataStoreManager,
    ): AuthRepository = AuthRepository(authService, dataStoreManager)

    @Provides
    @Singleton
    fun providePropertyRepository(
        propertyService: PropertyService,
    ): PropertyRepository = PropertyRepository(propertyService)
}
```

---

## Retrofit API Client

### Step 1: Data Models

Create `android/app/src/main/java/com/rentflow/android/data/models/User.kt`:

```kotlin
package com.rentflow.android.data.models

import com.google.gson.annotations.SerializedName

data class User(
    val id: String,
    val email: String,
    val role: String,
    @SerializedName("firstName")
    val firstName: String,
    @SerializedName("lastName")
    val lastName: String,
    val phone: String? = null,
)

data class LoginRequest(
    val email: String,
    val password: String,
)

data class LoginResponse(
    val accessToken: String,
    val refreshToken: String,
    val user: User,
)

data class RegisterRequest(
    val email: String,
    val password: String,
    val role: String,
    @SerializedName("firstName")
    val firstName: String,
    @SerializedName("lastName")
    val lastName: String,
)

data class RegisterResponse(
    val id: String,
    val email: String,
    val accessToken: String,
    val refreshToken: String,
    val user: User,
)
```

### Step 2: API Services

Create `android/app/src/main/java/com/rentflow/android/data/api/AuthService.kt`:

```kotlin
package com.rentflow.android.data.api

import com.rentflow.android.data.models.LoginRequest
import com.rentflow.android.data.models.LoginResponse
import com.rentflow.android.data.models.RegisterRequest
import com.rentflow.android.data.models.RegisterResponse
import retrofit2.http.Body
import retrofit2.http.POST

interface AuthService {
    @POST("/api/v1/auth/login")
    suspend fun login(@Body request: LoginRequest): LoginResponse

    @POST("/api/v1/auth/register")
    suspend fun register(@Body request: RegisterRequest): RegisterResponse

    @POST("/api/v1/auth/refresh")
    suspend fun refreshToken(@Body refreshToken: String): LoginResponse
}
```

---

## Authentication & JWT

### Step 1: Create Token Manager

Create `android/app/src/main/java/com/rentflow/android/data/local/DataStoreManager.kt`:

```kotlin
package com.rentflow.android.data.local

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class DataStoreManager @Inject constructor(
    private val dataStore: DataStore<Preferences>
) {
    companion object {
        val ACCESS_TOKEN = stringPreferencesKey("access_token")
        val REFRESH_TOKEN = stringPreferencesKey("refresh_token")
        val USER_ID = stringPreferencesKey("user_id")
        val USER_EMAIL = stringPreferencesKey("user_email")
        val USER_ROLE = stringPreferencesKey("user_role")
    }

    // Get access token
    val accessToken: Flow<String?> = dataStore.data.map { preferences ->
        preferences[ACCESS_TOKEN]
    }

    // Get refresh token
    val refreshToken: Flow<String?> = dataStore.data.map { preferences ->
        preferences[REFRESH_TOKEN]
    }

    // Save tokens
    suspend fun saveTokens(accessToken: String, refreshToken: String) {
        dataStore.edit { preferences ->
            preferences[ACCESS_TOKEN] = accessToken
            preferences[REFRESH_TOKEN] = refreshToken
        }
    }

    // Save user info
    suspend fun saveUserInfo(userId: String, email: String, role: String) {
        dataStore.edit { preferences ->
            preferences[USER_ID] = userId
            preferences[USER_EMAIL] = email
            preferences[USER_ROLE] = role
        }
    }

    // Clear all data (logout)
    suspend fun clearAll() {
        dataStore.edit { preferences ->
            preferences.clear()
        }
    }

    // Get current access token (blocking)
    // Note: Use the Flow version for production
}
```

### Step 2: Create Token Interceptor

Create `android/app/src/main/java/com/rentflow/android/utils/TokenInterceptor.kt`:

```kotlin
package com.rentflow.android.utils

import com.rentflow.android.data.local.DataStoreManager
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.runBlocking
import okhttp3.Interceptor
import okhttp3.Response
import timber.log.Timber
import javax.inject.Inject

class TokenInterceptor @Inject constructor(
    private val dataStoreManager: DataStoreManager
) : Interceptor {

    override fun intercept(chain: Interceptor.Chain): Response {
        var request = chain.request()

        // Skip token for auth endpoints
        if (request.url.encodedPath.contains("/auth/")) {
            return chain.proceed(request)
        }

        try {
            // Get access token (blocking with runBlocking for interceptors)
            val token = runBlocking {
                dataStoreManager.accessToken.firstOrNull()
            }

            token?.let {
                request = request.newBuilder()
                    .header("Authorization", "Bearer $it")
                    .build()
                Timber.d("Token added to request")
            } ?: run {
                Timber.d("No token available")
            }
        } catch (e: Exception) {
            Timber.e(e, "Error getting token from DataStore")
        }

        return chain.proceed(request)
    }
}
```

---

## Navigation Structure

Create `android/app/src/main/java/com/rentflow/android/ui/navigation/NavGraph.kt`:

```kotlin
package com.rentflow.android.ui.nav

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import com.rentflow.android.ui.screens.auth.LoginScreen
import com.rentflow.android.ui.screens.auth.RegisterScreen
import com.rentflow.android.ui.screens.main.DashboardScreen

sealed class Routes(val route: String) {
    object Login : Routes("login")
    object Register : Routes("register")
    object Dashboard : Routes("dashboard")
    object Properties : Routes("properties")
    object Profile : Routes("profile")
}

@Composable
fun NavGraph(navController: NavHostController) {
    NavHost(
        navController = navController,
        startDestination = Routes.Login.route
    ) {
        composable(Routes.Login.route) {
            LoginScreen(
                onLoginSuccess = {
                    navController.navigate(Routes.Dashboard.route) {
                        popUpTo(Routes.Login.route) { inclusive = true }
                    }
                },
                onNavigateToRegister = {
                    navController.navigate(Routes.Register.route)
                }
            )
        }

        composable(Routes.Register.route) {
            RegisterScreen(
                onRegisterSuccess = {
                    navController.navigate(Routes.Dashboard.route) {
                        popUpTo(Routes.Login.route) { inclusive = true }
                    }
                },
                onNavigateToLogin = {
                    navController.popBackStack()
                }
            )
        }

        composable(Routes.Dashboard.route) {
            DashboardScreen(
                onLogout = {
                    navController.navigate(Routes.Login.route) {
                        popUpTo(Routes.Dashboard.route) { inclusive = true }
                    }
                }
            )
        }
    }
}
```

---

## UI Components

### Reusable Button Component

Create `android/app/src/main/java/com/rentflow/android/ui/components/CustomButton.kt`:

```kotlin
package com.rentflow.android.ui.components

import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.rentflow.android.ui.theme.ForestGreen

@Composable
fun CustomButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    isLoading: Boolean = false,
    backgroundColor: Color = ForestGreen,
) {
    Button(
        onClick = onClick,
        modifier = modifier
            .fillMaxWidth()
            .height(50.dp),
        enabled = enabled && !isLoading,
        colors = ButtonDefaults.buttonColors(
            containerColor = backgroundColor,
            disabledContainerColor = backgroundColor.copy(alpha = 0.5f)
        ),
        shape = androidx.compose.foundation.shape.RoundedCornerShape(8.dp)
    ) {
        if (isLoading) {
            CircularProgressIndicator(
                color = Color.White,
                modifier = Modifier
                    .height(24.dp)
                    .width(24.dp),
                strokeWidth = 2.dp
            )
        } else {
            Text(text = text)
        }
    }
}
```

### TextField Component

Create `android/app/src/main/java/com/rentflow/android/ui/components/CustomTextField.kt`:

```kotlin
package com.rentflow.android.ui.components

import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextFieldDefaults
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import com.rentflow.android.ui.theme.ForestGreen

@Composable
fun CustomTextField(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    modifier: Modifier = Modifier,
    isPassword: Boolean = false,
    keyboardType: KeyboardType = KeyboardType.Text,
    enabled: Boolean = true,
    error: String? = null,
) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        label = { Text(label) },
        modifier = modifier.fillMaxWidth(),
        isError = error != null,
        visualTransformation = if (isPassword) PasswordVisualTransformation() else VisualTransformation.None,
        keyboardOptions = KeyboardOptions(keyboardType = keyboardType),
        enabled = enabled,
        colors = TextFieldDefaults.colors(
            focusedBorderColor = ForestGreen,
            cursorColor = ForestGreen,
        ),
        supportingText = {
            if (error != null) {
                Text(text = error, color = Color.Red)
            }
        }
    )
}
```

---

## Testing

### Unit Tests

Create `android/app/src/test/java/com/rentflow/android/AuthViewModelTest.kt`:

```kotlin
package com.rentflow.android

import com.rentflow.android.data.repository.AuthRepository
import com.rentflow.android.viewmodel.AuthViewModel
import kotlinx.coroutines.test.runTest
import org.junit.Before
import org.junit.Test
import org.mockito.Mockito.*

class AuthViewModelTest {
    private lateinit var authRepository: AuthRepository
    private lateinit var authViewModel: AuthViewModel

    @Before
    fun setup() {
        authRepository = mock(AuthRepository::class.java)
        authViewModel = AuthViewModel(authRepository)
    }

    @Test
    fun testLoginSuccess() = runTest {
        // Add test implementation
    }

    @Test
    fun testLoginFailure() = runTest {
        // Add test implementation
    }
}
```

---

## Build & Run

### Step 1: Build APK

```bash
# Debug APK
./gradlew assembleDebug

# Release APK (requires signing)
./gradlew assembleRelease

# APK location: app/build/outputs/apk/
```

### Step 2: Run on Emulator

```bash
# List available emulators
emulator -list-avds

# Start emulator
emulator -avd <emulator_name>

# Install and run
./gradlew installDebug
./gradlew runDebug

# Or in Android Studio: Run → Run 'app'
```

### Step 3: Run on Physical Device

```bash
# Enable USB debugging on device
# Settings → Developer options → USB debugging

# Connect device via USB
adb devices  # Should show your device

# Install
./gradlew installDebug

# View logs
adb logcat -s RentFlow
```

---

## Troubleshooting

### "SDK location not found" Error

```bash
# Create local.properties in project root
echo "sdk.dir=/path/to/Android/sdk" > local.properties
```

### Gradle Build Fails

```bash
# Clean and rebuild
./gradlew clean
./gradlew build

# If still failing
./gradlew build --stacktrace
```

### Emulator Won't Start

```bash
# List AVDs
emulator -list-avds

# Create new AVD via Android Studio
# Tools → Device Manager → Create Virtual Device
```

### App Crashes on Startup

```bash
# View logs
adb logcat | grep RentFlow

# Enable debug logging
// In RentFlowApp.kt
if (BuildConfig.DEBUG) {
    Timber.plant(Timber.DebugTree())
}
```

---

## Next Steps

1. ✅ Android project initialized
2. ⏭️ Implement Login Screen
3. ⏭️ Implement Register Screen
4. ⏭️ Create repositories and ViewModels
5. ⏭️ Implement dashboard UI
6. ⏭️ Build properties listing screen
7. ⏭️ Implement lease management UI
8. ⏭️ Create payment tracking screens
9. ⏭️ Build complaints system
10. ⏭️ Add push notifications

---

## Resources

- **Android Developer Guide**: https://developer.android.com/
- **Kotlin Documentation**: https://kotlinlang.org/docs/
- **Jetpack Compose**: https://developer.android.com/compose
- **Dagger Hilt**: https://dagger.dev/hilt/
- **Retrofit**: https://square.github.io/retrofit/
- **Material Design 3**: https://m3.material.io/

---

**Questions?** Check the main [README.md](./README.md) or [DEVELOPMENT_WORKFLOW.md](./DEVELOPMENT_WORKFLOW.md) for team processes.
