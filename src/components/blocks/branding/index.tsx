import { Section as SectionType } from "@/types/blocks/section";
import Image from "next/image";

export default function Branding({ section }: { section: SectionType }) {
  if (section.disabled) {
    return null;
  }

  return (
    <section id={section.name} className="py-16">
      <div className="container flex flex-row items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <h2 className="text-center: text-muted-foreground lg:text-left">
            {section.title}
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-8 mt-4">
            {section.items?.map((item, idx) => {
              if (item.image && item.image.src) {
                return (
                  <Image
                    key={idx}
                    src={item.image.src}
                    alt={item.image.alt || item.title || 'Brand logo'}
                    width={120}
                    height={28}
                    className="h-7 w-auto dark:invert"
                    loading="lazy"
                  />
                );
              }
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
