package webserver

import (
	"database/sql"
	"fmt"
	"log"

	"github.com/ballpoint/lib/db/postgres"
)

func emailListHandler(ctxt *Context) error {
	err := postgres.Do("ballpoint", func(db *sql.DB) error {

		rows, err := db.Query("SELECT (email) FROM newsletter_subscribers")
		log.Println(rows, err)

		for rows.Next() {
			var email string

			rows.Scan(&email)

			fmt.Println(email)
		}
		return nil
	})

	return err
}
