-- Enable realtime for the appointments table to support millisecond-precision QMS
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'public_appointments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public_appointments;
  END IF;
END $$;
