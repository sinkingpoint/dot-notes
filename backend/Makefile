.PHONY: bundle-dev bundle dev build cross-arm watch

bundle-dev:
	cd ../frontend && npm run dev
	mkdir -p bundles && rm -f bundles/*.js
	cp ../frontend/dist/*.js ./bundles

bundle:
	cd ../frontend && npm run build
	mkdir -p bundles && rm -f bundles/*.js
	cp ../frontend/dist/*.js ./bundles

dev:
	cargo build --no-default-features
	
build: bundle
	cargo build --release

cross-arm: bundle
	cross build --target armv7-unknown-linux-gnueabihf --release

watch:
	./dev-utils/watch-everything.sh