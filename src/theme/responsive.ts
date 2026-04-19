export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const scaleByWidth = (width: number, baseSize: number, minScale = 0.88, maxScale = 1.14) => {
  const rawScale = width / 390;
  const scale = clamp(rawScale, minScale, maxScale);
  return Math.round(baseSize * scale);
};
