import Image from "next/image";
import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Provider } from "@/types";

type ProviderCardProps = Readonly<{
  provider: Provider;
}>;

export function ProviderCard({ provider }: ProviderCardProps) {
  return (
    <Card className="group flex h-full flex-col overflow-hidden border-border/80 transition-all duration-200 hover:-translate-y-1 hover:shadow-subtle">
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-primary/10 via-white to-primary/5">
        <Image
          src={provider.image}
          alt={provider.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
        <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-3 p-4">
          <Badge variant="secondary" className="bg-white/90 text-text shadow-soft backdrop-blur">
            {provider.specialty}
          </Badge>
          <Badge
            variant={provider.isAvailable ? "success" : "warning"}
            className="bg-white/90 shadow-soft backdrop-blur"
          >
            {provider.isAvailable ? "Available" : "Unavailable"}
          </Badge>
        </div>
      </div>

      <CardHeader className="space-y-3 pb-4">
        <div className="space-y-2">
          <CardTitle className="text-xl">{provider.name}</CardTitle>
          <p className="text-sm font-medium text-muted">{provider.subSpecialty}</p>
        </div>

        {provider.rating ? (
          <div className="flex items-center gap-1 text-sm font-medium text-warning">
            <Star className="size-4 fill-current" />
            {provider.rating.toFixed(1)}
            <span className="ml-1 text-muted">patient rating</span>
          </div>
        ) : null}
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-6">
        <p className="overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
          {provider.bio}
        </p>

        <div className="mt-auto flex flex-col gap-4 border-t border-border/80 pt-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-muted">Consultation fee</p>
            <p className="text-lg font-semibold text-text">${provider.consultationFee}</p>
          </div>

          <Button href={`/providers/${provider.slug}`} variant="secondary" fullWidth className="sm:w-auto">
            View Profile
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
