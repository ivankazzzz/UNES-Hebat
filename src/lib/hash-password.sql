-- Create RPC function to hash password with bcrypt
CREATE OR REPLACE FUNCTION hash_password(password_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  hashed_password TEXT;
BEGIN
  -- Use pgcrypto's crypt function with bcrypt
  SELECT crypt(password_text, gen_salt('bf')) INTO hashed_password;
  
  RETURN hashed_password;
END;
$$;

-- Create function to verify password
CREATE OR REPLACE FUNCTION verify_password(password_text TEXT, hashed_password TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (hashed_password = crypt(password_text, hashed_password));
END;
$$;
