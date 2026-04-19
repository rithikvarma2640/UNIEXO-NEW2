import { redis } from '../config/redis';
import { generateOTP } from '../utils/helpers';
import { OTPLog } from '../database/models';
import { logger } from '../config/logger';

const OTP_EXPIRY_SECONDS = 300; // 5 minutes
const OTP_PREFIX = 'otp';

export class OTPService {
  static async generate(
    email: string,
    purpose: string,
    userData?: Record<string, unknown>,
  ): Promise<string> {
    const otp = generateOTP();
    const key = `${OTP_PREFIX}:${purpose}:${email}`;

    const data = JSON.stringify({ otp, email, purpose, userData });
    await redis.set(key, data, 'EX', OTP_EXPIRY_SECONDS);

    // Log OTP for audit
    await OTPLog.create({
      email,
      otp,
      purpose,
      expiresAt: new Date(Date.now() + OTP_EXPIRY_SECONDS * 1000),
    });

    logger.info(`OTP generated for ${email} (${purpose})`);
    console.log(`\n========== OTP ==========`);
    console.log(`  Email  : ${email}`);
    console.log(`  OTP    : ${otp}`);
    console.log(`  Purpose: ${purpose}`);
    console.log(`=========================\n`);
    return otp;
  }

  static async verify(
    email: string,
    otp: string,
    purpose: string,
  ): Promise<{ valid: boolean; userData?: Record<string, unknown> }> {
    const key = `${OTP_PREFIX}:${purpose}:${email}`;
    const stored = await redis.get(key);

    if (!stored) {
      return { valid: false };
    }

    const data = JSON.parse(stored);
    if (data.otp !== otp) {
      return { valid: false };
    }

    // Delete OTP after successful verification
    await redis.del(key);

    // Mark as used in log
    await OTPLog.findOneAndUpdate(
      { email, otp, purpose, isUsed: false },
      { isUsed: true },
      { sort: { createdAt: -1 } },
    );

    return { valid: true, userData: data.userData };
  }

  static async invalidate(email: string, purpose: string): Promise<void> {
    const key = `${OTP_PREFIX}:${purpose}:${email}`;
    await redis.del(key);
  }
}
