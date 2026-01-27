-- Fix existing routes that should be public
-- Update all routes owned by the system user to be public

UPDATE public.routes 
SET is_public = true 
WHERE user_id = '63a80fa9-b66d-42e6-af0e-26c10a2b3b40' 
  AND is_public = false;

-- Verify the update
SELECT count(*) as updated_count 
FROM public.routes 
WHERE user_id = '63a80fa9-b66d-42e6-af0e-26c10a2b3b40' 
  AND is_public = true;
