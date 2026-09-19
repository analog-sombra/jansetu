import axios from "axios";

const SMS_CONFIG = {
  user: "SirsaM",
  key: "6f9d40f476XX",
  senderid: "SIRSAG",
  accusage: "1",
  entityid: "1701178557720912275",
  tempid: "1777178669853541752",
  baseUrl: "http://sms.smartechwebworks.com/submitsms.jsp",
};

interface SmsResponse {
  ok: boolean;
  error?: string;
  messageId?: string;
}

export async function sendSmsOtp(
  mobileNumber: string,
  otp: string,
): Promise<SmsResponse> {
  try {
    // Format mobile number - ensure it doesn't already have +91
    const formattedMobile = mobileNumber.replace(/^\+91/, "").replace(/^91/, "");
    const phoneWithCountryCode = `+91${formattedMobile}`;

    // Create the OTP message
    // const message = `Your One-Time Password (OTP) for login is: ${otp}. This OTP is valid for 5 minutes. Do not share it with anyone.`;
    const message = `Your OTP for login on Seva Me Sirsa portal is ${otp}. Do not share this OTP with anyone. - https://sevamesirsa.com/`;
    const encodedMessage = encodeURIComponent(message);

    // Construct the SMS API URL
    const url = `${SMS_CONFIG.baseUrl}?user=${SMS_CONFIG.user}&key=${SMS_CONFIG.key}&mobile=${phoneWithCountryCode}&message=${encodedMessage}&senderid=${SMS_CONFIG.senderid}&accusage=${SMS_CONFIG.accusage}&entityid=${SMS_CONFIG.entityid}&tempid=${SMS_CONFIG.tempid}`;


    // Send SMS via API
    const response = await axios.get(url, {
      timeout: 10000, // 10 second timeout
    });

    // Check if the response indicates success
    // The API should return some indication of success (adjust based on actual API response format)
    if (response.status === 200) {
      return {
        ok: true,
        messageId: response.data?.messageId || `sms_${Date.now()}`,
      };
    }

    return {
      ok: false,
      error: "Failed to send SMS",
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to send SMS";
    console.error("SMS sending error:", errorMessage);
    return {
      ok: false,
      error: errorMessage,
    };
  }
}

export async function sendSmsBulk(
  mobileNumbers: string[],
  message: string,
): Promise<SmsResponse> {
  try {
    const encodedMessage = encodeURIComponent(message);

    // Send SMS to multiple numbers (if your API supports batch sending)
    const results = await Promise.all(
      mobileNumbers.map((mobile) => {
        const formattedMobile = mobile.replace(/^\+91/, "").replace(/^91/, "");
        const phoneWithCountryCode = `+91${formattedMobile}`;

        const url = `${SMS_CONFIG.baseUrl}?user=${SMS_CONFIG.user}&key=${SMS_CONFIG.key}&mobile=${phoneWithCountryCode}&message=${encodedMessage}&senderid=${SMS_CONFIG.senderid}&accusage=${SMS_CONFIG.accusage}&entityid=${SMS_CONFIG.entityid}&tempid=${SMS_CONFIG.tempid}`;

        return axios.get(url, { timeout: 10000 });
      }),
    );

    const allSuccess = results.every((r) => r.status === 200);

    return {
      ok: allSuccess,
      error: allSuccess ? undefined : "Some messages failed to send",
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to send bulk SMS";
    console.error("Bulk SMS sending error:", errorMessage);
    return {
      ok: false,
      error: errorMessage,
    };
  }
}
