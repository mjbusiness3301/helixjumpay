export type CountryCode = "BR" | "PT";

export function detectCountry(phone: string): CountryCode {
  const digits = (phone || "").replace(/\D/g, "");
  return /^351\d{9}$/.test(digits) ? "PT" : "BR";
}

export function formatCurrency(value: number, country: CountryCode = "BR"): string {
  if (country === "PT") {
    return "€ " + value.toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return "R$ " + value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatCurrencyCents(cents: number, country: CountryCode = "BR"): string {
  return formatCurrency(cents / 100, country);
}

export function currencySymbol(country: CountryCode = "BR"): string {
  return country === "PT" ? "€" : "R$";
}

export function currencyLabel(country: CountryCode = "BR"): string {
  return country === "PT" ? "EUR" : "BRL";
}

export function localeCode(country: CountryCode = "BR"): string {
  return country === "PT" ? "pt-PT" : "pt-BR";
}
