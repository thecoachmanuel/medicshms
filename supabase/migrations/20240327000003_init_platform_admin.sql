-- Seed Platform Admin User
-- This script safely removes any existing platform admin and creates a new one.

DO $$
DECLARE
    new_user_id UUID := '39744d14-ce33-4701-85bc-af9717e565eb';
    admin_email TEXT := 'platform-admin@hms.com';
    admin_pass TEXT := 'hms@admin';
BEGIN
    -- 1. Remove existing profile if it exists
    DELETE FROM public.profiles WHERE email = admin_email OR role = 'platform_admin';

    -- 2. Remove existing auth user if it exists
    DELETE FROM auth.users WHERE email = admin_email;

    -- 3. Create the auth user
    -- Supabase uses bcrypt for passwords. We use crypt() from pgcrypto.
    INSERT INTO auth.users (
        id, 
        instance_id, 
        email, 
        encrypted_password, 
        email_confirmed_at, 
        raw_app_meta_data, 
        raw_user_meta_data, 
        created_at, 
        updated_at, 
        role, 
        confirmation_token, 
        email_change, 
        email_change_token_new, 
        recovery_token
    )
    VALUES (
        new_user_id,
        '00000000-0000-0000-0000-000000000000',
        admin_email,
        crypt(admin_pass, gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}',
        '{"role":"platform_admin","name":"Platform Admin"}',
        now(),
        now(),
        'authenticated',
        '',
        '',
        '',
        ''
    );

    -- 4. Create the identity
    INSERT INTO auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, provider_id)
    VALUES (
        gen_random_uuid(),
        new_user_id,
        format('{"sub":"%s","email":"%s"}', new_user_id, admin_email)::jsonb,
        'email',
        now(),
        now(),
        now(),
        new_user_id
    );

    -- 5. Create the public profile
    -- Using the 'name' column as identified in the schema
    INSERT INTO public.profiles (id, name, email, role, is_active, hospital_id)
    VALUES (
        new_user_id,
        'Platform Admin',
        admin_email,
        'platform_admin',
        true,
        null
    );

    RAISE NOTICE 'Platform Admin created successfully: %', admin_email;
END $$;
