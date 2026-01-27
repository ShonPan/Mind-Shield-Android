package com.mindshieldsamsung.filewatcher

import android.os.FileObserver
import java.io.File

class RecordingFileObserver(
    private val directoryPath: String,
    private val onNewFile: (String, String) -> Unit
) : FileObserver(File(directoryPath), CLOSE_WRITE or MOVED_TO) {

    override fun onEvent(event: Int, path: String?) {
        if (path == null) return

        val masked = event and ALL_EVENTS
        if (masked != CLOSE_WRITE && masked != MOVED_TO) return

        if (!path.endsWith(".m4a", ignoreCase = true)) return

        val fullPath = "$directoryPath${File.separator}$path"
        onNewFile(fullPath, path)
    }
}
