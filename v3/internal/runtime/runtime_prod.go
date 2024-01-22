//go:build production

package runtime

import _ "embed"

//go:embed runtime_core_prod.js
var Core string
