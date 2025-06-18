#!/usr/bin/env uv
import os
import sys
import argparse
import json
from pathlib import Path
import base64
import hashlib
import math

from tree_sitter import Parser, Language
import tree_sitter_python as tspython
import tree_sitter_javascript as tsjs
import tree_sitter_go as tsgo  # Uncomment if available
import tree_sitter_java as tsjava

LANGUAGES = {
    'python': Language(tspython.language()),
    'javascript': Language(tsjs.language()),
    'go': Language(tsgo.language()),  # Uncomment if available
    'java': Language(tsjava.language()),
}
LANGUAGE_EXTENSIONS = {
    '.py': 'python',
    '.js': 'javascript',
    '.go': 'go',
    '.java': 'java',
}

# Mapping from language to Tidal Cycles instrument (easy to swap)
LANGUAGE_TO_SOUND = {
    'python': 'gm_epiano2',
    'javascript': 'pluck',
    'go': 'gm_melodic_tom',
    'java': 'gm_pad_3_polysynth',
}

def detect_language(file_path):
    ext = Path(file_path).suffix
    return LANGUAGE_EXTENSIONS.get(ext)

def get_node_text(node, code):
    return code[node.start_byte:node.end_byte]

def walk_tree(node):
    yield node
    for child in node.children:
        yield from walk_tree(child)

def analyze_python(tree, code):
    root = tree.root_node
    function_count = 0
    max_function_size = 0
    max_function_params = 0
    max_cyclomatic = 0
    for node in walk_tree(root):
        if node.type == 'function_definition':
            function_count += 1
            # Function size (lines)
            start_line = node.start_point[0]
            end_line = node.end_point[0]
            size = end_line - start_line + 1
            if size > max_function_size:
                max_function_size = size
            # Parameters
            params = 0
            for child in node.children:
                if child.type == 'parameters':
                    # Count identifiers in parameters
                    params = sum(1 for p in child.children if p.type == 'identifier')
                    break
            if params > max_function_params:
                max_function_params = params
            # Cyclomatic complexity (basic)
            block = None
            for child in node.children:
                if child.type == 'block':
                    block = child
                    break
            complexity = 1
            if block:
                # Count decision points in the block
                stack = [block]
                while stack:
                    n = stack.pop()
                    if n.type in ('if_statement', 'for_statement', 'while_statement', 'except_clause', 'elif_clause'):
                        complexity += 1
                    # Logical operators (and/or)
                    if n.type == 'boolean_operator':
                        complexity += 1
                    stack.extend(n.children)
            if complexity > max_cyclomatic:
                max_cyclomatic = complexity
    return {
        'function_count': function_count,
        'max_function_size': max_function_size,
        'max_function_params': max_function_params,
        'cyclomatic_complexity': max_cyclomatic,
    }

def analyze_javascript(tree, code):
    root = tree.root_node
    function_types = [
        'function_declaration',
        'function_expression',
        'arrow_function',
        'method_definition',
    ]
    function_count = 0
    max_function_size = 0
    max_function_params = 0
    max_cyclomatic = 0
    def get_params_count(node):
        for child in node.children:
            if child.type in ('formal_parameters', 'parameters'):
                # Count identifiers in parameters
                return sum(1 for p in child.children if p.type == 'identifier')
        return 0
    def get_body_node(node):
        for child in node.children:
            if child.type == 'statement_block':
                return child
        return None
    cursor = root.walk()
    reached_root = False
    while not reached_root:
        node = cursor.node
        if node.type in function_types:
            function_count += 1
            start_line = node.start_point[0]
            end_line = node.end_point[0]
            size = end_line - start_line + 1
            if size > max_function_size:
                max_function_size = size
            params = get_params_count(node)
            if params > max_function_params:
                max_function_params = params
            # Cyclomatic complexity
            body = get_body_node(node)
            complexity = 1
            if body:
                stack = [body]
                while stack:
                    n = stack.pop()
                    if n.type in ('if_statement', 'for_statement', 'while_statement', 'switch_statement', 'catch_clause'):
                        complexity += 1
                    if n.type == 'binary_expression':
                        # Check for logical operators
                        op = get_node_text(n.child_by_field_name('operator'), code) if n.child_by_field_name('operator') else b''
                        if op in (b'&&', b'||'):
                            complexity += 1
                    stack.extend(n.children)
            if complexity > max_cyclomatic:
                max_cyclomatic = complexity
        if cursor.goto_first_child():
            continue
        if cursor.goto_next_sibling():
            continue
        while True:
            if not cursor.goto_parent():
                reached_root = True
                break
            if cursor.goto_next_sibling():
                break
    return {
        'function_count': function_count,
        'max_function_size': max_function_size,
        'max_function_params': max_function_params,
        'cyclomatic_complexity': max_cyclomatic,
    }

