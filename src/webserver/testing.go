package webserver

import "html/template"

var (
	mochaTemplate *template.Template
)

func init() {
	templ, err := Asset("templates/mocha.html")

	if err != nil {
		panic(err)
	}

	mochaTemplate, err = template.New("mocha.html").Parse(string(templ))

	if err != nil {
		panic(err)
	}
}

func mochaHandler(ctxt *Context) error {
	return ctxt.Render(mochaTemplate)
}
