const MAX_INPUT_BYTES = 8 * 1024 * 1024;
const MAX_EDGE = 1600;

function readAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("The photograph could not be read."));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(blob);
  });
}

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onerror = () => reject(new Error("The selected file is not a readable photograph."));
    image.onload = () => resolve(image);
    image.src = source;
  });
}

export async function prepareBookPhoto(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Choose a JPEG, PNG, or WebP photograph.");
  if (file.size > MAX_INPUT_BYTES) throw new Error("Choose a photograph smaller than 8 MB.");

  const original = await readAsDataUrl(file);
  const image = await loadImage(original);
  const scale = Math.min(1, MAX_EDGE / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("This browser cannot prepare the photograph.");
  context.drawImage(image, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.82));
  if (!blob) throw new Error("The photograph could not be prepared.");
  return readAsDataUrl(blob);
}
