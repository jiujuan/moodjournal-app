import { Router } from 'express';
import { statements } from '../database.js';
import { z } from 'zod';
import type { 
  MoodEntry, 
  CreateEntryRequest, 
  UpdateEntryRequest, 
  GetEntriesRequest,
  EmotionType 
} from '../../shared/types.js';

const router = Router();

// Validation schemas
const emotionSchema = z.enum([
  'happy', 'sad', 'anxious', 'calm', 'excited', 
  'stressed', 'peaceful', 'frustrated', 'content', 'overwhelmed'
]);

const createEntrySchema = z.object({
  emotion: emotionSchema,
  notes: z.string().max(500).optional(),
  date: z.string().datetime(),
  photoPath: z.string().optional(),
  voicePath: z.string().optional()
});

const updateEntrySchema = z.object({
  emotion: emotionSchema.optional(),
  notes: z.string().max(500).optional(),
  date: z.string().datetime().optional()
});

const getEntriesSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  emotion: emotionSchema.optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0)
});

// GET /api/entries - Get all entries with optional filters
router.get('/', (req, res) => {
  try {
    console.log('Received query params:', req.query);
    const query = getEntriesSchema.parse(req.query);
    console.log('Parsed query:', query);
    
    let entries: MoodEntry[];
    let totalCount: number;
    
    if (query.startDate && query.endDate) {
      // Convert simple date format to full datetime range
      const startDateTime = query.startDate.includes('T') ? query.startDate : `${query.startDate}T00:00:00.000Z`;
      const endDateTime = query.endDate.includes('T') ? query.endDate : `${query.endDate}T23:59:59.999Z`;
      
      // Get entries by date range
      entries = statements.getEntriesByDateRange.all(startDateTime, endDateTime) as MoodEntry[];
      totalCount = entries.length;
    } else if (query.emotion) {
      // Get entries by emotion
      entries = statements.getEntriesByEmotion.all(query.emotion) as MoodEntry[];
      totalCount = entries.length;
    } else {
      // Get all entries with pagination
      entries = statements.getEntries.all(query.limit, query.offset) as MoodEntry[];
      // Get total count for pagination - use a separate count query instead
      const countResult = statements.getEntries.all(100, 0) as MoodEntry[];
      // For now, we'll use the length of a reasonable sample
      // TODO: Implement a proper count query
      totalCount = countResult.length;
    }
    
    // Apply pagination if we got all results
    if (!query.startDate && !query.endDate && !query.emotion) {
      entries = entries.slice(query.offset, query.offset + query.limit);
    }
    
    res.json({
      success: true,
      data: entries,
      total: totalCount
    });
  } catch (error) {
    console.error('Error fetching entries:', error);
    if (error instanceof z.ZodError) {
      console.log('Zod validation errors:', error.issues);
    }
    res.status(400).json({
      success: false,
      error: error instanceof z.ZodError ? 'Invalid query parameters' : 'Failed to fetch entries'
    });
  }
});

// GET /api/entries/:id - Get a specific entry
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const entry = statements.getEntryById.get(id) as MoodEntry | undefined;
    
    if (!entry) {
      return res.status(404).json({
        success: false,
        error: 'Entry not found'
      });
    }
    
    // Get associated media files
    const mediaFiles = statements.getMediaFilesByEntry.all(id);
    
    res.json({
      success: true,
      data: {
        ...entry,
        mediaFiles
      }
    });
  } catch (error) {
    console.error('Error fetching entry:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch entry'
    });
  }
});

// POST /api/entries - Create a new entry
router.post('/', (req, res) => {
  try {
    const data = createEntrySchema.parse(req.body) as CreateEntryRequest;
    
    // Insert the entry
    const result = statements.insertEntry.run(data.emotion, data.notes || null, data.date);
    const entryId = result.lastInsertRowid as string;
    
    // Handle media files if provided
    if (data.photoPath) {
      statements.insertMediaFile.run(entryId, data.photoPath, 'photo', 0);
    }
    
    if (data.voicePath) {
      statements.insertMediaFile.run(entryId, data.voicePath, 'voice', 0);
    }
    
    // Get the created entry
    const createdEntry = statements.getEntryById.get(entryId) as MoodEntry;
    
    res.status(201).json({
      success: true,
      data: createdEntry
    });
  } catch (error) {
    console.error('Error creating entry:', error);
    res.status(400).json({
      success: false,
      error: error instanceof z.ZodError ? 'Invalid entry data' : 'Failed to create entry'
    });
  }
});

// PUT /api/entries/:id - Update an existing entry
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const data = updateEntrySchema.parse(req.body) as UpdateEntryRequest;
    
    // Check if entry exists
    const existingEntry = statements.getEntryById.get(id) as MoodEntry | undefined;
    if (!existingEntry) {
      return res.status(404).json({
        success: false,
        error: 'Entry not found'
      });
    }
    
    // Update the entry
    const result = statements.updateEntry.run(
      data.emotion || existingEntry.emotion,
      data.notes !== undefined ? data.notes : existingEntry.notes,
      data.date || existingEntry.date,
      id
    );
    
    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'Entry not found'
      });
    }
    
    // Get the updated entry
    const updatedEntry = statements.getEntryById.get(id) as MoodEntry;
    
    res.json({
      success: true,
      data: updatedEntry
    });
  } catch (error) {
    console.error('Error updating entry:', error);
    res.status(400).json({
      success: false,
      error: error instanceof z.ZodError ? 'Invalid entry data' : 'Failed to update entry'
    });
  }
});

// DELETE /api/entries/:id - Delete an entry
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    const result = statements.deleteEntry.run(id);
    
    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'Entry not found'
      });
    }
    
    res.json({
      success: true
    });
  } catch (error) {
    console.error('Error deleting entry:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete entry'
    });
  }
});

export default router;