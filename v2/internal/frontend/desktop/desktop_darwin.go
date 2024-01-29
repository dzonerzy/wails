//go:build darwin
// +build darwin

package desktop

import (
	"context"

	"github.com/dzonerzy/wails/v2/internal/frontend/desktop/darwin"

	"github.com/dzonerzy/wails/v2/internal/binding"
	"github.com/dzonerzy/wails/v2/internal/frontend"

	"github.com/dzonerzy/wails/v2/internal/logger"
	"github.com/dzonerzy/wails/v2/pkg/options"
)

func NewFrontend(ctx context.Context, appoptions *options.App, logger *logger.Logger, appBindings *binding.Bindings, dispatcher frontend.Dispatcher) frontend.Frontend {
	return darwin.NewFrontend(ctx, appoptions, logger, appBindings, dispatcher)
}
