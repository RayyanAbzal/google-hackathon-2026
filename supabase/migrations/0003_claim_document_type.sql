-- Store Gemini's specific document label separately from the app category.
ALTER TABLE claims
ADD COLUMN IF NOT EXISTS document_type TEXT;

UPDATE claims
SET document_type = doc_type
WHERE document_type IS NULL;
