package webserver

import (
	"net/http"

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

	r.PathPrefix("/assets/").Handler(http.StripPrefix("/assets/", http.FileServer(http.Dir("build"))))

	s.Handle("/", editorViewHandler)

	return s
}

func (s *Webserver) Handle(route string, h Handler) {
	do := func(w http.ResponseWriter, req *http.Request) {
		context := &Context{
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
