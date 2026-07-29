"use client";

import React, { Suspense } from "react";
import { OnboardingContent } from "@/app/(onboarding)/onboarding/page";
import { Loader2 } from "lucide-react";

export default function CreateBusinessPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  );
}
