-- Grant admin users the ability to delete other users
-- This creates a security definer function that can delete users from auth.users

CREATE OR REPLACE FUNCTION delete_user_as_admin(user_id_to_delete UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  calling_user_role TEXT;
BEGIN
  -- Get the role of the user making the request
  SELECT role INTO calling_user_role
  FROM profiles 
  WHERE user_id = auth.uid();
  
  -- Only allow admins to delete users
  IF calling_user_role != 'admin' THEN
    RAISE EXCEPTION 'Only admins can delete users';
  END IF;
  
  -- Delete the user's profile first
  DELETE FROM profiles WHERE user_id = user_id_to_delete;
  
  -- Note: We cannot directly delete from auth.users in a regular function
  -- This function will be called from the client side which will then
  -- use supabase.auth.admin.deleteUser() to complete the deletion
  
  RETURN TRUE;
END;
$$;