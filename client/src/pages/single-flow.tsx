import { useRef, useState, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ChevronRight,
  Check,
  Camera,
  RotateCcw,
  SwitchCamera,
  AlertCircle,
  Download,
  Share2,
  Home,
  AlertTriangle,
  Loader2,
  Sparkles,
  Trophy,
  Gift,
  ImagePlus,
} from "lucide-react";
import { useApp } from "@/lib/app-context";
import { TEAMS, teamInfo, type TeamId } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import trophyImage from "@assets/ChatGPT_Image_6_ene_2026,_15_32_44_1767829210783.png";
import mileniumLogo from "@assets/logo_milenium__1767829210784.png";
import qrGallery from "@assets/qr-images-gallery.png";
import worldcupBg from "@assets/generated_images/valle_napa_bg.png";

const teamFlags: Record<TeamId, string> = {
  mexico: "https://flagcdn.com/w80/mx.png",
  usa: "https://flagcdn.com/w80/us.png",
  canada: "https://flagcdn.com/w80/ca.png",
  spain: "https://flagcdn.com/w80/es.png",
  england: "https://flagcdn.com/w80/gb-eng.png",
  brazil: "https://flagcdn.com/w80/br.png",
  argentina: "https://flagcdn.com/w80/ar.png",
  portugal: "https://flagcdn.com/w80/pt.png",
};

const MAX_IMAGE_WIDTH = 800;
const JPEG_QUALITY = 0.5;

function compressImage(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      let width = img.width;
      let height = img.height;

      if (width > MAX_IMAGE_WIDTH) {
        height = (height * MAX_IMAGE_WIDTH) / width;
        width = MAX_IMAGE_WIDTH;
      }

      canvas.width = width;
      canvas.height = height;

      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
      } else {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

function PromoBadge({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border border-green-600/60 bg-green-900/80 px-3 py-1 text-xs font-bold uppercase tracking-widest text-green-300 ${className}`}>
      {children}
    </span>
  );
}

function RedBadge({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-md border border-red-700/60 bg-red-700/90 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-lg ${className}`}>
      {children}
    </span>
  );
}

function GoldBadge({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-md border border-yellow-500/60 bg-yellow-500/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-yellow-400 ${className}`}>
      {children}
    </span>
  );
}

function ValleDeNapaLogo({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex flex-col items-center leading-none rounded-xl px-3 py-1.5 ${className}`}
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
      data-testid="img-valle-de-napa-logo"
    >
      <span
        className="text-white"
        style={{
          fontFamily: "'Dancing Script', cursive",
          fontSize: "clamp(1.1rem, 3vw, 1.6rem)",
          fontWeight: 700,
          lineHeight: 1.1,
          textShadow: '0 2px 10px rgba(0,0,0,1), 0 0px 20px rgba(0,0,0,0.8)',
        }}
      >
        Valle de Napa
      </span>
      <span className="mt-0.5 rounded-sm bg-white/95 px-2 py-px text-[8px] font-black uppercase tracking-[0.2em] text-green-900 sm:text-[9px]">
        RESIDENCIAL
      </span>
    </div>
  );
}

function IntroContent({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 p-4 text-center sm:gap-4 sm:p-5">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600 shadow-lg shadow-red-900/50 sm:h-14 sm:w-14">
        <Camera className="h-6 w-6 text-white sm:h-7 sm:w-7" />
      </div>

      <div className="space-y-1.5">
        <h2 className="text-lg font-black uppercase tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] sm:text-xl md:text-2xl">
          Tu Foto del Mundial
        </h2>
        <p className="max-w-sm text-xs text-white/70 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)] sm:text-sm">
          Toma una selfie o sube una foto y te convertiremos en leyenda del Mundial.
        </p>
      </div>

      <PromoBadge>
        <span>⚽</span> Visita y Gana <span>⚽</span>
      </PromoBadge>

      <Button
        size="lg"
        onClick={onContinue}
        className="w-full max-w-xs gap-2 bg-red-600 py-4 text-base font-bold uppercase tracking-wide text-white hover:bg-red-700 sm:py-5 sm:text-lg"
        data-testid="button-comenzar"
      >
        <Camera className="h-5 w-5" />
        ¡Comenzar!
      </Button>
    </div>
  );
}

