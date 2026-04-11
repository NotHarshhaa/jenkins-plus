package cmd

import (
	"bytes"
	"fmt"
	"io"
	"net/http"
	"time"
)

// doHTTP performs a single HTTP request with basic auth.
func doHTTP(method, url, user, token string, body []byte, timeout time.Duration) ([]byte, error) {
	var reqBody io.Reader
	if body != nil {
		reqBody = bytes.NewReader(body)
	}

	req, err := http.NewRequest(method, url, reqBody)
	if err != nil {
		return nil, fmt.Errorf("create request: %w", err)
	}

	if user != "" && token != "" {
		req.SetBasicAuth(user, token)
	}

	client := &http.Client{Timeout: timeout}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request %s %s: %w", method, url, err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read response body: %w", err)
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		snippet := string(respBody)
		if len(snippet) > 200 {
			snippet = snippet[:200] + "..."
		}
		return nil, fmt.Errorf("HTTP %d from %s: %s", resp.StatusCode, url, snippet)
	}

	return respBody, nil
}

// jenkinsHTTPWithHeaders is like jenkinsHTTP but lets the caller inject extra headers.
func jenkinsHTTPWithHeaders(method, url, user, token string, body []byte, headers map[string]string, timeout time.Duration) ([]byte, error) {
	const maxRetries = 3
	var lastErr error

	for attempt := 1; attempt <= maxRetries; attempt++ {
		b, err := doHTTPWithHeaders(method, url, user, token, body, headers, timeout)
		if err == nil {
			return b, nil
		}
		lastErr = err
		if attempt < maxRetries {
			time.Sleep(time.Duration(attempt) * 2 * time.Second)
		}
	}
	return nil, fmt.Errorf("after %d attempts: %w", maxRetries, lastErr)
}

func doHTTPWithHeaders(method, url, user, token string, body []byte, headers map[string]string, timeout time.Duration) ([]byte, error) {
	var reqBody io.Reader
	if body != nil {
		reqBody = bytes.NewReader(body)
	}

	req, err := http.NewRequest(method, url, reqBody)
	if err != nil {
		return nil, fmt.Errorf("create request: %w", err)
	}

	if user != "" && token != "" {
		req.SetBasicAuth(user, token)
	}
	for k, v := range headers {
		req.Header.Set(k, v)
	}

	client := &http.Client{Timeout: timeout}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request %s %s: %w", method, url, err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read response body: %w", err)
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		snippet := string(respBody)
		if len(snippet) > 200 {
			snippet = snippet[:200] + "..."
		}
		return nil, fmt.Errorf("HTTP %d from %s: %s", resp.StatusCode, url, snippet)
	}

	return respBody, nil
}
