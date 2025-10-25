import * as Sentry from '@sentry/node'

const DSN = process.env.SENTRY_DSN || ''
const ENV = process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development'
const RELEASE = process.env.SENTRY_RELEASE

let initialized = false

export function initSentry() {
  if (initialized) return
  if (!DSN) {
    // No-op if DSN not provided — keep API surface available for calls
    // so instrumentation can remain in code without throwing.
    // eslint-disable-next-line no-console
    console.warn('[sentry] SENTRY_DSN not set — Sentry disabled')
    initialized = true
    return
  }

  Sentry.init({
    dsn: DSN,
    environment: ENV,
    release: RELEASE,
    // Leave traces disabled by default; enable explicitly if desired.
    tracesSampleRate: 0.0,
  })
  initialized = true
}

// Initialize on import so routes can simply import Sentry and use it.
initSentry()

export default Sentry

export const flush = (timeout = 2000) => {
  try {
    return Sentry.flush(timeout)
  } catch (e) {
    // If Sentry isn't initialised or flushing fails, swallow the error.
    // eslint-disable-next-line no-console
    console.warn('[sentry] flush failed', e)
    return Promise.resolve(false)
  }
}
