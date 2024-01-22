//go:build !production

package runtime

import _ "embed"

//go:embed runtime_core_debug.js
var Core string
