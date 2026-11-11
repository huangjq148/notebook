const TokenKey = 'token';
const accessTokenKey = `${TokenKey}-access`;
// 角色与 token 同生命周期存放：登录成功写入，退出/换号时清除
const rolesKey = `${TokenKey}-roles`;
interface TokenInterface {
  access_token: string;
  expires_in?: number;
}

/** 把角色串（如 "admin,user"）解析为数组（小写、去空、去重） */
export function parseRoles(raw?: string | null): string[] {
  if (!raw) {
    return [];
  }
  const seen = new Set<string>();
  const result: string[] = [];
  raw.split(',').forEach((item) => {
    const role = item.trim().toLowerCase();
    if (role && !seen.has(role)) {
      seen.add(role);
      result.push(role);
    }
  });
  return result;
}

/** 保存角色（跟随 token 生命周期） */
export function setRoles(raw?: string | null) {
  localStorage.setItem(rolesKey, raw ?? '');
}

/** 读取当前登录用户的角色 */
export function getRoles(): string[] {
  return parseRoles(localStorage.getItem(rolesKey));
}

/** 是否拥有指定角色 */
export function hasRole(role: string): boolean {
  const target = role.trim().toLowerCase();
  return !!target && getRoles().includes(target);
}

/** 是否是管理员（操作日志等管理功能用） */
export function isAdmin(): boolean {
  return hasRole('admin');
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
  // 角色跟随 token：退出登录时一并清理，避免下次登录沿用旧角色
  localStorage.removeItem(rolesKey);
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
