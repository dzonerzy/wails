package runtime

import (
	"fmt"
	"runtime"
)

func GetEnvironment() string {
	return fmt.Sprintf(`window._wails=window._wails||{};window._wails.environment={"OS":"%s","Arch":"%s","Debug":true}`, runtime.GOOS, runtime.GOARCH)
}
