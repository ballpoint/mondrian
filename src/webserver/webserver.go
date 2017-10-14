package webserver

import (
	"net/http"

	"github.com/ballpoint/mondrian/src/webserver/handlers"
	"github.com/gorilla/mux"
)

type Webserver struct {
	r      *mux.Router
	server *http.Server
}

func New() *Webserver {
	r := mux.NewRouter()

	s := &Webserver{
		r: r,
		server: &http.Server{
			Addr:    ":8060",
			Handler: r,
		},
	}

	s.Handle("/", handlers.RootHandler)

	return s
}

func (s *Webserver) Handle(route string, h handlers.Handler) {
	do := func(w http.ResponseWriter, req *http.Request) {
		context := &handlers.Context{
			ResponseWriter: w,
			Request:        req,
		}

		h(context)
	}

	s.r.HandleFunc(route, do)
}

func (s *Webserver) Run() {
	s.server.ListenAndServe()
}
