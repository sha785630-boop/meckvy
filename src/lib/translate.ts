import type { LanguageCode } from "./types";

const MYMEMORY_LANG: Record<LanguageCode, string> = {
  en: "en",
  dv: "dv",
  zh: "zh-CN",
  ru: "ru",
  de: "de",
  it: "it",
  fr: "fr",
  ar: "ar",
  hi: "hi",
};

/** Offline fallback phrases for demo when network translation is unavailable */
const FALLBACK_PHRASES: Partial<
  Record<LanguageCode, Record<string, string>>
> = {
  zh: {
    hello: "您好",
    thank_you: "谢谢您的咨询。",
    availability:
      "是的，我们有空房。早餐已包含。请提供客人姓名和航班信息以便确认。",
  },
  de: {
    hello: "Guten Tag",
    thank_you: "Vielen Dank für Ihre Anfrage.",
    availability:
      "Ja, wir haben Verfügbarkeit. Frühstück ist inklusive. Bitte senden Sie Gästenamen und Flugdaten zur Bestätigung.",
  },
  ru: {
    hello: "Здравствуйте",
    thank_you: "Спасибо за ваш запрос.",
    availability:
      "Да, у нас есть свободные номера. Завтрак включён. Пожалуйста, пришлите имена гостей и данные рейса для подтверждения.",
  },
  it: {
    hello: "Buongiorno",
    thank_you: "Grazie per la sua richiesta.",
    availability:
      "Sì, abbiamo disponibilità. La colazione è inclusa. Per confermare, ci invii i nomi degli ospiti e i dettagli del volo.",
  },
  fr: {
    hello: "Bonjour",
    thank_you: "Merci pour votre demande.",
    availability:
      "Oui, nous avons de la disponibilité. Le petit-déjeuner est inclus. Merci d'envoyer les noms des voyageurs et les détails du vol.",
  },
  ar: {
    hello: "مرحباً",
    thank_you: "شكراً لاستفساركم.",
    availability:
      "نعم، لدينا غرف متاحة. الإفطار مشمول. يرجى إرسال أسماء الضيوف وتفاصيل الرحلة للتأكيد.",
  },
  hi: {
    hello: "नमस्ते",
    thank_you: "आपकी पूछताछ के लिए धन्यवाद।",
    availability:
      "हाँ, हमारे पास उपलब्धता है। नाश्ता शामिल है। पुष्टि के लिए कृपया मेहमानों के नाम और उड़ान विवरण भेजें।",
  },
  dv: {
    hello: "އައްސަލާމް ޢަލައިކުމް",
    thank_you: "ތިޔަބޭފުޅުންގެ ސުވާލަށް ޝުކުރިއްޔާ.",
    availability:
      "އާދަޔާ އެކު ރޫމް ލިބޭނެ. ބްރެކްފާސްޓް ހިމެނޭ. ކޮންފަރމް ކުރުމަށް މެހުމުންގެ ނަންތައް އަދި ފުލައިޓް ތަފްސީލް ފޮނުވާ.",
  },
};

export async function translateText(
  text: string,
  from: LanguageCode,
  to: LanguageCode,
): Promise<{ translated: string; provider: string }> {
  if (!text.trim() || from === to) {
    return { translated: text, provider: "none" };
  }

  try {
    const langpair = `${MYMEMORY_LANG[from]}|${MYMEMORY_LANG[to]}`;
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.slice(0, 450))}&langpair=${langpair}`;
    const res = await fetch(url, { next: { revalidate: 0 } });
    if (res.ok) {
      const data = (await res.json()) as {
        responseData?: { translatedText?: string };
        responseStatus?: number;
      };
      const translated = data.responseData?.translatedText;
      if (translated && data.responseStatus === 200) {
        return { translated, provider: "mymemory" };
      }
    }
  } catch {
    // fall through to offline fallback
  }

  const pack = FALLBACK_PHRASES[to];
  if (pack) {
    return {
      translated: `${pack.hello}\n\n${pack.thank_you}\n\n${pack.availability}\n\n---\n(Original draft)\n${text}`,
      provider: "offline-fallback",
    };
  }

  return { translated: text, provider: "passthrough" };
}

export function fillTemplate(
  body: string,
  values: Record<string, string>,
): string {
  return body.replace(/\{\{(\w+)\}\}/g, (_, key: string) => values[key] ?? `{{${key}}}`);
}
