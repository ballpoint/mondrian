package webserver

import (
	"bytes"
	"database/sql"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/ballpoint/lib/db/postgres"
)

func emailListHandler(ctxt *Context) error {
	var emails []string

	err := postgres.Do("ballpoint", func(db *sql.DB) error {

		rows, err := db.Query("SELECT email, created FROM newsletter_subscribers")

		for rows.Next() {
			var (
				email   string
				created time.Time
			)

			scanErr := rows.Scan(&email, &created)

			emails = append(emails, fmt.Sprintf("%-40s %s", email, created.String()))
		}
		return nil
	})

	ctxt.Write(bytes.NewBufferString(strings.Join(emails, "\n")), "text/plain")

	return err
}

func newsletterSubscribeHandler(ctxt *Context) error {
	postgres.Do("ballpoint", func(db *sql.DB) error {
		email := ctxt.Request.PostFormValue("email")

		_, err := db.Exec("INSERT INTO newsletter_subscribers (email, created) VALUES ($1, $2)", email, time.Now())
		log.Println(err)
		return nil

	})

	return nil
}
