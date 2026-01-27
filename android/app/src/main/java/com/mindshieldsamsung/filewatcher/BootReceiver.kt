package com.mindshieldsamsung.filewatcher

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class BootReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Intent.ACTION_BOOT_COMPLETED) return

        val prefs = context.getSharedPreferences("mindshield_prefs", Context.MODE_PRIVATE)
        val monitoringEnabled = prefs.getBoolean("monitoring_enabled", false)

        if (!monitoringEnabled) return

        val serviceIntent = Intent(context, FileWatcherService::class.java)
        context.startForegroundService(serviceIntent)
    }
}
