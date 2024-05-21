package main

import (
	"context"
	"fmt"
	"io"
	"log"
	"net/http"

	"github.com/Edznux/sound-based-analysis/processor"
	"github.com/Edznux/sound-based-analysis/sound"
)

func uploadHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	file, _, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "Failed to retrieve file", http.StatusBadRequest)
		return
	}
	defer file.Close()

	data, err := io.ReadAll(file)
	if err != nil {
		http.Error(w, "Failed to read file", http.StatusInternalServerError)
		return
	}

	ctx := context.Background()
	res, err := processor.AnalyzeAST(ctx, data)
	if err != nil {
		http.Error(w, "Failed to analyze AST", http.StatusInternalServerError)
		return
	}
	fmt.Println(res)

	// Process the uploaded file data here
	// You can save it to disk, parse it, or perform any other operations
	w.Write([]byte("File uploaded successfully"))
}

func main() {
	http.HandleFunc("/upload", uploadHandler)
	log.Println("Server started on http://localhost:8080")

	sound.Start()
	fmt.Println("lol ended sound")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
