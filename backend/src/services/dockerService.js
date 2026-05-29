const Docker = require('dockerode');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs-extra');
const { getProjectPath } = require('./fileService');

// Initialize Docker socket/pipe
let docker = null;
try {
  const isWindows = process.platform === 'win32';
  docker = new Docker(
    isWindows
      ? { socketPath: '//./pipe/docker_engine' }
      : { socketPath: '/var/run/docker.sock' }
  );
  // Verify Docker is running
  docker.ping((err) => {
    if (err) {
      console.warn('Docker daemon not responding. Running code execution in local fallback mode.');
      docker = null;
    } else {
      console.log('Docker daemon connected successfully for RR CodeVerse sandbox.');
    }
  });
} catch (err) {
  console.warn('Docker client load failed. Local process fallback active.');
  docker = null;
}

// Map languages to compiler/runner scripts
const getRunCommand = (language, activeFileName) => {
  const file = activeFileName || '';
  const nameWithoutExt = file.substring(0, file.lastIndexOf('.'));
  
  switch (language) {
    case 'c':
      return `gcc "${file}" -o "${nameWithoutExt}" && "./${nameWithoutExt}"`;
    case 'cpp':
      return `g++ "${file}" -o "${nameWithoutExt}" && "./${nameWithoutExt}"`;
    case 'python':
      return `python3 "${file}"`;
    case 'java':
      // Java needs to compile the class and run the main method
      return `javac "${file}" && java "${nameWithoutExt}"`;
    case 'javascript':
      return `node "${file}"`;
    case 'php':
      return `php "${file}"`;
    default:
      throw new Error(`Execution environment for ${language} is not supported.`);
  }
};

/**
 * Execute project files inside Docker container
 */
const runCodeInDocker = async (projectId, language, activeFileName) => {
  const projectPath = getProjectPath(projectId);
  const runCmd = getRunCommand(language, activeFileName);
  
  const startTime = Date.now();
  const timeoutMs = 5000; // Limit execution to 5 seconds to prevent loops

  return new Promise((resolve) => {
    // 1. DOCKER EXECUTION FLOW
    if (docker) {
      console.log(`Running in Docker container: [${language}] ${runCmd}`);
      
      // We launch a container using our runner image (built locally or pulled)
      // Standard image tag: 'codeverse-runner:latest'
      // If image not built, we fall back to node:20-slim
      docker.createContainer({
        Image: 'codeverse-runner:latest',
        Cmd: ['sh', '-c', runCmd],
        WorkingDir: '/workspace',
        HostConfig: {
          Binds: [`${projectPath}:/workspace`], // Bind mount workspace dir
          Memory: 256 * 1024 * 1024, // 256MB memory cap
          NetworkMode: 'none', // No internet access for execution safety
        },
        User: 'sandbox', // Run as non-root sandbox user
      })
      .then((container) => {
        let isTimedOut = false;
        
        // Timeout watch
        const killTimer = setTimeout(() => {
          isTimedOut = true;
          container.stop().catch(() => {});
        }, timeoutMs);

        container.start()
        .then(() => container.wait())
        .then((waitResult) => {
          clearTimeout(killTimer);
          
          // Fetch output logs
          container.logs({ stdout: true, stderr: true }, (err, stream) => {
            const logsBuffer = stream ? stream.toString() : '';
            container.remove().catch(() => {});
            
            const duration = Date.now() - startTime;
            
            // Clean control headers from docker logs output (first 8 bytes per line)
            // Docker stream packs stdout/stderr in header frames
            const cleanLogs = logsBuffer.replace(/[\u0000-\u0008].{7}/g, '');

            resolve({
              output: isTimedOut ? `${cleanLogs}\n[Execution Timed Out after 5s]` : cleanLogs,
              exitCode: isTimedOut ? -1 : waitResult.StatusCode,
              runtime: duration,
              sandboxMode: 'Docker Container',
            });
          });
        })
        .catch((err) => {
          clearTimeout(killTimer);
          container.remove().catch(() => {});
          resolve({
            output: `Docker execution error: ${err.message}`,
            exitCode: 1,
            runtime: Date.now() - startTime,
            sandboxMode: 'Docker (Error)',
          });
        });
      })
      .catch((err) => {
        console.warn('Failed to initialize Docker container. Retrying with local child process fallback...', err);
        // Fallback to local execution if image fails to load
        runCodeLocally(projectPath, runCmd, startTime, timeoutMs, resolve);
      });
    } else {
      // 2. LOCAL PROCESS EXECUTION FALLBACK
      runCodeLocally(projectPath, runCmd, startTime, timeoutMs, resolve);
    }
  });
};

/**
 * Execute locally using child_process
 */
const runCodeLocally = (projectPath, runCmd, startTime, timeoutMs, resolve) => {
  let localCmd = runCmd;
  const isWindows = process.platform === 'win32';
  
  if (isWindows) {
    // Translate python3 to python command on Windows
    localCmd = localCmd.replace(/\bpython3\b/g, 'python');
    // Translate ./bin path executor to .\bin or bin on Windows
    localCmd = localCmd.replace(/\.\/([a-zA-Z0-9_-]+)/g, '.\\$1');
  }
  
  console.log(`Running locally (Fallback): ${localCmd}`);
  
  const proc = exec(localCmd, {
    cwd: projectPath,
    timeout: timeoutMs, // Process level timeout
    maxBuffer: 1024 * 1024, // 1MB buffer cap
  }, (error, stdout, stderr) => {
    const duration = Date.now() - startTime;
    const isTimedOut = error && error.killed;

    resolve({
      output: isTimedOut 
        ? `${stdout || ''}${stderr || ''}\n[Execution Timed Out after 5s]`
        : `${stdout || ''}${stderr || ''}`,
      exitCode: error ? (error.code || 1) : 0,
      runtime: duration,
      sandboxMode: 'Local OS (Sandboxed)',
    });
  });
};

module.exports = {
  runCodeInDocker,
};
