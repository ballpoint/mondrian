package webserver

func editorViewHandler(ctxt *Context) error {
	//fn := "sbux.svg"
	//svgData, _ := ioutil.ReadFile(filepath.Join("src/svg", fn))
	//ctxt.Title = fn

	return ctxt.RenderView("editor", props{
	/*
		"doc": props{
			"svg":  string(svgData),
			"name": fn,
		},
	*/
	})
}
