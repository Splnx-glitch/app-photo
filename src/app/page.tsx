"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Camera,
  ImagePlus,
  Upload,
  CheckCircle2,
  Loader2,
  Heart,
  PartyPopper,
  ExternalLink,
} from "lucide-react";

type Screen = "idle" | "preview" | "uploading" | "success";

// --- Floating Petals (decorative) --------------------------
function Petals() {
  return (
    <div aria-hidden="true" className="pointer-events-none">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="petal"
          style={{
            left: `${10 + i * 12}%`,
            animationDuration: `${8 + i * 2.5}s`,
            animationDelay: `${i * 1.2}s`,
            background: i % 2 === 0 ? "#fda4af" : "#fecdd3",
            width: `${8 + (i % 3) * 4}px`,
            height: `${8 + (i % 3) * 4}px`,
          }}
        />
      ))}
    </div>
  );
}

// --- Main Page Component -----------------------------------
export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [screen, setScreen] = useState<Screen>("idle");
  const [error, setError] = useState<string | null>(null);

  const albumUrl = process.env.NEXT_PUBLIC_ALBUM_URL || "#";

  // Cleanup object URL on unmount or when file changes
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // --- File selection handler ----------------------------
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (!selectedFile) return;

      // Revoke previous preview URL if any
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setError(null);
      setScreen("preview");

      // Reset the input so the same file can be re-selected
      e.target.value = "";
    },
    [previewUrl]
  );

  // --- Upload handler -----------------------------------
  const handleUpload = useCallback(async () => {
    if (!file) return;

    setScreen("uploading");
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Upload failed (${res.status})`);
      }

      // Success!
      setScreen("success");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
      setScreen("preview");
    }
  }, [file]);

  // --- Reset for a new photo ----------------------------
  const handleReset = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setFile(null);
    setPreviewUrl(null);
    setError(null);
    setScreen("idle");
  }, [previewUrl]);

  return (
    <main className="relative flex flex-1 flex-col items-center justify-center px-5 py-10">
      <Petals />

      <div className="relative z-10 w-full max-w-md mx-auto">
        {/* --- IDLE SCREEN ------------------------------- */}
        {screen === "idle" && (
          <div className="flex flex-col items-center text-center">
            {/* Header */}
            <div className="animate-fade-in-up mb-2">
              <Heart
                className="w-10 h-10 mx-auto mb-4"
                style={{ color: "#f43f5e" }}
                fill="#f43f5e"
              />
              <h1
                className="text-4xl font-light tracking-tight leading-tight mb-1"
                style={{ fontFamily: "var(--font-cormorant)" }}
              >
                Our Wedding
              </h1>
              <p className="ornament text-sm tracking-widest uppercase text-rose-400 font-medium mt-1">
                Share the Moments
              </p>
            </div>

            <p className="animate-fade-in-up-delay text-base text-[#7a5c4f] mt-4 mb-8 max-w-xs leading-relaxed">
              Help us capture the magic! Take a photo or upload one from your
              gallery.
            </p>

            {/* Action Buttons */}
            <div className="animate-fade-in-up-delay-2 w-full flex flex-col gap-4">
              {/* Take a Photo */}
              <div className="relative w-full overflow-hidden rounded-full">
                <input
                  id="camera-input"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  style={{ fontSize: "200px" }}
                />
                <div className="btn-primary pointer-events-none">
                  <Camera className="w-5 h-5" />
                  Take a Photo
                </div>
              </div>

              {/* Upload from Gallery */}
              <div className="relative w-full overflow-hidden rounded-full">
                <input
                  id="gallery-input"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  style={{ fontSize: "200px" }}
                />
                <div className="btn-secondary pointer-events-none">
                  <ImagePlus className="w-5 h-5" />
                  Upload from Gallery
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- PREVIEW SCREEN ---------------------------- */}
        {screen === "preview" && previewUrl && (
          <div className="flex flex-col items-center text-center animate-fade-in-up">
            <div className="card-glass p-3 mb-6 w-full">
              <img
                src={previewUrl}
                alt="Photo preview"
                className="w-full rounded-xl object-cover"
                style={{ maxHeight: "45vh" }}
              />
            </div>

            {error && (
              <div className="w-full mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="w-full flex flex-col gap-3">
              <button
                id="upload-button"
                onClick={handleUpload}
                className="btn-primary"
              >
                <Upload className="w-5 h-5" />
                Upload Photo
              </button>
              <button
                id="retake-button"
                onClick={handleReset}
                className="btn-secondary"
              >
                Choose Another
              </button>
            </div>
          </div>
        )}

        {/* --- UPLOADING SCREEN -------------------------- */}
        {screen === "uploading" && (
          <div className="flex flex-col items-center text-center animate-fade-in-up">
            <div className="card-glass p-10 w-full flex flex-col items-center">
              <Loader2
                className="w-12 h-12 animate-spin mb-5"
                style={{ color: "#f43f5e" }}
              />
              <p
                className="text-2xl font-light mb-2"
                style={{ fontFamily: "var(--font-cormorant)" }}
              >
                Uploading...
              </p>
              <p className="text-sm text-[#7a5c4f] animate-pulse-soft">
                Saving your beautiful memory
              </p>
            </div>
          </div>
        )}

        {/* --- SUCCESS SCREEN ---------------------------- */}
        {screen === "success" && (
          <div className="flex flex-col items-center text-center animate-fade-in-up">
            <div className="card-glass p-10 w-full flex flex-col items-center">
              <div className="relative mb-5">
                <CheckCircle2
                  className="w-16 h-16"
                  style={{ color: "#16a34a" }}
                  fill="rgba(22, 163, 74, 0.1)"
                />
                <PartyPopper
                  className="w-6 h-6 absolute -top-1 -right-1"
                  style={{ color: "#d4a853" }}
                />
              </div>
              <h2
                className="text-3xl font-light mb-2"
                style={{ fontFamily: "var(--font-cormorant)" }}
              >
                Thank You!
              </h2>
              <p className="text-[#7a5c4f] mb-6 max-w-xs leading-relaxed">
                Your photo has been saved. We&apos;re so grateful you&apos;re
                here to celebrate with us!
              </p>

              {albumUrl !== "#" && (
                <a
                  href={albumUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary mb-3"
                >
                  <ExternalLink className="w-5 h-5" />
                  View Shared Album
                </a>
              )}

              <button
                id="upload-another-button"
                onClick={handleReset}
                className="btn-primary"
              >
                <Camera className="w-5 h-5" />
                Upload Another Photo
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
