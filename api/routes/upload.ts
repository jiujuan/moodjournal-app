import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { statements } from '../database.js';
import type { MediaFile } from '../../shared/types.js';
const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images and audio files
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
      'audio/mp4',
      'audio/webm'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and audio files are allowed.'));
    }
  }
});

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Helper function to generate unique filename
function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const ext = path.extname(originalName);
  const name = path.basename(originalName, ext).replace(/[^a-zA-Z0-9]/g, '_');
  return `${timestamp}_${random}_${name}${ext}`;
}

// POST /api/upload - Upload a file
router.post('/', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const { entryId } = req.body;
    
    if (!entryId) {
      return res.status(400).json({
        success: false,
        error: 'Entry ID is required'
      });
    }

    // Generate unique filename
    const filename = generateUniqueFilename(req.file.originalname);
    const filePath = path.join(uploadsDir, filename);
    const publicPath = `/uploads/${filename}`;

    // Save file to disk
    fs.writeFileSync(filePath, req.file.buffer);

    // Save file info to database
    const fileType = req.file.mimetype.startsWith('image/') ? 'photo' : 'voice';
    
    const result = statements.insertMediaFile.run(
      entryId,
      publicPath,
      fileType,
      req.file.size
    );

    const createdFile: MediaFile = {
      id: String(result.lastInsertRowid),
      entry_id: entryId,
      file_path: publicPath,
      file_type: req.file.mimetype,
      file_size: req.file.size,
      original_name: req.file.originalname,
      created_at: new Date().toISOString()
    };

    res.json({
      success: true,
      data: createdFile
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload file'
    });
  }
});

// POST /api/upload/multiple - Upload multiple files
router.post('/multiple', upload.array('files', 5), (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files uploaded'
      });
    }

    const { entryId } = req.body;
    
    if (!entryId) {
      return res.status(400).json({
        success: false,
        error: 'Entry ID is required'
      });
    }

    const uploadedFiles: MediaFile[] = [];

    for (const file of files) {
      // Generate unique filename
      const filename = generateUniqueFilename(file.originalname);
      const filePath = path.join(uploadsDir, filename);
      const publicPath = `/uploads/${filename}`;

      // Save file to disk
      fs.writeFileSync(filePath, file.buffer);

      // Save file info to database
      const fileType = file.mimetype.startsWith('image/') ? 'photo' : 'voice';
      
      const result = statements.insertMediaFile.run(
        entryId,
        publicPath,
        fileType,
        file.size
      );

      uploadedFiles.push({
        id: String(result.lastInsertRowid),
        entry_id: entryId,
        file_path: publicPath,
        file_type: file.mimetype,
        file_size: file.size,
        original_name: file.originalname,
        created_at: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      data: uploadedFiles
    });
  } catch (error) {
    console.error('Error uploading files:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload files'
    });
  }
});

// DELETE /api/upload/:id - Delete a file
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    // Get file info from database
    const mediaFile = statements.getMediaFileById.get(id);
    
    if (!mediaFile) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Delete file from filesystem
    const filePath = path.join(uploadsDir, path.basename(mediaFile.file_path));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from database
    statements.deleteMediaFile.run(id);

    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete file'
    });
  }
});

// GET /api/upload/entry/:entryId - Get all files for an entry
router.get('/entry/:entryId', (req, res) => {
  try {
    const { entryId } = req.params;
    
    const mediaFiles = statements.getMediaFilesByEntry.all(entryId) as MediaFile[];
    
    res.json({
      success: true,
      data: mediaFiles
    });
  } catch (error) {
    console.error('Error fetching media files:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch media files'
    });
  }
});

export default router;