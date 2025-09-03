// Simple validation helpers for server inputs

const isString = (v) => typeof v === 'string';
const isNumber = (v) => typeof v === 'number' && Number.isFinite(v);
const isBoolean = (v) => typeof v === 'boolean';

export function validateDemoPayment(input = {}) {
  const errors = [];
  const out = {
    amount: 500,
    currency: 'USD',
    durationDays: 30,
  };

  if (input.amount !== undefined) {
    if (!isNumber(input.amount)) errors.push('amount must be a number');
    else if (input.amount < 100) errors.push('amount must be >= 100');
    else if (input.amount > 50000) errors.push('amount must be <= 50000');
    else out.amount = Math.round(input.amount);
  }

  if (input.currency !== undefined) {
    const allowed = ['USD', 'EUR', 'GBP'];
    if (!isString(input.currency)) errors.push('currency must be a string');
    else if (!allowed.includes(input.currency.toUpperCase()))
      errors.push(`currency must be one of ${allowed.join(', ')}`);
    else out.currency = input.currency.toUpperCase();
  }

  if (input.durationDays !== undefined) {
    const allowedDurations = [7, 30, 90];
    if (!isNumber(input.durationDays)) errors.push('durationDays must be a number');
    else if (!allowedDurations.includes(input.durationDays))
      errors.push(`durationDays must be one of ${allowedDurations.join(', ')}`);
    else out.durationDays = input.durationDays;
  }

  return { valid: errors.length === 0, errors, value: out };
}

export function validateRenderInput(input = {}) {
  const errors = [];
  const out = { ...input };

  // settings
  const s = input.settings || {};
  if (!isNumber(s.width) || s.width < 256 || s.width > 3840)
    errors.push('settings.width must be 256..3840');
  if (!isNumber(s.height) || s.height < 256 || s.height > 3840)
    errors.push('settings.height must be 256..3840');
  if (!isNumber(s.fps) || s.fps < 1 || s.fps > 60)
    errors.push('settings.fps must be 1..60');
  if (!isNumber(s.duration) || s.duration <= 0 || s.duration > 1200)
    errors.push('settings.duration must be >0 and <=1200 seconds');
  if (s.backgroundColor && !isString(s.backgroundColor))
    errors.push('settings.backgroundColor must be a string');

  // exportSettings
  const e = input.exportSettings || {};
  const allowedFormats = ['mp4', 'webm', 'mov'];
  const allowedCodecs = ['h264', 'vp9', 'h265'];
  const allowedAudio = ['aac', 'opus'];
  if (!isString(e.format) || !allowedFormats.includes(e.format))
    errors.push(`exportSettings.format must be one of ${allowedFormats.join(', ')}`);
  if (e.codec && (!isString(e.codec) || !allowedCodecs.includes(e.codec)))
    errors.push(`exportSettings.codec must be one of ${allowedCodecs.join(', ')}`);
  if (e.audioCodec && (!isString(e.audioCodec) || !allowedAudio.includes(e.audioCodec)))
    errors.push(`exportSettings.audioCodec must be one of ${allowedAudio.join(', ')}`);
  if (e.transparentBackground !== undefined && !isBoolean(e.transparentBackground))
    errors.push('exportSettings.transparentBackground must be boolean');

  // timeline sanity (optional)
  if (Array.isArray(input.timeline)) {
    if (input.timeline.length > 500)
      errors.push('timeline too large (max 500 items)');
  }

  return { valid: errors.length === 0, errors };
}
