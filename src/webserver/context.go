package webserver

import (
	"compress/gzip"
	"html/template"
	"io"
	"net/http"
	"strings"

	"github.com/ballpoint/mondrian/src/conf"
)

type Context struct {
	http.ResponseWriter
	*http.Request

	Env conf.Environment

	View view

	Title string

	ResponseCode int
}

func NewContext(w http.ResponseWriter, req *http.Request) *Context {
	return &Context{
		ResponseWriter: w,
		Request:        req,
		ResponseCode:   200,
		Env:            conf.Env,
	}
}

func (ctxt *Context) FormatTitle() string {
	if ctxt.Title != "" {
		return ctxt.Title + " - Mondrian"
	} else {
		return "Mondrian"
	}
}

func (ctxt *Context) Render(templ *template.Template) error {
	return templ.Execute(ctxt.ResponseWriter, ctxt)
}

func (ctxt *Context) Write(content io.Reader, contentType string) error {
	w := ctxt.ResponseWriter

	if strings.Contains(ctxt.Request.Header.Get("Accept-Encoding"), "gzip") {
		// Gzip that shit
		w.Header().Set("Content-Encoding", "gzip")
		w.Header().Set("Content-Type", contentType)
		w.Header().Add("Vary", "Accept-Encoding")
		w.WriteHeader(ctxt.ResponseCode)
		gz := gzip.NewWriter(w)
		defer gz.Close()

		_, err := io.Copy(gz, content)
		return err
	} else {
		_, err := io.Copy(w, content)
		return err
	}
}
