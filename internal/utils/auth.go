package utils

import (
	"hjq-notebook/internal/config"
	"strings"

	"github.com/gofiber/fiber/v2"

	"github.com/golang-jwt/jwt"
)

func GetUserId(c *fiber.Ctx) string {
	token := c.Get("Authorization")
	userId := GetFromToken(token, "user_id")
	return userId
}

func GetFromToken(token string, key string) string {

	result, err := ParseToken(token)

	if err != nil {
		return ""
	}
	return result[key].(string)
}

func ParseToken(token string) (jwt.MapClaims, error) {
	tokenContent := token

	if strings.HasPrefix(token, "Bearer ") {
		tokenContent = token[7:]
	}

	secret := config.Config("SECRET")
	claim, err := jwt.Parse(tokenContent, func(token *jwt.Token) (interface{}, error) {
		return []byte(secret), nil
	})
	if err != nil {
		return nil, err
	}
	return claim.Claims.(jwt.MapClaims), nil
}

// RolesFromToken returns the normalized roles claim from a bearer token.
func RolesFromToken(token string) []string {
	claims, err := ParseToken(token)
	if err != nil {
		return nil
	}

	roles := make([]string, 0)
	switch value := claims["roles"].(type) {
	case string:
		roles = append(roles, strings.Split(value, ",")...)
	case []interface{}:
		for _, role := range value {
			if text, ok := role.(string); ok {
				roles = append(roles, text)
			}
		}
	case []string:
		roles = append(roles, value...)
	}

	normalized := roles[:0]
	for _, role := range roles {
		if role = strings.ToLower(strings.TrimSpace(role)); role != "" {
			normalized = append(normalized, role)
		}
	}
	return normalized
}
