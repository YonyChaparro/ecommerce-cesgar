import { MercadoPagoConfig, Payment, Preference } from "mercadopago";

if (!process.env.MP_ACCESS_TOKEN) {
  throw new Error("MP_ACCESS_TOKEN is not defined");
}

export const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
  options: { timeout: 5000 },
});

export const preference = new Preference(mpClient);
export const payment = new Payment(mpClient);
