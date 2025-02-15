import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, name, bookingDate, bookingTime, ticketNumber } = await req.json()

    // Invia email usando il servizio email di Supabase
    const emailResponse = await fetch('https://api.supabase.com/v1/mail/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
      },
      body: JSON.stringify({
        to,
        subject: 'Conferma della prenotazione',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #D22B2B; text-align: center;">Conferma della prenotazione</h1>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p>Gentile ${name},</p>
              <p>La tua prenotazione è stata confermata con successo!</p>
              
              <div style="margin: 20px 0; padding: 15px; background-color: #fff; border-radius: 4px;">
                <p><strong>Data:</strong> ${bookingDate}</p>
                <p><strong>Orario:</strong> ${bookingTime}</p>
                <p><strong>Numero Ticket:</strong> ${ticketNumber}</p>
              </div>
              
              <p>Indirizzo: Via Quinto Orazio Flacco 5, Aversa</p>
              
              <p style="margin-top: 20px;">
                Ti aspettiamo per il tuo servizio fotografico!
              </p>
            </div>
            
            <div style="text-align: center; color: #666; font-size: 12px; margin-top: 20px;">
              <p>Carnevale Cinematografico</p>
            </div>
          </div>
        `,
      }),
    })

    const result = await emailResponse.json()
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})