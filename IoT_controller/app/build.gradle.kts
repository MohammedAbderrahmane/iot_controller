plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.jetbrains.kotlin.android)
    kotlin("plugin.serialization") version "2.1.0"
}

android {
    namespace = "com.iot_controller"
    compileSdk = 35

    packaging {
        resources {
            excludes.add("META-INF/legal/LICENSE")
            excludes.add("META-INF/legal/NOTICE.md")
            excludes.add("META-INF/legal/3rd-party/CDDL+GPL-1.1.txt")
            excludes.add("META-INF/legal/3rd-party/cc0-legalcode.html")
            excludes.add("META-INF/legal/3rd-party/BSD-3-Clause-LICENSE.txt")
            excludes.add("META-INF/legal/3rd-party/APACHE-LICENSE-2.0.txt")
            excludes.add("META-INF/legal/3rd-party/MIT-license.html")
        }
    }

    defaultConfig {
        applicationId = "com.iot_controller"
        minSdk = 24
        targetSdk = 35
        versionCode = 1
        versionName = "1.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_1_8
        targetCompatibility = JavaVersion.VERSION_1_8
    }
    kotlinOptions {
        jvmTarget = "1.8"
    }
}

dependencies {

    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.appcompat)
    implementation(libs.material)
    implementation(libs.androidx.activity)
    implementation(libs.androidx.constraintlayout)
    implementation(libs.androidx.tools.core)
    testImplementation(libs.junit)
    androidTestImplementation(libs.androidx.junit)
    androidTestImplementation(libs.androidx.espresso.core)

    implementation(libs.okhttp)
    implementation(libs.kotlinx.serialization.json)
    implementation(libs.californium.core)
    implementation(libs.cf.oscore)
    implementation("com.google.android.material:material:1.10.0")
    implementation("com.google.code.gson:gson:2.10.1")
    implementation(files("libs/maabe.aar"))
}