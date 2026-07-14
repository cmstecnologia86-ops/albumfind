import { stickerImageManifest } from "@/data/sticker-image-manifest";

const unavailableStickerImages: Record<string, number[]> = {
  CIV: [19],
};

for (const [teamCode, unavailableNumbers] of Object.entries(
  unavailableStickerImages,
)) {
  const availableNumbers = stickerImageManifest[teamCode];

  if (!availableNumbers) {
    continue;
  }

  stickerImageManifest[teamCode] = availableNumbers.filter(
    (number) => !unavailableNumbers.includes(number),
  );
}
