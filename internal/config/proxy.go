package config

import (
	"log"
	"strings"
)

// ProxyConfig 反向代理下的真实 IP 解析配置。
//
// 全部由环境变量驱动，默认关闭：不配置时行为与改造前完全一致
// （fiber 的 c.IP() 取 RemoteIP()）。
type ProxyConfig struct {
	// ProxyHeader 存放真实客户端 IP 的请求头，例如 X-Forwarded-For
	ProxyHeader string
	// TrustedProxies 可信代理地址/网段，例如 10.0.0.0/8
	TrustedProxies []string
	// EnableTrustedProxyCheck 仅当 header 与白名单同时存在时才为 true
	EnableTrustedProxyCheck bool
}

// Enabled 是否真的启用了反代 IP 解析
func (p ProxyConfig) Enabled() bool {
	return p.EnableTrustedProxyCheck && p.ProxyHeader != "" && len(p.TrustedProxies) > 0
}

// ResolveProxyConfig 解析 OPLOG_PROXY_HEADER / OPLOG_TRUSTED_PROXIES。
//
// 安全联动（重要）：只有「header 非空」且「可信代理白名单非空」时才启用。
// 只配 header 不配白名单时，Fiber 会无条件信任该请求头 → 客户端可以随便伪造 IP：
// 见 fiber@v2.39.0/ctx.go:1739 `IsProxyTrusted()` —— EnableTrustedProxyCheck=false 时
// 它直接返回 true，于是只要 ProxyHeader 非空，c.IP() 就取请求头里的值。
// 因此这里必须把 ProxyHeader 也清空（不能只把 EnableTrustedProxyCheck 置 false）。
func ResolveProxyConfig() ProxyConfig {
	header := strings.TrimSpace(Config("OPLOG_PROXY_HEADER"))
	proxies := parseProxyList(Config("OPLOG_TRUSTED_PROXIES"))

	switch {
	case header == "" && len(proxies) == 0:
		// 默认：不启用，行为与改造前一致
		return ProxyConfig{}

	case header == "":
		log.Println("[warn] [代理] 已配置 OPLOG_TRUSTED_PROXIES 但 OPLOG_PROXY_HEADER 为空，反代 IP 解析未启用（继续使用 RemoteIP）")
		return ProxyConfig{}

	case len(proxies) == 0:
		log.Printf("[warn] [代理] OPLOG_PROXY_HEADER=%q 但 OPLOG_TRUSTED_PROXIES 为空：为防止客户端伪造 IP，"+
			"已忽略该配置（反代 IP 解析未启用，请同时配置可信代理网段）", header)
		return ProxyConfig{}
	}

	log.Printf("[代理] 已启用反代真实 IP 解析：header=%s trustedProxies=%v", header, proxies)
	return ProxyConfig{
		ProxyHeader:             header,
		TrustedProxies:          proxies,
		EnableTrustedProxyCheck: true,
	}
}

// parseProxyList 逗号分隔 -> 去空、去空格后的切片
func parseProxyList(raw string) []string {
	parts := strings.Split(raw, ",")
	result := make([]string, 0, len(parts))
	for _, part := range parts {
		if item := strings.TrimSpace(part); item != "" {
			result = append(result, item)
		}
	}
	return result
}
