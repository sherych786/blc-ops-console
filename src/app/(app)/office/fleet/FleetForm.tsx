"use client";

import { useActionState, useState } from "react";
import { saveFleet } from "./actions";
import { uploadFleetMedia } from "@/lib/uploadFleetMedia";

const inputCls =
  "control w-full border border-[var(--line)] px-3 py-2 text-sm bg-[var(--paper)]";
const labelCls = "text-sm font-medium block mb-1";

type Fleet = {
  id: string;
  class: string;
  registration: string | null;
  pax: number | null;
  luggage: number | null;
  description: string | null;
  profile_pic_url: string | null;
  video_url: string | null;
  gallery_urls: string[] | null;
};

export function FleetForm({ fleet }: { fleet?: Fleet }) {
  const [state, formAction, pending] = useActionState(saveFleet, null);

  const [profilePicUrl, setProfilePicUrl] = useState(fleet?.profile_pic_url || "");
  const [videoUrl, setVideoUrl] = useState(fleet?.video_url || "");
  const [gallery, setGallery] = useState<string[]>(fleet?.gallery_urls || []);
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState("");

  async function handleProfilePic(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading("profile");
    setUploadError("");
    try {
      setProfilePicUrl(await uploadFleetMedia(file));
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(null);
    }
  }

  async function handleVideo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading("video");
    setUploadError("");
    try {
      setVideoUrl(await uploadFleetMedia(file));
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(null);
    }
  }

  async function handleGallery(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading("gallery");
    setUploadError("");
    try {
      const urls = await Promise.all(files.map(uploadFleetMedia));
      setGallery((g) => [...g, ...urls]);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(null);
    }
  }

  function removeGalleryImage(url: string) {
    setGallery((g) => g.filter((u) => u !== url));
  }

  return (
    <form action={formAction} className="card p-6 max-w-2xl flex flex-col gap-4">
      {fleet && <input type="hidden" name="id" value={fleet.id} />}
      <input type="hidden" name="profile_pic_url" value={profilePicUrl} />
      <input type="hidden" name="video_url" value={videoUrl} />
      <input type="hidden" name="gallery_urls" value={JSON.stringify(gallery)} />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls} htmlFor="class">Vehicle class</label>
          <input id="class" name="class" required defaultValue={fleet?.class} placeholder="e.g. S-Class" className={inputCls} />
        </div>
        <div>
          <label className={labelCls} htmlFor="registration">Registration</label>
          <input id="registration" name="registration" defaultValue={fleet?.registration ?? ""} className={inputCls} />
        </div>
        <div>
          <label className={labelCls} htmlFor="pax">No. of Pax</label>
          <input id="pax" name="pax" type="number" min="0" defaultValue={fleet?.pax ?? ""} className={inputCls} />
        </div>
        <div>
          <label className={labelCls} htmlFor="luggage">Luggage capacity</label>
          <input id="luggage" name="luggage" type="number" min="0" defaultValue={fleet?.luggage ?? ""} className={inputCls} />
        </div>
      </div>

      <div>
        <label className={labelCls} htmlFor="description">Description</label>
        <textarea id="description" name="description" rows={3} defaultValue={fleet?.description ?? ""} className={inputCls} />
      </div>

      <div>
        <label className={labelCls}>Profile picture</label>
        {profilePicUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profilePicUrl} alt="Profile" className="w-32 h-32 object-cover rounded-[var(--radius-control)] mb-2 border border-[var(--line)]" />
        )}
        <input type="file" accept="image/*" onChange={handleProfilePic} className="text-sm" />
        {uploading === "profile" && <p className="text-xs text-[var(--grey)] mt-1">Uploading…</p>}
      </div>

      <div>
        <label className={labelCls}>Gallery images</label>
        {gallery.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {gallery.map((url) => (
              <div key={url} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="w-20 h-20 object-cover rounded-[var(--radius-control)] border border-[var(--line)]" />
                <button
                  type="button"
                  onClick={() => removeGalleryImage(url)}
                  className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[var(--red)] text-white text-xs leading-5"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        <input type="file" accept="image/*" multiple onChange={handleGallery} className="text-sm" />
        {uploading === "gallery" && <p className="text-xs text-[var(--grey)] mt-1">Uploading…</p>}
      </div>

      <div>
        <label className={labelCls}>Video (optional)</label>
        {videoUrl && (
          <video src={videoUrl} controls className="w-full max-w-xs rounded-[var(--radius-control)] mb-2 border border-[var(--line)]" />
        )}
        <input type="file" accept="video/*" onChange={handleVideo} className="text-sm" />
        {uploading === "video" && <p className="text-xs text-[var(--grey)] mt-1">Uploading…</p>}
      </div>

      {uploadError && <p className="text-sm text-[var(--red)]">{uploadError}</p>}
      {state?.error && <p className="text-sm text-[var(--red)]">{state.error}</p>}

      <button
        type="submit"
        disabled={pending || uploading !== null}
        className="control bg-[var(--accent)] text-white font-medium py-2 text-sm disabled:opacity-60"
      >
        {pending ? "Saving…" : fleet ? "Save Changes" : "Create Vehicle"}
      </button>
    </form>
  );
}
