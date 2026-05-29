const path = require('path');
const fs = require('fs-extra');
const mime = require('mime-types');
const { getProjectPath } = require('./fileService');

/**
 * Handle dynamic static file serving with hot-reload injection for HTML files
 */
const servePreviewFile = async (req, res) => {
  const { projectId } = req.params;
  
  // Extract relative path from wildcard param, fallback to index.html if empty
  let relativePath = req.params[0] || 'index.html';
  
  const projectPath = getProjectPath(projectId);
  let filePath = path.join(projectPath, relativePath);

  // Security check: ensure path is within the workspace
  if (!filePath.startsWith(projectPath)) {
    return res.status(403).send('Forbidden: Access denied outside workspace');
  }

  // If path is a directory, append index.html
  try {
    const stat = await fs.stat(filePath);
    if (stat.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }
  } catch (err) {
    return res.status(404).send('File or directory not found');
  }

  if (!fs.existsSync(filePath)) {
    return res.status(404).send('Preview file not found');
  }

  const mimeType = mime.lookup(filePath) || 'application/octet-stream';
  res.setHeader('Content-Type', mimeType);

  // If request is for an HTML file, inject hot-reload socket scripts
  if (mimeType === 'text/html') {
    try {
      let htmlContent = await fs.readFile(filePath, 'utf8');

      // Socket live reload injection code
      // We listen to the project room socket.io updates and trigger reload
      const injectionScript = `
        <!-- RR CodeVerse Live Server Hot-Reload -->
        <script src="/socket.io/socket.io.js"></script>
        <script>
          (function() {
            const socket = io();
            const projectId = "${projectId}";
            console.log("RR CodeVerse Live Server: connected to workspace " + projectId);
            
            socket.emit('join-project', { projectId, username: 'live-server-preview' });
            
            // Reload on hot sync file edits
            socket.on('file-synced', function(data) {
              const ext = data.filePath.split('.').pop().toLowerCase();
              if (['html', 'css', 'js'].includes(ext)) {
                console.log("Live Server: File saved, hot reloaded page.");
                window.location.reload();
              }
            });
          })();
        </script>
      `;

      // Inject before </body> tag if exists, otherwise append at the end
      if (htmlContent.includes('</body>')) {
        htmlContent = htmlContent.replace('</body>', `${injectionScript}</body>`);
      } else {
        htmlContent += injectionScript;
      }

      return res.send(htmlContent);
    } catch (readError) {
      console.error(readError);
      return res.status(500).send('Error rendering preview document');
    }
  }

  // Otherwise, pipe standard assets directly (css, js, images)
  const fileStream = fs.createReadStream(filePath);
  fileStream.on('error', (err) => {
    console.error(err);
    res.status(500).send('Error streaming preview asset');
  });
  fileStream.pipe(res);
};

module.exports = {
  servePreviewFile,
};
