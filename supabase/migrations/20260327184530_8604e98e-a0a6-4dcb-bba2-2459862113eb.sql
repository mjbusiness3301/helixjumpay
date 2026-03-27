
-- Add sequential display_id to affiliates
ALTER TABLE public.affiliates ADD COLUMN IF NOT EXISTS display_id serial;

-- Create unique index
CREATE UNIQUE INDEX IF NOT EXISTS affiliates_display_id_unique ON public.affiliates (display_id);

-- Backfill existing rows with sequential IDs based on creation order
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) AS rn
  FROM public.affiliates
)
UPDATE public.affiliates a
SET display_id = n.rn
FROM numbered n
WHERE a.id = n.id;
