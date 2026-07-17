export function normalizeTryOutContentHtml(html: string): string {
    return html.replace(/(<img\b[^>]*>)\s+/gi, '$1');
}
