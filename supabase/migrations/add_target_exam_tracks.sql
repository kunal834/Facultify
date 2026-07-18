-- Migration: Add Target Exam Tracks to Institutions, Batches, Students and Tests
ALTER TABLE institutions ADD COLUMN IF NOT EXISTS exam_tracks TEXT[] DEFAULT ARRAY['general']::TEXT[];
ALTER TABLE batches ADD COLUMN IF NOT EXISTS exam_track TEXT DEFAULT 'general';
ALTER TABLE students ADD COLUMN IF NOT EXISTS exam_track TEXT DEFAULT 'general';
ALTER TABLE tests ADD COLUMN IF NOT EXISTS exam_track TEXT DEFAULT 'general';
