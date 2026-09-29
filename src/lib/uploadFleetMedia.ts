import { createClient } from "@/lib/supabase/client";

/**
 * Uploads a file to the public "fleet-media" storage bucket and returns
 * its public URL. Run supabase/storage.sql once to create the bucket.
 */
export async function uploadFleetMedia(file: File): Promise<string> {
  const supabase = createClient();
  const ext = file.name.split(".").pop() || "bin";
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from("fleet-media")
    .upload(path, file, { cacheControl: "3600", upsert: false });

  if (error) throw error;

  const { data } = supabase.storage.from("fleet-media").getPublicUrl(path);
  return data.publicUrl;
}
