package main

import "github.com/ballpoint/mondrian/src/email"

func main() {
	email.SendTemplate("me@artur.co", "test email", "newsletter/welcome", struct{ Email, UnsubToken string }{Email: "x", UnsubToken: "x"})
}
