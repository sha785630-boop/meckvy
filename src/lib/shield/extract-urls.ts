const URL_PATTERN =
  /(?:https?:\/\/|www\.)[^\s<>"{}|\\^`[\]]+|[a-z0-9][-a-z0-9]*\.(?:com|org|net|io|co|app|dev|info|biz|me|uk|de|fr|ru|cn|xyz|top|click|link)[^\s<>"{}|\\^`[\]]*/gi;

export function extractUrls(text: string): string[] {
  const matches = text.match(URL_PATTERN) ?? [];
  const normalized = matches.map((raw) => {
    let url = raw.replace(/[.,;:!?)]+$/, "");
    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`;
    }
    return url;
  });

  return [...new Set(normalized)];
}
