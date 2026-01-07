import { useRef, useState, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ChevronRight,
  ArrowLeft,
  Check,
  Camera,
  Upload,
  RotateCcw,
  SwitchCamera,
  AlertCircle,
  Download,
  Share2,
  Home,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { useApp, type FlowStep } from "@/lib/app-context";
import { TEAMS, teamInfo, type TeamId } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import backgroundImage from "@assets/Captura_de_pantalla_2026-01-05_171649_1767827562768.png";
import trophyImage from "@assets/Base_Kickoff_2026_1767827570896.jpg";

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

function IntroSection({ onContinue }: { onContinue: () => void }) {
  const [, navigate] = useLocation();

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-12">
        <div className="flex flex-col items-center gap-6 text-center md:gap-8">
          <div className="relative">
            <img
              src={trophyImage}
              alt="Copa Mundial Milenium"
              className="h-40 w-auto object-contain drop-shadow-2xl md:h-56 lg:h-64"
              data-testid="img-trophy"
            />
          </div>

          <div className="space-y-3 md:space-y-4">
            <h1
              className="text-3xl font-bold tracking-tight text-white drop-shadow-lg md:text-4xl lg:text-5xl"
              data-testid="text-headline"
            >
              Transforma Tu Pasión
            </h1>
            <p
              className="max-w-md text-base text-white/90 md:text-lg lg:text-xl"
              data-testid="text-subheadline"
            >
              Conviértete en el fan definitivo del Mundial 2026 con un retrato
              único de tu equipo favorito
            </p>
          </div>

          <Button
            size="lg"
            onClick={onContinue}
            className="mt-4 gap-2 rounded-full bg-white/20 px-8 py-6 text-lg font-semibold text-white backdrop-blur-md border border-white/30 md:px-10 md:py-7 md:text-xl"
            data-testid="button-comenzar"
          >
            Comenzar
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        <footer className="absolute bottom-4 left-0 right-0 text-center">
          <button
            onClick={() => navigate("/admin-secreto")}
            className="text-xs text-white/30 transition-colors hover:text-white/50"
            data-testid="link-admin"
          >
            Admin
          </button>
        </footer>
      </div>
    </div>
  );
}

