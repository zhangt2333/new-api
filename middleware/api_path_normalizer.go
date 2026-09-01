package middleware

import "net/http"

// START custom api path normalization change: accept common OpenAI and Anthropic base URL composition mistakes.
var apiPathAliases = map[string]string{
	"/chat/completions":        "/v1/chat/completions",
	"/v1/v1/chat/completions":  "/v1/chat/completions",
	"/completions":             "/v1/completions",
	"/v1/v1/completions":       "/v1/completions",
	"/messages":                "/v1/messages",
	"/v1/v1/messages":          "/v1/messages",
	"/responses":               "/v1/responses",
	"/v1/v1/responses":         "/v1/responses",
	"/responses/compact":       "/v1/responses/compact",
	"/v1/v1/responses/compact": "/v1/responses/compact",
}

// NormalizeAPIPath normalizes explicitly supported API path aliases before Gin matches routes.
func NormalizeAPIPath(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost && r.URL != nil {
			if canonicalPath, ok := apiPathAliases[r.URL.Path]; ok {
				r.URL.Path = canonicalPath
				r.URL.RawPath = ""
				r.RequestURI = r.URL.RequestURI()
			}
		}
		next.ServeHTTP(w, r)
	})
}

// END custom api path normalization change: route compatible requests through canonical /v1 endpoints.
