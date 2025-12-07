"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendInviteEmail = sendInviteEmail;
// src/services/emailService.ts
const resend_1 = require("resend");
const resend = new resend_1.Resend(process.env.RESEND_API_KEY);
async function sendInviteEmail({ to, teamName, inviterName, role, inviteToken, expiresAt, }) {
    const inviteLink = `${process.env.FRONTEND_URL}/invites/${inviteToken}`;
    const roleDisplay = role === "coordinator" ? "Co-coordinator" : "Member";
    const expiresAtFormatted = expiresAt.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
    try {
        const { data, error } = await resend.emails.send({
            from: "Let's Play <onboarding@resend.dev>", // ← Usa este email para testar
            to: [to],
            subject: `🎉 You've been invited to join ${teamName}!`,
            html: getEmailTemplate({
                teamName,
                inviterName,
                role: roleDisplay,
                inviteLink,
                expiresAt: expiresAtFormatted,
            }),
        });
        if (error) {
            console.error("Resend error:", error);
            throw new Error(error.message);
        }
        console.log("Email sent successfully:", data?.id);
        return { success: true, id: data?.id };
    }
    catch (error) {
        console.error("Failed to send email:", error);
        throw error;
    }
}
function getEmailTemplate({ teamName, inviterName, role, inviteLink, expiresAt, }) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f3f4f6;">
      <div style="max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">⚽ Let's Play</h1>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px;">
          <h2 style="color: #111827; font-size: 24px; margin-top: 0;">You've Been Invited! 🎉</h2>
          
          <p style="color: #4b5563; line-height: 1.6;">Hi there!</p>
          
          <p style="color: #4b5563; line-height: 1.6;">
            <strong>${inviterName}</strong> has invited you to join their team 
            <strong>${teamName}</strong> on Let's Play.
          </p>
          
          <!-- Invite Details Box -->
          <div style="background: #f9fafb; border-left: 4px solid #10b981; padding: 20px; margin: 24px 0; border-radius: 4px;">
            <p style="margin: 8px 0; color: #374151;">
              <strong style="color: #111827;">Team:</strong> ${teamName}
            </p>
            <p style="margin: 8px 0; color: #374151;">
              <strong style="color: #111827;">Your Role:</strong> ${role}
            </p>
            <p style="margin: 8px 0; color: #374151;">
              <strong style="color: #111827;">Invited by:</strong> ${inviterName}
            </p>
            <p style="margin: 8px 0; color: #374151;">
              <strong style="color: #111827;">Expires:</strong> ${expiresAt}
            </p>
          </div>
          
          <p style="color: #4b5563; line-height: 1.6;">
            Click the button below to accept or decline this invitation:
          </p>
          
          <!-- Button -->
          <div style="text-align: center; margin: 24px 0;">
            <a href="${inviteLink}" style="display: inline-block; background: #10b981; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600;">
              View Invitation
            </a>
          </div>
          
          <p style="font-size: 14px; color: #6b7280; margin-top: 24px;">
            Or copy and paste this link:<br>
            <a href="${inviteLink}" style="color: #10b981; word-break: break-all;">${inviteLink}</a>
          </p>
        </div>
        
        <!-- Footer -->
        <div style="background: #f9fafb; padding: 20px 30px; text-align: center; color: #6b7280; font-size: 14px;">
          <p>This invitation expires on ${expiresAt}.</p>
          <p>If you didn't expect this invitation, you can safely ignore this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
