'use server'

import { updateBusiness } from '@/modules/business/services'
import { revalidatePath } from 'next/cache'
import { SocialLinks } from '@/modules/business/types'
import { triggerAnalysis } from '@/lib/analysis-service'

export async function updateBusinessExtraInfo(
  businessId: string, 
  data: { 
    phoneNumbers?: string, 
    location?: string,
    socialLinks?: SocialLinks,
  }
) {
  try {
    const { prisma } = await import("@/lib/prisma");
    const oldBusiness = await prisma.business.findUnique({
      where: { id: businessId },
      select: { website: true, socialLinks: true }
    });

    await updateBusiness(businessId, {
      phoneNumbers: data.phoneNumbers,
      location: data.location,
      socialLinks: data.socialLinks,
    })

    // Disparar análisis automático si se agregaron o cambiaron enlaces
    if (oldBusiness) {
      const oldLinks = (oldBusiness.socialLinks as unknown as SocialLinks) || {};
      const newLinks = data.socialLinks || {};
      
      const channelsToCheck = [
        { name: "FACEBOOK", oldUrl: oldLinks.facebook, newUrl: newLinks.facebook },
        { name: "INSTAGRAM", oldUrl: oldLinks.instagram, newUrl: newLinks.instagram },
        { name: "TIKTOK", oldUrl: oldLinks.tiktok, newUrl: newLinks.tiktok },
      ];

      const promises = channelsToCheck
        .filter((ch) => ch.newUrl && ch.newUrl.trim() !== "" && ch.newUrl !== ch.oldUrl)
        .map((ch) =>
          triggerAnalysis({
            type: "MY_BUSINESS",
            entityId: businessId,
            channel: ch.name,
            url: ch.newUrl!,
          }).catch((err) => {
            console.error(`Error al disparar scraping automático tras actualizar canal ${ch.name}:`, err);
          })
        );

      if (promises.length > 0) {
        await Promise.allSettled(promises);
      }
    }
    
    revalidatePath(`/business/${businessId}`)
    return { success: true }
  } catch (error) {
    console.error('Error updating business extra info:', error)
    return { success: false, error: 'Error al actualizar la información' }
  }
}
