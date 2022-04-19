BINARY_NAME=nonbiri
BINARY_DIRECTORY=bin

VERSION=$(shell cat version.txt)
BUILD=$(shell git rev-parse HEAD)

PLATFORMS=darwin linux
ARCHITECTURES=386 amd64
LDFLAGS=-ldflags="-s -w -X 'main.Version=${VERSION}' -X 'main.Build=${BUILD}'"

default: build

all: test build build-view

build:
	$(foreach GOOS,$(PLATFORMS),\
		$(foreach GOARCH,$(ARCHITECTURES),\
			$(shell export GOOS=$(GOOS) GOARCH=$(GOARCH))\
			$(shell go build $(LDFLAGS) -o $(BINARY_DIRECTORY)/$(BINARY_NAME)_$(GOOS)-$(GOARCH))\
		)\
	)

build-view:
	cd view && yarn && yarn prod

run:
	cd ${BINARY_DIRECTORY} && ./${BINARY_NAME}_linux-amd64

dev:
	cd ${BINARY_DIRECTORY} && ./${BINARY_NAME}_linux-amd64 -mode=debug

dev-view:
	cd view && yarn && yarn dev

test:
	go test ./... -v -timeout 10m

.PHONY: build
