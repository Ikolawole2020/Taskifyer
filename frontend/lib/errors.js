/**
 * Converts any Axios/DRF error into a short, user-friendly message.
 * Port of the mobile app's error handler (mobile/src/lib/api.js).
 */

function extractMessage(data) {
  if (data == null) return null;
  if (typeof data === 'string') return data.trim() || null;
  if (Array.isArray(data)) {
    for (const item of data) {
      const msg = extractMessage(item);
      if (msg) return msg;
    }
    return null;
  }
  if (typeof data === 'object') {
    for (const key of ['detail', 'error', 'message', 'non_field_errors']) {
      if (data[key] != null) {
        const msg = extractMessage(data[key]);
        if (msg) return msg;
      }
    }
    for (const [key, value] of Object.entries(data)) {
      const msg = extractMessage(value);
      if (msg) return `${key.replace(/_/g, ' ')}: ${msg}`;
    }
  }
  return null;
}

const STATUS_MESSAGES = {
  400: 'Please check the information you entered and try again.',
  401: 'Your session has expired. Please log in again.',
  403: "You don't have permission to perform this action.",
  404: 'The requested item could not be found.',
  408: 'The request timed out. Please try again.',
  429: 'Too many attempts. Please wait a moment and try again.',
};

export function getApiErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (!error) return fallback;

  if (!error.response) {
    return "Can't reach the server. Please check your internet connection and try again.";
  }

  const status = error.response.status;
  let data = error.response.data;

  // Django DEBUG pages / HTML error documents — never show these to users
  if (typeof data === 'string' && /^\s*</.test(data)) {
    data = null;
    if (status === 404) return STATUS_MESSAGES[404];
    if (status >= 500) return 'Server error. Please try again later.';
  }

  const serverMsg = extractMessage(data);
  if (
    serverMsg &&
    !/(proxy|connectionpool|traceback|ssl|html|internal server|<!doctype)/i.test(serverMsg)
  ) {
    return serverMsg;
  }

  return STATUS_MESSAGES[status] || (status >= 500 ? 'Server error. Please try again later.' : fallback);
}
