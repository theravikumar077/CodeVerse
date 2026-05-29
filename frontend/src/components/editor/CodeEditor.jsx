import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Editor from '@monaco-editor/react';
import { updateFileContent } from '../../store/slices/editorSlice';

// ----------------------------------------------------
// Keywords definitions for IntelliSense
// ----------------------------------------------------
const getKeywordsForLanguage = (lang) => {
  switch (lang) {
    case 'python':
      return ['def', 'class', 'import', 'from', 'return', 'if', 'elif', 'else', 'try', 'except', 'finally', 'for', 'while', 'print', 'len', 'range', 'list', 'dict', 'set', 'tuple', 'self', 'None', 'True', 'False', 'and', 'or', 'not', 'in', 'is', 'lambda', 'with', 'as', 'pass', 'break', 'continue'];
    case 'javascript':
    case 'typescript':
      return ['const', 'let', 'var', 'function', 'class', 'return', 'if', 'else', 'for', 'while', 'try', 'catch', 'finally', 'import', 'export', 'from', 'default', 'async', 'await', 'new', 'this', 'typeof', 'instanceof', 'true', 'false', 'null', 'undefined', 'break', 'continue', 'switch', 'case', 'extends', 'super', 'interface', 'implements'];
    case 'cpp':
    case 'c':
      return ['include', 'define', 'int', 'float', 'double', 'char', 'void', 'struct', 'class', 'public', 'private', 'protected', 'return', 'if', 'else', 'for', 'while', 'new', 'delete', 'namespace', 'using', 'std', 'vector', 'string', 'iostream', 'cout', 'cin', 'endl', 'true', 'false', 'const', 'static', 'virtual', 'override', 'template', 'typename'];
    case 'java':
      return ['public', 'private', 'protected', 'class', 'interface', 'extends', 'implements', 'static', 'final', 'void', 'int', 'double', 'float', 'boolean', 'char', 'new', 'return', 'if', 'else', 'for', 'while', 'try', 'catch', 'finally', 'import', 'package', 'this', 'super', 'null', 'true', 'false', 'System', 'out', 'println'];
    case 'php':
      return ['function', 'class', 'public', 'private', 'protected', 'echo', 'return', 'if', 'else', 'elseif', 'foreach', 'while', 'array', 'isset', 'empty', 'include', 'require', 'require_once', 'new', 'namespace', 'use', 'extends', 'implements', 'global', 'static'];
    case 'html':
      return ['doctype', 'html', 'head', 'title', 'meta', 'link', 'style', 'script', 'body', 'div', 'span', 'p', 'a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'button', 'input', 'form', 'img', 'ul', 'ol', 'li', 'table', 'tr', 'td', 'th', 'thead', 'tbody', 'section', 'header', 'footer', 'nav', 'aside', 'main'];
    case 'css':
      return ['color', 'background', 'background-color', 'margin', 'margin-top', 'margin-bottom', 'margin-left', 'margin-right', 'padding', 'padding-top', 'padding-bottom', 'padding-left', 'padding-right', 'display', 'position', 'flex', 'grid', 'width', 'height', 'border', 'font-size', 'font-family', 'font-weight', 'text-align', 'align-items', 'justify-content', 'border-radius', 'box-shadow', 'opacity', 'transition', 'animation', 'transform', 'overflow', 'z-index'];
    default:
      return [];
  }
};

// ----------------------------------------------------
// Snippets definitions for IntelliSense
// ----------------------------------------------------
const getSnippetsForLanguage = (lang, monaco, range) => {
  const list = [];
  
  if (lang === 'python') {
    list.push({
      label: 'def-function',
      kind: monaco.languages.CompletionItemKind.Snippet,
      detail: 'Snippet: Define Function',
      insertText: ['def ${1:name}(${2:args}):', '\t"""${3:docs}"""', '\t${4:pass}'].join('\n'),
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      range,
    });
    list.push({
      label: 'main-block',
      kind: monaco.languages.CompletionItemKind.Snippet,
      detail: 'Snippet: Main execution guard',
      insertText: ["if __name__ == '__main__':", "\t${1:main()}"].join('\n'),
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      range,
    });
    list.push({
      label: 'for-loop',
      kind: monaco.languages.CompletionItemKind.Snippet,
      detail: 'Snippet: For loop',
      insertText: ['for ${1:item} in ${2:items}:', '\t${3:pass}'].join('\n'),
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      range,
    });
  } else if (lang === 'javascript' || lang === 'typescript') {
    list.push({
      label: 'clg',
      kind: monaco.languages.CompletionItemKind.Snippet,
      detail: 'Snippet: console.log',
      insertText: 'console.log(${1:value});',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      range,
    });
    list.push({
      label: 'arrow-fn',
      kind: monaco.languages.CompletionItemKind.Snippet,
      detail: 'Snippet: Arrow Function',
      insertText: 'const ${1:name} = (${2:args}) => {\n\t${3:body}\n};',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      range,
    });
    list.push({
      label: 'useState-hook',
      kind: monaco.languages.CompletionItemKind.Snippet,
      detail: 'Snippet: React useState',
      insertText: 'const [${1:state}, set${2:State}] = useState(${3:initialValue});',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      range,
    });
    list.push({
      label: 'useEffect-hook',
      kind: monaco.languages.CompletionItemKind.Snippet,
      detail: 'Snippet: React useEffect',
      insertText: 'useEffect(() => {\n\t${1:effect}\n\treturn () => {\n\t\t${2:cleanup}\n\t};\n}, [${3:dependencies}]);',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      range,
    });
  } else if (lang === 'cpp' || lang === 'c') {
    list.push({
      label: 'main-cpp',
      kind: monaco.languages.CompletionItemKind.Snippet,
      detail: 'Snippet: C++ main structure',
      insertText: ['#include <iostream>', '', 'using namespace std;', '', 'int main() {', '\t${1:cout << "Hello, World!" << endl;}', '\treturn 0;', '}'].join('\n'),
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      range,
    });
    list.push({
      label: 'for-loop',
      kind: monaco.languages.CompletionItemKind.Snippet,
      detail: 'Snippet: For loop',
      insertText: ['for (int i = 0; i < ${1:count}; ++i) {', '\t${2:body}', '}'].join('\n'),
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      range,
    });
  }
  
  return list;
};

// ----------------------------------------------------
// Auto-Imports definitions for IntelliSense
// ----------------------------------------------------
const getAutoImportsForLanguage = (lang, fileContent, monaco, range) => {
  const list = [];
  
  if (lang === 'python') {
    const libs = [
      { name: 'math', stmt: 'import math\n' },
      { name: 'json', stmt: 'import json\n' },
      { name: 'os', stmt: 'import os\n' },
      { name: 'sys', stmt: 'import sys\n' },
      { name: 'datetime', stmt: 'import datetime\n' },
    ];
    
    libs.forEach(lib => {
      if (!fileContent.includes(`import ${lib.name}`)) {
        list.push({
          label: lib.name,
          kind: monaco.languages.CompletionItemKind.Module,
          detail: `Auto-import '${lib.name}'`,
          documentation: `Inserts: "${lib.stmt.trim()}" at line 1.`,
          insertText: lib.name,
          range,
          additionalTextEdits: [{
            range: new monaco.Range(1, 1, 1, 1),
            text: lib.stmt
          }]
        });
      }
    });
  } else if (lang === 'javascript' || lang === 'typescript') {
    const libs = [
      { name: 'useState', stmt: "import { useState } from 'react';\n" },
      { name: 'useEffect', stmt: "import { useEffect } from 'react';\n" },
      { name: 'useRef', stmt: "import { useRef } from 'react';\n" },
      { name: 'axios', stmt: "import axios from 'axios';\n" },
    ];

    libs.forEach(lib => {
      if (!fileContent.includes(lib.name)) {
        list.push({
          label: lib.name,
          kind: monaco.languages.CompletionItemKind.Interface,
          detail: `Auto-import ${lib.name}`,
          documentation: `Inserts: "${lib.stmt.trim()}" at line 1.`,
          insertText: lib.name,
          range,
          additionalTextEdits: [{
            range: new monaco.Range(1, 1, 1, 1),
            text: lib.stmt
          }]
        });
      }
    });
  }

  return list;
};

// ----------------------------------------------------
// Hover Docs definitions
// ----------------------------------------------------
const getStdLibraryDoc = (lang, word) => {
  const pythonDocs = {
    print: { signature: 'print(*objects, sep=" ", end="\\n", file=None, flush=False)', doc: 'Prints objects to the text stream file, separated by sep and followed by end.' },
    len: { signature: 'len(s)', doc: 'Return the length (the number of items) of an object.' },
    range: { signature: 'range(stop) -> range object\nrange(start, stop[, step])', doc: 'Returns an immutable sequence of numbers.' },
    append: { signature: 'list.append(x)', doc: 'Add an item to the end of the list.' },
  };

  const jsDocs = {
    log: { signature: 'console.log(message)', doc: 'Outputs a message to the global web console.' },
    useState: { signature: 'useState(initialState)', doc: 'Returns a stateful value, and a function to update it.' },
    useEffect: { signature: 'useEffect(didUpdate)', doc: 'Accepts a function that contains imperative, possibly effectful code.' },
  };

  if (lang === 'python' && pythonDocs[word]) return pythonDocs[word];
  if ((lang === 'javascript' || lang === 'typescript') && jsDocs[word]) return jsDocs[word];
  return null;
};

// ----------------------------------------------------
// Real-time Syntax Diagnostic checking helper
// ----------------------------------------------------
const getLineColFromIndex = (content, index) => {
  const lines = content.substring(0, index).split('\n');
  return {
    line: lines.length,
    col: lines[lines.length - 1].length + 1
  };
};

const runRealTimeDiagnostics = (model, monaco) => {
  const content = model.getValue();
  const lang = model.getLanguageId();
  const markers = [];

  if (lang === 'json') {
    try {
      if (content.trim()) {
        JSON.parse(content);
      }
    } catch (err) {
      let line = 1;
      let column = 1;
      const lineMatch = err.message.match(/line (\d+)/i);
      const colMatch = err.message.match(/column (\d+)/i);
      if (lineMatch) line = parseInt(lineMatch[1]);
      if (colMatch) column = parseInt(colMatch[1]);
      
      markers.push({
        severity: monaco.MarkerSeverity.Error,
        message: err.message,
        startLineNumber: line,
        startColumn: column,
        endLineNumber: line,
        endColumn: column + 10,
      });
    }
  } else if (lang === 'python') {
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      const lineNum = idx + 1;
      const trimmed = line.trim();
      
      if (/^(def|class|if|elif|else|for|while|try|except|finally)\b/.test(trimmed)) {
        if (!trimmed.endsWith(':') && !trimmed.includes('#') && !trimmed.endsWith('\\')) {
          markers.push({
            severity: monaco.MarkerSeverity.Error,
            message: "SyntaxError: expected ':' at the end of block statement",
            startLineNumber: lineNum,
            startColumn: Math.max(1, line.length),
            endLineNumber: lineNum,
            endColumn: line.length + 5,
          });
        }
      }
      
      if (/^print\s+["'].*["']/.test(trimmed)) {
        markers.push({
          severity: monaco.MarkerSeverity.Error,
          message: "SyntaxError: Missing parentheses in call to 'print'. Did you mean print(...)?",
          startLineNumber: lineNum,
          startColumn: line.indexOf('print') + 1,
          endLineNumber: lineNum,
          endColumn: line.indexOf('print') + 6,
        });
      }
    });
  } else if (lang === 'javascript' || lang === 'typescript') {
    const stack = [];
    
    for (let i = 0; i < content.length; i++) {
      const char = content[i];
      if (char === '{' || char === '(' || char === '[') {
        stack.push({ char, index: i });
      } else if (char === '}' || char === ')' || char === ']') {
        if (stack.length === 0) {
          const lineCol = getLineColFromIndex(content, i);
          markers.push({
            severity: monaco.MarkerSeverity.Warning,
            message: `SyntaxError: Unexpected closing character '${char}'`,
            startLineNumber: lineCol.line,
            startColumn: lineCol.col,
            endLineNumber: lineCol.line,
            endColumn: lineCol.col + 1,
          });
        } else {
          const top = stack.pop();
          if (
            (char === '}' && top.char !== '{') ||
            (char === ')' && top.char !== '(') ||
            (char === ']' && top.char !== '[')
          ) {
            const lineCol = getLineColFromIndex(content, i);
            markers.push({
              severity: monaco.MarkerSeverity.Error,
              message: `SyntaxError: Mismatched closing character '${char}', expected match for '${top.char}'`,
              startLineNumber: lineCol.line,
              startColumn: lineCol.col,
              endLineNumber: lineCol.line,
              endColumn: lineCol.col + 1,
            });
          }
        }
      }
    }
  }

  monaco.editor.setModelMarkers(model, 'realtime-diagnostics', markers);
};

