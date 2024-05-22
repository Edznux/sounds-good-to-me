var fileEl = document.getElementById("file")
var submitEl = document.getElementById("submit")
var testbutton = document.getElementById("test")
var code1button = document.getElementById("code1")
var code2button = document.getElementById("code2")
var code3button = document.getElementById("code3")
var lpsEl = document.getElementById("lps")
var lpsDisplayEl = document.getElementById("lps-display")

let LINES_PER_SEC = lpsEl.valueAsNumber;
lpsDisplayEl.innerText = LINES_PER_SEC.toString();

lpsEl.addEventListener("input", function(){
    LINES_PER_SEC = lpsEl.valueAsNumber;
    lpsDisplayEl.innerText = LINES_PER_SEC.toString();
}

const exampleCode1=`package processor
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
	Complexity int  \`json:"complexity"\`
	Vulnerable bool \`json:"vulnerable"\`
}

type Result struct {
	LineCount int     \`json:"line_count"\`
	ByteCount int     \`json:"byte_count"\`
	States    []State \`json:"states"\`
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
`
const exampleCode2 = `
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
	Content string \`json:"content"\`
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

	log.Println("Server started on http://localhost:8080")

	fmt.Println("lol ended sound")
	log.Fatal(http.ListenAndServe(":8000", nil))
}
`

const exampleCode3 = `// Unless explicitly stated otherwise all files in this repository are licensed
// under the Apache License Version 2.0.
// This product includes software developed at Datadog (https://www.datadoghq.com/).
// Copyright 2016-present Datadog, Inc.

//go:build linux && (functionaltests || stresstests)

// Package tests holds tests related files
package tests

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"sync"
	"time"

	"golang.org/x/sys/unix"
	"golang.org/x/time/rate"

	"k8s.io/apimachinery/pkg/util/rand"
)

const (
	mountDirName        = "mount"
	parentMountDirName  = "parent_mount"
	discardersDirName   = "discarders"
	noDiscardersDirName = "no_discarders"
	filePathLen         = 10
)

type fgMessage int

const (
	stop fgMessage = iota
	start
)

// FileGenerator defines a file generator
type FileGenerator struct {
	rootPath string
	contexts map[string]*FileGeneratorContext
	wg       sync.WaitGroup
}

// NewFileGenerator returns a new file generator
func NewFileGenerator(rootPath string) (*FileGenerator, error) {
	if err := os.MkdirAll(rootPath, 0755); err != nil {
		return nil, err
	}
	return &FileGenerator{
		rootPath: rootPath,
		contexts: make(map[string]*FileGeneratorContext),
	}, nil
}

// FileGeneratorConfig defines a file generator config
type FileGeneratorConfig struct {
	id           string
	TestDuration time.Duration
	Debug        bool

	// files creation
	MaxTotalFiles  int
	EventsPerSec   int
	MountDir       bool
	MountParentDir bool
	RemountEvery   time.Duration
	MaxDepth       int

	// select actions to be executed randomly on created files:
	Open bool
	// Rename bool
	// Utimes bool
	// Chmod  bool
	// Chown  bool
}

// FileStat defines stat
type FileStat struct {
	path string
	ino  uint64
}

// EstimatedResult defines estimated result
type EstimatedResult struct {
	FileCreation int64
	FileAccess   int64
	FileDeletion int64

	DiscarderPushed       []FileStat
	ParentDiscarderPushed []FileStat
	EventDiscarded        int64
	EventSent             int64
}

// Print print the result
func (es *EstimatedResult) Print() {
	fmt.Printf("  == Done:\n")
	fmt.Printf("  File creation: %d\n", es.FileCreation)
	fmt.Printf("  File access: %d\n", es.FileAccess)
	fmt.Printf("  File deletion: %d\n", es.FileDeletion)
	fmt.Printf("  == Estimated result:\n")
	fmt.Printf("  DiscarderPushed: %d\n", len(es.DiscarderPushed))
	fmt.Printf("  ParentDiscarderPushed: %d\n", len(es.ParentDiscarderPushed))
	fmt.Printf("  EventDiscarded: %d\n", es.EventDiscarded)
	fmt.Printf("  EventSent: %d\n", es.EventSent)
}

func (es *EstimatedResult) add(es2 *EstimatedResult) {
	es.DiscarderPushed = append(es.DiscarderPushed, es2.DiscarderPushed...)
	es.ParentDiscarderPushed = append(es.ParentDiscarderPushed, es2.ParentDiscarderPushed...)
	es.EventDiscarded += es2.EventDiscarded
	es.EventSent += es2.EventSent
	es.FileCreation += es2.FileCreation
	es.FileAccess += es2.FileAccess
	es.FileDeletion += es2.FileDeletion
}

// FileGeneratorContext defines a file generator context
type FileGeneratorContext struct {
	config              FileGeneratorConfig
	rootPath            string
	mountPoint          string
	parentMountPoint    string
	baseDirDiscarders   string
	baseDirNoDiscarders string
	files               []string
	limiter             *rate.Limiter
	messages            chan fgMessage
	result              EstimatedResult
	firstOpen           bool
	firstUnlink         bool
}

func (fg *FileGenerator) newFileGeneratorContext(config FileGeneratorConfig) *FileGeneratorContext {
	baseDir := fg.rootPath
	var mountPoint, parentMountPoint string
	if config.MountDir {
		if config.MountParentDir {
			parentMountPoint = filepath.Join(baseDir, parentMountDirName)
			baseDir = filepath.Join(baseDir, parentMountDirName, mountDirName)
		} else {
			baseDir = filepath.Join(baseDir, mountDirName)
		}
		mountPoint = baseDir
	}
	baseDirDiscarders := filepath.Join(baseDir, discardersDirName)
	baseDirNoDiscarders := filepath.Join(baseDir, noDiscardersDirName)

	return &FileGeneratorContext{
		config:              config,
		rootPath:            fg.rootPath,
		mountPoint:          mountPoint,
		parentMountPoint:    parentMountPoint,
		baseDirDiscarders:   baseDirDiscarders,
		baseDirNoDiscarders: baseDirNoDiscarders,
		limiter:             rate.NewLimiter(rate.Limit(config.EventsPerSec), 1),
		messages:            make(chan fgMessage),
	}
}

// Printf the context
func (fgc *FileGeneratorContext) Printf(format string, a ...any) {
	if fgc.config.Debug {
		fmt.Printf(format, a...)
	}
}

func (fgc *FileGeneratorContext) resetFirstStates() {
	fgc.firstOpen = true
	fgc.firstUnlink = true
}

func (fgc *FileGeneratorContext) getFileInode(file string) (uint64, error) {
	var s unix.Stat_t
	if err := unix.Stat(file, &s); err != nil {
		fmt.Printf("getFileInode error: %s (%s)\n", err, file)
		return 0, err
	}
	fgc.Printf(" -> Ino: %d for %s\n", s.Ino, file)
	return s.Ino, nil
}

func (fgc *FileGeneratorContext) addFileToMetric(file string, metric *[]FileStat) {
	ino, err := fgc.getFileInode(file)
	if err != nil {
		return
	}
	*metric = append(*metric, FileStat{
		path: file,
		ino:  ino,
	})
}

func (fgc *FileGeneratorContext) generateNewFile() {
	var filename string
	for depth := rand.Int() % fgc.config.MaxDepth; depth >= 0; depth-- {
		filename = filepath.Join(filename, rand.String(filePathLen))
	}
	filename += ".txt"
	fgc.files = append(fgc.files, filename)

	file := filepath.Join(fgc.baseDirDiscarders, filename)
	fgc.Printf("Create: %s\n", file)
	_ = os.MkdirAll(filepath.Dir(file), 0755)
	_ = os.WriteFile(file, []byte("Is this a discarder?\n"), 0666)
	if fgc.firstOpen {
		fgc.firstOpen = false
		fgc.addFileToMetric(filepath.Dir(file), &fgc.result.ParentDiscarderPushed)
		fgc.result.EventSent++
	} else {
		fgc.result.EventDiscarded++
	}

	file = filepath.Join(fgc.baseDirNoDiscarders, filename)
	fgc.Printf("Create: %s\n", file)
	_ = os.MkdirAll(filepath.Dir(file), 0755)
	_ = os.WriteFile(file, []byte("Is this a discarder?\n"), 0666)
	fgc.addFileToMetric(file, &fgc.result.DiscarderPushed)
	fgc.result.EventSent++

	fgc.result.FileCreation++
}

func (fgc *FileGeneratorContext) unlinkFile() {
	if len(fgc.files) <= 0 {
		return // should not happen
	}
	index := rand.Int() % len(fgc.files)
	randomFile := fgc.files[index]

	file := filepath.Join(fgc.baseDirDiscarders, randomFile)
	fgc.Printf("Removing: %s\n", file)
	if fgc.firstUnlink {
		fgc.firstUnlink = false
		fgc.addFileToMetric(filepath.Dir(file), &fgc.result.ParentDiscarderPushed)
		fgc.result.EventSent++
	} else {
		fgc.result.EventDiscarded++
	}
	_ = os.Remove(file)

	file = filepath.Join(fgc.baseDirNoDiscarders, randomFile)
	fgc.Printf("Removing: %s\n", file)
	_ = os.Remove(file)
	fgc.result.EventSent++

	fgc.result.FileDeletion++
	fgc.files = append(fgc.files[:index], fgc.files[index+1:]...)
}

func (fgc *FileGeneratorContext) openFile() {
	if len(fgc.files) <= 0 {
		return // should not happen
	}
	index := rand.Int() % len(fgc.files)
	randomFile := fgc.files[index]

	file := filepath.Join(fgc.baseDirDiscarders, randomFile)
	fgc.Printf("Opening: %s\n", file)
	_ = os.WriteFile(file, []byte("file opened once!\n"), 0666)
	fgc.result.EventDiscarded++

	file = filepath.Join(fgc.baseDirNoDiscarders, randomFile)
	fgc.Printf("Opening: %s\n", file)
	_ = os.WriteFile(file, []byte("file opened once!\n"), 0666)
	fgc.result.EventDiscarded++

	fgc.result.FileAccess++
}

func (fgc *FileGeneratorContext) doSomething() {
	if len(fgc.files) == fgc.config.MaxTotalFiles {
		fgc.unlinkFile()
	} else if len(fgc.files) < fgc.config.MaxTotalFiles/2 {
		fgc.generateNewFile()
	} else {
		rand := rand.Int() % 3
		if fgc.config.Open && rand == 0 {
			fgc.openFile()
		} else if rand == 1 {
			fgc.generateNewFile()
		} else {
			fgc.unlinkFile()
		}
	}
}

func (fgc *FileGeneratorContext) mountParentWordDir() {
	if fgc.parentMountPoint == "" {
		return
	}
	fgc.Printf("Mount memfs on %s\n", fgc.parentMountPoint)
	_ = os.MkdirAll(fgc.parentMountPoint, 0755)
	err := unix.Mount("", fgc.parentMountPoint, "tmpfs", 0, "")
	if err != nil {
		fmt.Printf("mountParentWordDir error: %s\n", err)
	}
	fgc.resetFirstStates()
}

func (fgc *FileGeneratorContext) mountWordDir() {
	if fgc.mountPoint == "" {
		return
	}
	fgc.Printf("Mount memfs on %s\n", fgc.mountPoint)
	_ = os.MkdirAll(fgc.mountPoint, 0755)
	err := unix.Mount("", fgc.mountPoint, "tmpfs", 0, "")
	if err != nil {
		fmt.Printf("mountWordDir error: %s\n", err)
	}
	fgc.resetFirstStates()
}

func (fgc *FileGeneratorContext) unmountParentWordDir() {
	if fgc.parentMountPoint == "" {
		return
	}
	fgc.Printf("Unmount %s\n", fgc.parentMountPoint)
	err := unix.Unmount(fgc.parentMountPoint, unix.MNT_DETACH)
	if err != nil {
		fmt.Printf("unmountParentWordDir error: %s\n", err)
	}
	fgc.files = []string{}
}

func (fgc *FileGeneratorContext) unmountWordDir() {
	if fgc.mountPoint == "" {
		return
	}
	fgc.Printf("Unmount %s\n", fgc.mountPoint)
	err := unix.Unmount(fgc.mountPoint, 0)
	if err != nil {
		fmt.Printf("unmountWordDir error: %s\n", err)
	}
	fgc.files = []string{}
}

func (fgc *FileGeneratorContext) start(wg *sync.WaitGroup) {
	wg.Add(1)
	go func() {
		defer wg.Done()

		fgc.mountParentWordDir()
		defer fgc.unmountParentWordDir()
		fgc.mountWordDir()
		defer fgc.unmountWordDir()
		remountTicker := time.NewTicker(fgc.config.RemountEvery)

		var testEnd *time.Time
		started := false
		fgc.resetFirstStates()
		for {
			if testEnd != nil && time.Now().After(*testEnd) {
				fgc.Printf("%s enddd!\n", fgc.config.id)
				return
			}

			select {
			case res := <-fgc.messages:
				if res == stop {
					fgc.Printf("%s stopped!\n", fgc.config.id)
					return // stop
				} else if res == start {
					fgc.Printf("%s started!\n", fgc.config.id)
					t := time.Now().Add(fgc.config.TestDuration)
					testEnd = &t
					started = true
				}
			case <-remountTicker.C:
				if fgc.parentMountPoint != "" {
					fgc.unmountParentWordDir()
				} else {
					fgc.unmountWordDir()
				}
				fgc.mountParentWordDir()
				fgc.mountWordDir()
			case <-time.After(time.Millisecond * 10):
				if started && fgc.limiter.Allow() {
					fgc.doSomething()
				} else {
					time.Sleep(time.Millisecond * 100)
				}
			}
		}
	}()
}

// PrepareFileGenerator prepare the file generator
func (fg *FileGenerator) PrepareFileGenerator(config FileGeneratorConfig) error {
	ctx := fg.newFileGeneratorContext(config)
	if fg.contexts[config.id] != nil {
		return errors.New("context ID already present")
	}
	fg.contexts[config.id] = ctx
	ctx.start(&fg.wg)
	return nil
}

// Start the file generator
func (fg *FileGenerator) Start() error {
	if len(fg.contexts) == 0 {
		return errors.New("no prepared contexts")
	}
	for _, ctx := range fg.contexts {
		ctx.Printf("Starting file generator: %s\n", ctx.config.id)
		ctx.messages <- start
	}
	return nil
}

// Wait for the result
func (fg *FileGenerator) Wait() (*EstimatedResult, error) {
	if len(fg.contexts) == 0 {
		return nil, errors.New("no running contexts")
	}

	// wait
	fg.wg.Wait()

	// get estimated results
	var res EstimatedResult
	for _, ctx := range fg.contexts {
		res.add(&ctx.result)
	}
	fg.contexts = make(map[string]*FileGeneratorContext)
	return &res, nil
}
`

fileEl.value = exampleCode1

code1button?.addEventListener("click", function(){
    fileEl.value = exampleCode1
});
code2button?.addEventListener("click", function(){
    fileEl.value = exampleCode2
});
code3button?.addEventListener("click", function(){
    fileEl.value = exampleCode3
});

testbutton?.addEventListener("click", function(){
    Tone.start();
    const synth = new Tone.PolySynth(Tone.Synth).toDestination();
    synth.triggerAttackRelease("C4", "8n");
});

// submitEl?.addEventListener("click", function(){
// 	Tone.start();
// 	console.log("audio is ready");
//     playSound();
// });

submitEl?.addEventListener("click", function(){
    Tone.start();
    console.log("audio is ready");
    upload(fileEl.value, playSound)
});


interface State {
    complexity: number;
    vulnerable: boolean;
}

interface Result {
    line_count: number;
    byte_count: number;
    states: State[];
}

function upload(data, callback){
    fetch("/upload", {
        method: "POST",
        mode: "cors",
        cache: "no-cache",
        credentials: "same-origin",
        redirect: "follow",
        referrerPolicy: "no-referrer",
        body: JSON.stringify({"Content": data}),
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
      }).then(function(response){
        return response.json()
        // alert(response.json());
      }).then(function(data){
        console.log(data);
        callback(data)
      })
      .catch(function(error){
        console.log(error);
      });
}

function lineToduration(lineCount: number) :number {
    return lineCount * (1/LINES_PER_SEC);
}

const baseNote = "C4";
function soundMap(value: number) :string {
    switch(value){
        case 0: return "D4";
        case 1: return "E4";
        case 2: return "C2";
        case 3: return "C2";
        default: return baseNote;
    }
}


function playSound(data: Result) {
    //create a synth and connect it to the main output (your speakers)
    // const synth = new Tone.Synth().toDestination();
    
    //play a middle 'C' for the duration of an 8th note
    let durationTotal = lineToduration(data.line_count)
    let durationPerNote = durationTotal/data.states.length
    console.log(durationTotal+ "second(s) (line count:"+ data.line_count+ ", Lines/sec: "+ data.line_count/durationTotal + ") with "+ data.states.length+ " notes" + " duration per note: "+ durationPerNote)
    
    const now = Tone.now();
    const synth = new Tone.PolySynth().toDestination();
    synth.volume.value = -20;
    const drum = new Tone.AMSynth().toDestination();
    drum.volume.value = +10;
    // const baseline = new Tone.MembraneSynth().connect(synth);
    synth.triggerAttackRelease(baseNote, durationTotal);
    
    let notes: string[] = [];
    for (let i = 0; i < data.states.length; i++){
        let note = soundMap(data.states[i].complexity)
        notes.push(note);
    }
    
    for (let i = 0; i < notes.length; i++){
        // This skips created notes that are the same as the previous note
        if(i > 0 && notes[i] == notes[i-1]){
            continue;
        }
        // It's already part of the baseline, lets not double submit
        if(notes[i] == baseNote){
            continue;
        }
        drum.triggerAttackRelease(notes[i], durationPerNote, now + i * durationPerNote);
    }
}