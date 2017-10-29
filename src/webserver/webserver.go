package webserver

import (
	"net/http"

	"github.com/ballpoint/mondrian/src/conf"
	"github.com/gorilla/mux"
)

type Webserver struct {
	r      *mux.Router
	server *http.Server
}

func New() *Webserver {
	r := mux.NewRouter()

	var addr string = ":8060"
	if conf.Env.Production() {
		addr = ":80"
	}

	s := &Webserver{
		r: r,
		server: &http.Server{
			Addr:    addr,
			Handler: r,
		},
	}

	r.PathPrefix("/assets/build/").Handler(http.StripPrefix("/assets/build/", http.FileServer(http.Dir("build/dev"))))

	s.Handle("/", editorViewHandler)

	return s
}

func (s *Webserver) Handle(route string, h Handler) {
	do := func(w http.ResponseWriter, req *http.Request) {
		context := NewContext(w, req)

		h(context)
	}

	s.r.HandleFunc(route, do)
}

func (s *Webserver) Run() {
	s.server.ListenAndServe()
}
