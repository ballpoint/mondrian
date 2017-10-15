package webserver

func editorViewHandler(ctxt *Context) error {

	ctxt.RenderView("editor", props{})

	return nil
}
