-- Ensure uniqueness for global (platform-level) content where hospital_id is NULL
-- Many Postgres versions don't treat multiple NULLs as unique in a standard UNIQUE constraint.
-- This partial index solves that specifically for the platform content.

CREATE UNIQUE INDEX IF NOT EXISTS site_content_page_path_section_key_global_idx 
ON site_content (page_path, section_key) 
WHERE hospital_id IS NULL;
