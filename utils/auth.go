package utils

import (
	"api-fiber-gorm/config"
	"strings"

	"github.com/golang-jwt/jwt"
)

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
