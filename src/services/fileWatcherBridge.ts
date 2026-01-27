import {NativeModules, NativeEventEmitter, Platform} from 'react-native';

const {FileWatcherModule} = NativeModules;

if (!FileWatcherModule) {
  console.error(
    '[MindShield] FileWatcherModule is not available. ' +
      'Make sure the native module is properly linked.',
  );
}

const eventEmitter = FileWatcherModule
  ? new NativeEventEmitter(FileWatcherModule)
  : null;

export interface FileWatcherEvent {
  filePath: string;
  fileName: string;
}

/**
 * Bridge to the native FileWatcherModule which monitors a directory
 * for new call recordings.
 *
 * On Android, the native side uses a FileObserver (or equivalent) to
 * detect when new audio files appear in the watched directory. When a
 * new recording is found it emits an `onNewRecording` event containing
 * the file path and file name.
 */
export const FileWatcher = {
  /**
   * Start watching the given directory for new recordings.
   *
   * @param path - Directory to monitor. If omitted the native module
   *               uses the default Samsung call recording directory.
   */
  async startWatching(path?: string): Promise<void> {
    if (Platform.OS !== 'android') {
      console.warn('[MindShield] FileWatcher is only supported on Android.');
      return;
    }

    if (!FileWatcherModule) {
      throw new Error('FileWatcherModule is not available');
    }

    await FileWatcherModule.startWatching(path ?? null);
  },

  /**
   * Stop watching for new recordings.
   */
  async stopWatching(): Promise<void> {
    if (!FileWatcherModule) {
      throw new Error('FileWatcherModule is not available');
    }

    await FileWatcherModule.stopWatching();
  },

  /**
   * Returns whether the native file observer is currently active.
   */
  async isWatching(): Promise<boolean> {
    if (!FileWatcherModule) {
      return false;
    }

    return FileWatcherModule.isWatching();
  },

  /**
   * Subscribe to new recording events from the native module.
   *
   * @param callback - Invoked with file path and name whenever a new
   *                   recording is detected.
   * @returns An unsubscribe function. Call it to remove the listener
   *          (e.g. in a cleanup / componentWillUnmount).
   */
  onNewRecording(
    callback: (event: FileWatcherEvent) => void,
  ): () => void {
    if (!eventEmitter) {
      console.warn(
        '[MindShield] Cannot subscribe to FileWatcher events: native module not available.',
      );
      return () => {};
    }

    const subscription = eventEmitter.addListener(
      'onNewRecording',
      callback,
    );

    return () => {
      subscription.remove();
    };
  },
};
