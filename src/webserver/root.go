package webserver

func indexViewHandler(ctxt *Context) error {
	return ctxt.RenderView("index", props{})
}

func editorViewHandler(ctxt *Context) error {
	return ctxt.RenderView("editor", props{})
}
