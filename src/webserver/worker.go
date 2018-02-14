package webserver

import (
	"bytes"
	"fmt"
	"path/filepath"
	"strings"
)

func serviceWorkerHandler(ctxt *Context) error {

	base, err := Asset("src/script/cache.js")

	if err != nil {
		fmt.Println(err)
		return err
	} else {
		// These are the three files required for minimal offline functionality
		var deps = []string{
			"'" + ctxt.AssetURL(filepath.Join("/build", assetsManifest["app.css"])) + "'",
			"'" + ctxt.AssetURL(filepath.Join("/build", assetsManifest["app.js"])) + "'",
			"'" + ctxt.AssetURL(filepath.Join("/build", assetsManifest["vendor.js"])) + "'",
		}
		out := strings.Replace(string(base), "DEPENDENCIES_PLACEHOLDER", strings.Join(deps, ",\n"), 1)

		return ctxt.Write(bytes.NewBuffer([]byte(out)), "application/javascript")
	}
}
