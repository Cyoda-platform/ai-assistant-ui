let tokenGetter: (options?: { cacheMode?: 'off' | 'on' }) => Promise<string> = async () => ''
let auth0Logout: (() => void) | null = null

export function setTokenGetter(fn: (options?: { cacheMode?: 'off' | 'on' }) => Promise<string>) {
  tokenGetter = fn
}

export async function getToken(options?: { cacheMode?: 'off' | 'on' }) {
  return tokenGetter(options)
}

export function setAuth0Logout(fn: () => void) {
  auth0Logout = fn
}

// Triggers a full Auth0 logout (clearing the Auth0 session cookie) so the
// user actually becomes unauthenticated. Returns true if a logout function
// was registered and invoked.
export function triggerAuth0Logout(): boolean {
  if (auth0Logout) {
    auth0Logout()
    return true
  }
  return false
}
