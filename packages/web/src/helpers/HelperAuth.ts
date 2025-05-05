let tokenGetter: () => Promise<string> = async () => ''

export function setTokenGetter(fn: () => Promise<string>) {
  tokenGetter = fn
}

export async function getToken() {
  return tokenGetter()
}
