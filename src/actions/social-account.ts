"use server";

import { revalidatePath } from "next/cache";
import { 
  createSocialAccount, 
  updateSocialAccount, 
  deleteSocialAccount, 
  disconnectSocialAccount 
} from "@/modules/publishing";
import { SocialAccountFormValues } from "@/lib/schemas/social-account";
import { SocialChannel } from "@prisma/client";

export async function createSocialAccountAction(data: SocialAccountFormValues & { businessId: string }) {
  try {
    const account = await createSocialAccount(data);
    revalidatePath(`/business/${data.businessId}`);
    return { success: true, message: "Cuenta social vinculada correctamente", account };
  } catch (error: any) {
    return { success: false, error: error.message || "Error al vincular la cuenta social" };
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
