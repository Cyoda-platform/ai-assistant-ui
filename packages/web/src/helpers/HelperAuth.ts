let tokenGetter: (options?: { cacheMode?: 'off' | 'on' }) => Promise<string> = async () => ''

export function setTokenGetter(fn: (options?: { cacheMode?: 'off' | 'on' }) => Promise<string>) {
  tokenGetter = fn
}

export async function getToken(options?: { cacheMode?: 'off' | 'on' }) {
  return tokenGetter(options)
}
