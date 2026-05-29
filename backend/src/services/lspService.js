const { exec } = require('child_process');
const path = require('path');
const fs = require('fs-extra');
const { getProjectPath } = require('./fileService');

/**
 * Validate syntax of code file by running lightweight local syntax checks
 */
const validateFileSyntax = async (projectId, relativePath) => {
  const projectPath = getProjectPath(projectId);
  const filePath = path.join(projectPath, relativePath);

  if (!fs.existsSync(filePath)) {
    return { success: false, markers: [] };
  }

  const ext = path.extname(filePath).toLowerCase();
  let command = null;
  const isWindows = process.platform === 'win32';

  // Choose syntax checking command based on extension
  switch (ext) {
    case '.py':
      command = `${isWindows ? 'python' : 'python3'} -m py_compile "${filePath}"`;
      break;
    case '.cpp':
    case '.cc':
      command = `g++ -fsyntax-only "${filePath}"`;
      break;
    case '.c':
      command = `gcc -fsyntax-only "${filePath}"`;
      break;
    case '.php':
      command = `php -l "${filePath}"`;
      break;
    default:
      // Monaco handles HTML, CSS, JS, TS, JSON natively in the editor worker!
      return { success: true, markers: [] };
  }

  return new Promise((resolve) => {
    exec(command, (error, stdout, stderr) => {
      const output = stderr || stdout || '';
      const markers = [];

      if (error) {
        // Parse compilers error messages (e.g. filename:line:col: error: message)
        const lines = output.split('\n');

        for (const line of lines) {
          if (!line.trim()) continue;

          // GCC / G++: "/path/to/file.cpp:5:10: error: expected ';' before..."
          // Python: "  File "file.py", line 3"
          // PHP: "Parse error: syntax error, unexpected 'echo' (T_ECHO) in index.php on line 4"

          if (ext === '.py') {
            // Match python compile error line details
            const lineMatch = output.match(/line (\d+)/);
            if (lineMatch) {
              markers.push({
                severity: 'error',
                message: output.split('\n').pop() || 'Python Syntax Error',
                line: parseInt(lineMatch[1], 10),
                column: 1,
              });
              break;
            }
          } else if (ext === '.php') {
            const lineMatch = line.match(/on line (\d+)/);
            if (lineMatch) {
              markers.push({
                severity: 'error',
                message: line,
                line: parseInt(lineMatch[1], 10),
                column: 1,
              });
              break;
            }
          } else if (ext === '.c' || ext === '.cpp') {
            // GCC parser match: file.c:line:col: error: message
            const match = line.match(/:(\d+):(\d+):\s+(error|warning):\s+(.+)/);
            if (match) {
              markers.push({
                severity: match[3] === 'warning' ? 'warning' : 'error',
                message: match[4],
                line: parseInt(match[1], 10),
                column: parseInt(match[2], 10),
              });
            }
          }
        }
      }

      resolve({
        success: markers.length === 0,
        markers,
      });
    });
  });
};

module.exports = {
  validateFileSyntax,
};
