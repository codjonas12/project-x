"use server"

import { z } from "zod"

const phoneSchema = z.object({
  phone: z.string().min(10, "Telefone deve ter pelo menos 10 dígitos"),
})

type ApiResponse = {
  success: boolean
  code?: string
  error?: string
  instanceId?: string
  instanceToken?: string
}

type StatusResponse = {
  success: boolean
  connected: boolean
  smartphoneConnected: boolean
  error?: string
  message?: string
  instanceId?: string
  instanceToken?: string
}

const API_BASE = "https://api-teste-003.up.railway.app"

async function getInstanciaAtual() {
  const res = await fetch(`${API_BASE}/api/instancia2`)
  return res.json() // { id, token }
}

async function avancarInstancia() {
  const res = await fetch(`${API_BASE}/api/instancia/next2`, {
    method: "POST",
    headers: { "Content-Type": "application/json" }
  })
  return res.json()
}

export async function getWhatsAppCode(formData: FormData): Promise<ApiResponse> {
  try {
    const phone = formData.get("phone") as string
    const result = phoneSchema.safeParse({ phone })

    if (!result.success) {
      return {
        success: false,
        error: "Número de telefone inválido. Digite pelo menos 10 dígitos incluindo o DDD.",
      }
    }

    const cleanPhone = phone.replace(/\D/g, "")
    const formattedPhone = `55${cleanPhone}`

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
    const clientToken = process.env.NEXT_PUBLIC_CLIENT_TOKEN

    const instancia = await getInstanciaAtual()
    const instanceId = instancia.id
    const instanceToken = instancia.token

    if (!instanceId || !instanceToken || !clientToken) {
      return {
        success: false,
        error: "Configuração da API incompleta",
      }
    }

    const apiUrl = `${baseUrl}/instances/${instanceId}/token/${instanceToken}/phone-code/${formattedPhone}`

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Client-Token": clientToken,
      },
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error(`Erro na API: ${response.status}`)
    }

    const data = await response.json()
    console.log("Resposta da API:", data)

    if (data?.code) {
      const result: ApiResponse = {
        success: true,
        code: data.code,
        instanceId,
        instanceToken,
      }

      await avancarInstancia()

      return result
    }

    return {
      success: false,
      error: "Código não encontrado na resposta da API",
    }
  } catch (error) {
    console.error("Erro ao obter código:", error)
    return {
      success: false,
      error: "Erro ao processar a solicitação do código",
    }
  }
}

export async function checkInstanceStatus(
  customInstanceId?: string,
  customInstanceToken?: string
): Promise<StatusResponse> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
    const clientToken = process.env.NEXT_PUBLIC_CLIENT_TOKEN

    const instancia = customInstanceId && customInstanceToken
      ? { id: customInstanceId, token: customInstanceToken }
      : await getInstanciaAtual()

    const instanceId = instancia.id
    const instanceToken = instancia.token

    if (!instanceId || !instanceToken || !clientToken) {
      return {
        success: false,
        connected: false,
        smartphoneConnected: false,
        error: "Configuração da API incompleta",
      }
    }

    console.log("🔍 Verificando status da instância:", { instanceId, instanceToken })

    const apiUrl = `${baseUrl}/instances/${instanceId}/token/${instanceToken}/status`

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Client-Token": clientToken,
      },
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error(`Erro na API de status: ${response.status}`)
    }

    const data = await response.json()

    if (data && typeof data.connected === "boolean") {
      if (data.connected) {
        console.log(`✅ WhatsApp CONECTADO na instância ${instanceId}`)
      }

      return {
        success: true,
        connected: data.connected,
        smartphoneConnected: data.smartphoneConnected || false,
        error: data.error,
        message: data.connected ? "WhatsApp conectado" : "WhatsApp não conectado",
        instanceId,
        instanceToken,
      }
    } else {
      return {
        success: false,
        connected: false,
        smartphoneConnected: false,
        error: "Resposta de status inválida",
      }
    }
  } catch (error) {
    console.error("❌ Erro ao verificar status:", error)
    return {
      success: false,
      connected: false,
      smartphoneConnected: false,
      error: "Erro ao verificar o status da instância",
    }
  }
}