def analyze_go(tree, code):
    root = tree.root_node
    function_types = [
        'function_declaration',
        'method_declaration',
    ]
    function_count = 0
    max_function_size = 0
    max_function_params = 0
    max_cyclomatic = 0
    def get_params_count(node):
        for child in node.children:
            if child.type == 'parameter_list':
                # Count identifiers in parameters
                return sum(1 for p in child.children if p.type == 'identifier')
        return 0
    def get_body_node(node):
        for child in node.children:
            if child.type == 'block':
                return child
        return None
    for node in walk_tree(root):
        if node.type in function_types:
            function_count += 1
            start_line = node.start_point[0]
            end_line = node.end_point[0]
            size = end_line - start_line + 1
            if size > max_function_size:
                max_function_size = size
            params = get_params_count(node)
            if params > max_function_params:
                max_function_params = params
            # Cyclomatic complexity
            body = get_body_node(node)
            complexity = 1
            if body:
                stack = [body]
                while stack:
                    n = stack.pop()
                    if n.type in ('if_statement', 'for_statement', 'range_clause', 'switch_statement', 'case_clause', 'select_statement'):
                        complexity += 1
                    if n.type == 'binary_expression':
                        # Check for logical operators
                        op = get_node_text(n.child_by_field_name('operator'), code) if n.child_by_field_name('operator') else b''
                        if op in (b'&&', b'||'):
                            complexity += 1
                    stack.extend(n.children)
            if complexity > max_cyclomatic:
                max_cyclomatic = complexity
    return {
        'function_count': function_count,
        'max_function_size': max_function_size,
        'max_function_params': max_function_params,
        'cyclomatic_complexity': max_cyclomatic,
    }

def analyze_java(tree, code):
    root = tree.root_node
    function_types = [
        'method_declaration',
        'constructor_declaration',
    ]
    function_count = 0
    max_function_size = 0
    max_function_params = 0
    max_cyclomatic = 0
    def get_params_count(node):
        for child in node.children:
            if child.type == 'formal_parameters':
                # Count identifiers in parameters
                return sum(1 for p in child.children if p.type == 'formal_parameter')
        return 0
    def get_body_node(node):
        for child in node.children:
            if child.type == 'block':
                return child
        return None
    for node in walk_tree(root):
        if node.type in function_types:
            function_count += 1
            start_line = node.start_point[0]
            end_line = node.end_point[0]
            size = end_line - start_line + 1
            if size > max_function_size:
                max_function_size = size
            params = get_params_count(node)
            if params > max_function_params:
                max_function_params = params
            # Cyclomatic complexity
            body = get_body_node(node)
            complexity = 1
            if body:
                stack = [body]
                while stack:
                    n = stack.pop()
                    if n.type in ('if_statement', 'for_statement', 'while_statement', 'switch_expression', 'switch_statement', 'catch_clause', 'case'): 
                        complexity += 1
                    if n.type == 'binary_expression':
                        op = get_node_text(n.child_by_field_name('operator'), code) if n.child_by_field_name('operator') else b''
                        if op in (b'&&', b'||'):
                            complexity += 1
                    stack.extend(n.children)
            if complexity > max_cyclomatic:
                max_cyclomatic = complexity
    return {
        'function_count': function_count,
        'max_function_size': max_function_size,
        'max_function_params': max_function_params,
        'cyclomatic_complexity': max_cyclomatic,
    }

def count_comments(tree, code, lang):
    comment_types = {
        'python': ['comment'],
        'javascript': ['comment'],
        'go': ['comment'],
        'java': ['line_comment', 'block_comment'],
    }
    types = comment_types.get(lang, ['comment'])
    total_length = 0
    for node in walk_tree(tree.root_node):
        if node.type in types:
            total_length += node.end_byte - node.start_byte
    return total_length

def analyze_file(file_path, language):
    parser = Parser(LANGUAGES[language])
    with open(file_path, 'rb') as f:
        code = f.read()
    tree = parser.parse(code)
    metrics = {
        'file': str(file_path),
        'language': language,
        'lines_of_code': code.count(b'\n'),
        'file_size': len(code),
        'function_count': None,
        'max_function_size': None,
        'max_function_params': None,
        'cyclomatic_complexity': None,
        'comment_length': 0,
    }
    if language == 'python':
        py_metrics = analyze_python(tree, code)
        metrics.update(py_metrics)
    elif language == 'javascript':
        js_metrics = analyze_javascript(tree, code)
        metrics.update(js_metrics)
    elif language == 'go':
        go_metrics = analyze_go(tree, code)
        metrics.update(go_metrics)
    elif language == 'java':
        java_metrics = analyze_java(tree, code)
        metrics.update(java_metrics)
    metrics['comment_length'] = count_comments(tree, code, language)
    return metrics

