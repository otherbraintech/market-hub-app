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
    await updateBusiness(businessId, {
      phoneNumbers: data.phoneNumbers,
      location: data.location,
      socialLinks: data.socialLinks,
    })
    
    revalidatePath(`/business/${businessId}`)
    return { success: true }
  } catch (error) {
    console.error('Error updating business extra info:', error)
    return { success: false, error: 'Error al actualizar la información' }
  }
}
