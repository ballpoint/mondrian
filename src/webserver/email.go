package webserver

import (
	"bytes"
	"database/sql"
	"fmt"
	"strings"
	"time"

	"github.com/ballpoint/lib/db/postgres"
	"github.com/ballpoint/mondrian/src/email"
)

func emailListHandler(ctxt *Context) error {
	var emails []string

	err := postgres.Do("ballpoint", func(db *sql.DB) error {

		rows, err := db.Query("SELECT email, created FROM newsletter_subscribers")

		if err != nil {
			return err
		}

		for rows.Next() {
			var (
				email   string
				created time.Time
			)

			scanErr := rows.Scan(&email, &created)

			if scanErr == nil {
				emails = append(emails, fmt.Sprintf("%-40s %s", email, created.String()))
			}
		}
		return nil
	})

	ctxt.Write(bytes.NewBufferString(strings.Join(emails, "\n")), "text/plain")

	return err
}

func newsletterSubscribeHandler(ctxt *Context) error {
	var (
		addr = ctxt.Request.PostFormValue("email")
	)

	email.AddSubscriber(addr)

	return nil
}
