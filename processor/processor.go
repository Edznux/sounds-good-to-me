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
	Complexity int
	Vulnerable bool
}

type Result struct {
	LineCount int
	ByteCount int
	States    []State
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
	for i := range states {
		fmt.Println(i, states[i].Complexity)
	}
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
	if slices.Contains(GoComplexity, n.Type()) {
		// fmt.Println(n.StartByte(), n.EndByte(), n.Type())
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
	for child := range n.ChildCount() {
		TraverseTree(n.Child(int(child)), states)
	}
}
