'use server'

import { updateBusiness } from '@/modules/business/services'
import { revalidatePath } from 'next/cache'
import { SocialLinks } from '@/modules/business/types'

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
      const oldLinks = (oldBusiness.socialLinks as any) || {};
      const newLinks = data.socialLinks || {};
      
      const channelsToCheck = [
        { name: "FACEBOOK", oldUrl: oldLinks.facebook, newUrl: newLinks.facebook },
        { name: "INSTAGRAM", oldUrl: oldLinks.instagram, newUrl: newLinks.instagram },
        { name: "TIKTOK", oldUrl: oldLinks.tiktok, newUrl: newLinks.tiktok },
      ];

      const appUrl = process.env.APP_URL || "http://localhost:3000";
      channelsToCheck.forEach((ch) => {
        if (ch.newUrl && ch.newUrl.trim() !== "" && ch.newUrl !== ch.oldUrl) {
          fetch(`${appUrl}/api/analysis/request`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "MY_BUSINESS",
              entityId: businessId,
              channel: ch.name,
              url: ch.newUrl,
            }),
          }).catch((err) => {
            console.error(`Error al disparar scraping automático tras actualizar canal ${ch.name}:`, err);
          });
        }
      });
    }
    
    revalidatePath(`/business/${businessId}`)
    return { success: true }
  } catch (error) {
    console.error('Error updating business extra info:', error)
    return { success: false, error: 'Error al actualizar la información' }
  }
}
