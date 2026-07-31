"use client";

import React, { useState } from "react";
import { OnboardingResultsPanel } from "@/components/business/onboarding-results-panel";
import { AgentPipelineSidebar } from "@/components/business/agent-pipeline-sidebar";
import { ClientStatsBar } from "@/components/business/client-stats-bar";
import { BusinessHeader } from "@/components/business/business-header";

interface BusinessDetailClientProps {
  business: any;
  hasAudit: boolean;
  hasMediaAnalysis?: boolean;
  hasStrategy: boolean;
  hasCampaign: boolean;
  hasCalendar: boolean;
  flowPercentage: number;
  flowDone: number;
  activeNetworksCount: number;
  activeNetworksList: string[];
  calendarCount: number;
  latestCalendarStatus: string;
  approvedPiecesCount: number;
  totalPiecesCount: number;
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
  flowPercentage,
  flowDone,
  activeNetworksCount,
  activeNetworksList,
  calendarCount,
  latestCalendarStatus,
  approvedPiecesCount,
  totalPiecesCount,
  auditId,
  strategyId,
  calendarId
}: BusinessDetailClientProps) {
  // Stage tabs: "bancodedatos" | "activosvisuales" | "estrategia" | "campanas" | "calendario"
  const [activeTab, setActiveTab] = useState<string>("bancodedatos");

  return (
    <div className="flex flex-col h-full bg-background pb-12">
      <BusinessHeader business={business} />

      <div className="flex-1 p-6 md:p-8 space-y-6 w-full max-w-[1700px] mx-auto animate-fade-in">
        {/* Metric / Stats Bar */}
        <ClientStatsBar
          flowPercentage={flowPercentage}
          flowDone={flowDone}
          activeNetworksCount={activeNetworksCount}
          activeNetworksList={activeNetworksList}
          calendarCount={calendarCount}
          latestCalendarStatus={latestCalendarStatus}
          approvedPiecesCount={approvedPiecesCount}
          totalPiecesCount={totalPiecesCount}
        />

        {/* 2-Column ERP Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left Column (2/3): Dynamic Full Report & Interactive Stages */}
          <div className="lg:col-span-2 space-y-6">
            <OnboardingResultsPanel 
              businessId={business.id} 
              externalActiveTab={activeTab}
              onTabChange={setActiveTab}
              hideTopTabBar={true}
            />
          </div>

          {/* Right Column (1/3): 5-Step Operative Agent Pipeline */}
          <div className="lg:col-span-1">
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
    </div>
  );
}
