package webserver

import (
	"bytes"
	"fmt"
	"io/ioutil"
	"strings"
)

func serviceWorkerHandler(ctxt *Context) error {

	base, err := ioutil.ReadFile("src/script/cache.js")

	if err != nil {
		fmt.Println(err)
		return err
	} else {
		var deps []string
		for _, v := range assetsManifest {
			deps = append(deps, "'/build/"+v+"'")
		}
		out := strings.Replace(string(base), "DEPENDENCIES_PLACEHOLDER", strings.Join(deps, ",\n"), 1)

		return ctxt.Write(bytes.NewBuffer([]byte(out)), "application/javascript")
	}
}
