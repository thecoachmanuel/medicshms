-- Update unique constraint for site_content to include hospital_id
ALTER TABLE site_content DROP CONSTRAINT IF EXISTS site_content_page_path_section_key_key;
ALTER TABLE site_content ADD CONSTRAINT site_content_page_path_section_key_hospital_id_key UNIQUE (page_path, section_key, hospital_id);
