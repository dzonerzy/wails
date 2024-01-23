//go:build darwin

package runtime

import (
	_ "embed"
)

func invoke() string {
	return `window._wails=window._wails||{};window._wails.invoke=function(msg){window.webkit.messageHandlers.external.postMessage(msg);};`
}
