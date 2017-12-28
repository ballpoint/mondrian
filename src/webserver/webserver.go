package webserver

import (
	"crypto/tls"
	"fmt"
	"net/http"
	"os"
	"time"

	"github.com/ballpoint/mondrian/src/conf"
	"github.com/gorilla/mux"
)

type Webserver struct {
	r           *mux.Router
	httpServer  *http.Server
	httpsServer *http.Server
}

func New() *Webserver {
	r := mux.NewRouter()

	s := &Webserver{
		r: r,
	}

	if conf.Env.Production() {
		// Production: redirect from :80 and listen on :443
		s.httpServer = &http.Server{
			Addr: ":80",
			Handler: http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
				fmt.Println("https://"+req.URL.Host+req.URL.RawPath, 301)
				http.Redirect(w, req, "https://"+req.URL.Host+req.URL.RawPath, 301)
			}),
			ReadTimeout:  10 * time.Second,
			WriteTimeout: 10 * time.Second,
		}

		// Build HTTPS config
		c := &tls.Config{}
		c.Certificates = []tls.Certificate{}

		cert1, _ := tls.LoadX509KeyPair(os.Getenv("MONDRIAN_TLS_CERT"), os.Getenv("MONDRIAN_TLS_KEY"))
		cert2, _ := tls.LoadX509KeyPair(os.Getenv("BALLPOINT_TLS_CERT"), os.Getenv("BALLPOINT_TLS_KEY"))

		c.Certificates = append(c.Certificates, cert1, cert2)

		c.BuildNameToCertificate()

		s.httpsServer = &http.Server{
			Addr: ":443",
			Handler: http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
				w.Header().Set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
				r.ServeHTTP(w, req)
			}),
			ReadTimeout:  10 * time.Second,
			WriteTimeout: 10 * time.Second,
			TLSConfig:    c,
		}
	} else {
		// Dev mode: just listen on 8060

		s.httpServer = &http.Server{
			Addr:         ":8060",
			Handler:      r,
			ReadTimeout:  10 * time.Second,
			WriteTimeout: 10 * time.Second,
		}
	}

	r.PathPrefix("/build/").Handler(http.StripPrefix("/build/", http.FileServer(http.Dir("build/dev"))))
	r.PathPrefix("/assets/").Handler(http.StripPrefix("/assets/", http.FileServer(http.Dir("src"))))

	s.Handle("GET", "/test/unit", testMochaHandler)
	s.Handle("GET", "/test/boolean", testBooleanHandler)

	s.Handle("GET", "/dev/emails", emailListHandler)
	s.Handle("POST", "/newsletter/subscribe", newsletterSubscribeHandler)

	// Support old URL posted to Hacker News
	s.Handle("GET", "/contributing", aliasHandler("/"))

	s.Prefix("/files/{backend}/", editorViewHandler)
	s.Prefix("/files", indexViewHandler)
	s.Handle("GET", "/", editorViewHandler)

	return s
}

func (s *Webserver) Handle(method, route string, h Handler) {
	do := func(w http.ResponseWriter, req *http.Request) {
		context := NewContext(w, req)

		h(context)
	}

	s.r.Path(route).Methods(method).HandlerFunc(do)
}

func (s *Webserver) Prefix(prefix string, h Handler) {
	do := func(w http.ResponseWriter, req *http.Request) {
		context := NewContext(w, req)

		h(context)
	}

	s.r.PathPrefix(prefix).Handler(http.HandlerFunc(do))
}

func aliasHandler(alias string) Handler {
	return func(c *Context) error {
		http.Redirect(c.ResponseWriter, c.Request, "/", 301)
		return nil
	}
}

func (s *Webserver) Run() {
	if s.httpsServer != nil {
		go s.httpsServer.ListenAndServeTLS("", "")
	}
	s.httpServer.ListenAndServe()
}
