package email

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"

	"github.com/ballpoint/lib/config/secret"
)

var (
	listId = "5753c2dd8c"
)

func AddSubscriber(email string) {
	var (
		body bytes.Buffer
		j    = json.NewEncoder(&body)
	)

	j.Encode(map[string]interface{}{
		"email_address": email,
		"status":        "subscribed",
	})

	req, _ := http.NewRequest(http.MethodPost, fmt.Sprintf("https://us17.api.mailchimp.com/3.0/lists/%s/members/", listId), &body)
	req.SetBasicAuth("x", secret.Get("mailchimp", "key"))
	resp, err := (&http.Client{}).Do(req)

	fmt.Println(resp, err)

	out, _ := ioutil.ReadAll(resp.Body)
	fmt.Println(string(out))
}
