-- Migration: Push Notifications Setup (using Supabase Database Webhooks)
-- This file is for documentation only - the actual setup is done in Supabase Dashboard

/*
============================================
SETUP ANLEITUNG: Push Notifications
============================================

SCHRITT 1: Edge Function deployen
---------------------------------
Im Terminal ausführen:
    supabase functions deploy send-push-notification

SCHRITT 2: Firebase Service Account Secret setzen
-------------------------------------------------
1. Firebase Console > Project Settings > Service accounts
2. "Generate new private key" klicken
3. JSON-Datei herunterladen
4. Im Supabase Dashboard: Project Settings > Edge Functions > Secrets
5. Neues Secret erstellen:
   - Name: FIREBASE_SERVICE_ACCOUNT
   - Value: Inhalt der JSON-Datei (alles kopieren)

SCHRITT 3: Database Webhooks erstellen
--------------------------------------
Supabase Dashboard > Database > Webhooks > "Create a new webhook"

Webhook 1 - Comments:
  - Name: notify-comment-mention
  - Table: match_comments (Schema: public ODER kopecht)
  - Events: INSERT
  - Type: Supabase Edge Function
  - Edge Function: send-push-notification
  - HTTP Headers hinzufügen:
    - x-webhook-source: database
    - x-database-schema: public (oder kopecht)

Webhook 2 - Chat:
  - Name: notify-chat-mention  
  - Table: chat_messages (Schema: public ODER kopecht)
  - Events: INSERT
  - Type: Supabase Edge Function
  - Edge Function: send-push-notification
  - HTTP Headers hinzufügen:
    - x-webhook-source: database
    - x-database-schema: public (oder kopecht)

Für beide Schemas (public und kopecht) separate Webhooks erstellen!

============================================
*/

-- Keine SQL-Trigger mehr nötig - alles wird über Webhooks gemacht!

