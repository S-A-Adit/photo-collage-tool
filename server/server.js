import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { createCollage } from './imageProcessor.js';

// Resolve __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directory Setup
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const TEMP_DIR = path.join(UPLOADS_DIR, 'temp');
const COLLAGES_DIR = path.join(UPLOADS_DIR, 'collages');

// Create directories recursively on startup
fs.mkdirSync(TEMP_DIR, { recursive: true });
fs.mkdirSync(COLLAGES_DIR, { recursive: true });

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for client development server
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));

app.use(express.json());

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, TEMP_DIR);
  },
  filename: (req, file, cb) => {
    // Save with a unique name to avoid naming collisions
    const uniqueSuffix = crypto.randomUUID();
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

// File validation filter (image files only)
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, WEBP, and GIF images are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per image
    files: 10 // Max 10 images
  }
});

// In-Memory Task Registry and Queue
const tasks = new Map();
const taskQueue = [];
let isProcessing = false;

// Task Worker Loop
async function processNextTask() {
  if (isProcessing || taskQueue.length === 0) {
    return;
  }

  isProcessing = true;
  const taskId = taskQueue.shift();
  const task = tasks.get(taskId);

  if (!task) {
    isProcessing = false;
    processNextTask();
    return;
  }

  task.status = 'processing';
  task.startedAt = new Date();

  const collageId = crypto.randomUUID();
  const format = task.options.format || 'png';
  const ext = format === 'jpeg' ? 'jpg' : format;
  const collageFileName = `${collageId}.${ext}`;
  const outputPath = path.join(COLLAGES_DIR, collageFileName);

  try {
    // Run collage stitching
    await createCollage(task.inputFiles, task.options, outputPath);

    // Update task as completed
    task.status = 'completed';
    task.resultUrl = `/api/collage/download/${collageFileName}`;
    task.finishedAt = new Date();
  } catch (error) {
    console.error(`Error processing task ${taskId}:`, error);
    task.status = 'failed';
    task.error = error.message || 'Unknown processing error';
    task.finishedAt = new Date();
  } finally {
    // Clean up temporary uploaded files to preserve privacy and free up space
    for (const file of task.inputFiles) {
      fs.unlink(file.path, (err) => {
        if (err && err.code !== 'ENOENT') {
          console.warn(`Warning: Failed to delete temporary file ${file.path}:`, err);
        }
      });
    }

    isProcessing = false;
    // Process next item in the queue
    setTimeout(processNextTask, 0);
  }
}

// REST API Endpoints

// Endpoint 1: Create Collage Job
app.post('/api/collage/create', (req, res) => {
  upload.array('images', 10)(req, res, (err) => {
    if (err) {
      let status = 400;
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'One or more files exceed the 10MB size limit.' });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({ error: 'You can upload a maximum of 10 images.' });
        }
      }
      return res.status(status).json({ error: err.message });
    }

    if (!req.files || req.files.length < 2) {
      return res.status(400).json({ error: 'Please upload at least 2 images to create a collage.' });
    }

    const { layout = 'horizontal', borderSize = 10, borderColor = '#ffffff', format = 'png', quality = 90 } = req.body;

    const taskId = crypto.randomUUID();
    const task = {
      id: taskId,
      status: 'pending',
      createdAt: new Date(),
      inputFiles: req.files.map(f => ({
        path: f.path,
        originalname: f.originalname
      })),
      options: {
        layout,
        borderSize: parseInt(borderSize, 10),
        borderColor,
        format,
        quality: parseInt(quality, 10)
      },
      resultUrl: null,
      error: null
    };

    tasks.set(taskId, task);
    taskQueue.push(taskId);

    // Trigger queue processor
    processNextTask();

    res.status(202).json({
      message: 'Collage processing job queued successfully',
      taskId
    });
  });
});

// Endpoint 2: Poll Task Status
app.get('/api/collage/status/:taskId', (req, res) => {
  const { taskId } = req.params;
  const task = tasks.get(taskId);

  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const queueIndex = taskQueue.indexOf(taskId);
  const queuePosition = queueIndex !== -1 ? queueIndex + 1 : (task.status === 'pending' || task.status === 'processing' ? 0 : null);

  res.json({
    id: task.id,
    status: task.status,
    resultUrl: task.resultUrl,
    error: task.error,
    queuePosition
  });
});

// Endpoint 3: Download Collage Result
app.get('/api/collage/download/:filename', (req, res) => {
  const { filename } = req.params;
  
  // Prevent directory traversal attacks
  const safeFilename = path.basename(filename);
  const filePath = path.join(COLLAGES_DIR, safeFilename);

  if (fs.existsSync(filePath)) {
    const ext = path.extname(safeFilename);
    if (req.query.download === 'true') {
      res.download(filePath, `collage_${Date.now()}${ext}`, (err) => {
        if (err) {
          console.error('Download error:', err);
        }
      });
    } else {
      res.sendFile(filePath);
    }
  } else {
    res.status(404).json({ error: 'Collage file not found or has expired.' });
  }
});

// Privacy Cleanup Task: Runs every 15 minutes, deletes files older than 30 minutes
const CLEANUP_INTERVAL = 15 * 60 * 1000;
const MAX_FILE_AGE = 30 * 60 * 1000;

setInterval(() => {
  const now = Date.now();
  console.log('Running periodic uploads and collages cleanup task...');

  // Clean temp folder
  fs.readdir(TEMP_DIR, (err, files) => {
    if (err) return console.error('Cleanup read temp dir error:', err);
    files.forEach(file => {
      const filePath = path.join(TEMP_DIR, file);
      fs.stat(filePath, (statErr, stats) => {
        if (statErr) return;
        if (now - stats.mtimeMs > MAX_FILE_AGE) {
          fs.unlink(filePath, () => {});
        }
      });
    });
  });

  // Clean collages folder
  fs.readdir(COLLAGES_DIR, (err, files) => {
    if (err) return console.error('Cleanup read collages dir error:', err);
    files.forEach(file => {
      const filePath = path.join(COLLAGES_DIR, file);
      fs.stat(filePath, (statErr, stats) => {
        if (statErr) return;
        if (now - stats.mtimeMs > MAX_FILE_AGE) {
          fs.unlink(filePath, () => {});
        }
      });
    });
  });

  // Clean tasks Map to prevent memory leaks
  for (const [id, task] of tasks.entries()) {
    const age = now - new Date(task.createdAt).getTime();
    if (age > MAX_FILE_AGE) {
      tasks.delete(id);
    }
  }
}, CLEANUP_INTERVAL);

// Start server
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  server.close(() => {
    console.log('Server terminated');
  });
});
