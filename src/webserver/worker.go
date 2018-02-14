package webserver

import (
	"bytes"
	"fmt"
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
			assetsManifest["app.css"],
			assetsManifest["app.js"],
			assetsManifest["vendor.js"],
		}
		out := strings.Replace(string(base), "DEPENDENCIES_PLACEHOLDER", strings.Join(deps, ",\n"), 1)

		return ctxt.Write(bytes.NewBuffer([]byte(out)), "application/javascript")
	}
}
