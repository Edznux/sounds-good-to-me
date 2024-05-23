package processor

import (
	"context"
	"fmt"
	"slices"

	"bytes"

	sitter "github.com/smacker/go-tree-sitter"
	"github.com/smacker/go-tree-sitter/golang"
)

// omegalul, this should probably be a tree or something less dumb that a slice of states for each byte of the file.
// It duplicates a crap ton of state
var GoComplexity = []string{
	"if_statement",
	"for_statement",
	"function_declaration",
	"expression_case",
	"for_statement",
	"&&",
	"||",
}

type State struct {
	Complexity int  `json:"complexity"`
	Vulnerable bool `json:"vulnerable"`
	IsSink     bool `json:"is_sink"`
	IsSource   bool `json:"is_source"`
}

type Result struct {
	LineCount int     `json:"line_count"`
	ByteCount int     `json:"byte_count"`
	States    []State `json:"states"`
}

func AnalyzeAST(ctx context.Context, data []byte) (*Result, error) {
	states := make([]State, len(data))

	parser := sitter.NewParser()
	parser.SetLanguage(golang.GetLanguage())

	n, err := parser.ParseCtx(ctx, nil, data)
	if err != nil {
		return nil, err
	}
	TraverseTree(n.RootNode(), states)
	// for i := range states {
	// 	fmt.Println(i, states[i].Complexity)
	// }
	lineCount := bytes.Count(data, []byte("\n"))

	return &Result{
		LineCount: lineCount,
		ByteCount: len(data),
		States:    states,
	}, nil
}

func TraverseTree(n *sitter.Node, states []State) {
	if n == nil {
		fmt.Println("Node is nil")
		return
	}
	// fmt.Println(n.StartByte(), n.EndByte(), n.Type())
	if slices.Contains(GoComplexity, n.Type()) {
		// fmt.Println("added complexity")
		for i := n.StartByte(); i < n.EndByte(); i++ {
			if states[i].Complexity == 0 {
				states[i] = State{
					Complexity: 1,
				}
			} else {
				states[i].Complexity++
			}
		}
	}

	if n.Type() == "pointer_type" {
		// fmt.Println("added sink")
		for i := n.StartByte(); i < n.EndByte(); i++ {
			states[i].IsSink = true
		}
	}
	if n.Type() == "type_conversion_expression" {
		// fmt.Println("added source")
		for i := n.StartByte(); i < n.EndByte(); i++ {
			states[i].IsSource = true
		}
	}

	for child := range n.ChildCount() {
		TraverseTree(n.Child(int(child)), states)
	}
}
