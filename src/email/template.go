package email

import (
	"bytes"
	"fmt"
	"html/template"
	"io/ioutil"
	"path/filepath"

	"github.com/ballpoint/lib/email"
)

var (
	base = string(MustAsset("templates/email/base.html"))
)

func SendTemplate(to, subject, path string, presenter interface{}) error {
	emailHtml := MustAsset(filepath.Join("templates/email", path+".html"))
	emailText := MustAsset(filepath.Join("templates/email", path+".txt"))

	h, e1 := template.New("html").Parse(string(base))
	fmt.Println(e1)
	h, e1 = h.Parse(string(emailHtml))
	fmt.Println(e1)
	t, e2 := template.New("html").Parse(string(base))
	fmt.Println(e2)
	t, e2 = t.Parse(string(emailText))
	fmt.Println(e2)

	var bh = bytes.NewBuffer([]byte{})
	var bt = bytes.NewBuffer([]byte{})
	h.Execute(bh, presenter)
	t.Execute(bt, presenter)

	fmt.Println(bh.String())
	fmt.Println(bt.String())

	ioutil.WriteFile("out.html", bh.Bytes(), 0755)

	email.Send("me@artur.co", "Ballpoint updates subscription", bh.String(), bt.String())
	return nil
}
