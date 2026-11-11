package main

import (
	"bytes"
	"fmt"
	"io"
	"os"

	"hjq-notebook/internal/database"

	"golang.org/x/crypto/bcrypt"
)

func main() {
	passwordInput, err := io.ReadAll(io.LimitReader(os.Stdin, 74))
	if err != nil {
		fail("read password from stdin")
	}
	password := bytes.TrimRight(passwordInput, "\r\n")
	if len(password) == 0 || len(password) > 72 {
		fail("password must contain 1 to 72 bytes")
	}

	passwordHash, err := bcrypt.GenerateFromPassword(password, bcrypt.DefaultCost)
	if err != nil {
		fail("hash password")
	}
	if _, connected := database.ConnectDB(); !connected {
		fail("connect to database")
	}
	defer database.DBConn.Close()

	result, err := database.DBConn.Exec(`UPDATE t_user_account SET password = ? WHERE username = ?`, string(passwordHash), "huangjq")
	if err != nil {
		fail("update huangjq password")
	}
	updated, err := result.RowsAffected()
	if err != nil || updated == 0 {
		fail("huangjq account was not found")
	}
	fmt.Println("huangjq password updated")
}

func fail(message string) {
	fmt.Fprintln(os.Stderr, message)
	os.Exit(1)
}