function TeamSection({
  onContinue,
  onBack,
}: {
  onContinue: () => void;
  onBack: () => void;
}) {
  const { selectedTeam, setSelectedTeam } = useApp();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 flex items-center gap-4 border-b bg-background/95 px-4 py-3 backdrop-blur-sm md:px-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1
          className="text-lg font-semibold md:text-xl"
          data-testid="text-page-title"
        >
          Selecciona Tu Equipo
        </h1>
      </header>

      <main className="container mx-auto max-w-4xl px-4 py-6 md:py-8">
        <p className="mb-6 text-center text-muted-foreground md:mb-8 md:text-lg">
          Elige el equipo con el que quieres transformar tu foto
        </p>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {TEAMS.map((team) => {
            const info = teamInfo[team];
            const isSelected = selectedTeam === team;

            return (
              <Card
                key={team}
                className={`relative cursor-pointer overflow-visible p-4 transition-all duration-200 hover-elevate active-elevate-2 md:p-6 ${
                  isSelected ? "ring-2 ring-primary ring-offset-2" : ""
                }`}
                onClick={() => setSelectedTeam(team)}
                data-testid={`card-team-${team}`}
              >
                {isSelected && (
                  <div className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="h-4 w-4" />
                  </div>
                )}

                <div className="flex flex-col items-center gap-3">
                  <div className="relative h-12 w-16 overflow-hidden rounded-sm shadow-sm md:h-14 md:w-20">
                    <img
                      src={teamFlags[team]}
                      alt={`Bandera de ${info.name}`}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <span className="text-center text-sm font-medium md:text-base">
                    {info.name}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="mt-8 flex justify-center md:mt-10">
          <Button
            size="lg"
            disabled={!selectedTeam}
            onClick={onContinue}
            className="w-full max-w-xs gap-2 py-6 text-lg font-semibold md:max-w-sm"
            data-testid="button-continue"
          >
            Continuar
          </Button>
        </div>
      </main>
    </div>
  );
}

function CaptureSection({
  onContinue,
  onBack,
}: {
  onContinue: () => void;
  onBack: () => void;
}) {
  const { selectedTeam, setCapturedImage } = useApp();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const teamColors = selectedTeam ? teamInfo[selectedTeam].colors : null;

  const startCamera = useCallback(async () => {
    try {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 1280 },
        },
        audio: false,
      });

      setStream(mediaStream);
      setHasPermission(true);
      setError(null);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera error:", err);
      setHasPermission(false);
      setError(
        "No se pudo acceder a la cámara. Por favor, permite el acceso o sube una imagen."
      );
    }
  }, [facingMode, stream]);

  useEffect(() => {
    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const switchCamera = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  useEffect(() => {
    if (hasPermission) {
      startCamera();
    }
  }, [facingMode]);

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

    const imageData = canvas.toDataURL("image/jpeg", 0.9);
    setCapturedPreview(imageData);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Por favor, selecciona un archivo de imagen válido.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setCapturedPreview(result);
    };
    reader.readAsDataURL(file);
  };

  const retakePhoto = () => {
    setCapturedPreview(null);
    startCamera();
  };

  const confirmPhoto = () => {
    if (capturedPreview) {
      setCapturedImage(capturedPreview);
      onContinue();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 flex items-center gap-4 border-b bg-background/95 px-4 py-3 backdrop-blur-sm md:px-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1
          className="text-lg font-semibold md:text-xl"
          data-testid="text-page-title"
        >
          Captura Tu Foto
        </h1>
      </header>

      <main className="container mx-auto flex max-w-2xl flex-col items-center px-4 py-6 md:py-8">
        <p className="mb-6 text-center text-muted-foreground">
          Toma una selfie o sube una foto para transformarla
        </p>

        <Card
          className="relative aspect-square w-full max-w-md overflow-hidden"
          style={{
            borderColor: teamColors?.primary,
            borderWidth: teamColors ? "3px" : "1px",
          }}
          data-testid="card-camera-preview"
        >
          {capturedPreview ? (
            <img
              src={capturedPreview}
              alt="Foto capturada"
              className="h-full w-full object-cover"
              data-testid="img-captured-preview"
            />
          ) : hasPermission === false ? (
            <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-muted p-6 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="gap-2"
                data-testid="button-upload-fallback"
              >
                <Upload className="h-4 w-4" />
                Subir Imagen
              </Button>
            </div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`h-full w-full object-cover ${facingMode === "user" ? "scale-x-[-1]" : ""}`}
              data-testid="video-camera"
            />
          )}

          {hasPermission && !capturedPreview && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-3 top-3 bg-black/30 text-white backdrop-blur-sm"
              onClick={switchCamera}
              data-testid="button-switch-camera"
            >
              <SwitchCamera className="h-5 w-5" />
            </Button>
          )}
        </Card>

        <canvas ref={canvasRef} className="hidden" />

        <div className="mt-6 flex w-full max-w-md flex-col items-center gap-4">
          {capturedPreview ? (
            <div className="flex w-full gap-4">
              <Button
                variant="outline"
                size="lg"
                className="flex-1 gap-2 py-6"
                onClick={retakePhoto}
                data-testid="button-retake"
              >
                <RotateCcw className="h-5 w-5" />
                Volver a Tomar
              </Button>
              <Button
                size="lg"
                className="flex-1 py-6 font-semibold"
                onClick={confirmPhoto}
                data-testid="button-confirm"
              >
                Transformar
              </Button>
            </div>
          ) : (
            <>
              {hasPermission && (
                <Button
                  size="lg"
                  className="h-20 w-20 rounded-full p-0"
                  onClick={capturePhoto}
                  data-testid="button-capture"
                >
                  <Camera className="h-8 w-8" />
                </Button>
              )}

              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-border" />
                <span className="text-sm text-muted-foreground">o</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <Button
                variant="outline"
                size="lg"
                className="w-full gap-2 py-6"
                onClick={() => fileInputRef.current?.click()}
                data-testid="button-upload"
              >
                <Upload className="h-5 w-5" />
                Subir Imagen
              </Button>
            </>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
          data-testid="input-file-upload"
        />
      </main>
    </div>
  );
}

