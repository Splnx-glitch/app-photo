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
  X,
  Languages,
  Sparkles
} from "lucide-react";

// --- Compression Helper ------------------------------------
const compressImage = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 2560;
        const MAX_HEIGHT = 2560;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: "image/jpeg",
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              reject(new Error("Compression failed"));
            }
          },
          "image/jpeg",
          0.85
        );
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};

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
    errorNetwork: "Erreur réseau lors de l'envoi. Veuillez réessayer.",
    nameLabel: "Votre nom (optionnel)",
    namePlaceholder: "Entrez votre nom..."
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
    errorNetwork: "Network error occurred during upload. Please try again.",
    nameLabel: "Your Name (optional)",
    namePlaceholder: "Enter your name..."
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
    errorNetwork: "خطأ في الشبكة أثناء الإرسال. يرجى المحاولة مرة أخرى.",
    nameLabel: "اسمك (اختياري)",
    namePlaceholder: "أدخل اسمك هنا..."
  }
};

// --- Main Page Component -----------------------------------
export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [screen, setScreen] = useState<Screen>("idle");
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [files, setFiles] = useState<File[]>([]);
  const [currentUploadIndex, setCurrentUploadIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lang, setLang] = useState<"fr" | "en" | "ar">("fr");
  const [guestName, setGuestName] = useState("");

  useEffect(() => {
    const savedName = localStorage.getItem("wedding_guest_name");
    if (savedName) setGuestName(savedName);
  }, []);

  useEffect(() => {
    localStorage.setItem("wedding_guest_name", guestName);
  }, [guestName]);

  const t = (TRANSLATIONS as any)[lang];
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
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    setIsProcessing(true);
    setError(null);
    
    try {
      const filesArray = Array.from(selectedFiles);
      // Compress all images in parallel
      const compressedFiles = await Promise.all(
        filesArray.map(f => compressImage(f))
      );
      
      setFiles(compressedFiles);
      
      // Preview first compressed image
      const url = URL.createObjectURL(compressedFiles[0]);
      setPreviewUrl(url);
      setScreen("preview");
      setUploadProgress(0);
    } catch (err) {
      console.error("Compression error:", err);
      setError(lang === 'ar' ? 'فشل معالجة الصور' : (lang === 'fr' ? 'Erreur lors du traitement des images' : 'Error processing images'));
    } finally {
      setIsProcessing(false);
      // Reset input
      e.target.value = "";
    }
  };

  // --- Upload handler -----------------------------------
  const handleUpload = async () => {
    if (files.length === 0) return;
    setScreen("uploading");
    setUploadProgress(0);

    for (let i = 0; i < files.length; i++) {
      setCurrentUploadIndex(i);
      const file = files[i];
      
      try {
        await new Promise((resolve, reject) => {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("guestName", guestName);

          const xhr = new XMLHttpRequest();
          xhr.open("POST", "/api/upload", true);

          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              // Calculate global progress
              const fileProgress = (event.loaded / event.total) * 100;
              const globalProgress = ((i * 100) + fileProgress) / files.length;
              setUploadProgress(globalProgress);
            }
          };

          xhr.onload = () => {
            if (xhr.status === 200) {
              resolve(true);
            } else {
              let errorMessage = `Upload failed (${xhr.status})`;
              try {
                const resp = JSON.parse(xhr.responseText);
                errorMessage = resp.error || errorMessage;
              } catch (e) {}
              reject(new Error(errorMessage));
            }
          };

          xhr.onerror = () => reject(new Error(t.errorNetwork));
          xhr.send(formData);
        });
      } catch (err: any) {
        setError(err.message || t.errorGeneric);
        setScreen("preview");
        return;
      }
    }

    setUploadProgress(100);
    setScreen("success");
  };

  // --- Reset for a new photo ----------------------------
  const handleReset = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setFiles([]);
    setPreviewUrl(null);
    setError(null);
    setScreen("idle");
  }, [previewUrl]);

  return (
    <main className="relative flex flex-1 flex-col items-center justify-center px-5 py-10">
      <Petals />

      {/* Processing Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm animate-fade-in">
          <div className="card-glass p-8 flex flex-col items-center shadow-2xl scale-110">
            <Loader2 className="w-12 h-12 animate-spin mb-4 text-blue-600" />
            <p className="text-xl font-medium text-blue-900 italic" style={{ fontFamily: "var(--font-cormorant)" }}>
              {lang === 'ar' ? 'جاري تحسين الصور...' : (lang === 'fr' ? 'Optimisation des photos...' : 'Optimizing photos...')}
            </p>
            <p className="text-xs text-blue-400 mt-2 tracking-widest uppercase">
              {lang === 'ar' ? 'يرجى الانتظار' : (lang === 'fr' ? 'Veuillez patienter' : 'Please wait')}
            </p>
          </div>
        </div>
      )}

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
              <div className="w-full max-w-[280px] space-y-2 text-center">
                <label className="text-xs font-semibold uppercase tracking-wider text-blue-800/60 block" style={{ fontFamily: isRtl ? "var(--font-amiri)" : "inherit" }}>
                  {(t as any).nameLabel}
                </label>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder={(t as any).namePlaceholder}
                  className="w-full bg-white/50 border border-blue-100 rounded-xl px-4 py-3 text-center focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all placeholder:text-blue-300 text-blue-900"
                  style={{ fontFamily: isRtl ? "var(--font-amiri)" : "inherit" }}
                />
              </div>

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
                    multiple
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
                    multiple
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
            <div className="relative group animate-scale-in">
              {previewUrl && (
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full aspect-[4/5] object-cover rounded-3xl shadow-2xl border-4 border-white"
                  />
                  {files.length > 1 && (
                    <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                      +{files.length - 1} {lang === 'ar' ? 'صور أخرى' : (lang === 'fr' ? 'autres' : 'more')}
                    </div>
                  )}
                </div>
              )}
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
              <div className="flex flex-col items-center gap-2 mb-6">
                <p className="text-sm font-bold text-blue-600 uppercase tracking-widest">
                  {lang === 'ar' ? `جاري إرسال ${currentUploadIndex + 1} من ${files.length}` : 
                   lang === 'fr' ? `Envoi de ${currentUploadIndex + 1} sur ${files.length}` : 
                   `Uploading ${currentUploadIndex + 1} of ${files.length}`}
                </p>
                <p
                  className="text-2xl font-light italic"
                  style={{ fontFamily: "var(--font-cormorant)", color: "#2c4a6e" }}
                >
                  {uploadProgress >= 98 ? t.thankYou : t.uploading}
                </p>
              </div>
              
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
