package main

import (
	"log"

	"github.com/ballpoint/mondrian/src/webserver"
)

func main() {
	log.SetFlags(log.LstdFlags | log.Lshortfile)
	server := webserver.New()
	server.Run()
}