// ----------------------------------------------------
// Global IntelliSense Registers Coordinator
// ----------------------------------------------------
const registerIntelliSense = (monaco) => {
  if (monaco.isRRCodeVerseIntelliSenseRegistered) return;
  monaco.isRRCodeVerseIntelliSenseRegistered = true;

  const languages = ['javascript', 'typescript', 'python', 'cpp', 'c', 'java', 'php', 'html', 'css'];

  languages.forEach(lang => {
    // 1. COMPLETIONS ITEM PROVIDER
    monaco.languages.registerCompletionItemProvider(lang, {
      triggerCharacters: ['.', ' ', '(', ','],
      provideCompletionItems: (model, position) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        const content = model.getValue();
        const suggestions = [];

        const funcRegex = /(?:function|def|void|int|double|float|string)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g;
        const classRegex = /(?:class|struct)\s+([a-zA-Z_][a-zA-Z0-9_]*)/g;
        const varRegex = /(?:let|const|var|int|double|float|std::string)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=/g;
        const pyVarRegex = /^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*/gm;

        const userTokens = new Set();
        let match;

        while ((match = funcRegex.exec(content)) !== null) {
          if (match[1] !== word.word) userTokens.add({ name: match[1], kind: monaco.languages.CompletionItemKind.Function });
        }
        while ((match = classRegex.exec(content)) !== null) {
          if (match[1] !== word.word) userTokens.add({ name: match[1], kind: monaco.languages.CompletionItemKind.Class });
        }
        while ((match = varRegex.exec(content)) !== null) {
          if (match[1] !== word.word) userTokens.add({ name: match[1], kind: monaco.languages.CompletionItemKind.Variable });
        }
        if (lang === 'python') {
          while ((match = pyVarRegex.exec(content)) !== null) {
            if (match[1] !== word.word) userTokens.add({ name: match[1], kind: monaco.languages.CompletionItemKind.Variable });
          }
        }

        userTokens.forEach(token => {
          suggestions.push({
            label: token.name,
            kind: token.kind,
            detail: `User ${token.kind === monaco.languages.CompletionItemKind.Function ? 'Function' : token.kind === monaco.languages.CompletionItemKind.Class ? 'Class' : 'Variable'}`,
            documentation: `Defined in workspace code file.`,
            insertText: token.name,
            range,
          });
        });

        getKeywordsForLanguage(lang).forEach(kw => {
          suggestions.push({
            label: kw,
            kind: monaco.languages.CompletionItemKind.Keyword,
            detail: 'Keyword',
            insertText: kw,
            range,
          });
        });

        getSnippetsForLanguage(lang, monaco, range).forEach(snip => {
          suggestions.push(snip);
        });

        getAutoImportsForLanguage(lang, content, monaco, range).forEach(imp => {
          suggestions.push(imp);
        });

        return { suggestions };
      }
    });

    // 2. HOVER PROVIDER
    monaco.languages.registerHoverProvider(lang, {
      provideHover: (model, position) => {
        const word = model.getWordAtPosition(position);
        if (!word) return null;
        
        const content = model.getValue();
        const funcDefRegex = new RegExp(`(?:function|def|void|int|double|float|string)\\s+${word.word}\\s*\\(([^)]*)\\)`, 'i');
        const classDefRegex = new RegExp(`(?:class|struct)\\s+${word.word}\\b`, 'i');
        
        let hoverContents = [];
        const funcMatch = funcDefRegex.exec(content);
        const classMatch = classDefRegex.exec(content);
        
        if (funcMatch) {
          hoverContents = [
            { value: `**function ${word.word}(${funcMatch[1]})**` },
            { value: 'User-defined function in this workspace.' }
          ];
        } else if (classMatch) {
          hoverContents = [
            { value: `**class ${word.word}**` },
            { value: 'User-defined class declaration.' }
          ];
        } else {
          const stdDoc = getStdLibraryDoc(lang, word.word);
          if (stdDoc) {
            hoverContents = [
              { value: `**${stdDoc.signature}**` },
              { value: stdDoc.doc }
            ];
          }
        }
        
        if (hoverContents.length > 0) {
          return { contents: hoverContents };
        }
        return null;
      }
    });

    // 3. DEFINITION PROVIDER
    monaco.languages.registerDefinitionProvider(lang, {
      provideDefinition: (model, position) => {
        const word = model.getWordAtPosition(position);
        if (!word) return null;
        
        const lines = model.getValue().split('\n');
        let definitionLine = -1;
        let definitionCol = 1;
        
        const funcDef = new RegExp(`(?:function|def|void|int|double|float|string)\\s+${word.word}\\b`, 'i');
        const classDef = new RegExp(`(?:class|struct)\\s+${word.word}\\b`, 'i');
        const pyVarDef = new RegExp(`^${word.word}\\s*=`, 'i');

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (funcDef.test(line) || classDef.test(line) || (lang === 'python' && pyVarDef.test(line))) {
            definitionLine = i + 1;
            definitionCol = line.indexOf(word.word) + 1;
            break;
          }
        }
        
        if (definitionLine !== -1) {
          return {
            uri: model.uri,
            range: new monaco.Range(definitionLine, definitionCol, definitionLine, definitionCol + word.word.length)
          };
        }
        return null;
      }
    });

    // 4. REFERENCE PROVIDER
    monaco.languages.registerReferenceProvider(lang, {
      provideReferences: (model, position) => {
        const word = model.getWordAtPosition(position);
        if (!word) return null;
        
        const text = model.getValue();
        const lines = text.split('\n');
        const references = [];
        const regex = new RegExp(`\\b${word.word}\\b`, 'g');
        
        lines.forEach((line, idx) => {
          let match;
          const lineNum = idx + 1;
          while ((match = regex.exec(line)) !== null) {
            references.push({
              uri: model.uri,
              range: new monaco.Range(lineNum, match.index + 1, lineNum, match.index + 1 + word.word.length)
            });
          }
        });
        
        return references;
      }
    });

    // 5. SIGNATURE HELP PROVIDER
    monaco.languages.registerSignatureHelpProvider(lang, {
      signatureHelpTriggerCharacters: ['(', ','],
      provideSignatureHelp: (model, position) => {
        const lineContent = model.getLineContent(position.lineNumber);
        const beforeCursor = lineContent.substring(0, position.column - 1);
        
        const lastParen = beforeCursor.lastIndexOf('(');
        if (lastParen === -1) return null;
        
        const beforeParen = beforeCursor.substring(0, lastParen).trim();
        const words = beforeParen.split(/\s+/);
        const funcName = words[words.length - 1];
        if (!funcName) return null;

        const content = model.getValue();
        const funcDefRegex = new RegExp(`(?:function|def|void|int|double|float|string)\\s+${funcName}\\s*\\(([^)]*)\\)`, 'i');
        const match = funcDefRegex.exec(content);
        
        if (match) {
          const paramsStr = match[1];
          const params = paramsStr.split(',').map(p => p.trim()).filter(Boolean);
          const commaCount = beforeCursor.substring(lastParen + 1).split(',').length - 1;
          
          return {
            value: {
              signatures: [{
                label: `${funcName}(${paramsStr})`,
                documentation: `Parameters structure help helper.`,
                parameters: params.map(p => ({
                  label: p,
                  documentation: `Parameter: ${p}`
                }))
              }],
              activeSignature: 0,
              activeParameter: Math.min(commaCount, params.length - 1)
            },
            dispose: () => {}
          };
        }
        return null;
      }
    });
  });
};

