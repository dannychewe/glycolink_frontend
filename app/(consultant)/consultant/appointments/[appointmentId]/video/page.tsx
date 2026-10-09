"use client";

import { useCallback, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { VideoConsultationCall } from "@/components/VideoConsultationCall";
import { VideoEncounterPanel } from "@/components/consultant/consultations/VideoEncounterPanel";
import type { JoinVideoConsultationSession } from "@/lib/video-consultation-graphql";

export default function ConsultantVideoConsultationPage() {
  const params = useParams<{ appointmentId: string }>();
  const appointmentId = params?.appointmentId ?? "";

  const [session, setSession] = useState<JoinVideoConsultationSession | null>(null);
  const [patientName, setPatientName] = useState<string | null>(null);

  const handleSessionReady = useCallback((s: JoinVideoConsultationSession) => {
    setSession(s);
    if (s.participantRole === "PROVIDER") {
      setPatientName(null);
    }
  }, []);

  const patientId = session?.consultation.patientId ?? null;

  return (
    <Container className="max-w-none py-2">
      <VideoConsultationCall
        appointmentId={appointmentId}
        backHref="/consultant/appointments"
        backLabel="Back to appointments"
        pcqHref="/consultant/consultations"
        onSessionReady={handleSessionReady}
        postCallActions={
          <Button href={`/consultant/consultations/${appointmentId}`} className="bg-white/10 text-white hover:bg-white/20">
            Open full workspace
          </Button>
        }
        companion={
          patientId ? (
            <VideoEncounterPanel appointmentId={appointmentId} patientId={patientId} />
          ) : (
            <div className="rounded-xl border border-border bg-surface px-4 py-6 text-center text-sm text-muted">
              Connecting to consultation...
            </div>
          )
        }
      />
    </Container>
  );
}
