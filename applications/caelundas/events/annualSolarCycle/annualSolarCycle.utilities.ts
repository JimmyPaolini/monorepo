// #region 📏 Annual Solar Cycle

export function isVernalEquinox(args: {
  currentLongitude: number;
  previousLongitude: number;
}) {
  const { currentLongitude, previousLongitude } = args;
  return currentLongitude < 180 && previousLongitude > 180;
}

export function isFirstHexadecan(args: {
  currentLongitude: number;
  previousLongitude: number;
}) {
  const { currentLongitude, previousLongitude } = args;
  return currentLongitude >= 22.5 && previousLongitude < 22.5;
}

export function isBeltane(args: {
  currentLongitude: number;
  previousLongitude: number;
}) {
  const { currentLongitude, previousLongitude } = args;
  return currentLongitude >= 45 && previousLongitude < 45;
}

export function isThirdHexadecan(args: {
  currentLongitude: number;
  previousLongitude: number;
}) {
  const { currentLongitude, previousLongitude } = args;
  return currentLongitude >= 67.5 && previousLongitude < 67.5;
}

export function isSummerSolstice(args: {
  currentLongitude: number;
  previousLongitude: number;
}) {
  const { currentLongitude, previousLongitude } = args;
  return currentLongitude >= 90 && previousLongitude < 90;
}

export function isFifthHexadecan(args: {
  currentLongitude: number;
  previousLongitude: number;
}) {
  const { currentLongitude, previousLongitude } = args;
  return currentLongitude >= 112.5 && previousLongitude < 112.5;
}

export function isLammas(args: {
  currentLongitude: number;
  previousLongitude: number;
}) {
  const { currentLongitude, previousLongitude } = args;
  return currentLongitude >= 135 && previousLongitude < 135;
}

export function isSeventhHexadecan(args: {
  currentLongitude: number;
  previousLongitude: number;
}) {
  const { currentLongitude, previousLongitude } = args;
  return currentLongitude >= 157.5 && previousLongitude < 157.5;
}

export function isAutumnalEquinox(args: {
  currentLongitude: number;
  previousLongitude: number;
}) {
  const { currentLongitude, previousLongitude } = args;
  return currentLongitude >= 180 && previousLongitude < 180;
}

export function isNinthHexadecan(args: {
  currentLongitude: number;
  previousLongitude: number;
}) {
  const { currentLongitude, previousLongitude } = args;
  return currentLongitude >= 202.5 && previousLongitude < 202.5;
}

export function isSamhain(args: {
  currentLongitude: number;
  previousLongitude: number;
}) {
  const { currentLongitude, previousLongitude } = args;
  return currentLongitude >= 225 && previousLongitude < 225;
}

export function isEleventhHexadecan(args: {
  currentLongitude: number;
  previousLongitude: number;
}) {
  const { currentLongitude, previousLongitude } = args;
  return currentLongitude >= 247.5 && previousLongitude < 247.5;
}

export function isWinterSolstice(args: {
  currentLongitude: number;
  previousLongitude: number;
}) {
  const { currentLongitude, previousLongitude } = args;
  return currentLongitude >= 270 && previousLongitude < 270;
}

export function isThirteenthHexadecan(args: {
  currentLongitude: number;
  previousLongitude: number;
}) {
  const { currentLongitude, previousLongitude } = args;
  return currentLongitude >= 292.5 && previousLongitude < 292.5;
}

export function isImbolc(args: {
  currentLongitude: number;
  previousLongitude: number;
}) {
  const { currentLongitude, previousLongitude } = args;
  return currentLongitude >= 315 && previousLongitude < 315;
}

export function isFifteenthHexadecan(args: {
  currentLongitude: number;
  previousLongitude: number;
}) {
  const { currentLongitude, previousLongitude } = args;
  return currentLongitude >= 337.5 && previousLongitude < 337.5;
}