def load_gitignore_patterns(gitignore_path='.gitignore'):
    patterns = set()
    if os.path.exists(gitignore_path):
        with open(gitignore_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#'):
                    patterns.add(line)
    return patterns

def is_ignored(path, patterns):
    # Always ignore .git folder
    if '.git' in path.parts:
        return True
    # Simple matching: skip if any pattern is in the path parts
    for pat in patterns:
        if pat in path.parts:
            return True
        # Also skip if file/dir starts with pattern (for files like .venv)
        if path.name.startswith(pat):
            return True
    return False

# Helper to map metrics to a Strudel code block (layered)
def metrics_to_strudel(metrics, add_visualizer=False):
    file_id = metrics.get('file', '')
    lang = metrics.get('language', 'python')
    file_size = metrics.get('file_size', 0)
    function_count = metrics.get('function_count', 1) or 1
    loc = metrics.get('lines_of_code', 1) or 1
    cyclomatic = metrics.get('cyclomatic_complexity', 1) or 1
    max_func_size = metrics.get('max_function_size', 1) or 1
    max_params = metrics.get('max_function_params', 1) or 1
    filename = metrics.get('file', '').lower()

    # 1. Instrument by language
    synth_map = {
        'python': 'gm_epiano2',
        'javascript': 'gm_fx_sci_fi',
        'go': 'gm_melodic_tom',
        'java': 'gm_pad_poly',
    }
    synth = synth_map.get(lang, 'gm_fx_sci_fi')

    # 2. Function count -> note density (make it much lower)
    density = min(2, max(1, function_count // 2))
    base_pattern = f's("{synth}*{density}")'

    # 3. Cyclomatic complexity -> number of notes in a scale (reduce notes)
    scale = [0, 2, 4, 5, 7, 9, 11, 12]
    num_notes = min(4, max(1, cyclomatic // 2))
    notes = ' '.join(str(scale[i % len(scale)]) for i in range(num_notes))

    # 4. Max function size -> note duration (clip)
    clip_val = min(2, max(1, max_func_size // 20))
    # 5. Max params -> panning
    pan_val = (max_params % 3 - 1) * 0.5  # -0.5, 0, 0.5
    # 7. File size -> reverb/room
    room_val = min(0.9, 0.1 + (file_size % 8000) / 10000)
    # 8. Add more effect options
    decay_val = min(2, max(0.5, max_func_size / 40))
    release_val = min(2, max(0.5, function_count / 4))
    lpf_val = 400 + (cyclomatic % 4) * 200
    hpf_val = 100 + (max_params % 3) * 100

    is_test_file = 'test' in filename
    variant_seed = int(hashlib.sha256(file_id.encode('utf-8')).hexdigest(), 16)
    variant = variant_seed % 4

    if is_test_file:
        calliope_variants = [f'gm_lead_3_calliope:{i}' for i in range(7)]
        idx = variant_seed % 7
        extra_synths = ','.join(['gm_lead_3_calliope'] + calliope_variants[idx:idx+1])
        base_harmonics = f'n("{notes}").s("{synth},{extra_synths}")'
    elif synth == 'gm_melodic_tom':
        tom_variants = [f'gm_melodic_tom:{i}' for i in range(9)]
        idx = variant_seed % 9
        extra_synths = ','.join(['gm_melodic_tom'] + tom_variants[idx:idx+1])
        base_harmonics = f'n("{notes}").s("{extra_synths}")'
    else:
        base_harmonics = f'n("{notes}").s("{synth}")'

    visualizers = [
        '._pianoroll()',
        '._scope()',
        # '._spiral()',
        # '._spectrum()',
        # Add a few empty, so we don't flood too much
        '',
        '',
        '',
        '',
        '._punchcard()',
        '._pitchwheel()'
    ]
    visualizer = visualizers[variant_seed % len(visualizers)] if add_visualizer else ''

    if variant == 0:
        harmonics_pattern = f'{base_harmonics}.clip({clip_val}).pan({pan_val}).room({room_val:.2f}){visualizer}'
    elif variant == 1:
        harmonics_pattern = f'{base_harmonics}.decay({decay_val}).release({release_val}).lpf({lpf_val}){visualizer}'
    elif variant == 2:
        harmonics_pattern = f'{base_harmonics}.clip({clip_val}).hpf({hpf_val}).room({room_val:.2f}){visualizer}'
    else:
        harmonics_pattern = f'{base_harmonics}.pan({pan_val}).decay({decay_val}).lpf({lpf_val}){visualizer}'

    if lang == 'go':
        kick_pattern = f's("bd*2 [hh<1 2>]*2").gain(0.2)'
    elif lang == 'java':
        kick_pattern = f's("bd*2 [hh<1 2>]*2").gain(0.2)'
    else:
        kick_pattern = f's("bd*4 [hh<1 2>]*2").gain(0.2)'

    comment_length = metrics.get('comment_length', 0)
    if comment_length > 100:
        comments_notes = f'\n  s("gm_koto * 6").n("3 4 5 6 8 9").degradeBy(0.8).gain(0.1)'
    if comment_length > 1000:
        comments_notes = f'\n  s("gm_koto * 6").n("3 4 5 6 8 9").degradeBy(0.2).gain(0.1)'
    else:
        comments_notes = ''

    code = f"stack(\n  {kick_pattern},\n  {base_pattern},\n  {harmonics_pattern},\n {comments_notes}\n)"
    return code

def indent_block(block, level=1):
    indent = '  ' * level
    lines = block.split('\n')
    return '\n'.join(indent + line if line.strip() else line for line in lines)

def combine_strudel_blocks_by_folder(results, root_dir, level=0):
    import os
    from collections import defaultdict
    def chunked(lst, n):
        for i in range(0, len(lst), n):
            yield lst[i:i + n]
    folder_map = defaultdict(list)
    for metrics in results:
        folder = os.path.dirname(metrics['file'])
        folder_map[folder].append(metrics)
    folder_blocks = []
    for folder, metrics_list in sorted(folder_map.items()):
        blocks = metrics_list
        indent = '  ' * (level+1)
        rel_folder = os.path.relpath(folder, root_dir)
        if len(blocks) == 1:
            folder_blocks.append(indent_block(metrics_to_strudel(blocks[0]), level+1))
        else:
            fastcat_blocks = []
            for chunk in chunked(blocks, 4):
                joined_blocks = ',\n'.join([indent_block(metrics_to_strudel(m, add_visualizer=True), level+2) for m in chunk])
                fastcat_blocks.append(f'cat(\n{joined_blocks}\n{indent})')
            if len(fastcat_blocks) == 1:
                fastcat_code = fastcat_blocks[0]
            else:
                joined_fastcats = ',\n'.join([indent_block(b, level+2) for b in fastcat_blocks])
                fastcat_code = f'cat(\n{joined_fastcats}\n{indent})'
            comment = f'{indent}// Folder: {rel_folder}'
            folder_blocks.append(f'{comment}\n{indent}{fastcat_code}')
    if len(folder_blocks) == 1:
        return folder_blocks[0]
    joined_folders = ',\n'.join([indent_block(b, level+1) for b in folder_blocks])
    return 'cat(\n' + joined_folders + '\n' + '  ' * level + ')'

# Base64 encode and generate Strudel URL
def strudel_code_to_url(strudel_code):
    b64 = base64.urlsafe_b64encode(strudel_code.encode('utf-8')).decode('utf-8')
    return f"https://strudel.cc/#{b64}"

def main():
    parser = argparse.ArgumentParser(description='Analyze codebase metrics.')
    parser.add_argument('path', type=str, help='Path to codebase directory')
    parser.add_argument('--output', type=str, default=None, help='Output JSON file (default: stdout)')
    args = parser.parse_args()

    gitignore_patterns = load_gitignore_patterns()
    results = []
    strudel_blocks = []
    for root, dirs, files in os.walk(args.path):
        # Exclude ignored directories
        dirs[:] = [d for d in dirs if not is_ignored(Path(root) / d, gitignore_patterns)]
        for file in files:
            file_path = os.path.join(root, file)
            if is_ignored(Path(file_path), gitignore_patterns):
                print(f"Skipping (gitignore): {file_path}")
                continue
            lang = detect_language(file_path)
            print(f"Processing: {file_path}, detected language: {lang}")
            if lang and lang in LANGUAGES:
                metrics = analyze_file(file_path, lang)
                print(f"Metrics for {file_path}: {metrics}")
                if metrics:
                    results.append(metrics)
                    strudel_blocks.append(metrics_to_strudel(metrics))

    if args.output:
        with open(args.output, 'w') as f:
            json.dump(results, f, indent=2)
    else:
        print(json.dumps(results, indent=2))

    # Generate Strudel code and Strudel URL
    if strudel_blocks:
        strudel_code = combine_strudel_blocks_by_folder(results, args.path)
        bpm_line = 'setcpm(80)'
        strudel_code = f"{bpm_line}\n{strudel_code}"
        print("\nGenerated Strudel code:\n")
        print(strudel_code)
        strudel_url = strudel_code_to_url(strudel_code)
        print("\nStrudel URL:")
        print(strudel_url)

if __name__ == '__main__':
    main() 