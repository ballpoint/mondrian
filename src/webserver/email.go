package webserver

import "github.com/ballpoint/mondrian/src/email"

func newsletterSubscribeHandler(ctxt *Context) error {
	var (
		addr = ctxt.Request.PostFormValue("email")
	)

	email.AddSubscriber(addr)

	return nil
}
