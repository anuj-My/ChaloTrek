import Image from "next/image";

// Cover photo large, the rest in a strip that scrolls sideways on phones.
export function TrekGallery({ name, photos }: { name: string; photos: string[] }) {
  if (photos.length === 0) return null;
  const [cover, ...rest] = photos;

  return (
    <div className="space-y-2">
      <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-muted md:aspect-[21/9]">
        <Image src={cover} alt={name} fill preload sizes="(min-width: 1152px) 1120px, 100vw" className="object-cover" />
      </div>
      {rest.length > 0 && (
        <ul className="flex snap-x gap-2 overflow-x-auto pb-1">
          {rest.map((src, i) => (
            <li key={src} className="relative aspect-[4/3] w-40 shrink-0 snap-start overflow-hidden rounded-lg bg-muted md:w-52">
              <Image src={src} alt={`${name} photo ${i + 2}`} fill sizes="208px" className="object-cover" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
