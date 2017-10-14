package handlers

import "net/http"

type Context struct {
	http.ResponseWriter
	*http.Request
}

type Handler func(*Context) error
