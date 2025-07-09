import {
  isCouldNotEstablishConnectionError,
  isExtensionContextInvalidatedError,
  isBackForwardCacheError,
  throwRuntimeLastError,
} from '../background/browser-api/errors';
import { WAKE_UP_BACKGROUND } from '../shared/messages';
import { getMinutesInMs } from '../shared/utils/dates-helper';
import { ignore } from '../shared/utils/errors';
import { Logger } from '../shared/utils/logger';

const SOURCE = 'CONTENT/SLEEP-COUNTER-MEASURES';

let messagePollingId = 0;
let backgroundPort: chrome.runtime.Port | null = null;

function tryWakeUpBackground() {
 try {
  chrome.runtime?.sendMessage({ type: WAKE_UP_BACKGROUND }, (response) => {
    if (!response) {
      console.error('Background is not awake');
    }
      throwRuntimeLastError();

    // Continue polling only if the background is not invalidated and visible
    if (document.visibilityState === 'visible') {
      messagePollingId = window.setTimeout(
        () => tryWakeUpBackground(),
        getMinutesInMs(1)
      );
    }
  });
  } catch (error) {
      ignore(
        isExtensionContextInvalidatedError,
        isCouldNotEstablishConnectionError,
        isBackForwardCacheError
      )(error);
      Logger.debug(SOURCE,"tryWakeUpBackground => ignore Error " + error)
    }
}

function connectToExtension() {
  try {
    if (backgroundPort) {
      return; // Already connected
    }

    backgroundPort = chrome.runtime.connect({ name: "codealike-chrome" }); // Use a name for the port

    backgroundPort.onDisconnect.addListener(() => {
      //console.log("Disconnected from background script.");
      backgroundPort = null; // Reset the port

      
        throwRuntimeLastError(); // Your error logging function
      

      // Fallback reconnection after a delay
      setTimeout(connectToExtension, getMinutesInMs(1));
    });

    // Optionally, send an initial message upon successful connection
    backgroundPort.onMessage.addListener((message) => {
      console.log("Received message from background:", message);
      // Handle messages
    });

    // console.log("Connected to background script.");
  } catch (error) {
      ignore(
        isExtensionContextInvalidatedError,
        isCouldNotEstablishConnectionError,
        isBackForwardCacheError
      )(error);
      Logger.debug(SOURCE,"connectToExtension => ignore Error " + error)
    }
}

export const runManifestV3SleepCounterMeasures = () => {
  tryWakeUpBackground();
  connectToExtension();

  // if page is on foreground, try to wake up background
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      window.clearTimeout(messagePollingId);
      tryWakeUpBackground();
    }
  });
};

// Listen for the 'pageshow' event to attempt immediate reconnection
// when the page is restored from the back/forward cache
window.addEventListener('pageshow', (event) => {
  if (event.persisted && !backgroundPort) {
    Logger.debug(SOURCE,"pageshow: Page restored from cache, attempting immediate reconnection.")
    connectToExtension();
  }
});