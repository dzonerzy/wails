package runtime

import (
	"context"

	"github.com/dzonerzy/wails/v2/pkg/menu"
)

func MenuSetApplicationMenu(ctx context.Context, menu *menu.Menu) {
	frontend := getFrontend(ctx)
	frontend.MenuSetApplicationMenu(menu)
}

func MenuUpdateApplicationMenu(ctx context.Context) {
	frontend := getFrontend(ctx)
	frontend.MenuUpdateApplicationMenu()
}
