plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("com.google.devtools.ksp")
}

android {
    namespace = "com.wimmich.app"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.wimmich.app"
        minSdk = 26
        targetSdk = 34
        versionCode = 1
        versionName = "0.1.0"
    }

    // Fixed, checked-in debug keystore (android/keystore/wimmich-debug.keystore)
    // used for every debug build - local and CI (.github/workflows/android-release.yml)
    // alike. Without this, Gradle's auto-generated per-machine debug keystore
    // would differ between your machine and the CI runner, and Android refuses
    // to install an update whose signing certificate doesn't match the
    // already-installed app - auto-update would fail with "signatures do not
    // match" the very first time a CI-built APK tried to update a locally
    // built one (or vice versa). Not a production/Play Store signing key -
    // just a shared identity so sideloaded builds stay update-compatible.
    signingConfigs {
        getByName("debug") {
            storeFile = file("../keystore/wimmich-debug.keystore")
            storePassword = "wimmich-debug"
            keyAlias = "wimmich-debug"
            keyPassword = "wimmich-debug"
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }
    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.14"
    }

    testOptions {
        unitTests.isIncludeAndroidResources = true
    }
}

dependencies {
    val composeBom = platform("androidx.compose:compose-bom:2024.06.00")
    implementation(composeBom)
    androidTestImplementation(composeBom)

    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.4")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.4")
    implementation("androidx.activity:activity-compose:1.9.1")

    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended:1.6.8")

    // Networking
    implementation("com.squareup.retrofit2:retrofit:2.11.0")
    implementation("com.squareup.retrofit2:converter-gson:2.11.0")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")

    // Image loading (auth-aware, shares the app's OkHttpClient)
    implementation("io.coil-kt:coil-compose:2.6.0")

    // Background sync
    implementation("androidx.work:work-runtime-ktx:2.9.1")

    // Local "already uploaded" tracking DB
    implementation("androidx.room:room-runtime:2.6.1")
    implementation("androidx.room:room-ktx:2.6.1")
    ksp("androidx.room:room-compiler:2.6.1")

    // Encrypted storage for the server URL + API key
    implementation("androidx.security:security-crypto:1.1.0-alpha06")

    testImplementation("junit:junit:4.13.2")
    testImplementation("org.robolectric:robolectric:4.13")
    testImplementation("androidx.test:core:1.6.1")
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.8.1")

    debugImplementation("androidx.compose.ui:ui-tooling")
}
