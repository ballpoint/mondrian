package webserver

import (
	"bytes"
	"context"
	"encoding/json"
	"html/template"
	"log"
	"net"
	"net/http"
	"net/url"
	"time"

	"golang.org/x/net/html"
	"golang.org/x/net/html/atom"
)

var (
	page *template.Template
)

func init() {
	templ, err := Asset("templates/page.html")

	if err != nil {
		panic(err)
	}

	page, err = template.New("page.html").Parse(string(templ))

	if err != nil {
		panic(err)
	}
}

type props map[string]interface{}

type view struct {
	Name        string
	Props       []byte
	Prerendered template.HTML
}

// All views in Mondrian are top-level React components rendered directly into <body>
func (ctxt *Context) RenderView(name string, p props) error {
	var (
		client = http.Client{
			Timeout: 1 * time.Second,

			Transport: &http.Transport{
				DialContext: func(_ context.Context, _, _ string) (net.Conn, error) {
					return net.Dial("unix", "renderer.sock")
				},
			},
		}
	)

	propsJson, jsonErr := json.Marshal(p)

	if jsonErr != nil {
		return jsonErr
	}

	root := html.Node{
		Type: html.ElementNode,
		Data: "div",
		Attr: []html.Attribute{
			html.Attribute{Key: "data-react-view", Val: name},
			html.Attribute{Key: "data-react-props", Val: string(propsJson)},
		},
	}

	resp, renderErr := client.PostForm("http://unix", url.Values{
		"view":  []string{name},
		"props": []string{string(propsJson)},
	})

	var rootWriter bytes.Buffer

	if renderErr == nil && resp != nil && resp.StatusCode == 200 {

		defer resp.Body.Close()
		renderedNodes, componentErr := html.ParseFragment(resp.Body, &html.Node{
			Type:     html.ElementNode,
			Data:     "body",
			DataAtom: atom.Body,
		})

		if len(renderedNodes) == 1 && componentErr == nil {
			log.Println(renderedNodes)
			root.FirstChild = renderedNodes[0]
		}

	}
	html.Render(&rootWriter, &root)

	ctxt.View = view{
		Name:        name,
		Props:       propsJson,
		Prerendered: template.HTML(rootWriter.String()),
	}

	execErr := ctxt.Render(page)

	if execErr != nil {
		panic(execErr)
	}

	return nil
}
