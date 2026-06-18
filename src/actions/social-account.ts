"use server";

import { revalidatePath } from "next/cache";
import { 
  createSocialAccount, 
  updateSocialAccount, 
  deleteSocialAccount, 
  disconnectSocialAccount 
} from "@/modules/publishing";
import { SocialAccountFormValues } from "@/lib/schemas/social-account";
import { prisma } from "@/lib/prisma";

export async function createSocialAccountAction(data: SocialAccountFormValues & { businessId: string }) {
  try {
    const account = await createSocialAccount(data);
    revalidatePath(`/business/${data.businessId}`);
    
    // Trigger automatic consolidated analysis if conditions are met
    await triggerAutomaticConsolidatedAnalysis(data.businessId);
    
    return { success: true, message: "Cuenta social vinculada correctamente", account };
  } catch (error: any) {
    return { success: false, error: error.message || "Error al vincular la cuenta social" };
  }
}

async function triggerAutomaticConsolidatedAnalysis(businessId: string) {
  try {
    // Check if business has enough data to trigger analysis
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        socialAccounts: true,
        competitors: true
      }
    });

    if (!business) return;

    // Check if there's at least 1 social account and 1 competitor
    if (business.socialAccounts.length >= 1 && business.competitors.length >= 1) {
      // Check if consolidated analysis already exists
      const existingConsolidated = await prisma.analysisReport.findFirst({
        where: {
          type: 'MY_BUSINESS',
          channel: 'CONSOLIDATED',
          entityId: businessId,
          status: 'COMPLETED'
        }
      });

      if (!existingConsolidated) {
        // Trigger consolidated analysis API in background
        const appUrl = process.env.APP_URL || "http://localhost:3000";
        
        // Trigger business consolidated analysis
        fetch(`${appUrl}/api/business/${businessId}/consolidated-analysis`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }).catch((err) => {
          console.error('Error triggering business consolidated analysis:', err);
        });

        // Trigger competitor consolidated analysis
        fetch(`${appUrl}/api/competitors/${businessId}/consolidated-analysis`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }).catch((err) => {
          console.error('Error triggering competitor consolidated analysis:', err);
        });
      }
    }
  } catch (error) {
    console.error('Error in triggerAutomaticConsolidatedAnalysis:', error);
  }
}

export async function updateSocialAccountAction(id: string, data: SocialAccountFormValues, businessId: string) {
  try {
    const account = await updateSocialAccount(id, data);
    revalidatePath(`/business/${businessId}`);
    return { success: true, message: "Cuenta social actualizada correctamente", account };
  } catch (error: any) {
    return { success: false, error: error.message || "Error al actualizar la cuenta social" };
  }
}

export async function deleteSocialAccountAction(id: string, businessId: string) {
  try {
    await deleteSocialAccount(id);
    revalidatePath(`/business/${businessId}`);
    return { success: true, message: "Cuenta social eliminada correctamente" };
  } catch (error: any) {
    return { success: false, error: error.message || "Error al eliminar la cuenta social" };
  }
}
