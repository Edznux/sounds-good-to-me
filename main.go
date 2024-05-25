package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"github.com/Edznux/sound-based-analysis/processor"
)

type Content struct {
	Content string `json:"content"`
}

func uploadHandler(w http.ResponseWriter, r *http.Request) {
	ctx := context.Background()
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var p Content
	err := json.NewDecoder(r.Body).Decode(&p)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	res, err := processor.AnalyzeAST(ctx, []byte(p.Content))
	if err != nil {
		http.Error(w, "Failed to analyze AST", http.StatusInternalServerError)
		return
	}
	// Process the uploaded file data here
	// You can save it to disk, parse it, or perform any other operations
	err = json.NewEncoder(w).Encode(res)
	if err != nil {
		panic(err)
	}
}

func main() {
	http.HandleFunc("/upload", uploadHandler)
	fs := http.FileServer(http.Dir("./static"))
	http.Handle("/", fs)

	log.Println("Server started on http://localhost:8000")

	fmt.Println("lol ended sound")
	log.Fatal(http.ListenAndServe(":8000", nil))
}
