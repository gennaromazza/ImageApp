// Stripe configuration
export const STRIPE_CONFIG = {
  publicKey: 'pk_live_51Qo6lpEmdMXC4yluG1kEWRlI79iJBTLKT2FIaDaS6pvtvZQQwbSV3Hqkl2MJMbof54xTrX2YcFGJGenZ2SKcZulb00YJezCflH',
  plans: {
    monthly: {
      name: 'Piano Mensile',
      price: 10, // Aggiornato a €10
      features: [
        'Prenotazioni illimitate',
        'Dashboard personalizzata', 
        'Statistiche avanzate',
        'Supporto prioritario'
      ]
    },
    yearly: {
      name: 'Piano Annuale', 
      price: 100, // Aggiornato a €100
      features: [
        'Prenotazioni illimitate',
        'Dashboard personalizzata',
        'Statistiche avanzate', 
        'Supporto prioritario',
        '2 mesi gratuiti'
      ]
    }
  }
};