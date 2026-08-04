import Image from "next/image";

type CrestProps = {
  className?: string;
  priority?: boolean;
};

export function Crest({ className, priority = false }: CrestProps) {
  return (
    <Image
      suppressHydrationWarning
      className={className}
      src="/brand/marginalia-crest-master.png"
      alt="Marginalia crest: an ouroboros encircling a book, quill, candle, and the words For All the Readers"
      width={1254}
      height={1254}
      priority={priority}
      sizes="(max-width: 700px) 72vw, 430px"
    />
  );
}
