-- Debug Script: Check service_role_key format
-- Run this in the Supabase SQL Editor

-- Check the beginning of the service_role_key (first 20 chars only for security)
SELECT 
    name,
    LEFT(decrypted_secret, 20) || '...' as key_prefix,
    LENGTH(decrypted_secret) as key_length
FROM vault.decrypted_secrets 
WHERE name = 'service_role_key';

-- Check supabase_url format
SELECT 
    name,
    decrypted_secret as url_value
FROM vault.decrypted_secrets 
WHERE name = 'supabase_url';

-- Check one of the failed HTTP request details
SELECT 
    id,
    status_code,
    url,
    headers,
    content,
    error_msg
FROM net._http_response 
ORDER BY created DESC 
LIMIT 1;
