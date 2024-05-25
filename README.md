# Sounds Good To Me

An experiment to listen to your code.

Live version: https://sgtm.edznux.fr (example code included)
This is currently hosted on a website, but ideally this should probably be an extension in your IDE/Text Editor, and be able to play sound like you run your other tools, like your debugger.

## Context based sound

The idea is to be able to hear complex patterns in the sound, much quicker than your brain can read or even detect visual patterns (except for large patterns like indententation I suppose?).

### Code complexity

This is basically the only thing that as been implemented.
It uses Tree-Sitter to parse the syntax tree of the file and based on some keyword incrementes the complexity of the code.
As the complexity increase, the baseline sound should become higher and higher.

### Vulnerability

This has not been implemented but the idea would be to integrate some tool(s) that do static analysis of the provided code.
It could be semgrep or something like Datadog Static Analysis for example.

A special note and instrument should be played when encountering a potential issue.

### Linter

This has not been implemented but the idea would be to integrate your usual linter in there as well.
Each language has its own nowadays but supporting a couple of the main one could be interesting.

A special note and instrument, distinct to the vulnerability sound should be played.

### Further research needed

Could there be a way to display information that aren't easily readable / not very visual?

#### Cross reference count

Cross reference is something that is pretty much always hidden behind a few clicks in your IDE, as it can get fairly large.
Would it be possible to highlight functions that are called very often?
Should function calls to highly called function do the opposite and basically disappear?

#### Large change in context

- User space vs Kernel space?
- Local vs RPC/Network call?
- Database call?

## Improvements

Lots of things are left to be desired; but some of the main thing I would change if I wanted to improve would be:
-[ ] Better sound generation (better notes and instrument, proper attack and fading of notes...)
-[ ] Sync between the sound wave visualization and the code scrolling
-[ ] Highlight the current line of code
-[ ] Support for other languages (currently only go)

## Build & debug locally

Run backend (with live reloading):
```bash
air
```
(needs `air`, installed via `go install github.com/cosmtrek/air@latest`)

Build frontend:
```
cd static
tsc main.ts --watch
```
(need `tsc`, installed via `npm install typescript -g`)

## Disclaimers

The code is very very hacky and was rushed in a few hours during a hackathon.
I wanted to spent as little time as possible with FE build tools and as such it's really janky.
I have no intention on cleaning this up, it's just a PoC.
