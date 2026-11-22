import type { Langue } from "./api";

const textes = {
  fr: {
    titre: "Assistant EIDIA",
    sousTitre: "Posez vos questions sur l'EIDIA : formations, admission, frais, vie étudiante…",
    placeholder: "Écrivez votre question…",
    envoyer: "Envoyer",
    nouvelle: "Nouvelle conversation",
    suggestions: "Questions fréquentes",
    sources: "Sources officielles",
    orientation: "Contacter",
    aConfirmer: "Information à confirmer auprès du service concerné.",
    validite: "Valable pour",
    reflexion: "L'assistant rédige sa réponse…",
    erreur: "La réponse n'a pas pu être obtenue.",
    reessayer: "Réessayer",
    avertissement:
      "Réponses générées par IA à partir des informations publiées par l'UEMF. Vérifiez les informations importantes. Ne saisissez pas de données personnelles.",
  },
  en: {
    titre: "EIDIA Assistant",
    sousTitre: "Ask about EIDIA: programs, admission, fees, student life…",
    placeholder: "Type your question…",
    envoyer: "Send",
    nouvelle: "New conversation",
    suggestions: "Frequent questions",
    sources: "Official sources",
    orientation: "Contact",
    aConfirmer: "Please confirm this information with the relevant office.",
    validite: "Valid for",
    reflexion: "The assistant is writing…",
    erreur: "The answer could not be retrieved.",
    reessayer: "Retry",
    avertissement:
      "AI-generated answers based on information published by UEMF. Check important information. Do not enter personal data.",
  },
  ar: {
    titre: "مساعد EIDIA",
    sousTitre: "اطرح أسئلتك حول EIDIA: التكوينات، القبول، الرسوم، الحياة الطلابية…",
    placeholder: "اكتب سؤالك…",
    envoyer: "إرسال",
    nouvelle: "محادثة جديدة",
    suggestions: "أسئلة متكررة",
    sources: "المصادر الرسمية",
    orientation: "التواصل",
    aConfirmer: "يرجى تأكيد هذه المعلومة لدى المصلحة المعنية.",
    validite: "صالحة لسنة",
    reflexion: "المساعد يكتب الجواب…",
    erreur: "تعذر الحصول على الجواب.",
    reessayer: "إعادة المحاولة",
    avertissement:
      "أجوبة مولدة بالذكاء الاصطناعي اعتمادا على المعلومات المنشورة من طرف الجامعة. تحقق من المعلومات المهمة. لا تدخل معطيات شخصية.",
  },
} satisfies Record<Langue, Record<string, string>>;

export type CleTexte = keyof (typeof textes)["fr"];

export function t(langue: Langue, cle: CleTexte): string {
  return textes[langue][cle];
}

export const LANGUES: { code: Langue; libelle: string }[] = [
  { code: "fr", libelle: "FR" },
  { code: "en", libelle: "EN" },
  { code: "ar", libelle: "العربية" },
];
