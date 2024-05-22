FROM golang:1.22.3 as builder
RUN mkdir /app
WORKDIR /app
ADD . .
RUN go build -o ./sgtm
CMD ["/app/sgtm"]
