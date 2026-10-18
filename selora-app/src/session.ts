/**
 * Logging out of Selora. Microsoft signs people in before the app opens, so logging out only ends the
 * Selora session in this browser: the app shows the login page until the same account logs in again.
 * Signing out of Microsoft itself is a separate step (MICROSOFT_SIGN_OUT).
 */
const KEY = 'selora.loggedOut'

export const MICROSOFT_SIGN_OUT = 'https://login.microsoftonline.com/common/oauth2/v2.0/logout'

export function isLoggedOut(email: string): boolean {
  try {
    return localStorage.getItem(KEY) === email
  } catch {
    return false
  }
}

export function setLoggedOut(email: string, out: boolean): void {
  try {
    if (out) localStorage.setItem(KEY, email)
    else localStorage.removeItem(KEY)
  } catch {
    /* storage can be blocked; the login page then lasts until the page is reloaded */
  }
}
