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

export function setToken(token: TokenInterface, username: string) {
  try {
    if (token.access_token) {
      setAuthToken(token);
      addTokenToList({
        username,
        token: token.access_token,
      });
      return true;
    }
  } catch (error) {
    console.error('setToken error:', error);
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

// 将 token 添加到 localStorage 列表
export function addTokenToList(data: { username: string; token: string }) {
  const cacheStr = localStorage.getItem('login_token_list');
  const cacheList: {
    username: string;
    token: string;
  }[] = cacheStr ? JSON.parse(cacheStr) : [];
  let newList = [...cacheList];

  if (cacheList.some((item) => item.username === data.username)) {
    newList = cacheList.map((item) => {
      if (item.username === data.username) {
        return data;
      }
      return item;
    });
  } else {
    newList.push(data);
  }

  localStorage.setItem('login_token_list', JSON.stringify(newList));
}

export function getTokenList() {
  return JSON.parse(localStorage.getItem('login_token_list') ?? '[]');
}

export function deleteCatchToken(username: string) {
  const cacheStr = localStorage.getItem('login_token_list');
  const cacheList: {
    username: string;
    token: string;
  }[] = cacheStr ? JSON.parse(cacheStr) : [];
  const newList = cacheList.filter((item) => item.username !== username);
  localStorage.setItem('login_token_list', JSON.stringify(newList));
}
