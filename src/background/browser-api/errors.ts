export function throwRuntimeLastError() {
  const error = chrome.runtime.lastError;
  if (error?.message) {
    throw new Error(error.message);
  }
}

export function isTabNotExistError(error: unknown): error is Error {
  return (
    error instanceof Error &&
    error.message.toLowerCase().startsWith('no tab with id')
  );
}

export function isCouldNotEstablishConnectionError(
  error: unknown
): error is Error {
  return (
    error instanceof Error &&
    error.message.toLowerCase().startsWith('could not establish connection')
  );
}

export function isUserDraggingWindowError(error: unknown): error is Error {
  return (
    error instanceof Error &&
    error.message.toLowerCase().indexOf('user may be dragging a tab') > -1
  );
}

export function isExtensionContextInvalidatedError(
  error: unknown
): error is Error {
  return (
    error instanceof Error &&
    error.message.toLowerCase().indexOf('extension context invalidated') > -1
  );
}



// This file defines several utility functions for handling errors in a Chrome extension. 
// The throwRuntimeLastError function retrieves the last runtime error from the Chrome 
// runtime and throws it as a standard Error if it has a message property. 
// The other functions (isTabNotExistError, isCouldNotEstablishConnectionError, 
// isUserDraggingWindowError, and isExtensionContextInvalidatedError) take an error argument 
// and return a boolean indicating whether the error is of a specific type. Each function 
// checks whether the error argument is an instance of Error and whether the error message 
// matches a specific string pattern, returning true if so and false otherwise. 
// These functions can be used to selectively handle errors in a Chrome extension based on their type.