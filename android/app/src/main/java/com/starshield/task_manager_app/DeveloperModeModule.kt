package com.starshield.task_manager_app

import android.content.Context
import android.content.Intent
import android.location.Location
import android.location.LocationManager
import android.os.Build
import android.provider.Settings
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class DeveloperModeModule(private val reactContext: ReactApplicationContext) :
        ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "DeveloperMode"

    // 🧩 Check if Developer Options are enabled
    @ReactMethod
    fun isDeveloperModeEnabled(promise: Promise) {
        try {
            // Skip blocking when running a debug build (so devs aren’t trapped 😅)
            if (BuildConfig.DEBUG) {
                promise.resolve(false)
                return
            }

            val enabled =
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN_MR1) {
                        Settings.Global.getInt(
                                reactContext.contentResolver,
                                Settings.Global.DEVELOPMENT_SETTINGS_ENABLED,
                                0
                        ) == 1
                    } else {
                        Settings.Secure.getInt(
                                reactContext.contentResolver,
                                Settings.Secure.DEVELOPMENT_SETTINGS_ENABLED,
                                0
                        ) == 1
                    }
            promise.resolve(enabled)
        } catch (e: Exception) {
            promise.reject("ERROR_CHECKING_DEV_MODE", e)
        }
    }

    // 🧩 Check if USB Debugging is enabled
    @ReactMethod
    fun isUSBDebuggingEnabled(promise: Promise) {
        try {
            if (BuildConfig.DEBUG) {
                promise.resolve(false)
                return
            }

            val adbOn =
                    Settings.Global.getInt(
                            reactContext.contentResolver,
                            Settings.Global.ADB_ENABLED,
                            0
                    ) == 1
            promise.resolve(adbOn)
        } catch (e: Exception) {
            promise.reject("ERROR_CHECKING_USB_DEBUGGING", e)
        }
    }

    // 🧩 Check if Mock Location is enabled
    @ReactMethod
    fun isMockLocationEnabled(promise: Promise) {
        try {
            if (BuildConfig.DEBUG) {
                promise.resolve(false)
                return
            }

            var isMock = false
            if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.LOLLIPOP_MR1) {
                // For older Android
                val allowMock =
                        Settings.Secure.getString(
                                reactContext.contentResolver,
                                Settings.Secure.ALLOW_MOCK_LOCATION
                        )
                isMock = allowMock != null && allowMock != "0"
            } else {
                val lm = reactContext.getSystemService(Context.LOCATION_SERVICE) as LocationManager?
                if (lm != null) {
                    for (provider in lm.allProviders) {
                        try {
                            val loc: Location? = lm.getLastKnownLocation(provider)
                            if (loc != null &&
                                            Build.VERSION.SDK_INT >=
                                                    Build.VERSION_CODES.JELLY_BEAN_MR2
                            ) {
                                if (loc.isFromMockProvider) {
                                    isMock = true
                                    break
                                }
                            }
                        } catch (_: SecurityException) {
                            // No permission for that provider — skip
                        }
                    }
                }
            }

            promise.resolve(isMock)
        } catch (e: Exception) {
            promise.reject("ERROR_CHECKING_MOCK_LOCATION", e)
        }
    }

    // 🔧 Optional helper — opens Developer Options screen
    @ReactMethod
    fun openDeveloperSettings() {
        try {
            val intent = Intent(Settings.ACTION_APPLICATION_DEVELOPMENT_SETTINGS)
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactContext.startActivity(intent)
        } catch (_: Exception) {
            // Ignore
        }
    }
}
