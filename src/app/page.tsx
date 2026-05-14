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
  const colors = ["#b8d4e3", "#c4976a", "#8bbad0", "#d4b896", "#a8c5d6", "#d4b08a"];
  return (
    <div aria-hidden="true" className="pointer-events-none">
      {Array.from({ length: 22 }).map((_, i) => (
        <div
          key={i}
          className="petal"
          style={{
            left: `${(i * 4.5) % 100}%`,
            animationDuration: `${5 + (i % 7) * 2}s`,
            animationDelay: `${i * 0.4}s`,
            background: colors[i % colors.length],
            width: `${6 + (i % 5) * 3}px`,
            height: `${6 + (i % 5) * 3}px`,
          }}
        />
      ))}
    </div>
  );
}

const TRANSLATIONS = {
  fr: {
    title: "Bienvenue au mariage de",
    names: "Lucie & Soufiane",
    subtitle: "Capturez ces instants",
    instruction: "Aidez-nous à immortaliser cette journée ! Prenez une photo ou choisissez-en une depuis votre galerie.",
    takePhoto: "Prendre une photo",
    uploadGallery: "Choisir depuis la galerie",
    uploadPhoto: "Envoyer la photo",
    chooseAnother: "En choisir une autre",
    uploading: "Envoi en cours...",
    savingMemory: "Sauvegarde de votre magnifique souvenir...",
    savingDrive: "Enregistrement...",
    thankYou: "Merci !",
    thankYouDesc: "Votre photo a bien été enregistrée. Merci d'être là pour célébrer avec nous !",
    viewAlbum: "Voir l'album partagé",
    uploadAnother: "Ajouter une autre photo",
    errorGeneric: "Une erreur s'est produite. Veuillez réessayer.",
    errorNetwork: "Erreur réseau lors de l'envoi. Veuillez réessayer."
  },
  en: {
    title: "Welcome to the wedding of",
    names: "Lucie & Soufiane",
    subtitle: "Share the Moments",
    instruction: "Help us capture the magic! Take a photo or upload one from your gallery.",
    takePhoto: "Take a Photo",
    uploadGallery: "Upload from Gallery",
    uploadPhoto: "Upload Photo",
    chooseAnother: "Choose Another",
    uploading: "Uploading...",
    savingMemory: "Saving your beautiful memory...",
    savingDrive: "Saving to Drive...",
    thankYou: "Thank You!",
    thankYouDesc: "Your photo has been saved. We're so grateful you're here to celebrate with us!",
    viewAlbum: "View Shared Album",
    uploadAnother: "Upload Another Photo",
    errorGeneric: "Something went wrong. Please try again.",
    errorNetwork: "Network error occurred during upload. Please try again."
  },
  ar: {
    title: "أهلاً بكم في زفاف",
    names: "لوسي وسفيان",
    subtitle: "خلدوا هذه اللحظات",
    instruction: "ساعدونا في تخليد هذه اللحظات! التقطوا صورة أو اختاروا واحدة من معرض الصور الخاص بكم.",
    takePhoto: "التقاط صورة",
    uploadGallery: "اختر من المعرض",
    uploadPhoto: "إرسال الصورة",
    chooseAnother: "اختر صورة أخرى",
    uploading: "جاري الإرسال...",
    savingMemory: "جاري حفظ ذكرياتكم الجميلة...",
    savingDrive: "جاري الحفظ...",
    thankYou: "شكراً لكم!",
    thankYouDesc: "لقد تم حفظ صورتكم. شكراً لتواجدكم معنا للاحتفال!",
    viewAlbum: "مشاهدة الألبوم المشترك",
    uploadAnother: "إضافة صورة أخرى",
    errorGeneric: "حدث خطأ ما. يرجى المحاولة مرة أخرى.",
    errorNetwork: "خطأ في الشبكة أثناء الإرسال. يرجى المحاولة مرة أخرى."
  }
};

