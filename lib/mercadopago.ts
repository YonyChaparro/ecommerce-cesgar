import { MercadoPagoConfig, Payment, Preference } from "mercadopago";

function buildClient(): MercadoPagoConfig {
  if (!process.env.MP_ACCESS_TOKEN) {
    throw new Error("MP_ACCESS_TOKEN is not defined");
  }
  return new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN,
    options: { timeout: 10000 },
  });
}

export function getPreference(): Preference {
  return new Preference(buildClient());
}

export function getPayment(): Payment {
  return new Payment(buildClient());
}
