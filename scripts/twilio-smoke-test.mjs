import twilio from "twilio";

const [, , to, ...messageParts] = process.argv;
const body = messageParts.join(" ").trim() || "Test Open Spot";

function requireEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required.`);
  }

  return value;
}

function isE164Phone(value) {
  return /^\+[1-9][0-9]{7,14}$/.test(value);
}

async function main() {
  if (process.env.ALLOW_REAL_SMS_SENDS !== "true") {
    throw new Error("Refusing to send: ALLOW_REAL_SMS_SENDS must be true.");
  }

  if (!to) {
    throw new Error("Usage: npm run twilio:smoke -- +15145551234 \"Test Open Spot\"");
  }

  if (!isE164Phone(to)) {
    throw new Error("Destination phone must be a valid E.164 number.");
  }

  const accountSid = requireEnv("TWILIO_ACCOUNT_SID");
  const authToken = requireEnv("TWILIO_AUTH_TOKEN");
  const from = requireEnv("TWILIO_SOURCE_NUMBER");

  if (!isE164Phone(from)) {
    throw new Error("TWILIO_SOURCE_NUMBER must be a valid E.164 number.");
  }

  const client = twilio(accountSid, authToken);
  const message = await client.messages.create({
    to,
    from,
    body,
    statusCallback: process.env.TWILIO_STATUS_CALLBACK_URL || undefined
  });

  console.log(`Twilio smoke SMS queued. SID: ${message.sid}`);
  console.log(`Twilio returned status: ${message.status}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Twilio smoke test failed.");
  process.exit(1);
});