const CodeEditor = ({ onSaveFile, onCursorMove }) => {
  const dispatch = useDispatch();
  const activeFile = useSelector((state) => state.editor.activeFile);
  const fileContents = useSelector((state) => state.editor.fileContents) || {};
  const settings = useSelector((state) => state.editor.settings);
  const projectId = useSelector((state) => state.editor.activeProject?._id);

  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const saveTimeoutRef = useRef(null);
  const decorationsRef = useRef([]);

  const fileMarkers = useSelector((state) => state.editor.fileMarkers) || {};
  const activeMarkers = activeFile ? fileMarkers[activeFile] || [] : [];
  const collabCursors = useSelector((state) => state.editor.collabCursors) || {};

  const activeContent = activeFile ? fileContents[activeFile] || '' : '';

  const getLanguage = (filePath) => {
    if (!filePath) return 'plaintext';
    const ext = filePath.split('.').pop().toLowerCase();
    switch (ext) {
      case 'html': return 'html';
      case 'css': return 'css';
      case 'js': return 'javascript';
      case 'jsx': return 'javascript';
      case 'ts': return 'typescript';
      case 'tsx': return 'typescript';
      case 'json': return 'json';
      case 'py': return 'python';
      case 'cpp': return 'cpp';
      case 'c': return 'c';
      case 'java': return 'java';
      case 'php': return 'php';
      case 'md': return 'markdown';
      default: return 'plaintext';
    }
  };

  // Define themes and register IntelliSense BEFORE mounting
  const handleEditorBeforeMount = (monaco) => {
    monacoRef.current = monaco;

    // Register all IntelliSense completion, definition, hover providers
    registerIntelliSense(monaco);

    // Define custom 'dark-plus' theme matching VS Code Dark+
    monaco.editor.defineTheme('dark-plus', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A9955' },
        { token: 'keyword', foreground: 'C586C0' },
        { token: 'keyword.control', foreground: 'C586C0' },
        { token: 'keyword.operator', foreground: 'D4D4D4' },
        { token: 'keyword.other', foreground: '569CD6' },
        { token: 'storage', foreground: '569CD6' },
        { token: 'storage.type', foreground: '569CD6' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'number', foreground: 'B5CEA8' },
        { token: 'identifier', foreground: '9CDCFE' },
        { token: 'variable', foreground: '9CDCFE' },
        { token: 'type', foreground: '4EC9B0' },
        { token: 'class', foreground: '4EC9B0' },
        { token: 'function', foreground: 'DCDCAA' },
        { token: 'meta.function-call', foreground: 'DCDCAA' },
        { token: 'tag', foreground: '569CD6' },
        { token: 'attribute.name', foreground: '9CDCFE' },
        { token: 'attribute.value', foreground: 'CE9178' },
      ],
      colors: {
        'editor.background': '#1e1e1e',
        'editor.foreground': '#d4d4d4',
        'editor.lineHighlightBackground': '#2d2d2d',
        'editorCursor.foreground': '#52afef', // Bright cursor
        'editorLineNumber.foreground': '#858585',
        'editorLineNumber.activeForeground': '#c6c6c6',
        'editorSuggestWidget.background': '#252526',
        'editorSuggestWidget.border': '#454545',
        'editorSuggestWidget.foreground': '#cccccc',
        'editorSuggestWidget.selectedBackground': '#37373d',
        'editorSuggestWidget.highlightForeground': '#0097fb',
        'editorHoverWidget.background': '#252526',
        'editorHoverWidget.border': '#454545',
        'editor.selectionBackground': '#264f78',
      },
    });

    // Also define Monokai / Dracula / Github dark custom themes
    monaco.editor.defineTheme('monokai', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '75715E', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'F92672' },
        { token: 'number', foreground: 'AE81FF' },
        { token: 'string', foreground: 'E6DB74' },
        { token: 'type', foreground: '66D9EF', fontStyle: 'italic' },
      ],
      colors: {
        'editor.background': '#272822',
        'editor.foreground': '#F8F8F2',
        'editor.lineHighlightBackground': '#3E3D32',
        'editorCursor.foreground': '#F8F8F0',
        'editorWhitespace.foreground': '#3B3A32',
      },
    });

    monaco.editor.defineTheme('dracula', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6272a4', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'ff79c6' },
        { token: 'string', foreground: 'f1fa8c' },
        { token: 'number', foreground: 'bd93f9' },
        { token: 'variable', foreground: 'f8f8f2' },
        { token: 'type', foreground: '8be9fd', fontStyle: 'italic' },
      ],
      colors: {
        'editor.background': '#282a36',
        'editor.foreground': '#f8f8f2',
        'editor.lineHighlightBackground': '#44475a',
        'editorCursor.foreground': '#f8f8f0',
      },
    });

    monaco.editor.defineTheme('github-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '8b949e', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'ff7b72' },
        { token: 'string', foreground: 'a5d6ff' },
        { token: 'variable', foreground: 'c9d1d9' },
        { token: 'constant', foreground: '79c0ff' },
      ],
      colors: {
        'editor.background': '#0d1117',
        'editor.foreground': '#c9d1d9',
        'editor.lineHighlightBackground': '#161b22',
        'editorCursor.foreground': '#58a6ff',
      },
    });
  };

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Apply active theme immediately
    const themeValue = settings.theme;
    if (themeValue === 'dark-plus') {
      monaco.editor.setTheme('dark-plus');
    } else if (themeValue === 'light-plus') {
      monaco.editor.setTheme('vs');
    } else {
      monaco.editor.setTheme(themeValue);
    }

    // Setup Custom Monaco options for VS Code behavior
    editor.updateOptions({
      fontSize: settings.fontSize,
      fontFamily: settings.fontFamily,
      tabSize: settings.tabSize,
      autoCloseBrackets: settings.autoCloseBrackets ? 'always' : 'never',
      cursorBlinking: 'smooth',
      cursorSmoothCaretAnimation: 'on',
      cursorWidth: 3, // Highly visible caret
      cursorStyle: 'line',
      smoothScrolling: true,
      suggestOnTriggerCharacters: true,
      acceptSuggestionOnEnter: 'on',
      tabCompletion: 'on',
      snippetSuggestions: 'top',
      quickSuggestions: { other: true, comments: true, strings: true },
      parameterHints: { enabled: true },
      wordBasedSuggestions: 'allDocuments',
      suggest: {
        insertMode: 'insert',
        filterGraceful: true,
        snippetsPreventQuickSuggestions: false,
        showMethods: true,
        showFunctions: true,
        showConstructors: true,
        showFields: true,
        showVariables: true,
        showClasses: true,
        showInterfaces: true,
        showModules: true,
        showProperties: true,
        showEvents: true,
        showOperators: true,
        showTypeParameters: true,
        showUnits: true,
        showColors: true,
        showFiles: true,
        showReferences: true,
        showFolders: true,
        showTypeVariables: true,
        showEnums: true,
        showEnumMembers: true,
        showKeywords: true,
        showWords: true,
        showSnippetTab: true,
      }
    });

    // Listen to cursor position changes to broadcast over socket
    editor.onDidChangeCursorPosition((e) => {
      if (activeFile && projectId) {
        const pos = { lineNumber: e.position.lineNumber, column: e.position.column };
        localStorage.setItem(`editor-cursor-${projectId}-${activeFile}`, JSON.stringify(pos));
      }
      if (onCursorMove) {
        onCursorMove({ lineNumber: e.position.lineNumber, column: e.position.column });
      }
    });

    // Save scroll position changes
    editor.onDidScrollChange((e) => {
      if (activeFile && projectId) {
        const scroll = { scrollTop: editor.getScrollTop(), scrollLeft: editor.getScrollLeft() };
        localStorage.setItem(`editor-scroll-${projectId}-${activeFile}`, JSON.stringify(scroll));
      }
    });

    // Save instantly when the editor loses focus (blur text area)
    editor.onDidBlurEditorText(() => {
      if (onSaveFile) onSaveFile();
    });

    // Restore scroll/cursor positions on initial load
    if (activeFile && projectId) {
      const savedCursor = localStorage.getItem(`editor-cursor-${projectId}-${activeFile}`);
      if (savedCursor) {
        try {
          const { lineNumber, column } = JSON.parse(savedCursor);
          editor.setPosition({ lineNumber, column });
          editor.revealPositionInCenter({ lineNumber, column });
        } catch (err) {}
      }
      const savedScroll = localStorage.getItem(`editor-scroll-${projectId}-${activeFile}`);
      if (savedScroll) {
        try {
          const { scrollTop, scrollLeft } = JSON.parse(savedScroll);
          editor.setScrollTop(scrollTop);
          editor.setScrollLeft(scrollLeft);
        } catch (err) {}
      }
    }
  };

  // Run initial real-time syntax checking on file load
  useEffect(() => {
    if (editorRef.current && monacoRef.current && activeFile) {
      const model = editorRef.current.getModel();
      if (model) {
        runRealTimeDiagnostics(model, monacoRef.current);
      }
    }
  }, [activeFile]);

  // Sync settings when they update in Redux
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions({
        fontSize: settings.fontSize,
        fontFamily: settings.fontFamily,
        tabSize: settings.tabSize,
        wordWrap: settings.wordWrap,
        minimap: { enabled: settings.minimap },
        autoCloseBrackets: settings.autoCloseBrackets ? 'always' : 'never',
      });
    }
  }, [settings]);

  // Sync theme changes dynamically
  useEffect(() => {
    if (monacoRef.current) {
      const themeValue = settings.theme;
      if (themeValue === 'dark-plus') {
        monacoRef.current.editor.setTheme('dark-plus');
      } else if (themeValue === 'light-plus') {
        monacoRef.current.editor.setTheme('vs');
      } else {
        monacoRef.current.editor.setTheme(themeValue);
      }
    }
  }, [settings.theme]);

  // Sync validation error markers (LSP diagnostics)
  useEffect(() => {
    if (editorRef.current && monacoRef.current && activeFile) {
      const model = editorRef.current.getModel();
      if (model) {
        const monacoMarkers = activeMarkers.map((marker) => ({
          severity: marker.severity === 'warning'
            ? monacoRef.current.MarkerSeverity.Warning
            : monacoRef.current.MarkerSeverity.Error,
          message: marker.message,
          startLineNumber: marker.line,
          startColumn: marker.column || 1,
          endLineNumber: marker.line,
          endColumn: (marker.column || 1) + 20,
        }));
        
        monacoRef.current.editor.setModelMarkers(model, 'compiler', monacoMarkers);
      }
    }
  }, [activeMarkers, activeFile]);

  // Sync collaborative cursors overlay (Live Share)
  useEffect(() => {
    if (editorRef.current && monacoRef.current && activeFile) {
      const model = editorRef.current.getModel();
      if (model) {
        const activeCollabCursors = Object.keys(collabCursors)
          .map((socketId) => collabCursors[socketId])
          .filter((collab) => collab && collab.filePath === activeFile && collab.cursor);

        const newDecorations = activeCollabCursors.map((collab) => {
          const pos = collab.cursor;
          return {
            range: new monacoRef.current.Range(pos.lineNumber, pos.column, pos.lineNumber, pos.column),
            options: {
              className: 'remote-cursor',
              hoverMessage: { value: `${collab.username} is editing here` },
            }
          };
        });

        decorationsRef.current = editorRef.current.deltaDecorations(
          decorationsRef.current,
          newDecorations
        );
      }
    }
  }, [collabCursors, activeFile]);

  // Handle content edits and real-time validation checks
  const handleContentChange = (newValue) => {
    dispatch(updateFileContent({ path: activeFile, content: newValue }));

    // Cache current edit instantly to localStorage to prevent data loss on crash
    if (projectId && activeFile) {
      localStorage.setItem(`draft-${projectId}-${activeFile}`, newValue);
    }

    if (editorRef.current && monacoRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        runRealTimeDiagnostics(model, monacoRef.current);
      }
    }

    // Auto save always enabled (typing stop 600ms)
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      if (onSaveFile) onSaveFile();
    }, 600);
  };

  // Clean up auto-save on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Restore cursor and scroll position on tab/file change
  useEffect(() => {
    if (editorRef.current && activeFile && projectId) {
      const savedCursor = localStorage.getItem(`editor-cursor-${projectId}-${activeFile}`);
      if (savedCursor) {
        try {
          const { lineNumber, column } = JSON.parse(savedCursor);
          editorRef.current.setPosition({ lineNumber, column });
          editorRef.current.revealPositionInCenter({ lineNumber, column });
        } catch (err) {}
      }

      const savedScroll = localStorage.getItem(`editor-scroll-${projectId}-${activeFile}`);
      if (savedScroll) {
        try {
          const { scrollTop, scrollLeft } = JSON.parse(savedScroll);
          editorRef.current.setScrollTop(scrollTop);
          editorRef.current.setScrollLeft(scrollLeft);
        } catch (err) {}
      }
    }
  }, [activeFile, projectId]);

  if (!activeFile) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#1e1e1e] text-gray-500 select-none text-xs">
        <div className="text-center flex flex-col items-center gap-3">
          <svg className="w-16 h-16 text-gray-700/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
          </svg>
          <div className="font-semibold text-gray-500">No active file open</div>
          <div className="text-[11px] text-gray-600 font-mono">
            Press <kbd className="bg-gray-800 border border-gray-700 px-1 py-0.5 rounded text-[10px] text-gray-400">Ctrl+P</kbd> to find files<br />
            Press <kbd className="bg-gray-800 border border-gray-700 px-1 py-0.5 rounded text-[10px] text-gray-400">Ctrl+Shift+P</kbd> for commands
          </div>
        </div>
      </div>
    );
  }

  // Resolve active theme key for the Monaco wrapper
  const activeThemeKey = settings.theme === 'light-plus'
    ? 'vs'
    : (settings.theme === 'dark-plus' ? 'dark-plus' : settings.theme);

  return (
    <div className="w-full h-full relative">
      <Editor
        height="100%"
        width="100%"
        path={activeFile}
        language={getLanguage(activeFile)}
        value={activeContent}
        onChange={handleContentChange}
        beforeMount={handleEditorBeforeMount}
        onMount={handleEditorDidMount}
        theme={activeThemeKey}
        loading={
          <div className="w-full h-full bg-[#1e1e1e] flex items-center justify-center text-xs text-gray-500">
            Loading editor assets...
          </div>
        }
      />
    </div>
  );
};

export default CodeEditor;
