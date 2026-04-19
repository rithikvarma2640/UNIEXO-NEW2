import { mailTransporter } from '../config/mail';
import { env } from '../config/env';
import { logger } from '../config/logger';

export class EmailService {
  static async sendOTP(email: string, otp: string, purpose: string): Promise<void> {
    const subjects: Record<string, string> = {
      signup: 'Verify Your Email - CARR',
      'password-reset': 'Reset Your Password - CARR',
      'email-verify': 'Email Verification - CARR',
    };

    const messages: Record<string, string> = {
      signup: `Welcome to CARR! Your verification OTP is: <strong>${otp}</strong>. It expires in 5 minutes.`,
      'password-reset': `Your password reset OTP is: <strong>${otp}</strong>. It expires in 5 minutes. If you didn't request this, please ignore.`,
      'email-verify': `Your email verification OTP is: <strong>${otp}</strong>. It expires in 5 minutes.`,
    };

    try {
      await mailTransporter.sendMail({
        from: `"CARR Platform" <${env.SMTP_FROM}>`,
        to: email,
        subject: subjects[purpose] || 'OTP Verification - CARR',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333;">CARR Platform</h2>
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="font-size: 16px; color: #555;">
                ${messages[purpose] || `Your OTP is: <strong>${otp}</strong>`}
              </p>
            </div>
            <p style="color: #999; font-size: 12px;">
              This is an automated message. Do not reply to this email.
            </p>
          </div>
        `,
      });
      logger.info(`OTP sent to ${email} for ${purpose}`);
    } catch (error) {
      logger.error(`Failed to send OTP email to ${email}:`, error);
      throw new Error('Failed to send OTP email');
    }
  }
  static async sendBookingConfirmation(
    userEmail: string,
    vendorEmail: string,
    details: {
      serviceName: string;
      serviceType: string;
      bookingId: string;
      amount: number;
      startDate: string;
      endDate: string;
      vendorPhone?: string;
    }
  ): Promise<void> {
    try {
      // 1. Email to the User (Receipt / Confirmation)
      const userHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Booking Confirmed!</h2>
          <p>Hi there,</p>
          <p>Your payment was successful and your booking for <strong>${details.serviceName}</strong> (${details.serviceType}) is confirmed.</p>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Booking ID:</strong> ${details.bookingId}</p>
            <p><strong>Dates:</strong> ${details.startDate} to ${details.endDate}</p>
            <p><strong>Amount Paid:</strong> ₹${details.amount.toFixed(2)}</p>
            ${details.vendorPhone ? `<p><strong>Vendor Contact Number:</strong> ${details.vendorPhone}</p>` : ''}
          </div>
          <p>The vendor has been notified and expects you!</p>
          <p style="color: #999; font-size: 12px; margin-top: 20px;">
            This is an automated receipt from CARR Platform.
          </p>
        </div>
      `;

      await mailTransporter.sendMail({
        from: `"CARR Platform" <${env.SMTP_FROM}>`,
        to: userEmail,
        subject: `Booking Confirmed: ${details.serviceName}`,
        html: userHtml,
      });

      // 2. Email to the Vendor (Notification)
      const vendorHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">New Booking Alert!</h2>
          <p>Hi Provider,</p>
          <p>Great news! A user just booked your listing: <strong>${details.serviceName}</strong> (${details.serviceType}).</p>
          <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Booking ID:</strong> ${details.bookingId}</p>
            <p><strong>Check-in/Start:</strong> ${details.startDate}</p>
            <p><strong>Check-out/End:</strong> ${details.endDate}</p>
            <p><strong>Earnings (before commission):</strong> ₹${details.amount.toFixed(2)}</p>
          </div>
          <p>Please log in to your dashboard to view more details.</p>
          <p style="color: #999; font-size: 12px; margin-top: 20px;">
            This is an automated notification from CARR Platform.
          </p>
        </div>
      `;

      await mailTransporter.sendMail({
        from: `"CARR Platform" <${env.SMTP_FROM}>`,
        to: vendorEmail,
        subject: `New Booking: ${details.serviceName}`,
        html: vendorHtml,
      });

      logger.info(`Booking confirmation emails sent for ${details.bookingId}`);
    } catch (error) {
      logger.error('Failed to send booking confirmation emails:', error);
      // We don't throw here to avoid failing the payment verification just because email failed
    }
  }

  static async sendBookingCreatedNotification(
    userEmail: string,
    vendorEmail: string,
    details: {
      serviceName: string;
      serviceType: string;
      bookingId: string;
      amount: number;
      startDate: string;
      endDate: string;
      paymentMethod: string;
    }
  ): Promise<void> {
    try {
      const userHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Booking Received</h2>
          <p>Hi there,</p>
          <p>Your booking for <strong>${details.serviceName}</strong> (${details.serviceType}) has been received and is pending vendor confirmation.</p>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Booking ID:</strong> ${details.bookingId}</p>
            <p><strong>Dates:</strong> ${details.startDate} to ${details.endDate}</p>
            <p><strong>Amount:</strong> ₹${details.amount.toFixed(2)} (${details.paymentMethod})</p>
          </div>
          <p style="color: #999; font-size: 12px; margin-top: 20px;">
            This is an automated notification from CARR Platform.
          </p>
        </div>
      `;

      await mailTransporter.sendMail({
        from: `"CARR Platform" <${env.SMTP_FROM}>`,
        to: userEmail,
        subject: `Booking Request: ${details.serviceName}`,
        html: userHtml,
      });

      const vendorHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">New Booking Request!</h2>
          <p>Hi Provider,</p>
          <p>A user just requested to book your listing: <strong>${details.serviceName}</strong> (${details.serviceType}).</p>
          <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Booking ID:</strong> ${details.bookingId}</p>
            <p><strong>Start:</strong> ${details.startDate}</p>
            <p><strong>End:</strong> ${details.endDate}</p>
            <p><strong>Payment Method:</strong> ${details.paymentMethod}</p>
            <p><strong>Earnings (before commission):</strong> ₹${details.amount.toFixed(2)}</p>
          </div>
          <p>Please log in to your dashboard to accept or reject this booking.</p>
          <p style="color: #999; font-size: 12px; margin-top: 20px;">
            This is an automated notification from CARR Platform.
          </p>
        </div>
      `;

      await mailTransporter.sendMail({
        from: `"CARR Platform" <${env.SMTP_FROM}>`,
        to: vendorEmail,
        subject: `New Booking Request: ${details.serviceName}`,
        html: vendorHtml,
      });

      logger.info(`Booking request emails sent for ${details.bookingId}`);
    } catch (error) {
      logger.error('Failed to send booking request emails:', error);
    }
  }

  static async sendOfferAcceptedEmail(
    buyerEmail: string,
    details: {
      itemTitle: string;
      offeredPrice: number;
      sellerName: string;
      sellerEmail: string;
      sellerPhone: string;
      message?: string;
    }
  ): Promise<void> {
    try {
      const buyerHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Your Offer has been Accepted! 🎉</h2>
          <p>Hi there,</p>
          <p>Great news! The seller has <strong>accepted</strong> your offer for <strong>${details.itemTitle}</strong>.</p>
          <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Item:</strong> ${details.itemTitle}</p>
            <p><strong>Agreed Price:</strong> ₹${details.offeredPrice.toFixed(2)}</p>
            <hr style="border: none; border-top: 1px solid #c8e6c9; margin: 12px 0;" />
            <p style="font-weight: bold; margin-bottom: 4px;">Seller Contact Details:</p>
            <p><strong>Name:</strong> ${details.sellerName}</p>
            <p><strong>Email:</strong> ${details.sellerEmail}</p>
            <p><strong>Phone:</strong> ${details.sellerPhone}</p>
          </div>
          ${details.message ? `<p><strong>Seller's Message:</strong> ${details.message}</p>` : ''}
          <p>Please coordinate with the seller directly to complete the transaction. Do not send payment without inspecting the item first!</p>
          <p style="color: #999; font-size: 12px; margin-top: 20px;">
            This is an automated notification from CARR Platform.
          </p>
        </div>
      `;

      await mailTransporter.sendMail({
        from: `"CARR Platform" <${env.SMTP_FROM}>`,
        to: buyerEmail,
        subject: `Offer Accepted: ${details.itemTitle}`,
        html: buyerHtml,
      });

      logger.info(`Offer accepted email sent to ${buyerEmail} for item "${details.itemTitle}"`);
    } catch (error) {
      logger.error('Failed to send offer accepted email:', error);
    }
  }
}
