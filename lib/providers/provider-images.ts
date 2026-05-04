const DEFAULT_PROVIDER_IMAGES = [
  "/providers/dr-sarah-mensah.svg",
  "/providers/dr-brian-okello.svg",
  "/providers/dr-anita-phiri.svg",
  "/providers/dr-james-ncube.svg",
  "/providers/dr-lucia-tembo.svg",
  "/providers/dr-peter-sitali.svg",
];

function hashSeed(seed: string) {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }
  return hash;
}

export function getProviderFallbackImage(seed: string) {
  if (!seed) {
    return DEFAULT_PROVIDER_IMAGES[0];
  }

  return DEFAULT_PROVIDER_IMAGES[hashSeed(seed) % DEFAULT_PROVIDER_IMAGES.length];
}

