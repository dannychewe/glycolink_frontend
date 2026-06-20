"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useMutation } from "@apollo/client";
import DailyIframe, { type DailyCall } from "@daily-co/daily-js";
import { AlertCircle, PhoneOff, RefreshCcw, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getGraphQLErrorCode, getGraphQLErrorMessage } from "@/features/auth/auth-context";
import {
  JOIN_VIDEO_CONSULTATION_MUTATION,
  type JoinVideoConsultationData,
  type JoinVideoConsultationSession,
  type JoinVideoConsultationVariables,
} from "@/lib/video-consultation-graphql";

type VideoConsultationCallProps = Readonly<{
  appointmentId: string;
  backHref: string;
  backLabel: string;
  pcqHref?: string;
  companion?: ReactNode;
}>;

type CallState = "idle" | "joining" | "joined" | "left" | "error";

function mapVideoConsultationError(error: unknown) {
  const code = getGraphQLErrorCode(error);
  if (code === "PCQ_NOT_COMPLETED" || code === "APPOINTMENT_PCQ_REQUIRED") {
    return "Complete the appointment questionnaire before joining this consultation.";
  }
  if (code === "VIDEO_CONSULTATION_INVALID_APPOINTMENT") {
    return "This appointment is not configured for video consultation.";
  }
  if (code === "VIDEO_CONSULTATION_INVALID_STATE") {
    return "This appointment is not ready for video yet.";
  }
  if (code === "VIDEO_CONSULTATION_ACCESS_DENIED") {
    return "You do not have access to this video consultation.";
  }
  if (code === "DAILY_CONFIGURATION_ERROR") {
    return "Video consultations are not fully configured. Contact support.";
  }
  if (code === "DAILY_API_ERROR") {
    return "Unable to connect to the video provider. Try again.";
  }
  if (code === "VIDEO_CONSULTATION_NOT_FOUND") {
    return "Video consultation room was not found. Try again.";
  }
  return getGraphQLErrorMessage(error, "Unable to join video consultation.");
}

export function VideoConsultationCall({
  appointmentId,
  backHref,
  backLabel,
  pcqHref,
  companion,
}: VideoConsultationCallProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const callRef = useRef<DailyCall | null>(null);
  const [status, setStatus] = useState<CallState>("idle");
  const [session, setSession] = useState<JoinVideoConsultationSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorActionHref, setErrorActionHref] = useState<string | null>(null);
  const isDailyEnabled = process.env.NEXT_PUBLIC_DAILY_JS_ENABLED !== "false";

  const [joinVideoConsultation] = useMutation<
    JoinVideoConsultationData,
    JoinVideoConsultationVariables
  >(JOIN_VIDEO_CONSULTATION_MUTATION);

  const destroyCall = useCallback(() => {
    callRef.current?.destroy();
    callRef.current = null;
    if (containerRef.current) {
      containerRef.current.replaceChildren();
    }
  }, []);

  const startCall = useCallback(async () => {
    if (!isDailyEnabled) {
      setStatus("error");
      setError("Video consultations are disabled in this environment.");
      return;
    }
    if (!containerRef.current) return;

    setStatus("joining");
    setError(null);
    setErrorActionHref(null);
    destroyCall();

    try {
      const result = await joinVideoConsultation({ variables: { appointmentId } });
      const nextSession = result.data?.joinVideoConsultation.session;
      if (!nextSession) {
        throw new Error("The backend did not return a video session.");
      }

      const call = DailyIframe.createFrame(containerRef.current, {
        iframeStyle: {
          width: "100%",
          height: "100%",
          border: "0",
          borderRadius: "16px",
        },
        showLeaveButton: true,
        showFullscreenButton: true,
      });

      callRef.current = call;
      setSession(nextSession);

      call.on("left-meeting", () => {
        destroyCall();
        setStatus("left");
      });
      call.on("error", () => {
        destroyCall();
        setStatus("error");
        setError("The video call ended unexpectedly. Try rejoining.");
      });

      await call.join({
        url: nextSession.roomUrl,
        token: nextSession.token,
      });
      setStatus("joined");
    } catch (joinError) {
      destroyCall();
      setStatus("error");
      const code = getGraphQLErrorCode(joinError);
      setErrorActionHref(
        (code === "PCQ_NOT_COMPLETED" || code === "APPOINTMENT_PCQ_REQUIRED") && pcqHref
          ? pcqHref
          : null,
      );
      setError(mapVideoConsultationError(joinError));
    }
  }, [appointmentId, destroyCall, isDailyEnabled, joinVideoConsultation, pcqHref]);

  useEffect(() => {
    void startCall();
    return () => destroyCall();
  }, [destroyCall, startCall]);

  const showOverlay = status === "joining" || status === "left" || status === "error";

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="space-y-4">
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface px-4 py-4 shadow-soft sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
              Video consultation
            </p>
            <h1 className="text-xl font-semibold text-text">
              {session?.participantName ?? "Joining consultation"}
            </h1>
            {session ? (
              <p className="text-sm text-muted">
                {session.participantRole === "PROVIDER" ? "Provider" : "Patient"}
                {session.isOwner ? " · host" : ""}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button href={backHref} variant="secondary" size="sm">
              {backLabel}
            </Button>
            {status === "joined" ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  destroyCall();
                  setStatus("left");
                }}
              >
                <PhoneOff className="size-4" />
                Leave
              </Button>
            ) : null}
          </div>
        </div>

        <div className="relative min-h-[520px] overflow-hidden rounded-2xl border border-border bg-slate-950 shadow-soft">
          <div ref={containerRef} className="h-[70vh] min-h-[520px] w-full" />
          {showOverlay ? (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/92 px-6 text-center text-white">
              <div className="max-w-sm space-y-4">
                {status === "joining" ? (
                  <>
                    <Video className="mx-auto size-8 text-white/80" />
                    <p className="text-sm text-white/70">Joining video consultation...</p>
                  </>
                ) : null}

                {status === "left" ? (
                  <>
                    <PhoneOff className="mx-auto size-8 text-white/80" />
                    <p className="text-base font-medium">You left the consultation.</p>
                    <Button type="button" onClick={() => void startCall()}>
                      <RefreshCcw className="size-4" />
                      Rejoin
                    </Button>
                  </>
                ) : null}

                {status === "error" ? (
                  <>
                    <AlertCircle className="mx-auto size-8 text-warning" />
                    <p className="text-base font-medium">Unable to join</p>
                    <p className="text-sm text-white/70">{error}</p>
                    {errorActionHref ? (
                      <Button href={errorActionHref}>
                        Complete questionnaire
                      </Button>
                    ) : (
                      <Button type="button" onClick={() => void startCall()}>
                        <RefreshCcw className="size-4" />
                        Try again
                      </Button>
                    )}
                  </>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {companion ? <aside className="space-y-4">{companion}</aside> : null}
    </div>
  );
}
