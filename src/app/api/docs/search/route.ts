import { source } from "@/lib/source";
import { createFromSource } from "fumadocs-core/search/server";

export const { GET } = createFromSource(source, {
  // https://docs.orama.com/open-source/supported-languages
  // Note: Chinese (zh) is not supported by Orama, using English as fallback
  // Supported multilingual search will use English tokenization for all languages
  language: "english",
});
