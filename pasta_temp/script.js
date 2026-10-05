// A linha de importação do "desenho.js" foi REMOVIDA. O navegador não desenha mais nada.

const formulario = document.getElementById("formulario");
const campoNumero = document.getElementById("numero");
const area = document.getElementById("desenho");
const mensagem = document.getElementById("mensagem");
const botaoBaixar = document.getElementById("baixar");

let svgAtual = "";
// Correção de 'nulo' para 'null'
let tokenGoogle = null; 

// Captura o token do Google
window.tratarLoginGoogle = function(response) {
    tokenGoogle = response.credential; // Aqui recebemos o id_token
    console.log("Token capturado com sucesso!");
    mensagem.textContent = "Login efetuado com sucesso! Agora você pode desenhar.";
};

// Transformamos a função num 'async' para podermos usar o 'await fetch'
formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    mensagem.textContent = "";
    area.innerHTML = "";
    botaoBaixar.hidden = true;

    const numero = Number(campoNumero.value);

    // Validação básica do número
    if (!Number.isInteger(numero) || numero < 1 || numero > 100) {
        mensagem.textContent = "Digite um inteiro entre 1 e 100.";
        return;
    }

    // Impede o envio se o usuário não fez login com o Google
    if (!tokenGoogle) {
        mensagem.textContent = "Por favor, faça login com o Google para assinar o desenho.";
        return;
    }

    try {
        // Envia o número e o token à rota /api/desenho usando fetch
        const resposta = await fetch("/api/desenho", {
            method: "POST", // O método exigido pelo contrato[cite: 3]
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${tokenGoogle}` // Envio do token no cabeçalho[cite: 3]
            },
            body: JSON.stringify({ numero: numero }) // Envio do número no corpo JSON[cite: 3]
        });

        if (resposta.ok) { // Código 200
            svgAtual = await resposta.text();
            area.innerHTML = svgAtual; // Exibe o SVG recebido do servidor[cite: 3]
            botaoBaixar.hidden = false;
        } else if (resposta.status === 400 || resposta.status === 401) {
            // Tratamento obrigatório para erros 400 e 401[cite: 3]
            mensagem.textContent = `Erro ${resposta.status}: Requisição inválida ou token não autorizado.`;
        } else {
            mensagem.textContent = `Erro no servidor: Código ${resposta.status}`;
        }
    } catch (erro) {
        mensagem.textContent = "Erro de comunicação com o servidor.";
    }
});

botaoBaixar.addEventListener("click", () => {
    const arquivo = new Blob([svgAtual], { type: "image/svg+xml" });
    const url = URL.createObjectURL(arquivo);
    const link = document.createElement("a");
    link.href = url;
    link.download = "exemplo.svg";
    link.click();
    URL.revokeObjectURL(url);
});