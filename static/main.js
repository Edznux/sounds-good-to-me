var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var fileEl = document.getElementById("file");
var submitEl = document.getElementById("submit");
var testbutton = document.getElementById("test");
var code1button = document.getElementById("code1");
var code2button = document.getElementById("code2");
var code3button = document.getElementById("code3");
var code4button = document.getElementById("code4");
var lpsEl = document.getElementById("lps");
var lpsDisplayEl = document.getElementById("lps-display");
var baseNote = "C4";
var LINES_PER_SEC = lpsEl.valueAsNumber;
var exampleCode1 = "package processor\nimport (\n\t\"context\"\n\t\"fmt\"\n\t\"slices\"\n\n\t\"bytes\"\n\n\tsitter \"github.com/smacker/go-tree-sitter\"\n\t\"github.com/smacker/go-tree-sitter/golang\"\n)\n\n// omegalul, this should probably be a tree or something less dumb that a slice of states for each byte of the file.\n// It duplicates a crap ton of state\nvar GoComplexity = []string{\n\t\"if_statement\",\n\t\"for_statement\",\n\t\"function_declaration\",\n\t\"expression_case\",\n\t\"for_statement\",\n\t\"&&\",\n\t\"||\",\n}\n\ntype State struct {\n\tComplexity int  `json:\"complexity\"`\n\tVulnerable bool `json:\"vulnerable\"`\n}\n\ntype Result struct {\n\tLineCount int     `json:\"line_count\"`\n\tByteCount int     `json:\"byte_count\"`\n\tStates    []State `json:\"states\"`\n}\n\nfunc AnalyzeAST(ctx context.Context, data []byte) (*Result, error) {\n\tstates := make([]State, len(data))\n\n\tparser := sitter.NewParser()\n\tparser.SetLanguage(golang.GetLanguage())\n\n\tn, err := parser.ParseCtx(ctx, nil, data)\n\tif err != nil {\n\t\treturn nil, err\n\t}\n\tTraverseTree(n.RootNode(), states)\n\tfor i := range states {\n\t\tfmt.Println(i, states[i].Complexity)\n\t}\n\tlineCount := bytes.Count(data, []byte(\"\n\"))\n\n\treturn &Result{\n\t\tLineCount: lineCount,\n\t\tByteCount: len(data),\n\t\tStates:    states,\n\t}, nil\n}\n\nfunc TraverseTree(n *sitter.Node, states []State) {\n\tif n == nil {\n\t\tfmt.Println(\"Node is nil\")\n\t\treturn\n\t}\n\tif slices.Contains(GoComplexity, n.Type()) {\n\t\t// fmt.Println(n.StartByte(), n.EndByte(), n.Type())\n\t\tfor i := n.StartByte(); i < n.EndByte(); i++ {\n\t\t\tif states[i].Complexity == 0 {\n\t\t\t\tstates[i] = State{\n\t\t\t\t\tComplexity: 1,\n\t\t\t\t}\n\t\t\t} else {\n\t\t\t\tstates[i].Complexity++\n\t\t\t}\n\t\t}\n\t}\n\tfor child := range n.ChildCount() {\n\t\tTraverseTree(n.Child(int(child)), states)\n\t}\n}\n";
var exampleCode2 = "\npackage main\n\nimport (\n\t\"context\"\n\t\"encoding/json\"\n\t\"fmt\"\n\t\"log\"\n\t\"net/http\"\n\n\t\"github.com/Edznux/sound-based-analysis/processor\"\n)\n\ntype Content struct {\n\tContent string `json:\"content\"`\n}\n\nfunc uploadHandler(w http.ResponseWriter, r *http.Request) {\n\tctx := context.Background()\n\tif r.Method != http.MethodPost {\n\t\thttp.Error(w, \"Method not allowed\", http.StatusMethodNotAllowed)\n\t\treturn\n\t}\n\tvar p Content\n\terr := json.NewDecoder(r.Body).Decode(&p)\n\tif err != nil {\n\t\thttp.Error(w, err.Error(), http.StatusBadRequest)\n\t\treturn\n\t}\n\n\tres, err := processor.AnalyzeAST(ctx, []byte(p.Content))\n\tif err != nil {\n\t\thttp.Error(w, \"Failed to analyze AST\", http.StatusInternalServerError)\n\t\treturn\n\t}\n\t// Process the uploaded file data here\n\t// You can save it to disk, parse it, or perform any other operations\n\terr = json.NewEncoder(w).Encode(res)\n\tif err != nil {\n\t\tpanic(err)\n\t}\n}\n\nfunc main() {\n\thttp.HandleFunc(\"/upload\", uploadHandler)\n\tfs := http.FileServer(http.Dir(\"./static\"))\n\thttp.Handle(\"/\", fs)\n\n\tlog.Println(\"Server started on http://localhost:8080\")\n\n\tfmt.Println(\"lol ended sound\")\n\tlog.Fatal(http.ListenAndServe(\":8000\", nil))\n}\n";
var exampleCode3 = "// Unless explicitly stated otherwise all files in this repository are licensed\n// under the Apache License Version 2.0.\n// This product includes software developed at Datadog (https://www.datadoghq.com/).\n// Copyright 2016-present Datadog, Inc.\n\n//go:build linux && (functionaltests || stresstests)\n\n// Package tests holds tests related files\npackage tests\n\nimport (\n\t\"errors\"\n\t\"fmt\"\n\t\"os\"\n\t\"path/filepath\"\n\t\"sync\"\n\t\"time\"\n\n\t\"golang.org/x/sys/unix\"\n\t\"golang.org/x/time/rate\"\n\n\t\"k8s.io/apimachinery/pkg/util/rand\"\n)\n\nconst (\n\tmountDirName        = \"mount\"\n\tparentMountDirName  = \"parent_mount\"\n\tdiscardersDirName   = \"discarders\"\n\tnoDiscardersDirName = \"no_discarders\"\n\tfilePathLen         = 10\n)\n\ntype fgMessage int\n\nconst (\n\tstop fgMessage = iota\n\tstart\n)\n\n// FileGenerator defines a file generator\ntype FileGenerator struct {\n\trootPath string\n\tcontexts map[string]*FileGeneratorContext\n\twg       sync.WaitGroup\n}\n\n// NewFileGenerator returns a new file generator\nfunc NewFileGenerator(rootPath string) (*FileGenerator, error) {\n\tif err := os.MkdirAll(rootPath, 0755); err != nil {\n\t\treturn nil, err\n\t}\n\treturn &FileGenerator{\n\t\trootPath: rootPath,\n\t\tcontexts: make(map[string]*FileGeneratorContext),\n\t}, nil\n}\n\n// FileGeneratorConfig defines a file generator config\ntype FileGeneratorConfig struct {\n\tid           string\n\tTestDuration time.Duration\n\tDebug        bool\n\n\t// files creation\n\tMaxTotalFiles  int\n\tEventsPerSec   int\n\tMountDir       bool\n\tMountParentDir bool\n\tRemountEvery   time.Duration\n\tMaxDepth       int\n\n\t// select actions to be executed randomly on created files:\n\tOpen bool\n\t// Rename bool\n\t// Utimes bool\n\t// Chmod  bool\n\t// Chown  bool\n}\n\n// FileStat defines stat\ntype FileStat struct {\n\tpath string\n\tino  uint64\n}\n\n// EstimatedResult defines estimated result\ntype EstimatedResult struct {\n\tFileCreation int64\n\tFileAccess   int64\n\tFileDeletion int64\n\n\tDiscarderPushed       []FileStat\n\tParentDiscarderPushed []FileStat\n\tEventDiscarded        int64\n\tEventSent             int64\n}\n\n// Print print the result\nfunc (es *EstimatedResult) Print() {\n\tfmt.Printf(\"  == Done:\n\")\n\tfmt.Printf(\"  File creation: %d\n\", es.FileCreation)\n\tfmt.Printf(\"  File access: %d\n\", es.FileAccess)\n\tfmt.Printf(\"  File deletion: %d\n\", es.FileDeletion)\n\tfmt.Printf(\"  == Estimated result:\n\")\n\tfmt.Printf(\"  DiscarderPushed: %d\n\", len(es.DiscarderPushed))\n\tfmt.Printf(\"  ParentDiscarderPushed: %d\n\", len(es.ParentDiscarderPushed))\n\tfmt.Printf(\"  EventDiscarded: %d\n\", es.EventDiscarded)\n\tfmt.Printf(\"  EventSent: %d\n\", es.EventSent)\n}\n\nfunc (es *EstimatedResult) add(es2 *EstimatedResult) {\n\tes.DiscarderPushed = append(es.DiscarderPushed, es2.DiscarderPushed...)\n\tes.ParentDiscarderPushed = append(es.ParentDiscarderPushed, es2.ParentDiscarderPushed...)\n\tes.EventDiscarded += es2.EventDiscarded\n\tes.EventSent += es2.EventSent\n\tes.FileCreation += es2.FileCreation\n\tes.FileAccess += es2.FileAccess\n\tes.FileDeletion += es2.FileDeletion\n}\n\n// FileGeneratorContext defines a file generator context\ntype FileGeneratorContext struct {\n\tconfig              FileGeneratorConfig\n\trootPath            string\n\tmountPoint          string\n\tparentMountPoint    string\n\tbaseDirDiscarders   string\n\tbaseDirNoDiscarders string\n\tfiles               []string\n\tlimiter             *rate.Limiter\n\tmessages            chan fgMessage\n\tresult              EstimatedResult\n\tfirstOpen           bool\n\tfirstUnlink         bool\n}\n\nfunc (fg *FileGenerator) newFileGeneratorContext(config FileGeneratorConfig) *FileGeneratorContext {\n\tbaseDir := fg.rootPath\n\tvar mountPoint, parentMountPoint string\n\tif config.MountDir {\n\t\tif config.MountParentDir {\n\t\t\tparentMountPoint = filepath.Join(baseDir, parentMountDirName)\n\t\t\tbaseDir = filepath.Join(baseDir, parentMountDirName, mountDirName)\n\t\t} else {\n\t\t\tbaseDir = filepath.Join(baseDir, mountDirName)\n\t\t}\n\t\tmountPoint = baseDir\n\t}\n\tbaseDirDiscarders := filepath.Join(baseDir, discardersDirName)\n\tbaseDirNoDiscarders := filepath.Join(baseDir, noDiscardersDirName)\n\n\treturn &FileGeneratorContext{\n\t\tconfig:              config,\n\t\trootPath:            fg.rootPath,\n\t\tmountPoint:          mountPoint,\n\t\tparentMountPoint:    parentMountPoint,\n\t\tbaseDirDiscarders:   baseDirDiscarders,\n\t\tbaseDirNoDiscarders: baseDirNoDiscarders,\n\t\tlimiter:             rate.NewLimiter(rate.Limit(config.EventsPerSec), 1),\n\t\tmessages:            make(chan fgMessage),\n\t}\n}\n\n// Printf the context\nfunc (fgc *FileGeneratorContext) Printf(format string, a ...any) {\n\tif fgc.config.Debug {\n\t\tfmt.Printf(format, a...)\n\t}\n}\n\nfunc (fgc *FileGeneratorContext) resetFirstStates() {\n\tfgc.firstOpen = true\n\tfgc.firstUnlink = true\n}\n\nfunc (fgc *FileGeneratorContext) getFileInode(file string) (uint64, error) {\n\tvar s unix.Stat_t\n\tif err := unix.Stat(file, &s); err != nil {\n\t\tfmt.Printf(\"getFileInode error: %s (%s)\n\", err, file)\n\t\treturn 0, err\n\t}\n\tfgc.Printf(\" -> Ino: %d for %s\n\", s.Ino, file)\n\treturn s.Ino, nil\n}\n\nfunc (fgc *FileGeneratorContext) addFileToMetric(file string, metric *[]FileStat) {\n\tino, err := fgc.getFileInode(file)\n\tif err != nil {\n\t\treturn\n\t}\n\t*metric = append(*metric, FileStat{\n\t\tpath: file,\n\t\tino:  ino,\n\t})\n}\n\nfunc (fgc *FileGeneratorContext) generateNewFile() {\n\tvar filename string\n\tfor depth := rand.Int() % fgc.config.MaxDepth; depth >= 0; depth-- {\n\t\tfilename = filepath.Join(filename, rand.String(filePathLen))\n\t}\n\tfilename += \".txt\"\n\tfgc.files = append(fgc.files, filename)\n\n\tfile := filepath.Join(fgc.baseDirDiscarders, filename)\n\tfgc.Printf(\"Create: %s\n\", file)\n\t_ = os.MkdirAll(filepath.Dir(file), 0755)\n\t_ = os.WriteFile(file, []byte(\"Is this a discarder?\n\"), 0666)\n\tif fgc.firstOpen {\n\t\tfgc.firstOpen = false\n\t\tfgc.addFileToMetric(filepath.Dir(file), &fgc.result.ParentDiscarderPushed)\n\t\tfgc.result.EventSent++\n\t} else {\n\t\tfgc.result.EventDiscarded++\n\t}\n\n\tfile = filepath.Join(fgc.baseDirNoDiscarders, filename)\n\tfgc.Printf(\"Create: %s\n\", file)\n\t_ = os.MkdirAll(filepath.Dir(file), 0755)\n\t_ = os.WriteFile(file, []byte(\"Is this a discarder?\n\"), 0666)\n\tfgc.addFileToMetric(file, &fgc.result.DiscarderPushed)\n\tfgc.result.EventSent++\n\n\tfgc.result.FileCreation++\n}\n\nfunc (fgc *FileGeneratorContext) unlinkFile() {\n\tif len(fgc.files) <= 0 {\n\t\treturn // should not happen\n\t}\n\tindex := rand.Int() % len(fgc.files)\n\trandomFile := fgc.files[index]\n\n\tfile := filepath.Join(fgc.baseDirDiscarders, randomFile)\n\tfgc.Printf(\"Removing: %s\n\", file)\n\tif fgc.firstUnlink {\n\t\tfgc.firstUnlink = false\n\t\tfgc.addFileToMetric(filepath.Dir(file), &fgc.result.ParentDiscarderPushed)\n\t\tfgc.result.EventSent++\n\t} else {\n\t\tfgc.result.EventDiscarded++\n\t}\n\t_ = os.Remove(file)\n\n\tfile = filepath.Join(fgc.baseDirNoDiscarders, randomFile)\n\tfgc.Printf(\"Removing: %s\n\", file)\n\t_ = os.Remove(file)\n\tfgc.result.EventSent++\n\n\tfgc.result.FileDeletion++\n\tfgc.files = append(fgc.files[:index], fgc.files[index+1:]...)\n}\n\nfunc (fgc *FileGeneratorContext) openFile() {\n\tif len(fgc.files) <= 0 {\n\t\treturn // should not happen\n\t}\n\tindex := rand.Int() % len(fgc.files)\n\trandomFile := fgc.files[index]\n\n\tfile := filepath.Join(fgc.baseDirDiscarders, randomFile)\n\tfgc.Printf(\"Opening: %s\n\", file)\n\t_ = os.WriteFile(file, []byte(\"file opened once!\n\"), 0666)\n\tfgc.result.EventDiscarded++\n\n\tfile = filepath.Join(fgc.baseDirNoDiscarders, randomFile)\n\tfgc.Printf(\"Opening: %s\n\", file)\n\t_ = os.WriteFile(file, []byte(\"file opened once!\n\"), 0666)\n\tfgc.result.EventDiscarded++\n\n\tfgc.result.FileAccess++\n}\n\nfunc (fgc *FileGeneratorContext) doSomething() {\n\tif len(fgc.files) == fgc.config.MaxTotalFiles {\n\t\tfgc.unlinkFile()\n\t} else if len(fgc.files) < fgc.config.MaxTotalFiles/2 {\n\t\tfgc.generateNewFile()\n\t} else {\n\t\trand := rand.Int() % 3\n\t\tif fgc.config.Open && rand == 0 {\n\t\t\tfgc.openFile()\n\t\t} else if rand == 1 {\n\t\t\tfgc.generateNewFile()\n\t\t} else {\n\t\t\tfgc.unlinkFile()\n\t\t}\n\t}\n}\n\nfunc (fgc *FileGeneratorContext) mountParentWordDir() {\n\tif fgc.parentMountPoint == \"\" {\n\t\treturn\n\t}\n\tfgc.Printf(\"Mount memfs on %s\n\", fgc.parentMountPoint)\n\t_ = os.MkdirAll(fgc.parentMountPoint, 0755)\n\terr := unix.Mount(\"\", fgc.parentMountPoint, \"tmpfs\", 0, \"\")\n\tif err != nil {\n\t\tfmt.Printf(\"mountParentWordDir error: %s\n\", err)\n\t}\n\tfgc.resetFirstStates()\n}\n\nfunc (fgc *FileGeneratorContext) mountWordDir() {\n\tif fgc.mountPoint == \"\" {\n\t\treturn\n\t}\n\tfgc.Printf(\"Mount memfs on %s\n\", fgc.mountPoint)\n\t_ = os.MkdirAll(fgc.mountPoint, 0755)\n\terr := unix.Mount(\"\", fgc.mountPoint, \"tmpfs\", 0, \"\")\n\tif err != nil {\n\t\tfmt.Printf(\"mountWordDir error: %s\n\", err)\n\t}\n\tfgc.resetFirstStates()\n}\n\nfunc (fgc *FileGeneratorContext) unmountParentWordDir() {\n\tif fgc.parentMountPoint == \"\" {\n\t\treturn\n\t}\n\tfgc.Printf(\"Unmount %s\n\", fgc.parentMountPoint)\n\terr := unix.Unmount(fgc.parentMountPoint, unix.MNT_DETACH)\n\tif err != nil {\n\t\tfmt.Printf(\"unmountParentWordDir error: %s\n\", err)\n\t}\n\tfgc.files = []string{}\n}\n\nfunc (fgc *FileGeneratorContext) unmountWordDir() {\n\tif fgc.mountPoint == \"\" {\n\t\treturn\n\t}\n\tfgc.Printf(\"Unmount %s\n\", fgc.mountPoint)\n\terr := unix.Unmount(fgc.mountPoint, 0)\n\tif err != nil {\n\t\tfmt.Printf(\"unmountWordDir error: %s\n\", err)\n\t}\n\tfgc.files = []string{}\n}\n\nfunc (fgc *FileGeneratorContext) start(wg *sync.WaitGroup) {\n\twg.Add(1)\n\tgo func() {\n\t\tdefer wg.Done()\n\n\t\tfgc.mountParentWordDir()\n\t\tdefer fgc.unmountParentWordDir()\n\t\tfgc.mountWordDir()\n\t\tdefer fgc.unmountWordDir()\n\t\tremountTicker := time.NewTicker(fgc.config.RemountEvery)\n\n\t\tvar testEnd *time.Time\n\t\tstarted := false\n\t\tfgc.resetFirstStates()\n\t\tfor {\n\t\t\tif testEnd != nil && time.Now().After(*testEnd) {\n\t\t\t\tfgc.Printf(\"%s enddd!\n\", fgc.config.id)\n\t\t\t\treturn\n\t\t\t}\n\n\t\t\tselect {\n\t\t\tcase res := <-fgc.messages:\n\t\t\t\tif res == stop {\n\t\t\t\t\tfgc.Printf(\"%s stopped!\n\", fgc.config.id)\n\t\t\t\t\treturn // stop\n\t\t\t\t} else if res == start {\n\t\t\t\t\tfgc.Printf(\"%s started!\n\", fgc.config.id)\n\t\t\t\t\tt := time.Now().Add(fgc.config.TestDuration)\n\t\t\t\t\ttestEnd = &t\n\t\t\t\t\tstarted = true\n\t\t\t\t}\n\t\t\tcase <-remountTicker.C:\n\t\t\t\tif fgc.parentMountPoint != \"\" {\n\t\t\t\t\tfgc.unmountParentWordDir()\n\t\t\t\t} else {\n\t\t\t\t\tfgc.unmountWordDir()\n\t\t\t\t}\n\t\t\t\tfgc.mountParentWordDir()\n\t\t\t\tfgc.mountWordDir()\n\t\t\tcase <-time.After(time.Millisecond * 10):\n\t\t\t\tif started && fgc.limiter.Allow() {\n\t\t\t\t\tfgc.doSomething()\n\t\t\t\t} else {\n\t\t\t\t\ttime.Sleep(time.Millisecond * 100)\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t}()\n}\n\n// PrepareFileGenerator prepare the file generator\nfunc (fg *FileGenerator) PrepareFileGenerator(config FileGeneratorConfig) error {\n\tctx := fg.newFileGeneratorContext(config)\n\tif fg.contexts[config.id] != nil {\n\t\treturn errors.New(\"context ID already present\")\n\t}\n\tfg.contexts[config.id] = ctx\n\tctx.start(&fg.wg)\n\treturn nil\n}\n\n// Start the file generator\nfunc (fg *FileGenerator) Start() error {\n\tif len(fg.contexts) == 0 {\n\t\treturn errors.New(\"no prepared contexts\")\n\t}\n\tfor _, ctx := range fg.contexts {\n\t\tctx.Printf(\"Starting file generator: %s\n\", ctx.config.id)\n\t\tctx.messages <- start\n\t}\n\treturn nil\n}\n\n// Wait for the result\nfunc (fg *FileGenerator) Wait() (*EstimatedResult, error) {\n\tif len(fg.contexts) == 0 {\n\t\treturn nil, errors.New(\"no running contexts\")\n\t}\n\n\t// wait\n\tfg.wg.Wait()\n\n\t// get estimated results\n\tvar res EstimatedResult\n\tfor _, ctx := range fg.contexts {\n\t\tres.add(&ctx.result)\n\t}\n\tfg.contexts = make(map[string]*FileGeneratorContext)\n\treturn &res, nil\n}\n";
var exampleCode4 = "package main\n\nimport (\n\t\"crypto/des\"\n\t\"crypto/md5\"\n\t\"crypto/rc4\"\n\t\"crypto/sha1\"\n\t\"fmt\"\n\t\"io\"\n\t\"log\"\n\t\"os\"\n)\n\nfunc main() {\n}\n\nfunc test_des() {\n\t// NewTripleDESCipher can also be used when EDE2 is required by\n\t// duplicating the first 8 bytes of the 16-byte key.\n\tede2Key := []byte(\"example key 1234\")\n\n\tvar tripleDESKey []byte\n\ttripleDESKey = append(tripleDESKey, ede2Key[:16]...)\n\ttripleDESKey = append(tripleDESKey, ede2Key[:8]...)\n\t// ruleid: use-of-DES\n\t_, err := des.NewTripleDESCipher(tripleDESKey)\n\tif err != nil {\n\t\tpanic(err)\n\t}\n\n\t// See crypto/cipher for how to use a cipher.Block for encryption and\n\t// decryption.\n}\n\nfunc test_md5() {\n\tf, err := os.Open(\"file.txt\")\n\tif err != nil {\n\t\tlog.Fatal(err)\n\t}\n\tdefer f.Close()\n\n\tdefer func() {\n\t\terr := f.Close()\n\t\tif err != nil {\n\t\t\tlog.Printf(\"error closing the file: %s\", err)\n\t\t}\n\t}()\n\n\t// ruleid: use-of-md5\n\th := md5.New()\n\tif _, err := io.Copy(h, f); err != nil {\n\t\tlog.Fatal(err)\n\t}\n\t// ruleid: use-of-md5\n\tfmt.Printf(\"%x\", md5.Sum(nil))\n}\n\nfunc test_rc4() {\n\tkey := []byte{1, 2, 3, 4, 5, 6, 7}\n\t// ruleid: use-of-rc4\n\tc, err := rc4.NewCipher(key)\n\tdst := make([]byte, len(src))\n\tc.XORKeyStream(dst, src)\n}\n\nfunc test_sha1() {\n\tf, err := os.Open(\"file.txt\")\n\tif err != nil {\n\t\tlog.Fatal(err)\n\t}\n\tdefer f.Close()\n\t// ruleid: use-of-sha1\n\th := sha1.New()\n\tif _, err := io.Copy(h, f); err != nil {\n\t\tlog.Fatal(err)\n\t}\n\t// ruleid: use-of-sha1\n\tfmt.Printf(\"%x\", sha1.Sum(nil))\n}\n";
setTimeout(function () {
    window.editor.getModel().setValue(exampleCode1);
}, 200);
lpsDisplayEl.innerText = LINES_PER_SEC.toString();
setupListener();
function setupListener() {
    // window.editor.getModel().setValue(exampleCode1);
    lpsEl.addEventListener("input", function () {
        LINES_PER_SEC = lpsEl.valueAsNumber;
        lpsDisplayEl.innerText = LINES_PER_SEC.toString();
    });
    code1button === null || code1button === void 0 ? void 0 : code1button.addEventListener("click", function () {
        window.editor.getModel().setValue(exampleCode1);
    });
    code2button === null || code2button === void 0 ? void 0 : code2button.addEventListener("click", function () {
        window.editor.getModel().setValue(exampleCode2);
    });
    code3button === null || code3button === void 0 ? void 0 : code3button.addEventListener("click", function () {
        window.editor.getModel().setValue(exampleCode3);
    });
    testbutton === null || testbutton === void 0 ? void 0 : testbutton.addEventListener("click", function () {
        Tone.start();
        var synth = new Tone.PolySynth(Tone.Synth).toDestination();
        synth.triggerAttackRelease("C4", "8n");
    });
    submitEl === null || submitEl === void 0 ? void 0 : submitEl.addEventListener("click", function () {
        Tone.start();
        console.log("audio is ready");
        upload(window.editor.getValue(), playSound);
    });
}
function upload(data, callback) {
    fetch("/upload", {
        method: "POST",
        mode: "cors",
        cache: "no-cache",
        credentials: "same-origin",
        redirect: "follow",
        referrerPolicy: "no-referrer",
        body: JSON.stringify({ "Content": data }),
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    }).then(function (response) {
        return response.json();
        // alert(response.json());
    }).then(function (data) {
        console.log(data);
        callback(data);
    })
        .catch(function (error) {
        console.log(error);
    });
}
function lineToduration(lineCount) {
    return lineCount * (1 / LINES_PER_SEC);
}
function soundMap(value) {
    switch (value) {
        case 0: return "D4";
        case 1: return "E4";
        case 2: return "C2";
        case 3: return "C1";
        case 4: return "F1";
        default: return baseNote;
    }
}
function playSound(data) {
    var durationTotal = lineToduration(data.line_count);
    var durationPerNote = durationTotal / data.states.length;
    var line = 0;
    var countTick = 0;
    // OMEGALUL this is so bad
    var intervalID = setInterval(function () {
        if (line >= data.line_count) {
            return;
        }
        countTick++;
        var percentageOfTickProgress = countTick / data.line_count;
        line = Math.floor(percentageOfTickProgress * data.line_count);
        window.editor.revealLineInCenter(line);
    }, durationTotal / data.line_count * 1000);
    // const recorder = new Tone.Recorder();
    var now = Tone.now();
    var synth = new Tone.MonoSynth({
        oscillator: {
            type: "sine"
        },
        envelope: {
            attack: 0.1
        }
    }).toDestination();
    synth.volume.value = -30;
    var drum = new Tone.AMSynth().toDestination();
    // const drum = new Tone.AMSynth().connect(recorder);
    drum.volume.value = +10;
    var bla = new Tone.MetalSynth().toDestination();
    bla.volume.value = -10;
    var toto = new Tone.FatOscillator("Ab3", "sawtooth", 40).toDestination();
    toto.volume.value = -10;
    // const bla = new Tone.MetalSynth().connect(recorder);
    // }).connect(recorder);
    // start recording
    // recorder.start();
    setTimeout(function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // setTimeout(async function(id, recorder){
                clearInterval(id);
                return [2 /*return*/];
            });
        });
    }, durationTotal * 1000, intervalID);
    console.log(durationTotal + " second(s) (line count:" + data.line_count + ", Lines/sec: " + data.line_count / durationTotal + ") with " + data.states.length + " notes" + " duration per note: " + durationPerNote);
    synth.triggerAttackRelease(baseNote, durationTotal);
    var notes = [];
    for (var i = 0; i < data.states.length; i++) {
        var notation = soundMap(data.states[i].complexity);
        var instrumentName = "drum";
        if (data.states[i].vulnerable) {
            console.log("vuln");
            instrumentName = "drum";
        }
        if (data.states[i].is_sink) {
            console.log("sink");
            instrumentName = "bla";
        }
        if (data.states[i].is_source) {
            console.log("source");
            instrumentName = "toto";
        }
        notes.push({ notation: notation, instrumentName: instrumentName });
    }
    for (var i = 0; i < notes.length; i++) {
        // This skips created notes that are the same as the previous note
        //THIS IS ABSOLUTELY TERRIBLE AND BUGGED AS FUCK
        if (i > 0 && notes[i].notation == notes[i - 1].notation && notes[i].instrumentName == notes[i - 1].instrumentName) {
            continue;
        }
        // It's already part of the baseline, lets not double submit
        // if(notes[i].notation == baseNote){
        //     continue;
        // }
        console.log(notes[i].instrumentName);
        switch (notes[i].instrumentName) {
            case "drum":
                drum.triggerAttackRelease(notes[i].notation, durationPerNote, now + i * durationPerNote);
                break;
            case "bla":
                bla.triggerAttackRelease(notes[i].notation, durationPerNote, now + i * durationPerNote);
                break;
            case "toto":
                toto.triggerAttackRelease(notes[i].notation, durationPerNote, now + i * durationPerNote);
                break;
            default:
                synth.triggerAttackRelease(notes[i].notation, durationPerNote, now + i * durationPerNote);
                break;
        }
    }
}
