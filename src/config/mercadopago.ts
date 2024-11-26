export const mercadopagoConfig = {
    publicKey: import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY || '',
    accessToken: import.meta.env.VITE_MERCADOPAGO_ACCESS_TOKEN || '',
    isTestEnvironment: true // mudar para false em produção
};
