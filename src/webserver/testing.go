package webserver

import "html/template"

var (
	mochaTemplate, boolTemplate *template.Template
)

func init() {
	mochaTemplate = loadTemplate("templates/mocha.html")
	boolTemplate = loadTemplate("templates/bool.html")
}

func testMochaHandler(ctxt *Context) error {
	return ctxt.Render(mochaTemplate)
}

func testBooleanHandler(ctxt *Context) error {
	return ctxt.Render(boolTemplate)
}
