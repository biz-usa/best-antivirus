

import type { SiteConfig } from './types';
import { getSiteConfig } from './data';

export async function sendEmail(to: string, subject: string, htmlBody: string) {
    const config = await getSiteConfig();
    const fromEmail = config.email?.postmark?.fromEmail;
    const serverToken = config.email?.postmark?.serverToken;
    const replyToEmail = config.email?.postmark?.replyToEmail;

    if (!fromEmail || !serverToken) {
        console.warn("Postmark is not configured. Skipping email.");
        // We can throw an error here to notify the calling function
        throw new Error("Postmark settings are incomplete. Cannot send email.");
    }
    
    const payload = {
        From: `Saigonsoft.com <${fromEmail}>`,
        To: to,
        Subject: subject,
        HtmlBody: htmlBody,
        MessageStream: "outbound",
        ...(replyToEmail && { ReplyTo: replyToEmail })
    };

    try {
        const response = await fetch('https://api.postmarkapp.com/email', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-Postmark-Server-Token': serverToken
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorBody = await response.json();
            throw new Error(`Postmark API error: ${response.status} - ${JSON.stringify(errorBody)}`);
        }
        
        const result = await response.json();
        console.log(`Email sent via Postmark to ${to}. MessageID: ${result.MessageID}`);
        return result;

    } catch (error) {
        console.error(`Failed to send email via Postmark:`, error);
        throw error;
    }
};
