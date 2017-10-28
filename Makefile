SHELL := /bin/bash

server:
	go-bindata -pkg webserver -o $(GOPATH)/src/github.com/ballpoint/mondrian/src/webserver/templates_generated.go templates/page.html
	go build -o bin/webserver webserver.go

