export type Channel = "whatsapp" | "email";

export type LanguageCode =
  | "en"
  | "dv"
  | "zh"
  | "ru"
  | "de"
  | "it"
  | "fr"
  | "ar"
  | "hi";

export type MessageStatus = "unread" | "read" | "replied" | "automated";

export interface GuestMessage {
  id: string;
  channel: Channel;
  guestName: string;
  guestContact: string;
  subject?: string;
  body: string;
  detectedLanguage: LanguageCode;
  translatedPreview?: string;
  status: MessageStatus;
  receivedAt: string;
  threadId: string;
}

export interface Template {
  id: string;
  name: string;
  category: "booking" | "checkin" | "transfer" | "faq" | "checkout";
  channels: Channel[];
  body: string;
  variables: string[];
}

export interface Automation {
  id: string;
  name: string;
  enabled: boolean;
  trigger: string;
  action: string;
  channels: Channel[];
  translateToGuestLanguage: boolean;
  templateId: string;
}

export interface OutboundDraft {
  threadId: string;
  channel: Channel;
  to: string;
  subject?: string;
  body: string;
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode;
}
