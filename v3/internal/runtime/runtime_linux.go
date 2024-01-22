//go:build linux

package runtime

import (
	_ "embed"
)

func invoke() string {
	return `window._wails=window._wails||{};window._wails.invoke=window.webkit.messageHandlers.external.postMessage;`
}
