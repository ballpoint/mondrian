package conf

import "os"

type (
	Environment string
)

const (
	Development Environment = "development"
	Production  Environment = "production"
)

var Env Environment

func init() {
	Env = Environment(os.Getenv("MONDRIAN_ENV"))

	if Env == "" {
		Env = Development
	}
}

func (env Environment) Production() bool {
	return env == Production
}
