package webserver

import (
	"encoding/json"
	"path/filepath"

	"github.com/ballpoint/mondrian/src/conf"
)

var assetsManifest = make(map[string]string)

func init() {
	if conf.Env.Production() {
		manifest, mErr := Asset("build/prod/manifest.json")
		if mErr != nil {
			panic(mErr)
		}
		err := json.Unmarshal(manifest, &assetsManifest)
		if err != nil {
			panic(err)
		}
	}
}

func (ctxt *Context) AssetURL(path string) string {
	if conf.Env.Production() {
		return "https://d3ozpu4dhcdupq.cloudfront.net" + path
	} else {
		return path
	}
}

func (ctxt *Context) Bundle(bundle string) string {
	if conf.Env.Production() {
		if path, ok := assetsManifest[bundle]; ok {
			return ctxt.AssetURL(filepath.Join("/build", path))
		} else {
			return bundle
		}
	} else {
		return ctxt.AssetURL(filepath.Join("/build", bundle))
	}
}
