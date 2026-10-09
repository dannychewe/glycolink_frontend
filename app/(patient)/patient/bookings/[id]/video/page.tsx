"use client";

import { useCallback, useState } from "react";
import { useParams } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { VideoConsultationCall, type CallState } from "@/components/VideoConsultationCall";
import { VideoPatientPanel } from "@/components/patient/appointments/VideoPatientPanel";

export default function PatientVideoConsultationPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";

  const [callState, setCallState] = useState<CallState>("idle");

  const handleCallStateChange = useCallback((state: CallState) => {
    setCallState(state);
  }, []);

  const isLive = callState === "ready" || callState === "joined";
  const hasLeft = callState === "left";

  return (
    <Container className="max-w-none py-2">
      <VideoConsultationCall
        appointmentId={id}
        backHref={`/patient/bookings/${id}`}
        backLabel="Back to appointment"
        pcqHref={`/patient/pcq/${id}`}
        onCallStateChange={handleCallStateChange}
        postCallActions={
          <>
            <Button href="/patient/records" className="bg-white/10 text-white hover:bg-white/20">
              View your records
            </Button>
            <Button href="/patient/messages" variant="ghost" className="text-white hover:bg-white/10">
              <MessageSquare className="size-4" />
              Message consultant
            </Button>
          </>
        }
        companion={
          <VideoPatientPanel appointmentId={id} isLive={isLive} hasLeft={hasLeft} />
        }
      />
    </Container>
  );
}
