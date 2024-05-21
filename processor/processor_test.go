package processor

import (
	"context"
	"reflect"
	"testing"
)

func TestAnalyzeAST(t *testing.T) {
	type args struct {
		data []byte
	}
	tests := []struct {
		name    string
		args    args
		want    *Result
		wantErr bool
	}{
		{
			name: "Test 1",
			args: args{
				data: []byte(`
				package main
				import (
					"fmt"
				)
				function main() {
					fmt.Println("Hello, World!")
				}
			`),
			},
			want:    &Result{},
			wantErr: false,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := AnalyzeAST(context.Background(), tt.args.data)
			if (err != nil) != tt.wantErr {
				t.Errorf("AnalyzeAST() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !reflect.DeepEqual(got, tt.want) {
				t.Errorf("AnalyzeAST() = %v, want %v", got, tt.want)
			}
		})
	}
}
