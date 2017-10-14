package handlers

func RootHandler(ctxt *Context) error {
	ctxt.ResponseWriter.Write([]byte("hello, world!"))
	return nil
}
