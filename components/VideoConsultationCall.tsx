"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useMutation } from "@apollo/client";
import DailyIframe, { type DailyCall } from "@daily-co/daily-js";
import { AlarmClock, AlertCircle, ArrowLeft, PhoneOff, RefreshCcw, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CountdownPill } from "@/components/ui/countdown-pill";
import { useCountdown } from "@/hooks/use-countdown";
import { cn } from "@/lib/utils/cn";
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

type CallState = "idle" | "preparing" | "ready" | "joined" | "left" | "error";

function mapVideoConsultationError(error: unknown) {
  const code = getGraphQLErrorCode(error);
  const backendMessage = getGraphQLErrorMessage(error, "");
  if (code === "PCQ_NOT_COMPLETED" || code === "APPOINTMENT_PCQ_REQUIRED") {
    return "Complete the appointment questionnaire before joining this consultation.";
  }
  if (code === "VIDEO_CONSULTATION_INVALID_APPOINTMENT") {
    return "This appointment is not configured for video consultation.";
  }
  if (code === "VIDEO_CONSULTATION_INVALID_STATE") {
    return backendMessage || "This appointment is not ready for video yet.";
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

  const isLive = status === "ready" || status === "joined";
  const countdown = useCountdown(isLive ? session?.expiresAt : null, {
    warnSeconds: 300,
    criticalSeconds: 60,
  });

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

    setStatus("preparing");
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
      setStatus("ready");

      call.on("joined-meeting", () => {
        setStatus("joined");
      });
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

  const showOverlay = status === "preparing" || status === "left" || status === "error";
  const showEndingSoon = isLive && countdown?.isWarning;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="space-y-3">
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-4">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-primary">
              <Video className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 space-y-0.5">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted">
                Video consultation
              </p>
              <h1 className="truncate text-lg font-semibold text-text sm:text-xl">
                {session?.participantName ?? "Joining consultation"}
              </h1>
              {session ? (
                <p className="text-xs text-muted sm:text-sm">
                  {session.participantRole === "PROVIDER" ? "Provider" : "Patient"}
                  {session.isOwner ? " · host" : ""}
                </p>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isLive && countdown ? (
              <CountdownPill countdown={countdown} label="Ends in" />
            ) : null}
            <Button href={backHref} variant="secondary" size="sm">
              <ArrowLeft className="size-4" />
              <span className="hidden sm:inline">{backLabel}</span>
              <span className="sm:hidden">Back</span>
            </Button>
            {isLive ? (
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

        {showEndingSoon ? (
          <div
            className={cn(
              "flex items-center gap-2.5 rounded-xl border px-4 py-2.5 text-sm",
              countdown?.isCritical
                ? "border-danger/30 bg-danger/5 text-danger"
                : "border-warning/30 bg-warning/5 text-warning",
            )}
            role="status"
          >
            <AlarmClock className="size-4 shrink-0" aria-hidden="true" />
            <p className="flex-1">
              This consultation ends in{" "}
              <span className="font-semibold tabular-nums">{countdown?.label}</span>. Wrap up any
              final notes.
            </p>
          </div>
        ) : null}

        <div className="relative overflow-hidden rounded-xl border border-border bg-slate-950">
          <div
            ref={containerRef}
            className="h-[calc(100dvh-15rem)] min-h-[360px] w-full sm:h-[calc(100dvh-13rem)] sm:min-h-[480px] lg:min-h-[560px]"
          />
          {showOverlay ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/92 px-6 text-center text-white">
              <div className="max-w-sm space-y-4">
                {status === "preparing" ? (
                  <>
                    <Video className="mx-auto size-8 text-white/80" />
                    <p className="text-sm text-white/70">Preparing video consultation...</p>
                  </>
                ) : null}

                {status === "left" ? (
                  <>
                    <PhoneOff className="mx-auto size-8 text-white/80" />
                    <p className="text-base font-medium">You left the consultation.</p>
                    <div className="flex flex-col items-center gap-2">
                      <Button type="button" onClick={() => void startCall()}>
                        <RefreshCcw className="size-4" />
                        Rejoin
                      </Button>
                      <Button href={backHref} variant="ghost" className="text-white hover:bg-white/10">
                        {backLabel}
                      </Button>
                    </div>
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
