-- Create a new storage bucket for app icons
INSERT INTO storage.buckets (id, name, public)
VALUES ('app-icons', 'app-icons', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow authenticated users to upload files to the bucket
CREATE POLICY "Authenticated users can upload app icons"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'app-icons');

-- Policy to allow public access to view files in the bucket
CREATE POLICY "Public can view app icons"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'app-icons');

-- Policy to allow users to update their own files (or just overwrite)
-- Ideally we'd check ownership, but for simplicity in this context we'll allow authenticated updates
-- A more robust solution would check if the user owns the app associated with the icon, 
-- but storage objects don't directly link to apps in a way that's easy to query here without metadata.
-- For now, allowing authenticated updates to the bucket is a reasonable trade-off for this MVP.
CREATE POLICY "Authenticated users can update app icons"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'app-icons');

-- Policy to allow users to delete files
CREATE POLICY "Authenticated users can delete app icons"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'app-icons');
