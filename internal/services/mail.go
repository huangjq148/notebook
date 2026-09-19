package services

import (
	"bytes"
	"crypto/tls"
	"encoding/base64"
	"fmt"
	"mime"
	"net/smtp"
	"strings"
	"time"
)

// MailConfig 邮件发送配置（QQ 邮箱使用 smtp.qq.com）
type MailConfig struct {
	Host     string
	Port     string
	Username string // 发件邮箱完整地址，如 xxx@qq.com
	Password string // QQ 邮箱的 SMTP 授权码，不是登录密码
	From     string // 可选，默认与 Username 相同
	To       string // 收件邮箱，如 xxx@qq.com
}

// Enabled 判断配置是否完整
func (c MailConfig) Enabled() bool {
	host := c.Host
	if host == "" {
		host = "smtp.qq.com"
	}
	from := c.From
	if from == "" {
		from = c.Username
	}
	return host != "" && c.Port != "" && c.Username != "" && c.Password != "" && from != "" && c.To != ""
}

// SendMailWithAttachment 发送带 csv 附件的邮件
func SendMailWithAttachment(cfg MailConfig, subject, body, filename string, attachment []byte) error {
	if !cfg.Enabled() {
		return fmt.Errorf("邮件配置不完整，请检查 SYNC_MAIL_* 相关配置")
	}

	if cfg.Host == "" {
		cfg.Host = "smtp.qq.com"
	}
	if cfg.Port == "" {
		cfg.Port = "587"
	}
	from := cfg.From
	if from == "" {
		from = cfg.Username
	}

	msg := buildMailMessage(from, cfg.To, subject, body, filename, attachment)
	addr := cfg.Host + ":" + cfg.Port
	auth := smtp.PlainAuth("", cfg.Username, cfg.Password, cfg.Host)

	// 465 端口使用隐式 SSL，其余端口交给 smtp.SendMail 自动 STARTTLS
	if cfg.Port == "465" {
		return sendMailWithImplicitTLS(addr, cfg.Host, auth, from, cfg.To, msg)
	}
	return smtp.SendMail(addr, auth, from, []string{cfg.To}, msg)
}

func buildMailMessage(from, to, subject, body, filename string, attachment []byte) []byte {
	boundary := fmt.Sprintf("hjq-notebook-%d", time.Now().UnixNano())

	headers := []string{
		"From: " + from,
		"To: " + to,
		"Subject: " + mime.QEncoding.Encode("utf-8", subject),
		"MIME-Version: 1.0",
		`Content-Type: multipart/mixed; boundary="` + boundary + `"`,
	}

	var buf bytes.Buffer
	buf.WriteString(strings.Join(headers, "\r\n"))
	buf.WriteString("\r\n\r\n")

	// 正文
	buf.WriteString("--" + boundary + "\r\n")
	buf.WriteString("Content-Type: text/plain; charset=utf-8\r\n")
	buf.WriteString("Content-Transfer-Encoding: base64\r\n\r\n")
	buf.WriteString(wrapBase64([]byte(body)))

	// 附件
	buf.WriteString("--" + boundary + "\r\n")
	buf.WriteString("Content-Type: text/csv; charset=utf-8; name=\"" + filename + "\"\r\n")
	buf.WriteString("Content-Transfer-Encoding: base64\r\n")
	buf.WriteString("Content-Disposition: attachment; filename=\"" + filename + "\"\r\n\r\n")
	buf.WriteString(wrapBase64(attachment))

	buf.WriteString("--" + boundary + "--\r\n")

	return buf.Bytes()
}

// wrapBase64 base64 编码并按 76 字符换行，符合邮件规范
func wrapBase64(data []byte) string {
	encoded := base64.StdEncoding.EncodeToString(data)

	var buf strings.Builder
	for len(encoded) > 76 {
		buf.WriteString(encoded[:76])
		buf.WriteString("\r\n")
		encoded = encoded[76:]
	}
	buf.WriteString(encoded)
	buf.WriteString("\r\n")

	return buf.String()
}

func sendMailWithImplicitTLS(addr, host string, auth smtp.Auth, from, to string, msg []byte) error {
	conn, err := tls.Dial("tcp", addr, &tls.Config{ServerName: host})
	if err != nil {
		return err
	}

	client, err := smtp.NewClient(conn, host)
	if err != nil {
		return err
	}
	defer client.Close()

	if err = client.Auth(auth); err != nil {
		return err
	}
	if err = client.Mail(from); err != nil {
		return err
	}
	if err = client.Rcpt(to); err != nil {
		return err
	}

	writer, err := client.Data()
	if err != nil {
		return err
	}
	if _, err = writer.Write(msg); err != nil {
		return err
	}
	if err = writer.Close(); err != nil {
		return err
	}

	return client.Quit()
}
