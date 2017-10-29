package webserver

import (
	"net/http"

	"github.com/ballpoint/mondrian/src/conf"
)

type Context struct {
	http.ResponseWriter
	*http.Request

	View view

	Title string
}

func NewContext(w http.ResponseWriter, req *http.Request) *Context {
	return &Context{
		ResponseWriter: w,
		Request:        req,
	}
}

func (ctxt *Context) FormatTitle() string {
	if ctxt.Title != "" {
		return ctxt.Title + " - Mondrian"
	} else {
		return "Mondrian"
	}
}

func (ctxt *Context) AssetURL(path string) string {
	if conf.Env.Production() {
		return "https://d3ozpu4dhcdupq.cloudfront.net" + path
	} else {
		return "/assets" + path
	}
}
