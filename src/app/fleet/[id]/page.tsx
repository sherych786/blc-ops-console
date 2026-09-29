import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function PublicFleetProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: vehicle } = await supabase
    .from("fleet")
    .select("class, registration, pax, luggage, description, profile_pic_url, gallery_urls, video_url")
    .eq("id", id)
    .single();

  if (!vehicle) notFound();

  return (
    <div className="min-h-screen bg-[var(--surface)] py-10 px-4">
      <div className="max-w-2xl mx-auto card overflow-hidden">
        {vehicle.profile_pic_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={vehicle.profile_pic_url} alt={vehicle.class} className="w-full h-64 object-cover" />
        )}
        <div className="p-6">
          <h1 className="text-xl font-bold mb-1">{vehicle.class}</h1>
          <p className="text-sm text-[var(--grey)] mb-4">
            {vehicle.pax ? `${vehicle.pax} passengers` : ""}
            {vehicle.pax && vehicle.luggage ? " · " : ""}
            {vehicle.luggage ? `${vehicle.luggage} luggage capacity` : ""}
          </p>
          {vehicle.description && <p className="text-sm mb-4">{vehicle.description}</p>}

          {vehicle.gallery_urls && vehicle.gallery_urls.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-4">
              {vehicle.gallery_urls.map((url: string) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={url} src={url} alt="" className="w-full h-24 object-cover rounded-[var(--radius-control)]" />
              ))}
            </div>
          )}

          {vehicle.video_url && (
            <video src={vehicle.video_url} controls className="w-full rounded-[var(--radius-control)]" />
          )}
        </div>
      </div>
    </div>
  );
}
