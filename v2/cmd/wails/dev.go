package main

import (
	"os"

	"github.com/dzonerzy/wails/v2/cmd/wails/flags"
	"github.com/dzonerzy/wails/v2/cmd/wails/internal/dev"
	"github.com/dzonerzy/wails/v2/internal/colour"
	"github.com/dzonerzy/wails/v2/pkg/clilogger"
	"github.com/pterm/pterm"
)

func devApplication(f *flags.Dev) error {
	if f.NoColour {
		pterm.DisableColor()
		colour.ColourEnabled = false
	}

	quiet := f.Verbosity == flags.Quiet

	// Create logger
	logger := clilogger.New(os.Stdout)
	logger.Mute(quiet)

	if quiet {
		pterm.DisableOutput()
	} else {
		app.PrintBanner()
	}

	err := f.Process()
	if err != nil {
		return err
	}

	return dev.Application(f, logger)
}