// --- Main Page Component -----------------------------------
export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [screen, setScreen] = useState<Screen>("idle");
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [lang, setLang] = useState<"fr" | "en" | "ar">("fr");

  const t = TRANSLATIONS[lang];
  const isRtl = lang === "ar";

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
  const handleUpload = useCallback(() => {
    if (!file) return;

    setScreen("uploading");
    setError(null);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload", true);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentComplete = Math.round((event.loaded / event.total) * 100);
        // Cap the visual progress at 90% because the last 10% is the server talking to Google Drive
        setUploadProgress(Math.min(percentComplete, 90));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        setUploadProgress(100);
        setTimeout(() => setScreen("success"), 500); // Small delay for visual completion
      } else {
        let errorMessage = `Upload failed (${xhr.status})`;
        try {
          const res = JSON.parse(xhr.responseText);
          errorMessage = res.error || errorMessage;
        } catch (e) {
          // ignore parsing error
        }
        setError(errorMessage);
        setScreen("preview");
      }
    };

    xhr.onerror = () => {
      setError(t.errorNetwork);
      setScreen("preview");
    };

    xhr.send(formData);
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

      {/* Language Toggle */}
      <div className="absolute top-4 right-4 z-50 flex gap-2">
        {["fr", "en", "ar"].map((l) => (
          <button
            key={l}
            onClick={() => setLang(l as any)}
            className={`bg-white/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold tracking-wider shadow-sm border transition-all ${
              lang === l ? "border-blue-400 text-blue-600 scale-110" : "border-gray-100 text-gray-400 opacity-60"
            }`}
          >
            {l.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto" dir={isRtl ? "rtl" : "ltr"}>
        {/* --- IDLE SCREEN ------------------------------- */}
        {screen === "idle" && (
          <div className="flex flex-col items-center text-center">
            {/* Header */}
            <div className="animate-fade-in-up mb-2">
              <Heart
                className="w-10 h-10 mx-auto mb-4"
                style={{ color: "#c4976a" }}
                fill="#c4976a"
              />
              <p
                className={`${isRtl ? "text-xl md:text-2xl" : "text-lg"} font-light uppercase mb-4 ${isRtl ? "" : "tracking-[0.2em]"}`}
                style={{ 
                  fontFamily: isRtl ? "var(--font-amiri)" : "var(--font-cormorant)", 
                  color: "#5b8ba8" 
                }}
              >
                {t.title}
              </p>
              <h1
                className={`${isRtl ? "text-7xl md:text-8xl" : "text-6xl md:text-7xl"} font-medium leading-tight mb-4 ${isRtl ? "" : "italic tracking-tight"}`}
                style={{ 
                  fontFamily: isRtl ? "var(--font-aref)" : "var(--font-playfair)", 
                  color: "#2c4a6e" 
                }}
              >
                {t.names}
              </h1>
              <p className={`ornament ${isRtl ? "text-lg" : "text-sm"} uppercase font-medium mt-2 ${isRtl ? "" : "tracking-[0.3em]"}`} style={{ color: "#a37b52", fontFamily: isRtl ? "var(--font-amiri)" : "inherit" }}>
                {t.subtitle}
              </p>
            </div>

            <div className="mt-10 space-y-8 flex flex-col items-center w-full">
              <p className={`${isRtl ? "text-2xl" : "text-base"} text-gray-600 font-light leading-relaxed max-w-[300px] mx-auto`} style={{ fontFamily: isRtl ? "var(--font-amiri)" : "inherit" }}>
                {t.instruction}
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
                    {t.takePhoto}
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
                    {t.uploadGallery}
                  </div>
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
                {t.uploadPhoto}
              </button>
              <button
                id="retake-button"
                onClick={handleReset}
                className="btn-secondary"
              >
                {t.chooseAnother}
              </button>
            </div>
          </div>
        )}

        {/* --- UPLOADING SCREEN -------------------------- */}
        {screen === "uploading" && (
          <div className="flex flex-col items-center text-center animate-fade-in-up">
            <div className="card-glass p-8 w-full flex flex-col items-center">
              <Loader2
                className="w-10 h-10 animate-spin mb-4"
                style={{ color: "#5b8ba8" }}
              />
              <p
                className="text-2xl font-light mb-4"
                style={{ fontFamily: "var(--font-cormorant)", color: "#2c4a6e" }}
              >
                {uploadProgress >= 90 ? t.savingDrive : t.uploading}
              </p>
              
              {/* Progress Bar Container */}
              <div className="w-full rounded-full h-3 mb-2 overflow-hidden relative" style={{ background: "#dae8f0" }}>
                <div 
                  className="h-3 rounded-full transition-all duration-300 ease-out absolute left-0 top-0"
                  style={{ width: `${uploadProgress}%`, background: "linear-gradient(90deg, #5b8ba8, #2c4a6e)" }}
                ></div>
              </div>
              
              <div className="flex justify-between w-full text-xs font-medium px-1" style={{ color: "#4a5e6d" }}>
                <span>{uploadProgress}%</span>
                {uploadProgress >= 90 && <span className="animate-pulse">{t.savingDrive}</span>}
              </div>
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
                  style={{ color: "#5b8ba8" }}
                  fill="rgba(91, 139, 168, 0.1)"
                />
                <PartyPopper
                  className="w-6 h-6 absolute -top-1 -right-1"
                  style={{ color: "#c4976a" }}
                />
              </div>
              <h2
                className="text-3xl font-light mb-2"
                style={{ fontFamily: "var(--font-cormorant)", color: "#2c4a6e" }}
              >
                {t.thankYou}
              </h2>
              <p className="mb-6 max-w-xs leading-relaxed" style={{ color: "#4a5e6d" }}>
                {t.thankYouDesc}
              </p>

              {albumUrl !== "#" && (
                <a
                  href={albumUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary mb-3"
                >
                  <ExternalLink className="w-5 h-5" />
                  {t.viewAlbum}
                </a>
              )}

              <button
                id="upload-another-button"
                onClick={handleReset}
                className="btn-primary"
              >
                <Camera className="w-5 h-5" />
                {t.uploadAnother}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
