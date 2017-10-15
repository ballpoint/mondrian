package webserver

import "net/http"

type Context struct {
	http.ResponseWriter
	*http.Request

	View view
}
