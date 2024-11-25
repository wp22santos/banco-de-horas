-- Drop existing constraint if it exists
ALTER TABLE time_entries DROP CONSTRAINT IF EXISTS time_entries_time_order_check;

-- Add new constraint that allows overnight shifts
ALTER TABLE time_entries ADD CONSTRAINT time_entries_time_order_check 
CHECK (
  CASE 
    WHEN start_time > end_time THEN true  -- overnight shift
    WHEN start_time < end_time THEN true  -- same day shift
    ELSE false                            -- equal times not allowed
  END
);
