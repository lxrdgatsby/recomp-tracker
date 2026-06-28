const SCHEMA_MISSING =
  "Database not set up yet. In Supabase Dashboard → SQL Editor, paste and run the contents of supabase/schema.sql from this project, then try again."

export function formatSupabaseError(message: string | undefined): string {
  if (!message) return 'Something went wrong. Please try again.'
  if (
    message.includes("Could not find the table 'public.profiles'") ||
    message.includes("Could not find the table 'public.chat_messages'") ||
    message.includes("Could not find the table 'public.chat_conversations'")
  ) {
    return SCHEMA_MISSING
  }
  return message
}