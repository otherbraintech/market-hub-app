"use client";

import React, { useState } from "react";
import { OnboardingResultsPanel } from "@/components/business/onboarding-results-panel";
import { AgentPipelineSidebar } from "@/components/business/agent-pipeline-sidebar";
import { BusinessHeader } from "@/components/business/business-header";

interface BusinessDetailClientProps {
  business: any;
  hasAudit: boolean;
  hasMediaAnalysis?: boolean;
  hasStrategy: boolean;
  hasCampaign: boolean;
  hasCalendar: boolean;
  auditId?: string;
  strategyId?: string;
  calendarId?: string;
}

export function BusinessDetailClient({
  business,
  hasAudit,
  hasMediaAnalysis = false,
  hasStrategy,
  hasCampaign,
  hasCalendar,
  auditId,
  strategyId,
  calendarId
}: BusinessDetailClientProps) {
  // Stage tabs: "bancodedatos" | "activosvisuales" | "estrategia" | "campanas" | "calendario"
  const [activeTab, setActiveTab] = useState<string>("bancodedatos");

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden bg-background">
      {/* Header fixed at top */}
      <div className="shrink-0">
        <BusinessHeader business={business} />
      </div>

      {/* 2-Column Split View with Independent Scroll Areas */}
      <div className="flex-1 min-h-0 p-3 sm:p-4 md:p-6 w-full max-w-[1700px] mx-auto grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6 items-stretch overflow-hidden">
        {/* Left Column (3/4): Dynamic Full Report Panel */}
        <div className="lg:col-span-3 h-full min-h-0 flex flex-col overflow-hidden">
          <OnboardingResultsPanel 
            businessId={business.id} 
            externalActiveTab={activeTab}
            onTabChange={setActiveTab}
            hideTopTabBar={true}
          />
        </div>

        {/* Right Column (1/4): 5-Step Agent Pipeline Sidebar with Independent Scroll */}
        <div className="lg:col-span-1 h-full min-h-0 flex flex-col overflow-hidden">
          <AgentPipelineSidebar
            businessId={business.id}
            hasAudit={hasAudit}
            hasMediaAnalysis={hasMediaAnalysis}
            hasStrategy={hasStrategy}
            hasCampaign={hasCampaign}
            hasCalendar={hasCalendar}
            auditId={auditId}
            strategyId={strategyId}
            calendarId={calendarId}
            activeTab={activeTab}
            onSelectTab={setActiveTab}
          />
        </div>
      </div>
    </div>
  );
}
