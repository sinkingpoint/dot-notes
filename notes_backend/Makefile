.PHONY: bundle-dev bundle dev build cross-arm

bundle-dev:
	cd ../notes-frontend && npm run dev
	mkdir -p bundles && rm -f bundles/*.js
	cp ../notes-frontend/dist/*.js ./bundles

bundle:
	cd ../notes-frontend && npm run build
	mkdir -p bundles && rm -f bundles/*.js
	cp ../notes-frontend/dist/*.js ./bundles

dev: bundle-dev
	cargo build
	RUST_LOG="warp=debug" ./target/debug/notes_backend -l localhost:3030 &
	xdg-open http://localhost:3030

build: bundle
	cargo build --release

cross-arm: bundle
	cross build --target armv7-unknown-linux-gnueabihf --release
