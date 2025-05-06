# Preencher Excel Licenças

![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)

Este é um script de usuário (userscript) desenvolvido para o Tampermonkey, projetado para facilitar o preenchimento de planilhas do Excel a partir de tickets no Octadesk. Ele extrai informações como Razão Social, CNPJ/CPF e Número do Banco de Dados de um texto selecionado, solicita entrada manual para a coluna A e formata os dados para colagem em colunas específicas do Excel.

## Funcionalidades

- **Extração Automática:** Extrai dados (Razão Social, CNPJ/CPF, Número do Banco) de tickets selecionados no Octadesk.
- **Entrada Manual:** Permite ao usuário inserir o texto da coluna A via modal.
- **Cópia em Etapas:** Copia os dados em duas etapas (colunas B-E e H) para evitar sobrescrever colunas protegidas.
- **Hotkey:** Ativado com Ctrl+Q.
- **Interface Visual:** Usa modais estilizados com feedback visual e suporte à tecla Enter.
- **Versionamento:** Armazena a versão atual no localStorage para rastreamento de atualizações.

## Pré-requisitos

- **Navegador:** Chrome, Firefox ou outro compatível com extensões.
- **Tampermonkey:** Extensão instalada (disponível na Chrome Web Store ou Firefox Add-ons).
- **Acesso ao Octadesk:** Permissão para acessar tickets em https://app.octadesk.com.

## Instalação

- Instale a extensão Tampermonkey no seu navegador.
- Clique em "Criar um novo script" no Tampermonkey.
- Copie e cole o conteúdo do arquivo octadesk_hotkey.js neste repositório.
- Salve o script (Ctrl+S ou File > Save).
- Recarregue a página do Octadesk (https://app.octadesk.com/ticket/edit/*).

## Uso

- Abra uma página de ticket no Octadesk (ex.: https://app.octadesk.com/ticket/edit/195881).
- Selecione o texto do ticket que contém as informações (Razão Social, CNPJ/CPF, Número do Banco de Dados).
- Pressione Ctrl+Q para iniciar o script.
- Um modal aparecerá pedindo o texto da coluna A. Digite o valor e pressione Enter ou clique em "Próximo".
- O script copiará os dados para as colunas B, C, D e E. Cole-os no Excel.
- Clique em "Próximo" (ou pressione Enter) para copiar o texto formatado da coluna H e cole-o no Excel.
- Clique em "Finalizar" para encerrar o processo.

## Estrutura do Script

- Versão Atual: 0.24 (ver changelog no código).
- Dependências: Nenhuma (usa apenas APIs nativas do navegador).
- LocalStorage: Utilizado para armazenar temporariamente o texto formatado e a versão do script.

## Contribuições

Sinta-se à vontade para abrir issues ou pull requests neste repositório.

## Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo [LICENSE](LICENSE) para mais detalhes.
