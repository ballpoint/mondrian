$(npm bin)/prettier $(cat .prettier) --write src/script/*.js
$(npm bin)/prettier $(cat .prettier) --write src/script/**/*.js
