import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendPasswordResetEmail = async (email: string, code: string) => {
  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY is not set');
    return { error: 'Configuration error' };
  }

  try {
    const fromAddress = process.env.RESEND_FROM_EMAIL || 'MarketOps Support <onboarding@resend.dev>';
    console.log(`Attempting to send email from: ${fromAddress} to: ${email}`);
    
    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: [email],
      subject: 'Restablece tu contraseña',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Restablecimiento de contraseña</h2>
          <p>Has solicitado restablecer tu contraseña. Utiliza el siguiente código para continuar:</p>
          <div style="background-color: #f4f4f4; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0;">
            <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #000;">${code}</span>
          </div>
          <p>Este código expira en 1 hora.</p>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">Si no solicitaste este cambio, puedes ignorar este correo.</p>
        </div>
      `,
    });

    console.log('Resend response:', { data, error });

    if (error) {
        console.error('Error sending email:', error);
        return { error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Unexpected error sending email:', error);
    return { error: 'Failed to send email' };
  }
};
