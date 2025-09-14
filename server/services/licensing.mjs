// Simple licensing stub. Replace with real provider or signature verification.
const licenses = new Map(); // key: userId -> {key, plan, active, activatedAt}

export const activateLicense = async ({ userId, licenseKey }) => {
  if (!licenseKey) throw new Error('licenseKey required');
  // TODO: Validate signature or check with licensing provider
  const record = {
    key: licenseKey,
    plan: 'pro',
    active: true,
    activatedAt: new Date().toISOString(),
  };
  licenses.set(userId, record);
  return record;
};

export const getLicenseStatus = async ({ userId }) => {
  const rec = licenses.get(userId);
  if (!rec) return { active: false };
  return { active: !!rec.active, plan: rec.plan, activatedAt: rec.activatedAt };
};
