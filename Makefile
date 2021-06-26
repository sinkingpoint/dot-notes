.PHONY: bundle-dev bundle dev build cross-arm watch

FRONTEND_FILES=$(shell find frontend/src -type f)
BACKEND_FILES=$(shell find backend/src -type f)

bundle-dev: $(FRONTEND_FILES) $(BACKEND_FILES)
	cd frontend && npm run dev
	mkdir -p backend/bundles && rm -f backend/bundles/*.js
	cp frontend/dist/*.js ./backend/bundles

bundle: $(FRONTEND_FILES) $(BACKEND_FILES)
	cd frontend && npm run build
	mkdir -p backend/bundles && rm -f backend/bundles/*.js
	cp frontend/dist/*.js ./backend/bundles

dev: $(BACKEND_FILES)
	cd backend && cargo build --no-default-features

build: bundle
	cd backend && cargo build --release

cross-arm: bundle
	cd backend && cross build --target armv7-unknown-linux-gnueabihf --release

watch:
	./dev-utils/watch-everything.sh