package com.mindshieldsamsung.filewatcher

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import androidx.localbroadcastmanager.content.LocalBroadcastManager

class FileWatcherService : Service() {

    companion object {
        const val CHANNEL_ID = "mindshield-service"
        const val CHANNEL_NAME = "Mindshield Protection"
        const val NOTIFICATION_ID = 1
        const val ACTION_NEW_RECORDING = "com.mindshield.NEW_RECORDING"
        const val EXTRA_FILE_PATH = "filePath"
        const val EXTRA_FILE_NAME = "fileName"
        const val EXTRA_WATCH_PATH = "watchPath"
        const val DEFAULT_WATCH_PATH = "/storage/emulated/0/Recordings/Call"
    }

    private var fileObserver: RecordingFileObserver? = null

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val watchPath = intent?.getStringExtra(EXTRA_WATCH_PATH) ?: DEFAULT_WATCH_PATH

        val notification = buildNotification()
        startForeground(NOTIFICATION_ID, notification)

        startObserving(watchPath)

        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        super.onDestroy()
        fileObserver?.stopWatching()
        fileObserver = null
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Mindshield background protection service"
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }

    private fun buildNotification(): Notification {
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Mindshield")
            .setContentText("Mindshield is protecting your calls")
            .setSmallIcon(android.R.drawable.ic_lock_lock)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    private fun startObserving(directoryPath: String) {
        fileObserver?.stopWatching()

        fileObserver = RecordingFileObserver(directoryPath) { fullPath, fileName ->
            val intent = Intent(ACTION_NEW_RECORDING).apply {
                putExtra(EXTRA_FILE_PATH, fullPath)
                putExtra(EXTRA_FILE_NAME, fileName)
            }
            LocalBroadcastManager.getInstance(this).sendBroadcast(intent)
        }
        fileObserver?.startWatching()
    }
}
