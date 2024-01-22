//go:build windows

package runtime

import (
	_ "embed"
)

func invoke() string {
	return `window._wails=window._wails||{};window._wails.invoke=window.chrome.webview.postMessage;`
}
