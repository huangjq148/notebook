const TokenKey = 'token';
const accessTokenKey = `${TokenKey}-access`;
interface TokenInterface {
  access_token: string;
  expires_in?: number;
}


export function getToken(): { access_token: string } {
  const access_token: string = localStorage.getItem(accessTokenKey) || '';

  return {
    access_token,
  };
}

export function getAccessToken() {
  return localStorage.getItem(accessTokenKey);
}

export function setToken(token: TokenInterface) {
  try {
    if (token.access_token) {
      setAuthToken(token);
      return true;
    }
  } catch (error) {
    return false;
  }
}

export function setAuthToken(token: TokenInterface) {
  const { access_token, expires_in } = token;
  localStorage.setItem(accessTokenKey, access_token);
  localStorage.setItem(`${accessTokenKey}_expires_in`, expires_in + '');
}

export function removeToken() {
  localStorage.removeItem(accessTokenKey);
  return true;
}

export function hasToken() {
  return !!localStorage.getItem(accessTokenKey) || false;
}
