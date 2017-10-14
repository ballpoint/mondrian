SHELL := /bin/bash

server:
	go build -o bin/webserver webserver.go

