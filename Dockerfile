FROM node:12.18.1 as frontend_builder
COPY frontend /frontend
WORKDIR /frontend

RUN npm install && npm run build

FROM ekidd/rust-musl-builder AS backend_builder

COPY --chown=rust:rust ./backend ./
RUN mkdir -p bundles
COPY --from=frontend_builder /frontend/dist/*.js bundles/
RUN cargo build --release

FROM alpine:latest
RUN apk --no-cache add ca-certificates
COPY --from=backend_builder /home/rust/src/target/x86_64-unknown-linux-musl/release/dotnotes-backend /usr/local/bin/

ENTRYPOINT [ "/usr/local/bin/dotnotes-backend" ]