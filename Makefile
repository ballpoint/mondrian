SHELL := /bin/bash

all:
	make webserver

webserver-prod:
	go-bindata -pkg email -o $(GOPATH)/src/github.com/ballpoint/mondrian/src/email/templates_generated.go templates/email
	go-bindata -pkg webserver -o $(GOPATH)/src/github.com/ballpoint/mondrian/src/webserver/templates_generated.go templates/*.html build/prod/manifest.json
	go build -o bin/webserver webserver.go

webserver:
	go-bindata -pkg email -o $(GOPATH)/src/github.com/ballpoint/mondrian/src/email/templates_generated.go templates/email/*
	go-bindata -pkg webserver -o $(GOPATH)/src/github.com/ballpoint/mondrian/src/webserver/templates_generated.go templates/*.html
	go build -o bin/webserver webserver.go
