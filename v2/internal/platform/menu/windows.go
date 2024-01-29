//go:build windows

package menu

import "github.com/dzonerzy/wails/v2/internal/platform/win32"

type Menu struct {
	menu win32.HMENU
}
