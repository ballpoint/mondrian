SHELL := /bin/bash


webserver-prod:
	go-bindata -pkg webserver -o $(GOPATH)/src/github.com/ballpoint/mondrian/src/webserver/templates_generated.go templates/*.html build/prod/manifest.json
	go build -o bin/webserver webserver.go

webserver:
	go-bindata -pkg webserver -o $(GOPATH)/src/github.com/ballpoint/mondrian/src/webserver/templates_generated.go templates/*.html
	go build -o bin/webserver webserver.go

all:
	make webserver


