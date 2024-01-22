//go:build production

package runtime

import (
	_ "embed"
	"fmt"
	"runtime"
)

//go:embed runtime_core_prod.js
var core string

func Core() string {
	env := fmt.Sprintf(`window._wails=window._wails||{};window._wails.environment={"OS":"%s","Arch":"%s"};`, runtime.GOOS, runtime.GOARCH)
	return invoke() + env + core
}
