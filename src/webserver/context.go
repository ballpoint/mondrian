package webserver

import "net/http"

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
