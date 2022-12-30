install:
	npm ci

lint:
	npx eslint .

f-lint:
	npx eslint --fix .

test:
	npx jest .