function TeamContent({ onContinue }: { onContinue: () => void }) {
  const { selectedTeam, setSelectedTeam } = useApp();

  return (
    <div className="flex flex-col gap-3 p-3 sm:gap-4 sm:p-4 md:p-6">
      <div className="text-center space-y-2">
        <PromoBadge>
          <Trophy className="h-3 w-3" /> Elige Tu Equipo
        </PromoBadge>
        <h2 className="text-lg font-black uppercase tracking-tight text-white sm:text-xl md:text-2xl">
          Selecciona Tu Selección
        </h2>
        <p className="text-xs text-muted-foreground sm:text-sm">
          ¿Con quién vas al Mundial?
        </p>
      </div>

      <div className="grid grid-cols-4 gap-1.5 sm:gap-2 md:gap-3">
        {TEAMS.map((team) => {
          const info = teamInfo[team];
          const isSelected = selectedTeam === team;

          return (
            <button
              key={team}
              className={`relative flex flex-col items-center gap-0.5 rounded-lg p-1.5 transition-all hover-elevate active-elevate-2 sm:gap-1 sm:p-2 md:p-3 ${
                isSelected
                  ? "bg-red-700/30 ring-2 ring-red-500"
                  : "bg-white/5 hover:bg-white/10 border border-green-800/40"
              }`}
              onClick={() => setSelectedTeam(team)}
              data-testid={`card-team-${team}`}
            >
              {isSelected && (
                <div className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-white sm:-right-1 sm:-top-1 sm:h-5 sm:w-5">
                  <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                </div>
              )}
              <div className="h-6 w-10 overflow-hidden rounded-sm shadow-sm sm:h-8 sm:w-12 md:h-10 md:w-14">
                <img
                  src={teamFlags[team]}
                  alt={info.name}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
              <span className="text-[10px] font-semibold leading-tight text-white/90 sm:text-xs md:text-sm">{info.name}</span>
            </button>
          );
        })}
      </div>

      <Button
        size="lg"
        disabled={!selectedTeam}
        onClick={onContinue}
        className="mt-1 w-full gap-2 bg-red-600 py-5 font-bold uppercase tracking-wide text-white hover:bg-red-700 disabled:opacity-40 sm:mt-2 sm:py-6"
        data-testid="button-continue"
      >
        Continuar
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  );
}

