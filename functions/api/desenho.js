import { gerarDesenho } from "../../lib/desenho.js";

export async function onRequest(context) {
  const { request, env } = context;

  // 1. Verificação do Método (Erro 405)
  if (request.method !== "POST") {
    return new Response("Método não permitido", { status: 405 });
  }

  // 2. Verificação do Corpo (Erro 400)[cite: 3]
  let corpo;
  try {
    corpo = await request.json();
  } catch (erro) {
    return new Response("Corpo ausente ou JSON inválido", { status: 400 });
  }

  const { numero } = corpo;
  if (numero === undefined || !Number.isInteger(numero) || numero < 1 || numero > 100) {
    return new Response("Número ausente, não inteiro ou fora do intervalo de 1 a 100", { status: 400 });
  }

  // 3. Verificação do Token (Erro 401)[cite: 3]
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response("Token ausente", { status: 401 });
  }

  const token = authHeader.split(" ")[1];

  let tokenInfo;
  try {
    const respostaGoogle = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
    
    if (!respostaGoogle.ok) {
      return new Response("Token inválido ou expirado", { status: 401 });
    }
    
    tokenInfo = await respostaGoogle.json();
  } catch (erro) {
    return new Response("Erro ao validar token no Google", { status: 401 });
  }

  // Verifica se o token pertence à sua aplicação e se o email é verificado[cite: 3]
  if (tokenInfo.aud !== env.GOOGLE_CLIENT_ID || String(tokenInfo.email_verified) !== "true") {
    return new Response("Token com aud diferente ou e-mail não verificado", { status: 401 });
  }

  // 4. Sucesso (200) - Geração e devolução do Desenho[cite: 3]
  const emailAssinatura = tokenInfo.email;
  const svg = gerarDesenho(numero, emailAssinatura);

  return new Response(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml"
    }
  });
}
