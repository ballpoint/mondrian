package webserver

import "io/ioutil"

func editorViewHandler(ctxt *Context) error {

	svgData, _ := ioutil.ReadFile("src/svg/handletest.svg")

	ctxt.RenderView("editor", props{
		"doc": props{
			"svg":  string(svgData),
			"name": "handletest.svg",
		},
	})

	return nil
}