function CaptureContent({ onContinue }: { onContinue: () => void }) {
  const { selectedTeam, setCapturedImage } = useApp();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [cameraAvailable, setCameraAvailable] = useState(true);

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const teamColors = selectedTeam ? teamInfo[selectedTeam].colors : null;

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    // Check if getUserMedia is available (requires HTTPS or localhost)
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraAvailable(false);
      setHasPermission(false);
      setError("La cámara no está disponible. Sube una foto desde tu galería.");
      return;
    }

    try {
      stopCamera();

      // Try progressively simpler constraints to maximise compatibility
      const constraintAttempts = [
        // Attempt 1: preferred quality without aspectRatio (aspectRatio causes failures on many Android devices)
        { facingMode, width: { ideal: 1080 }, height: { ideal: 1920 } },
        // Attempt 2: just facingMode
        { facingMode },
        // Attempt 3: any camera
        true,
      ] as MediaTrackConstraints[];

      let mediaStream: MediaStream | null = null;
      let lastError: unknown = null;

      for (const constraints of constraintAttempts) {
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: constraints,
            audio: false,
          });
          break;
        } catch (e) {
          lastError = e;
        }
      }

      if (!mediaStream) throw lastError;

      streamRef.current = mediaStream;
      setHasPermission(true);
      setError(null);
      // Do NOT assign srcObject here — videoRef.current is null until
      // hasPermission=true causes React to render the <video> element.
      // The effect below handles it after the DOM update.
    } catch (err: any) {
      console.error("Camera error:", err);
      setHasPermission(false);
      if (err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError") {
        setError("Permiso de cámara denegado. Actívalo en ajustes o sube una foto.");
      } else if (err?.name === "NotFoundError" || err?.name === "DevicesNotFoundError") {
        setError("No se encontró cámara. Sube una foto desde tu galería.");
      } else {
        setError("No se pudo acceder a la cámara. Sube una foto desde tu galería.");
      }
    }
  }, [facingMode, stopCamera]);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  // After hasPermission becomes true, React renders the <video> element.
  // This effect runs after that render and wires the stream to the video node.
  useEffect(() => {
    if (hasPermission === true && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [hasPermission]);

  const switchCamera = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0);
    setCapturedPreview(canvas.toDataURL("image/jpeg", 0.9));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      if (result) {
        stopCamera();
        setCapturedPreview(result);
      }
    };
    reader.readAsDataURL(file);
    // Reset so the same file can be re-selected
    e.target.value = "";
  };

  const retakePhoto = () => {
    setCapturedPreview(null);
    if (cameraAvailable && hasPermission !== false) {
      startCamera();
    }
  };

  const confirmPhoto = async () => {
    if (!capturedPreview) return;
    setIsCompressing(true);
    stopCamera();
    try {
      const compressedImage = await compressImage(capturedPreview);
      setCapturedImage(compressedImage);
      onContinue();
    } finally {
      setIsCompressing(false);
    }
  };

  const showCamera = hasPermission === true && !capturedPreview;
  const showError = hasPermission === false && !capturedPreview;

  return (
    <div className="flex flex-col gap-3 p-3 sm:gap-4 sm:p-4 md:p-6">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileUpload}
        data-testid="input-file-upload"
      />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-black uppercase tracking-tight text-white sm:text-lg md:text-xl">
            Captura Tu Foto
          </h2>
          <p className="text-xs text-muted-foreground sm:text-sm">
            {isMobile ? "Toma o sube una foto para transformarla" : "Captura o sube una foto"}
          </p>
        </div>
        <RedBadge>
          <Gift className="h-3 w-3" /> Visita y Gana
        </RedBadge>
      </div>

      <div
        className="relative w-full overflow-hidden rounded-lg aspect-video sm:rounded-xl"
        style={{
          borderColor: teamColors?.primary || "#dc2626",
          borderWidth: "3px",
          borderStyle: "solid",
        }}
        data-testid="card-camera-preview"
      >
        {capturedPreview ? (
          <img
            src={capturedPreview}
            alt="Foto capturada"
            className="h-full w-full bg-black object-contain"
            data-testid="img-captured-preview"
          />
        ) : showError ? (
          <div
            className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-3 bg-green-950/80 p-4 text-center"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImagePlus className="h-12 w-12 text-green-400/80" />
            <p className="text-sm font-semibold text-white/80">{error}</p>
            <p className="text-xs text-green-400/70">Toca aquí para subir una foto</p>
          </div>
        ) : hasPermission === null ? (
          <div className="flex h-full w-full items-center justify-center bg-black">
            <Loader2 className="h-8 w-8 animate-spin text-green-400" />
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`h-full w-full bg-black object-contain ${facingMode === "user" ? "scale-x-[-1]" : ""}`}
            data-testid="video-camera"
          />
        )}

        {showCamera && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 bg-black/50 text-white backdrop-blur-sm hover:bg-black/70"
            onClick={switchCamera}
            data-testid="button-switch-camera"
          >
            <SwitchCamera className="h-4 w-4" />
          </Button>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <div className="flex flex-col gap-2 sm:gap-3">
        {capturedPreview ? (
          <div className="flex gap-2 sm:gap-3">
            <Button
              variant="outline"
              size="default"
              className="flex-1 gap-2 border-green-700/50 bg-white/5 font-semibold text-white hover:bg-white/10 sm:text-base"
              onClick={retakePhoto}
              disabled={isCompressing}
              data-testid="button-retake"
            >
              <RotateCcw className="h-4 w-4" />
              {cameraAvailable ? "Volver" : "Otra foto"}
            </Button>
            <Button
              size="default"
              className="flex-1 gap-2 bg-red-600 font-bold uppercase tracking-wide text-white hover:bg-red-700 sm:text-base"
              onClick={confirmPhoto}
              disabled={isCompressing}
              data-testid="button-confirm"
            >
              {isCompressing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Preparando...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Transformar
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {showCamera && (
              <Button
                size="default"
                className="w-full gap-2 bg-red-600 font-bold uppercase tracking-wide text-white hover:bg-red-700 sm:text-base"
                onClick={capturePhoto}
                data-testid="button-capture"
              >
                <Camera className="h-5 w-5" />
                Capturar Foto
              </Button>
            )}
            <Button
              size="default"
              variant="outline"
              className="w-full gap-2 border-green-600/50 bg-white/5 font-semibold text-white hover:bg-white/10 sm:text-base"
              onClick={() => fileInputRef.current?.click()}
              data-testid="button-upload"
            >
              <ImagePlus className="h-5 w-5" />
              Subir foto de galería
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function ProcessingContent({ onComplete }: { onComplete: () => void }) {
  const { selectedTeam, capturedImage, setTransformedImage, setError } =
    useApp();

  const hasStartedRef = useRef(false);
  const teamColors = selectedTeam ? teamInfo[selectedTeam].colors : null;

  const processImage = useCallback(async () => {
    if (!selectedTeam || !capturedImage) return;
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    setError(null);

    try {
      const response = await apiRequest("POST", "/api/transform", {
        team: selectedTeam,
        image: capturedImage,
      });

      const data = await response.json();

      if (data.transformedImage) {
        setTransformedImage(data.transformedImage);
        setError(null);
      } else {
        throw new Error("No se recibió la imagen transformada");
      }
    } catch (error) {
      console.error("Error processing image:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido";
      setError(errorMessage);
      setTransformedImage(null);
    } finally {
      onComplete();
    }
  }, [selectedTeam, capturedImage, setTransformedImage, setError, onComplete]);

  useEffect(() => {
    processImage();
  }, [processImage]);

  return (
    <div className="flex flex-col items-center gap-5 p-6 text-center sm:gap-8 sm:p-10">
      <div className="relative">
        <div
          className="absolute inset-0 animate-ping rounded-full opacity-25"
          style={{ backgroundColor: teamColors?.primary || "#16a34a" }}
        />
        <div
          className="relative flex h-16 w-16 items-center justify-center rounded-full shadow-2xl sm:h-20 sm:w-20"
          style={{ backgroundColor: teamColors?.primary || "#16a34a" }}
        >
          <Loader2 className="h-8 w-8 animate-spin text-white sm:h-10 sm:w-10" />
        </div>
      </div>

      <div className="space-y-2 sm:space-y-3">
        <GoldBadge>
          <Sparkles className="h-3 w-3" /> Creando Tu Retrato
        </GoldBadge>
        <h2
          className="text-xl font-black uppercase tracking-tight text-white sm:text-2xl"
          data-testid="text-processing-title"
        >
          Transformando tu pasión...
        </h2>
        <p
          className="text-sm text-muted-foreground sm:text-base"
          data-testid="text-processing-subtitle"
        >
          Estamos creando tu retrato mundialista
          {selectedTeam && ` de ${teamInfo[selectedTeam].name}`}
        </p>
      </div>

      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-2 w-2 animate-bounce rounded-full sm:h-2.5 sm:w-2.5"
            style={{
              backgroundColor: teamColors?.primary || "#16a34a",
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function ResultContent({
  onRetry,
  onHome,
}: {
  onRetry: () => void;
  onHome: () => void;
}) {
  const { selectedTeam, transformedImage, capturedImage, error } = useApp();
  const { toast } = useToast();
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  const teamColors = selectedTeam ? teamInfo[selectedTeam].colors : null;
  const hasError = error !== null || !transformedImage;
  const displayImage = transformedImage || capturedImage;

  const handleDownload = async () => {
    const imageToDownload = transformedImage || capturedImage;
    if (!imageToDownload) return;

    try {
      const response = await fetch(imageToDownload);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `fan-mundialista-${selectedTeam || "foto"}.jpg`;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      }, 100);

      toast({
        title: "Imagen descargada",
        description: "Tu retrato mundialista se ha guardado correctamente.",
      });
    } catch (err) {
      console.error("Download error:", err);
      const link = document.createElement("a");
      link.href = imageToDownload;
      link.download = `fan-mundialista-${selectedTeam || "foto"}.jpg`;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleShare = async () => {
    const imageToShare = transformedImage || capturedImage;
    if (!imageToShare) return;

    try {
      const blob = await fetch(imageToShare).then((r) => r.blob());
      const file = new File([blob], `fan-mundialista-${selectedTeam}.jpg`, {
        type: "image/jpeg",
      });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Mi retrato mundialista",
          text: `Mira mi transformación como fan de ${selectedTeam ? teamInfo[selectedTeam].name : "mi equipo"}!`,
        });
      } else {
        handleDownload();
      }
    } catch (err) {
      console.error("Share error:", err);
      handleDownload();
    }
  };

  return (
    <div className="flex flex-col gap-3 p-3 sm:gap-4 sm:p-4 md:p-6">
      <div className="text-center space-y-2">
        {!hasError && (
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <GoldBadge>
              <Trophy className="h-3 w-3" /> Sorteo Mensual
            </GoldBadge>
            <RedBadge>
              <Sparkles className="h-3 w-3" /> Ruleta de Premios
            </RedBadge>
          </div>
        )}
        <h2
          className="text-lg font-black uppercase tracking-tight text-white sm:text-xl md:text-2xl"
          data-testid="text-result-title"
        >
          {hasError ? "Ocurrió un Error" : "Tu Retrato Mundialista"}
        </h2>
        {selectedTeam && !hasError && (
          <p className="text-xs text-muted-foreground sm:text-sm">
            ⚽ Fan de {teamInfo[selectedTeam].name}
          </p>
        )}
      </div>

      {hasError ? (
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <AlertTriangle className="h-12 w-12 text-red-400" />
          <p className="text-sm text-muted-foreground">
            {error || "Hubo un problema al procesar tu foto."}
          </p>
          {capturedImage && (
            <img
              src={capturedImage}
              alt="Foto original"
              className="aspect-video w-full max-w-sm rounded-lg bg-black object-contain shadow-[0_20px_50px_rgba(0,0,0,0.45)]"
              data-testid="img-original-fallback"
            />
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
          <div
            className="relative w-full aspect-video sm:flex-1"
            data-testid="card-result-image"
          >
            <img
              src={displayImage!}
              alt="Retrato mundialista"
              className="h-full w-full rounded-xl bg-black object-contain shadow-[0_24px_60px_rgba(0,0,0,0.5)]"
              data-testid="img-result"
            />

            {/* Decorative soccer ball overlay — top-right */}
            <div
              className="hidden"
              aria-hidden="true"
            >
              ⚽
            </div>

            {/* Decorative soccer ball overlay — bottom-left */}
            <div
              className="hidden"
              aria-hidden="true"
            >
              ⚽
            </div>

            {/* Decorative jersey overlay — bottom-right corner */}
            <div
              className="hidden"
              aria-hidden="true"
            >
              <div
                className="flex h-10 w-8 items-center justify-center rounded-sm text-2xl opacity-40 sm:h-12 sm:w-10 sm:text-3xl"
                style={{ backgroundColor: teamColors?.primary || "#16a34a", opacity: 0.35 }}
              >
                👕
              </div>
            </div>

            {/* Milenium watermark */}
            <div className="hidden">
              <span className="rounded-full bg-black/60 px-2 py-1 text-xs font-bold text-white backdrop-blur-sm">
                ⚽ Milenium
              </span>
            </div>
          </div>
          <div className="flex flex-col items-center gap-2 rounded-xl border border-green-700/40 bg-green-950/60 p-3 backdrop-blur-sm sm:w-auto">
            <img
              src={qrGallery}
              alt="QR Galería"
              className="h-20 w-20 rounded-lg sm:h-24 sm:w-24"
              data-testid="img-qr-gallery"
            />
            <p className="text-center text-[10px] font-semibold uppercase tracking-wide text-green-400 sm:text-xs">
              Escanea para ver<br />todas las fotos
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2 sm:gap-3">
        {!hasError && (
          <div className="flex gap-2 sm:gap-3">
            <Button
              size="default"
              className="flex-1 gap-2 bg-red-600 font-bold uppercase tracking-wide text-white hover:bg-red-700 sm:text-base"
              onClick={handleDownload}
              data-testid="button-download"
            >
              <Download className="h-4 w-4" />
              Descargar
            </Button>
            <Button
              size="default"
              variant="outline"
              className="gap-2 border-green-700/50 bg-white/5 text-white hover:bg-white/10"
              onClick={handleShare}
              data-testid="button-share"
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        )}

        <Button
          size="default"
          variant={hasError ? "default" : "outline"}
          className={`w-full gap-2 sm:text-base ${hasError ? "bg-red-600 text-white hover:bg-red-700 font-bold uppercase tracking-wide" : "border-green-700/50 bg-white/5 text-white hover:bg-white/10"}`}
          onClick={onRetry}
          data-testid="button-retry"
        >
          <RotateCcw className="h-4 w-4" />
          Volver a Intentar
        </Button>

        <Button
          size="default"
          variant="ghost"
          className="w-full gap-2 text-white/60 hover:bg-white/5 hover:text-white sm:text-base"
          onClick={onHome}
          data-testid="button-home"
        >
          <Home className="h-4 w-4" />
          Inicio
        </Button>
      </div>
    </div>
  );
}

export default function SingleFlowPage() {
  const [, navigate] = useLocation();
  const {
    currentStep,
    setCurrentStep,
    goToNextStep,
    reset,
    setCapturedImage,
    setTransformedImage,
    setError,
  } = useApp();

  const handleRetry = () => {
    setCapturedImage(null);
    setTransformedImage(null);
    setError(null);
    setCurrentStep("capture");
  };

  const handleHome = () => {
    reset();
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case "intro":
        return <IntroContent onContinue={goToNextStep} />;
      case "team":
        return <TeamContent onContinue={goToNextStep} />;
      case "capture":
        return <CaptureContent onContinue={goToNextStep} />;
      case "processing":
        return <ProcessingContent onComplete={goToNextStep} />;
      case "result":
        return <ResultContent onRetry={handleRetry} onHome={handleHome} />;
      default:
        return <IntroContent onContinue={goToNextStep} />;
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${worldcupBg})` }}
      />
      <div className="fixed inset-0 bg-gradient-to-b from-black/72 via-green-950/60 to-black/80" />

      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="flex items-center justify-between gap-2 px-3 py-2 sm:px-4 sm:py-3">
          <img
            src={trophyImage}
            alt="Copa Mundial"
            className="h-10 w-auto object-contain drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] sm:h-12"
            data-testid="img-trophy"
          />
          <ValleDeNapaLogo />
          <div
            className="rounded-xl px-2 py-1.5"
            style={{ background: 'rgba(0,0,0,0.40)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
          >
            <img
              src={mileniumLogo}
              alt="Milenium"
              className="h-7 w-auto object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] sm:h-9"
              data-testid="img-milenium-logo"
            />
          </div>
        </header>

        <main className="flex flex-1 flex-col items-center justify-center px-2 py-1 sm:px-4 sm:py-2">
          <div className="mb-2 text-center sm:mb-3">
            <p
              className="mb-0.5"
              style={{
                fontFamily: "'Dancing Script', cursive",
                fontSize: "clamp(0.95rem, 3vw, 1.4rem)",
                fontWeight: 600,
                color: "rgba(255,255,255,0.95)",
                lineHeight: 1.2,
                textShadow: '0 2px 12px rgba(0,0,0,1), 0 0 30px rgba(0,0,0,0.9)',
              }}
            >
              El próximo gol es tuyo —
            </p>
            <h1
              className="text-2xl font-black uppercase tracking-tight text-white sm:text-3xl md:text-4xl"
              style={{ textShadow: '0 2px 16px rgba(0,0,0,0.95), 0 0 40px rgba(0,0,0,0.8)' }}
              data-testid="text-headline"
            >
              LEYENDA DEL{" "}
              <span className="text-red-400" style={{ textShadow: '0 2px 16px rgba(0,0,0,0.95), 0 0 20px rgba(220,38,38,0.5)' }}>
                MUNDIAL
              </span>
            </h1>
            <div className="mx-auto my-1.5 flex items-center justify-center gap-2 sm:my-2">
              <div className="h-px w-8 bg-gradient-to-r from-transparent to-green-500 sm:w-12" />
              <PromoBadge>
                ⚽ Bonos Futboleros ⚽
              </PromoBadge>
              <div className="h-px w-8 bg-gradient-to-l from-transparent to-green-500 sm:w-12" />
            </div>
            <p
              className="text-xs text-white/80 sm:text-sm"
              style={{ textShadow: '0 1px 8px rgba(0,0,0,0.9)' }}
              data-testid="text-subheadline"
            >
              Vive la experiencia del Mundial con <span className="font-semibold text-green-300">Valle de Napa</span> y Milenium.
            </p>
          </div>

          <Card className="w-full max-w-sm border-green-700/30 bg-green-950/75 backdrop-blur-md sm:max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-5xl">
            {renderStepContent()}
          </Card>
        </main>

        <footer className="py-2 text-center sm:py-4">
          <p className="flex items-center justify-center gap-1 text-[10px] text-white/40 sm:gap-2 sm:text-xs">
            <Sparkles className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
            Potenciado por Tecnología de COHETE BRANDS
            <Sparkles className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
          </p>
          <button
            onClick={() => navigate("/tus-imagenes")}
            className="mt-1 text-[10px] text-white/15 transition-colors hover:text-white/35 sm:mt-2 sm:text-xs"
            data-testid="link-admin"
          >
            Admin
          </button>
        </footer>
      </div>
    </div>
  );
}
