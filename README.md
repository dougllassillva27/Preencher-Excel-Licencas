# Automação de Tarefas no Octadesk

![Licença](https://img.shields.io/badge/license-MIT-blue.svg)

Este é um script de usuário (userscript) para **Tampermonkey**, projetado para automatizar e agilizar tarefas repetitivas dentro da plataforma de tickets **Octadesk**. O script adiciona múltiplos atalhos de teclado que executam fluxos de trabalho para preenchimento de planilhas, geração de textos padronizados e consulta de dados em APIs externas.

## 🚀 Funcionalidades Principais

- **Extração Automática de Dados:** Captura informações como Razão Social, CNPJ/CPF e Número do Banco de Dados diretamente do corpo do ticket, sem necessidade de seleção manual de texto.
- **Múltiplos Fluxos de Trabalho via Atalhos:**

  - `Ctrl + Q`: Inicia o fluxo completo para preenchimento de planilhas de **licenças**.
  - `Ctrl + Shift + Q`: Gera e copia texto padronizado para solicitações de **troca**.
  - `Ctrl + Shift + C`: Gera e copia texto padronizado para solicitações de **cancelamento**.
  - `Ctrl + Shift + S`: Inicia o fluxo de **consulta de CNPJ** em uma API externa.
  - `Ctrl + Shift + F`: Realiza **consulta de banco de dados** com interface tabular profissional.

- **Consulta de CNPJ:** Integra-se a uma API para buscar a Razão Social de uma empresa a partir do seu CNPJ, copiando o resultado automaticamente.
- **Consulta Avançada de Banco de Dados:** Permite pesquisar números de bancos em planilhas Excel remotas, exibindo resultados em formato tabular com informações completas dos registros encontrados.
- **Cópia Inteligente em Etapas:** Para o fluxo de licenças, a cópia dos dados para a planilha é feita em duas partes, facilitando o preenchimento sem sobresscrever colunas incorretas.
- **Interface de Usuário Integrada:** Utiliza modais personalizados e estilizados para interação com o usuário, incluindo tabelas profissionais para visualização de resultados de consultas.

## 📋 Pré-requisitos

- **Navegador Moderno:** Google Chrome, Mozilla Firefox, ou outro compatível com extensões.
- **Extensão Tampermonkey:** A extensão deve estar instalada e ativa no navegador.
- **Acesso ao Octadesk:** Credenciais válidas para acessar a plataforma em `https://app.octadesk.com`.

## ⚙️ Instalação

1. Certifique-se de que a extensão **Tampermonkey** está instalada no seu navegador.
2. No painel do Tampermonkey, clique em **"Criar um novo script..."**.
3. Apague o conteúdo padrão e cole o código completo do arquivo do script mais recente.
4. Salve o script (o atalho `Ctrl + S` funciona).
5. Recarregue qualquer página de ticket do Octadesk para que o script seja ativado.

## 🖱️ Como Usar

Abra um ticket na interface do Octadesk. Os atalhos a seguir estarão disponíveis:

### Fluxo de Licença (`Ctrl + Q`)

Ideal para preencher a planilha de controle de licenças.

1. Com o ticket aberto, pressione `Ctrl + Q`.
2. O script extrairá os dados do cliente (Razão Social, CNPJ, etc.) automaticamente.
3. Um modal aparecerá solicitando o **texto da coluna A**. Digite a informação e pressione `Enter` ou clique em "Próximo".
4. Os dados formatados para as **colunas B a E** serão copiados. Cole-os na sua planilha.
5. O modal avançará. Clique em "Próximo" para copiar o texto formatado para a **coluna H**. Cole-o na planilha.
6. Clique em "Encerrar" para finalizar.

### Fluxo de Troca (`Ctrl + Shift + Q`)

1. Pressione `Ctrl + Shift + Q`.
2. Um modal solicitará o **nome da revenda**. Digite e clique em "Próximo".
3. Um texto padronizado para a solicitação de troca será copiado para a sua área de transferência.

### Fluxo de Cancelamento (`Ctrl + Shift + C`)

1. Pressione `Ctrl + Shift + C`.
2. Um modal solicitará o **nome da revenda**. Digite e clique em "Copiar".
3. Um texto padronizado para a solicitação de cancelamento será copiado.

### Fluxo de Consulta de CNPJ (`Ctrl + Shift + S`)

1. Pressione `Ctrl + Shift + S`.
2. Um modal solicitará o **CNPJ para consulta**. Digite apenas os números e clique em "Consultar".
3. O script se conectará à API. Se o CNPJ for encontrado, a **Razão Social correspondente será copiada** para a sua área de transferência.

### 🆕 Fluxo de Consulta de Banco de Dados (`Ctrl + Shift + F`)

**Funcionalidade mais recente!** Permite consultar números de banco em planilhas Excel remotas com interface tabular profissional.

1. Pressione `Ctrl + Shift + F`.
2. Um modal solicitará o **número do banco** para consulta. Digite apenas números e clique em "Consultar".
3. O script se conectará ao sistema de planilhas e analisará milhares de registros.
4. **Se encontrado:** Uma tabela profissional será exibida com:
   - **Informações detalhadas** de cada registro encontrado
   - **Colunas organizadas:** Linha, Revenda, Cliente, Documento, Data (formato brasileiro), Banco, Nº Licença, Tipo, Ticket
   - **Visual similar ao Excel** com cores alternadas e hover effects
   - **Estatísticas da consulta:** Total de linhas analisadas, registros válidos, etc.
5. **Se não encontrado:** Será exibida uma mensagem informativa com estatísticas da busca.

#### Características da Consulta de Banco:

- **Performance otimizada:** Análise de mais de 13.000 registros em poucos segundos
- **Cache inteligente:** Utiliza sistema de cache para consultas rápidas
- **Formato de data brasileiro:** Exibe datas no formato DD/MM/AAAA
- **Interface responsiva:** Adaptável a diferentes tamanhos de tela
- **Dados em tempo real:** Sincronizado com planilhas Excel remotas

## ⚙️ Configuração de APIs

### API de CNPJ

A funcionalidade de consulta de CNPJ (`Ctrl + Shift + S`) depende de uma conexão com uma API externa. As informações para essa conexão estão definidas diretamente no código-fonte do script.

### API de Consulta de Banco

A nova funcionalidade de consulta de banco (`Ctrl + Shift + F`) se conecta a um sistema próprio de processamento de planilhas Excel. A URL do endpoint está configurada na constante `URL_CONSULTA_BANCO` no código do script.

Caso os endereços das APIs ou credenciais mudem, será necessário editar o arquivo do script diretamente no Tampermonkey e atualizar as variáveis correspondentes.

## 🧩 Estrutura do Script

- **Versão Atual:** 0.58 (com Modal Tabular)
- **Dependências:** O script utiliza a função `GM_xmlhttpRequest` fornecida pela API do Tampermonkey para realizar requisições a APIs externas.
- **LocalStorage:** Usado para armazenar temporariamente dados entre as etapas do fluxo de licença.
- **Renderização Avançada:** Sistema de modais customizados com suporte a tabelas HTML e CSS avançado.

## 🎨 Interface Visual

O script oferece uma experiência visual aprimorada:

- **Modais responsivos** com design moderno
- **Tabelas profissionais** para exibição de resultados
- **Feedback visual** com cores e ícones intuitivos
- **Estatísticas detalhadas** das operações realizadas
- **Hover effects** e animações suaves

## 🤝 Contribuições

Sinta-se à vontade para abrir _issues_ com sugestões ou relatar problemas, ou enviar _pull requests_ com melhorias.

## 📜 Licença

Este projeto está licenciado sob a Licença MIT. Veja o arquivo `LICENSE` para mais detalhes.
