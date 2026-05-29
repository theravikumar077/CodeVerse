const path = require('path');
const { spawn: spawnProcess } = require('child_process');

let pty = null;
try {
  pty = require('node-pty');
  console.log('PTY native terminal integration loaded successfully.');
} catch (err) {
  console.warn('Native node-pty module could not be loaded. Falling back to standard child_process.spawn.');
}

const activeTerminals = new Map(); // terminalId -> ptyProcess or childProcess

const initPtyService = (io) => {
  const terminalNamespace = io.of('/terminal');

  terminalNamespace.on('connection', (socket) => {
    console.log(`Terminal socket connected: ${socket.id}`);

    // Create a new terminal process
    socket.on('create-terminal', ({ terminalId, projectId }) => {
      const workspaceDir = path.resolve(process.env.WORKSPACE_DIR || './workspaces', projectId.toString());
      const isWindows = process.platform === 'win32';
      
      let termProcess = null;

      if (pty) {
        // Spawn native PTY process
        const shell = isWindows ? 'powershell.exe' : 'bash';
        try {
          termProcess = pty.spawn(shell, [], {
            name: 'xterm-color',
            cols: 80,
            rows: 24,
            cwd: workspaceDir,
            env: process.env,
          });

          // PTY output event
          termProcess.onData((data) => {
            socket.emit(`terminal-data-${terminalId}`, data);
          });
        } catch (spawnError) {
          console.error('PTY spawn failed, attempting child_process fallback', spawnError);
          pty = null; // Forces child process fallback next
        }
      }

      // Graceful fallback to child_process spawn
      if (!termProcess) {
        console.log(`Spawning fallback shell process for terminal: ${terminalId}`);
        const shell = isWindows ? 'powershell.exe' : 'bash';
        
        termProcess = spawnProcess(shell, [], {
          cwd: workspaceDir,
          env: process.env,
          shell: true,
        });

        // Fallback stdout data handler
        termProcess.stdout.on('data', (data) => {
          socket.emit(`terminal-data-${terminalId}`, data.toString());
        });

        // Fallback stderr data handler
        termProcess.stderr.on('data', (data) => {
          socket.emit(`terminal-data-${terminalId}`, data.toString());
        });

        termProcess.on('close', () => {
          socket.emit(`terminal-exit-${terminalId}`);
        });
      }

      // Store active session reference
      activeTerminals.set(terminalId, termProcess);
      console.log(`Active shell running for terminal ID: ${terminalId}`);
    });

    // Write input characters/commands to shell
    socket.on('terminal-input', ({ terminalId, data }) => {
      const termProcess = activeTerminals.get(terminalId);
      if (termProcess) {
        if (pty) {
          // Native node-pty write
          termProcess.write(data);
        } else {
          // Fallback process stdin write
          termProcess.stdin.write(data);
        }
      }
    });

    // Resize terminal columns and rows
    socket.on('resize-terminal', ({ terminalId, cols, rows }) => {
      const termProcess = activeTerminals.get(terminalId);
      // Resize only supported on native PTY
      if (termProcess && pty && typeof termProcess.resize === 'function') {
        try {
          termProcess.resize(cols, rows);
        } catch (resizeError) {
          console.error('Error resizing PTY:', resizeError);
        }
      }
    });

    // Kill terminal process
    socket.on('kill-terminal', ({ terminalId }) => {
      const termProcess = activeTerminals.get(terminalId);
      if (termProcess) {
        console.log(`Terminating shell process for terminal ID: ${terminalId}`);
        if (pty) {
          termProcess.kill();
        } else {
          termProcess.kill('SIGTERM');
        }
        activeTerminals.delete(terminalId);
      }
    });

    socket.on('disconnect', () => {
      console.log(`Terminal socket client disconnected: ${socket.id}`);
      // Clean up orphaned terminals owned by this socket session if tracking is added
    });
  });
};

module.exports = {
  initPtyService,
};