function ProcessingSection({ onComplete }: { onComplete: () => void }) {
  const {
    selectedTeam,
    capturedImage,
    setTransformedImage,
    setError,
  } = useApp();

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

  if (!selectedTeam) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <div className="flex flex-col items-center gap-8 text-center">
        <div className="relative">
          <div
            className="absolute inset-0 animate-ping rounded-full opacity-30"
            style={{ backgroundColor: teamColors?.primary }}
          />
          <div
            className="relative flex h-24 w-24 items-center justify-center rounded-full md:h-32 md:w-32"
            style={{ backgroundColor: teamColors?.primary }}
          >
            <Loader2 className="h-12 w-12 animate-spin text-white md:h-16 md:w-16" />
          </div>
        </div>

        <div className="space-y-3">
          <h1
            className="text-2xl font-bold md:text-3xl"
            data-testid="text-processing-title"
          >
            Transformando tu pasión...
          </h1>
          <p
            className="text-muted-foreground md:text-lg"
            data-testid="text-processing-subtitle"
          >
            Estamos creando tu retrato mundialista de{" "}
            {teamInfo[selectedTeam].name}
          </p>
        </div>

        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-3 w-3 animate-bounce rounded-full"
              style={{
                backgroundColor: teamColors?.primary,
                animationDelay: `${i * 0.15}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ResultSection({
  onRetry,
  onHome,
}: {
  onRetry: () => void;
  onHome: () => void;
}) {
  const { selectedTeam, transformedImage, capturedImage, error } = useApp();
  const { toast } = useToast();

  const teamColors = selectedTeam ? teamInfo[selectedTeam].colors : null;
  const hasError = error !== null || !transformedImage;
  const displayImage = transformedImage || capturedImage;

  const handleDownload = () => {
    const imageToDownload = transformedImage || capturedImage;
    if (!imageToDownload) return;

    const link = document.createElement("a");
    link.href = imageToDownload;
    link.download = `fan-mundialista-${selectedTeam || "foto"}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Imagen descargada",
      description: "Tu retrato mundialista se ha guardado correctamente.",
    });
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

  if (!displayImage && !error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
        <div className="text-center">
          <h1 className="mb-4 text-xl font-semibold">Sin imagen disponible</h1>
          <Button onClick={onHome} data-testid="button-go-home">
            Volver al inicio
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto flex max-w-2xl flex-col items-center px-4 py-6 md:py-8">
        <div className="mb-6 text-center md:mb-8">
          <h1
            className="text-2xl font-bold md:text-3xl"
            data-testid="text-result-title"
          >
            {hasError ? "Ocurrió un Error" : "Tu Retrato Mundialista"}
          </h1>
          {selectedTeam && !hasError && (
            <p className="mt-2 text-muted-foreground">
              Fan de {teamInfo[selectedTeam].name}
            </p>
          )}
        </div>

        {hasError ? (
          <Card
            className="flex w-full max-w-md flex-col items-center justify-center gap-4 p-8"
            data-testid="card-error"
          >
            <AlertTriangle className="h-16 w-16 text-destructive" />
            <h2 className="text-lg font-semibold">
              No se pudo transformar la imagen
            </h2>
            <p className="text-center text-sm text-muted-foreground">
              {error ||
                "Hubo un problema al procesar tu foto. Por favor, intenta de nuevo."}
            </p>
            {capturedImage && (
              <div className="mt-4 w-full">
                <p className="mb-2 text-center text-xs text-muted-foreground">
                  Tu foto original:
                </p>
                <img
                  src={capturedImage}
                  alt="Foto original"
                  className="aspect-square w-full rounded-md object-cover"
                  data-testid="img-original-fallback"
                />
              </div>
            )}
          </Card>
        ) : (
          <Card
            className="relative aspect-square w-full max-w-md overflow-hidden"
            style={{
              borderColor: teamColors?.primary,
              borderWidth: teamColors ? "3px" : "1px",
            }}
            data-testid="card-result-image"
          >
            <img
              src={displayImage!}
              alt="Retrato mundialista"
              className="h-full w-full object-cover"
              data-testid="img-result"
            />
          </Card>
        )}

        <div className="mt-6 flex w-full max-w-md flex-col gap-3 md:mt-8">
          {!hasError && (
            <div className="flex gap-3">
              <Button
                size="lg"
                className="flex-1 gap-2 py-6 font-semibold"
                onClick={handleDownload}
                data-testid="button-download"
              >
                <Download className="h-5 w-5" />
                Descargar
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="gap-2 py-6"
                onClick={handleShare}
                data-testid="button-share"
              >
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
          )}

          <Button
            size="lg"
            variant={hasError ? "default" : "outline"}
            className="w-full gap-2 py-6"
            onClick={onRetry}
            data-testid="button-retry"
          >
            <RotateCcw className="h-5 w-5" />
            Volver a Intentar
          </Button>

          <Button
            size="lg"
            variant="ghost"
            className="w-full gap-2"
            onClick={onHome}
            data-testid="button-home"
          >
            <Home className="h-5 w-5" />
            Inicio
          </Button>
        </div>
      </main>
    </div>
  );
}

export default function SingleFlowPage() {
  const {
    currentStep,
    setCurrentStep,
    goToNextStep,
    goToPreviousStep,
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

  const renderStep = () => {
    switch (currentStep) {
      case "intro":
        return <IntroSection onContinue={goToNextStep} />;
      case "team":
        return (
          <TeamSection onContinue={goToNextStep} onBack={goToPreviousStep} />
        );
      case "capture":
        return (
          <CaptureSection onContinue={goToNextStep} onBack={goToPreviousStep} />
        );
      case "processing":
        return <ProcessingSection onComplete={goToNextStep} />;
      case "result":
        return <ResultSection onRetry={handleRetry} onHome={handleHome} />;
      default:
        return <IntroSection onContinue={goToNextStep} />;
    }
  };

  return <div className="min-h-screen">{renderStep()}</div>;
}
