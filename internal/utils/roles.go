package utils

import (
	"strings"

	"github.com/golang-jwt/jwt"
)

// 角色常量。roles 在库里与 JWT 里都用逗号分隔的字符串表示，例如 "admin,user"。
const (
	RoleAdmin = "admin"
	RoleUser  = "user"
)

// ParseRoles 把 "admin, user" 解析为 ["admin","user"]（小写、去空、去重）
func ParseRoles(raw string) []string {
	parts := strings.Split(raw, ",")
	result := make([]string, 0, len(parts))
	seen := make(map[string]struct{}, len(parts))

	for _, part := range parts {
		role := strings.ToLower(strings.TrimSpace(part))
		if role == "" {
			continue
		}
		if _, ok := seen[role]; ok {
			continue
		}
		seen[role] = struct{}{}
		result = append(result, role)
	}
	return result
}

// HasRole 判断 roles 串里是否含指定角色（大小写、空格不敏感）
func HasRole(raw, role string) bool {
	target := strings.ToLower(strings.TrimSpace(role))
	if target == "" {
		return false
	}
	for _, item := range ParseRoles(raw) {
		if item == target {
			return true
		}
	}
	return false
}

// NormalizeRoles 规范化角色串；为空时回落普通用户。
//
// 这样「角色信息缺失」等价于「普通用户」，而不是「无限制」。
func NormalizeRoles(raw string) string {
	roles := ParseRoles(raw)
	if len(roles) == 0 {
		return RoleUser
	}
	return strings.Join(roles, ",")
}

// RolesFromToken 从 JWT 中安全读取 roles claim。
//
// 不能复用 GetFromToken：那里是裸类型断言，claim 缺失（老 token、或未执行 migration 的库）
// 会直接 panic。这里缺失或类型不符一律返回空串。
func RolesFromToken(token string) string {
	claims, err := ParseToken(token)
	if err != nil {
		return ""
	}
	return rolesFromClaims(claims)
}

func rolesFromClaims(claims jwt.MapClaims) string {
	if claims == nil {
		return ""
	}

	value, ok := claims["roles"]
	if !ok || value == nil {
		return ""
	}

	switch typed := value.(type) {
	case string:
		return typed
	case []string:
		return strings.Join(typed, ",")
	case []interface{}:
		parts := make([]string, 0, len(typed))
		for _, item := range typed {
			if text, ok := item.(string); ok {
				parts = append(parts, text)
			}
		}
		return strings.Join(parts, ",")
	default:
		return ""
	}
}
