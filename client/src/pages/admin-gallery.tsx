import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Download, Image as ImageIcon, Trophy } from "lucide-react";
import type { Transformation } from "@shared/schema";
import { teamInfo, type TeamId } from "@shared/schema";
import worldcupBg from "@assets/generated_images/valle_napa_bg.png";
import mileniumLogo from "@assets/logo_milenium_correcto.webp";

function ValleDeNapaLogo({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex flex-col items-center leading-none rounded-xl px-3 py-1.5 ${className}`}
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
    >
      <span
        className="text-white"
        style={{
          fontFamily: "'Dancing Script', cursive",
          fontSize: "clamp(1rem, 2.5vw, 1.4rem)",
          fontWeight: 700,
          lineHeight: 1.1,
          textShadow: '0 2px 10px rgba(0,0,0,1), 0 0px 20px rgba(0,0,0,0.8)',
        }}
      >
        Valle de Napa
      </span>
      <span className="mt-0.5 rounded-sm bg-white/95 px-2 py-px text-[8px] font-black uppercase tracking-[0.2em] text-green-900">
        RESIDENCIAL
      </span>
    </div>
  );
}

export default function AdminGallery() {
  const [, navigate] = useLocation();

  const { data: transformations, isLoading } = useQuery<Transformation[]>({
    queryKey: ["/api/transformations"],
  });

  const handleDownload = (imageUrl: string, id: number, team: string) => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `transformacion-${team}-${id}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${worldcupBg})` }}
      />
      <div className="fixed inset-0 bg-gradient-to-b from-black/80 via-green-950/70 to-black/85" />

      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="sticky top-0 z-50 flex items-center justify-between gap-3 px-3 py-2 sm:px-4 sm:py-3" style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="text-white hover:bg-white/10 hover:text-white"
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <ValleDeNapaLogo />

          <div
            className="rounded-xl px-2 py-1.5"
            style={{ background: 'rgba(0,0,0,0.40)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
          >
            <img
              src={mileniumLogo}
              alt="Milenium"
              className="h-7 w-auto object-contain brightness-0 invert drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]"
            />
          </div>
        </header>

        <main className="container mx-auto max-w-6xl px-4 py-6 md:py-8">
          <div className="mb-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Trophy className="h-5 w-5 text-yellow-400 drop-shadow-[0_1px_6px_rgba(0,0,0,0.9)]" />
              <h1
                className="text-xl font-black uppercase tracking-tight text-white sm:text-2xl"
                style={{ textShadow: '0 2px 12px rgba(0,0,0,0.95)' }}
                data-testid="text-page-title"
              >
                Galería del Mundial
              </h1>
              <Trophy className="h-5 w-5 text-yellow-400 drop-shadow-[0_1px_6px_rgba(0,0,0,0.9)]" />
            </div>
            <p className="text-xs text-white/60" style={{ textShadow: '0 1px 6px rgba(0,0,0,0.9)' }}>
              Leyendas capturadas con{" "}
              <span className="font-semibold text-green-300">Valle de Napa</span> y Milenium
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square w-full rounded-xl bg-white/10" />
              ))}
            </div>
          ) : !transformations || transformations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-900/60 backdrop-blur-sm">
                <ImageIcon className="h-10 w-10 text-white/40" />
              </div>
              <h2 className="mb-2 text-lg font-semibold text-white drop-shadow-lg" data-testid="text-empty-state">
                Sin transformaciones aún
              </h2>
              <p className="text-sm text-white/50">
                Las transformaciones realizadas aparecerán aquí
              </p>
            </div>
          ) : (
            <>
              <p
                className="mb-5 text-center text-sm text-white/60"
                style={{ textShadow: '0 1px 6px rgba(0,0,0,0.9)' }}
              >
                {transformations.length} leyenda{transformations.length !== 1 ? "s" : ""} capturada{transformations.length !== 1 ? "s" : ""}
              </p>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 sm:gap-4">
                {transformations.map((transformation) => {
                  const team = transformation.team as TeamId;
                  return (
                    <Card
                      key={transformation.id}
                      className="group relative overflow-hidden rounded-xl bg-transparent shadow-none"
                      data-testid={`card-transformation-${transformation.id}`}
                    >
                      <img
                        src={transformation.transformedImageUrl}
                        alt={`Transformación ${transformation.id}`}
                        className="aspect-square h-full w-full rounded-xl object-cover shadow-[0_18px_45px_rgba(0,0,0,0.45)] transition-transform duration-300 group-hover:scale-[1.03]"
                        loading="lazy"
                      />

                      <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-white hover:bg-white/20"
                          onClick={() =>
                            handleDownload(
                              transformation.transformedImageUrl,
                              transformation.id,
                              transformation.team
                            )
                          }
                          data-testid={`button-download-${transformation.id}`}
                        >
                          <Download className="h-6 w-6" />
                        </Button>
                      </div>

                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </main>

        <footer className="py-3 text-center">
          <p className="text-[10px] text-white/30">
            Potenciado por Tecnología de COHETE BRANDS
          </p>
        </footer>
      </div>
    </div>
  );
}
