package main

import "github.com/ballpoint/mondrian/src/webserver"

func main() {
	server := webserver.New()

	server.Run()

}
