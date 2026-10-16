"use client";

import * as React from "react";
import { CopyIcon, Share2Icon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const COPY_SUCCESS_MESSAGE = "Payment link copied.";
const COPY_FAILURE_MESSAGE = "Couldn't copy the payment link. Please copy it manually.";
const SHARE_FAILURE_MESSAGE = "Couldn't share or copy the payment link. Please copy it manually.";

const emptySubscribe = () => () => {};

function useOrigin(): string | null {
  return React.useSyncExternalStore(
    emptySubscribe,
    () => window.location.origin,
    () => null
  );
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    throw new Error("Clipboard API unavailable");
  } catch {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const successful = document.execCommand("copy");
      document.body.removeChild(textarea);
      return successful;
    } catch {
      return false;
    }
  }
}

export function PaymentLinkActions({ tenantCode }: { tenantCode: string }) {
  const origin = useOrigin();
  const paymentLink = origin ? `${origin}/pay/${tenantCode}` : null;

  async function handleCopy() {
    if (!paymentLink) return;
    const ok = await copyToClipboard(paymentLink);
    if (ok) toast.success(COPY_SUCCESS_MESSAGE);
    else toast.error(COPY_FAILURE_MESSAGE);
  }

  async function handleShare() {
    if (!paymentLink) return;

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: "Payment link", url: paymentLink });
        return;
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
      }
    }

    const ok = await copyToClipboard(paymentLink);
    if (ok) toast.success(COPY_SUCCESS_MESSAGE);
    else toast.error(SHARE_FAILURE_MESSAGE);
  }

  return (
    <div className="flex items-center gap-2">
      {paymentLink ? (
        <span className="hidden max-w-48 truncate text-xs text-muted-foreground lg:inline font-mono">
          {paymentLink}
        </span>
      ) : (
        <Skeleton className="hidden h-4 w-32 lg:inline-block" />
      )}
      <Button variant="outline" size="sm" onClick={handleCopy} disabled={!paymentLink} className="h-8 shadow-sm">
        <CopyIcon className="size-3.5 mr-1.5" /> Copy link
      </Button>
      <Button variant="outline" size="sm" onClick={handleShare} disabled={!paymentLink} className="h-8 shadow-sm">
        <Share2Icon className="size-3.5 mr-1.5" /> Share
      </Button>
    </div>
  );
}