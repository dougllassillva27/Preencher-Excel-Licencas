# Preencher Excel Licenças v0.52

[![Licença: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Este é um script de usuário (userscript) desenvolvido para o Tampermonkey, projetado para **automatizar o preenchimento de planilhas do Excel** a partir de tickets no Octadesk. Ele extrai informações automaticamente da interface, solicita entradas do usuário via modais e copia os dados formatados para a área de transferência em etapas.

---

## 🚀 Funcionalidades

- **Extração Automática de Dados**: Obtém o número do ticket, Razão Social, CNPJ/CPF e Número do Banco de Dados diretamente da tela do ticket do Octadesk.
- **Fluxos de Trabalho por Atalhos**:
  - `Ctrl + Q`: **Licença** - Copia dados para colunas B-E e H do Excel.
  - `Ctrl + Shift + Q`: **Troca** - Copia texto formatado para troca.
  - `Ctrl + Shift + C`: **Cancelamento** - Copia texto formatado para cancelamento.
  - `Ctrl + Shift + S`: **Consulta CNPJ** - Consulta uma API externa e copia o nome do cliente.
- **Interface Visual Intuitiva**: Utiliza modais estilizados para interação com o usuário, com suporte total ao teclado (Enter para confirmar, Esc para cancelar).
- **Cópia em Etapas**: Para o fluxo de licença, os dados são copiados em duas etapas (B-E e H) para facilitar o preenchimento sequencial da planilha.
- **Consulta de API Segura**: O fluxo de consulta de CNPJ se comunica com um endpoint externo utilizando autenticação básica. _(Credenciais não são expostas neste documento.)_
- **Versionamento Interno**: A versão do script (v0.52) é definida internamente para controle.

---

## 📋 Pré-requisitos

- **Navegador**: Google Chrome, Mozilla Firefox ou outro compatível com extensões userscript.
- **Gerenciador de Scripts**: Extensão [Tampermonkey](https://www.tampermonkey.net/) instalada.
- **Acesso ao Octadesk**: Conta com permissão para visualizar tickets em `https://app.octadesk.com`.

---

## ⚙️ Instalação

1.  Instale a extensão Tampermonkey no seu navegador.
2.  Clique no ícone do Tampermonkey e selecione "**Criar um novo script**".
3.  **Substitua todo o código padrão** pelo conteúdo completo do script v0.52.
4.  Salve o script (pressione `Ctrl + S` ou vá em `File > Save`).
5.  Recarregue qualquer página de ticket do Octadesk (ex: `https://app.octadesk.com/ticket/12345`) para ativar o script.

---

## 🖱️ Uso (Fluxo de Licença - Exemplo)

1.  Navegue até a página de um ticket no Octadesk.
2.  Pressione `Ctrl + Q`.
3.  Um modal aparecerá solicitando o "**texto da coluna A**". Digite o valor e pressione `Enter` ou clique em "**Próximo**".
4.  O script copiará automaticamente os dados para as **colunas B, C, D e E** (Razão Social, CNPJ, Data Atual, Banco). Cole-os no Excel.
5.  Um novo modal aparecerá. Clique em "**Próximo**" para copiar o texto formatado para a **coluna H**.
6.  Após colar a coluna H, clique em "**Finalizar**" para encerrar o processo.

---

## 🧩 Estrutura do Script

- **Versão Atual**: `0.52`
- **Dependências**: Nenhuma. Utiliza apenas APIs nativas do navegador e a função `GM_xmlhttpRequest` do Tampermonkey.
- **Armazenamento Temporário**: Utiliza `localStorage` apenas para armazenar temporariamente o texto da coluna H entre as etapas do fluxo de licença.

---

## 🤝 Contribuições

Sinta-se à vontade para abrir _issues_ ou _pull requests_ neste repositório para sugerir melhorias ou relatar bugs.

---

## 📜 Licença

Este projeto está licenciado sob a licença **MIT**. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.
