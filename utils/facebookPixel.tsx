import React from 'react';

interface UserData {
  client_ip_address: string;
  client_user_agent: string;
  [key: string]: any;
}

interface CustomData {
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_term: string;
  utm_content: string;
  [key: string]: any;
}

interface SendEventProps {
  userData: UserData;
  customData: CustomData;
}

export const sendFacebookPixelEvent = async ({
  userData,
  customData,
}: SendEventProps) => {
  const accessToken = 'EAATeRJivstQBOwGkUHfr2atvNF9YZCPIP7QSBKSHNZAiX6XJ4UEuyahdRTZBkHv9D636TBfZC2r8PpNUDr62r4SQrxoOzrxUyU85CFEH18DqBPCiWH2J25RmNmJNM89x6QFIaOeMEExMyojtDxW81zewVgqWNAg88bQZCHL4Lh2qZCkrxDcqPLPyUCxqSWGlMqlAZDZD';
  
  const pixelId = '531107683406345';

  const url = 'https://graph.facebook.com/v19.0/${pixelId}/events';

  const payload = {
    data: [
      {
        event_name: 'CompleteRegistration',
        event_time: Math.floor(Date.now() / 1000),
        action_source: 'website',
        user_data: userData,
        custom_data: customData,
      },
    ],
    access_token: accessToken,
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Evento enviado com sucesso:', data);
    } else {
      const errorText = await response.text();
      console.error('❌ Erro:', response.status, errorText);
    }
  } catch (error) {
    console.error('❌ Erro ao enviar o evento:', error);
  }
};