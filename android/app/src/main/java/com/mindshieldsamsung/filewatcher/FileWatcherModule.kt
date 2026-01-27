package com.mindshieldsamsung.filewatcher

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import androidx.localbroadcastmanager.content.LocalBroadcastManager
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule

class FileWatcherModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val MODULE_NAME = "FileWatcherModule"
        const val EVENT_NEW_RECORDING = "onNewRecording"
    }

    private var isWatching = false
    private var broadcastReceiver: BroadcastReceiver? = null

    override fun getName(): String = MODULE_NAME

    @ReactMethod
    fun startWatching(path: String?, promise: Promise) {
        try {
            if (isWatching) {
                promise.resolve(true)
                return
            }

            val watchPath = path ?: FileWatcherService.DEFAULT_WATCH_PATH

            registerReceiver()

            val intent = Intent(reactApplicationContext, FileWatcherService::class.java).apply {
                putExtra(FileWatcherService.EXTRA_WATCH_PATH, watchPath)
            }
            reactApplicationContext.startForegroundService(intent)

            isWatching = true

            val prefs = reactApplicationContext.getSharedPreferences("mindshield_prefs", Context.MODE_PRIVATE)
            prefs.edit().putBoolean("monitoring_enabled", true).apply()

            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("START_ERROR", "Failed to start file watching: ${e.message}", e)
        }
    }

    @ReactMethod
    fun stopWatching(promise: Promise) {
        try {
            unregisterReceiver()

            val intent = Intent(reactApplicationContext, FileWatcherService::class.java)
            reactApplicationContext.stopService(intent)

            isWatching = false

            val prefs = reactApplicationContext.getSharedPreferences("mindshield_prefs", Context.MODE_PRIVATE)
            prefs.edit().putBoolean("monitoring_enabled", false).apply()

            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("STOP_ERROR", "Failed to stop file watching: ${e.message}", e)
        }
    }

    @ReactMethod
    fun isWatching(promise: Promise) {
        promise.resolve(isWatching)
    }

    @ReactMethod
    fun addListener(eventName: String) {
        // Required for RCTDeviceEventEmitter
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        // Required for RCTDeviceEventEmitter
    }

    override fun onCatalystInstanceDestroy() {
        unregisterReceiver()
        super.onCatalystInstanceDestroy()
    }

    private fun registerReceiver() {
        if (broadcastReceiver != null) return

        broadcastReceiver = object : BroadcastReceiver() {
            override fun onReceive(context: Context?, intent: Intent?) {
                if (intent?.action != FileWatcherService.ACTION_NEW_RECORDING) return

                val filePath = intent.getStringExtra(FileWatcherService.EXTRA_FILE_PATH) ?: return
                val fileName = intent.getStringExtra(FileWatcherService.EXTRA_FILE_NAME) ?: return

                val params = Arguments.createMap().apply {
                    putString("filePath", filePath)
                    putString("fileName", fileName)
                }

                reactApplicationContext
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    .emit(EVENT_NEW_RECORDING, params)
            }
        }

        val filter = IntentFilter(FileWatcherService.ACTION_NEW_RECORDING)
        LocalBroadcastManager.getInstance(reactApplicationContext)
            .registerReceiver(broadcastReceiver!!, filter)
    }

    private fun unregisterReceiver() {
        broadcastReceiver?.let {
            LocalBroadcastManager.getInstance(reactApplicationContext).unregisterReceiver(it)
        }
        broadcastReceiver = null
    }
}
