// ==UserScript==
// @name         Preencher Excel Licenças
// @namespace    http://tampermonkey.net/
// @version      0.23
// @description  Executa o bookmarklet Preencher Excel com hotkey Ctrl+Q
// @author       You
// @match        *://*.octadesk.com/*
// @grant        none
// ==/UserScript==

/* Changelog:
 * 0.1 - 2025-05-05: Versão inicial com hotkey Ctrl+Q, extração de dados e preenchimento das colunas B, C, D, E.
 * 0.2 - 2025-05-06: Adicionada captura de texto da coluna A via prompt e formatação para coluna H ("1ª [texto] solicitou ticket"). Adicionado versionamento com localStorage.
 * 0.3 - 2025-05-07: Ajustado para copiar dados em duas etapas (B-E e H) para evitar sobrescrever colunas protegidas F e G.
 * 0.4 - 2025-05-08: Copia todos os dados em uma única string com separador |, com instruções para dividir no Excel e evitar colunas protegidas.
 * 0.5 - 2025-05-09: Retornado ao fluxo de duas cópias (B-E e H) com instruções simplificadas, otimizado para minimizar esforço manual.
 * 0.6 - 2025-05-10: Alterado fluxo para duas etapas com botão "Próximo" após a primeira cópia, aguardando ação do usuário para a segunda cópia.
 * 0.7 - 2025-05-11: Corrigido problema do botão "Próximo" não aparecer; adicionados logs de depuração; garantida criação do botão no DOM.
 * 0.8 - 2025-05-12: Tentativa de substituir alertas por modal, mas parou de funcionar (Ctrl+Q não respondia).
 * 0.9 - 2025-05-13: Revertido para base funcional (0.7); adicionado modal estilizado com fundo esmaecido de forma segura.
 * 0.10 - 2025-05-14: Corrigido problema do modal interrompendo o script; adicionado fallback para alert e depuração detalhada.
 * 0.11 - 2025-05-15: Ajustado @match para ser mais abrangente; adicionado log inicial para confirmar ativação.
 * 0.12 - 2025-05-16: Corrigido problema de ativação no Tampermonkey; adicionado setTimeout para garantir injeção na página de tickets.
 * 0.13 - 2025-05-17: Substituído prompt por modal para entrada da coluna A; ajustado modal de B-E para botão "Próximo" que executa cópia da coluna H diretamente.
 * 0.14 - 2025-05-18: Corrigido botão do modal de B-E para "Próximo"; alterado botão do modal de H para "Finalizar".
 * 0.15 - 2025-05-19: Adicionado botão "Encerrar" vermelho em todos os modais; alterada cor dos botões de verde (#4CAF50) para azul (#297ee4).
 * 0.16 - 2025-05-20: Aumentado o tamanho dos modais, botões e campo de entrada; foco automático no campo de entrada ao abrir o modal inicial.
 * 0.17 - 2025-05-21: Adicionado suporte a tecla Enter para avançar nos modais; removido botão "Encerrar" do último modal.
 * 0.18 - 2025-05-22: Corrigido foco no modal sem entrada para capturar Enter; modal agora é focável com tabIndex.
 * 0.19 - 2025-05-23: Adicionado extração do número do ticket do HTML e atualização da coluna H para incluir "nº_do_ticket".
 * 0.20 - 2025-05-24: Ajustado formato da coluna H para remover "nº" antes do número do ticket.
 * 0.21 - 2025-05-25: Adicionadas feedback visual nos botões e centralização de configurações.
 * 0.22 - 2025-05-26: Corrigido problema de interação com o modal ajustando z-index e foco no campo de entrada.
 * 0.23 - 2025-05-27: Aumentado o delay do foco para 500ms e removido "Copiando..." no modal Finalizar.
 */

(function () {
  'use strict';

  // Configurações centralizadas
  const CONFIG = {
    styles: {
      modal: {
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '15px',
        boxShadow: '0 6px 12px rgba(0, 0, 0, 0.3)',
        maxWidth: '600px',
        width: '90%',
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
        zIndex: '10001', // Aumentado para garantir que o modal fique acima do overlay
      },
      overlay: {
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: '9999',
      },
      button: {
        padding: '15px 30px',
        backgroundColor: '#297ee4',
        hoverColor: '#1b5ea6',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '18px',
        transition: 'background-color 0.2s ease',
      },
      cancelButton: {
        backgroundColor: '#ff0000',
        hoverColor: '#cc0000',
      },
      nextButton: {
        backgroundColor: '#ff5733',
        zIndex: '10000',
        padding: '15px 30px',
        borderRadius: '8px',
        fontSize: '16px',
        boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
      },
      input: {
        width: '90%',
        padding: '10px',
        marginBottom: '25px',
        border: '2px solid #ccc',
        borderRadius: '8px',
        fontSize: '18px',
        zIndex: '10002', // Garante que o campo de entrada esteja acima de tudo
      },
    },
    messages: {
      selectText: 'Selecione o texto do e-mail no Octadesk. Verifique o console (F12).',
      noColunaA: 'Nenhum texto fornecido para a coluna A. Prosseguindo sem preenchimento na coluna H.',
      copyBE: 'Dados das colunas B a E copiados! Cole na célula B da linha desejada no Excel Online (Ctrl+V).',
      copyH: 'Dados da coluna H copiados! Cole na célula H da mesma linha no Excel Online (Ctrl+V).',
      copyErrorBE: 'Erro ao copiar os dados das colunas B a E: ',
      copyErrorH: 'Erro ao copiar os dados da coluna H: ',
      noTextH: 'Erro: Nenhum texto disponível para copiar para a coluna H. Tente executar o script novamente (Ctrl+Q).',
      copying: 'Copiando...',
    },
  };

  // Força a execução após 500ms para garantir que a página esteja pronta
  setTimeout(function () {
    console.log('Script Preencher Excel Licenças ativado na URL:', window.location.href);

    // Controle de versão
    const SCRIPT_VERSION = '0.23';
    const storedVersion = localStorage.getItem('octadesk_script_version');
    if (storedVersion !== SCRIPT_VERSION) {
      showMessage(`Script atualizado para a versão ${SCRIPT_VERSION}!\nConsulte o changelog no código para ver as mudanças.`, false);
      localStorage.setItem('octadesk_script_version', SCRIPT_VERSION);
    }

    let nextButton = null;
    let modalOverlay = null;
    let modal = null;

    // Função para cancelar o processo
    function cancelProcess() {
      console.log('Processo cancelado pelo usuário.');
      localStorage.removeItem('octadesk_text_formatado'); // Limpa dados residuais
      hideModal();
    }

    // Função para extrair o número do ticket do HTML
    function getTicketNumber() {
      const ticketElement = document.querySelector('span.label.label-md.label-default.ng-binding');
      if (ticketElement) {
        const ticketText = ticketElement.textContent.trim();
        const ticketNumber = ticketText.split('\n')[0].trim(); // Pega o número antes dos outros elementos
        return ticketNumber.match(/\d+/) ? ticketNumber.match(/\d+/)[0] : null;
      }
      return null;
    }

    // Função genérica para exibir mensagem (tenta modal, cai em alert se falhar)
    function showMessage(message, isInput = false, callback = null, buttonText = 'OK', showCancel = true) {
      try {
        console.log('Tentando exibir modal com mensagem:', message);
        // Remove qualquer modal existente
        hideModal();

        // Verifica se o document.body está disponível
        if (!document.body) {
          console.error('Erro: document.body não está disponível. Usando alert como fallback.');
          if (isInput) {
            const input = prompt(message) || '';
            if (callback) callback(input);
          } else {
            alert(message);
          }
          return;
        }

        // Cria o overlay (fundo esmaecido)
        modalOverlay = document.createElement('div');
        modalOverlay.style.position = 'fixed';
        modalOverlay.style.top = '0';
        modalOverlay.style.left = '0';
        modalOverlay.style.width = '100%';
        modalOverlay.style.height = '100%';
        Object.assign(modalOverlay.style, CONFIG.styles.overlay);
        // Impede que o overlay capture eventos de clique
        modalOverlay.style.pointerEvents = 'none';

        // Cria o modal
        modal = document.createElement('div');
        modal.style.position = 'fixed';
        modal.style.top = '50%';
        modal.style.left = '50%';
        modal.style.transform = 'translate(-50%, -50%)';
        modal.tabIndex = 0; // Torna o modal focável para capturar teclas
        Object.assign(modal.style, CONFIG.styles.modal);
        modal.style.textAlign = 'center';

        // Adiciona a mensagem
        const messageDiv = document.createElement('div');
        messageDiv.style.whiteSpace = 'pre-wrap';
        messageDiv.style.marginBottom = '30px';
        messageDiv.textContent = message;
        modal.appendChild(messageDiv);

        // Adiciona campo de entrada se for modal de input
        let inputField = null;
        if (isInput) {
          inputField = document.createElement('input');
          inputField.type = 'text';
          Object.assign(inputField.style, CONFIG.styles.input);
          modal.appendChild(inputField);
        }

        // Container para os botões
        const buttonContainer = document.createElement('div');
        buttonContainer.style.display = 'flex';
        buttonContainer.style.justifyContent = 'center';
        buttonContainer.style.gap = '15px';

        // Adiciona o botão principal com texto personalizado
        const actionButton = document.createElement('button');
        actionButton.textContent = buttonText;
        Object.assign(actionButton.style, CONFIG.styles.button);
        actionButton.style.cursor = 'pointer';
        actionButton.addEventListener('mouseover', () => {
          actionButton.style.backgroundColor = CONFIG.styles.button.hoverColor;
        });
        actionButton.addEventListener('mouseout', () => {
          actionButton.style.backgroundColor = CONFIG.styles.button.backgroundColor;
        });
        // Condição para não mudar para "Copiando..." no modal Finalizar
        if (buttonText !== 'Finalizar') {
          actionButton.addEventListener('click', () => {
            actionButton.textContent = CONFIG.messages.copying;
            setTimeout(() => {
              if (isInput && inputField) {
                const inputValue = inputField.value.trim();
                if (callback) callback(inputValue);
              } else if (callback) {
                callback();
              }
              hideModal();
            }, 300); // Simula um pequeno delay para feedback visual
          });
        } else {
          actionButton.addEventListener('click', () => {
            if (callback) callback();
            hideModal();
          });
        }
        buttonContainer.appendChild(actionButton);

        // Adiciona o botão "Encerrar" se showCancel for true
        if (showCancel) {
          const cancelButton = document.createElement('button');
          cancelButton.textContent = 'Encerrar';
          Object.assign(cancelButton.style, CONFIG.styles.button, CONFIG.styles.cancelButton);
          cancelButton.style.cursor = 'pointer';
          cancelButton.addEventListener('mouseover', () => {
            cancelButton.style.backgroundColor = CONFIG.styles.cancelButton.hoverColor;
          });
          cancelButton.addEventListener('mouseout', () => {
            cancelButton.style.backgroundColor = CONFIG.styles.cancelButton.backgroundColor;
          });
          cancelButton.addEventListener('click', () => {
            cancelProcess();
          });
          buttonContainer.appendChild(cancelButton);
        }

        // Adiciona o container de botões ao modal
        modal.appendChild(buttonContainer);

        // Adiciona o overlay e o modal ao DOM
        document.body.appendChild(modalOverlay);
        document.body.appendChild(modal);

        // Foca no campo de entrada se for modal de input, senão foca no modal
        if (isInput && inputField) {
          setTimeout(() => {
            inputField.focus();
            console.log('Foco aplicado ao campo de entrada.');
          }, 500); // Aumentado para 500ms
        } else {
          modal.focus();
        }

        // Adiciona evento para tecla Enter
        modal.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') {
            e.preventDefault();
            console.log('Tecla Enter pressionada no modal.');
            // Condição para não mudar para "Copiando..." no modal Finalizar
            if (buttonText !== 'Finalizar') {
              actionButton.textContent = CONFIG.messages.copying;
              setTimeout(() => {
                if (isInput && inputField) {
                  const inputValue = inputField.value.trim();
                  if (callback) callback(inputValue);
                } else if (callback) {
                  callback();
                }
                hideModal();
              }, 300);
            } else {
              if (callback) callback();
              hideModal();
            }
          }
        });
        console.log('Modal exibido com sucesso.');
      } catch (e) {
        console.error('Erro ao exibir modal:', e);
        if (isInput) {
          const input = prompt(message) || '';
          if (callback) callback(input);
        } else {
          alert(message);
        }
      }
    }

    // Função para esconder o modal
    function hideModal() {
      try {
        if (modalOverlay) {
          modalOverlay.remove();
          modalOverlay = null;
        }
        if (modal) {
          modal.remove();
          modal = null;
        }
        console.log('Modal escondido.');
      } catch (e) {
        console.error('Erro ao esconder modal:', e);
      }
    }

    function createNextButton() {
      // Verifica se o botão já existe
      if (nextButton) {
        console.log('Botão "Próximo" já existe, não será criado novamente.');
        return;
      }

      // Verifica se o document.body está disponível
      if (!document.body) {
        console.error('Erro: document.body não está disponível. Tentando novamente em 500ms.');
        setTimeout(createNextButton, 500);
        return;
      }

      // Cria o botão
      nextButton = document.createElement('button');
      nextButton.textContent = 'Próximo (Copiar Coluna H)';
      nextButton.style.position = 'fixed';
      nextButton.style.bottom = '50px';
      nextButton.style.right = '50px';
      Object.assign(nextButton.style, CONFIG.styles.nextButton);
      nextButton.style.color = 'white';
      nextButton.style.border = 'none';
      nextButton.style.cursor = 'pointer';
      nextButton.addEventListener('click', () => {
        console.log('Botão "Próximo" clicado, executando segunda cópia.');
        if (nextButton) {
          nextButton.remove();
          nextButton = null;
          performSecondCopy();
        }
      });

      // Adiciona o botão ao DOM
      document.body.appendChild(nextButton);
      console.log('Botão "Próximo" criado e adicionado ao DOM com sucesso.');
    }

    function performSecondCopy() {
      const textoFormatado = localStorage.getItem('octadesk_text_formatado') || '';
      console.log('Executando segunda cópia, textoFormatado:', textoFormatado);
      if (textoFormatado) {
        navigator.clipboard
          .writeText(textoFormatado)
          .then(() => {
            showMessage(CONFIG.messages.copyH, false, null, 'Finalizar', false); // Remove "Encerrar"
            localStorage.removeItem('octadesk_text_formatado');
            console.log('Segunda cópia concluída com sucesso.');
          })
          .catch((e) => {
            console.error('Erro ao copiar os dados da coluna H:', e);
            showMessage(CONFIG.messages.copyErrorH + e, false);
          });
      } else {
        console.error('Erro: Nenhum texto formatado encontrado no localStorage.');
        showMessage(CONFIG.messages.noTextH, false);
      }
    }

    document.addEventListener('keydown', function (e) {
      console.log('Tecla pressionada:', e.key, 'Ctrl ativo:', e.ctrlKey);
      if (e.ctrlKey && e.key === 'q') {
        e.preventDefault(); // Evita conflitos com outros atalhos
        console.log('Ctrl+Q detectado, iniciando execução.');
        let t = '';
        try {
          t = window.getSelection().toString().trim();
          console.log('Seleção window:', t);
        } catch (e) {
          console.log('Erro window:', e);
        }
        if (!t) {
          const f = document.querySelectorAll('iframe');
          console.log('Iframes encontrados:', f.length);
          f.forEach((iframe, i) => {
            try {
              const s = iframe.contentWindow.getSelection().toString().trim();
              if (s) t = s;
              console.log(`Seleção iframe ${i}:`, s);
            } catch (e) {
              console.log(`Erro iframe ${i}:`, e);
            }
          });
        }
        if (!t) {
          showMessage(CONFIG.messages.selectText, false);
          return;
        }
        console.log('Texto final:', t);
        const r = /^(?:Razão Social do Cliente|RAZÃO SOCIAL DO CLIENTE):\s*(.*?)\n/im;
        const c = /^(?:Cnpj ou Cpf cliente|CNPJ OU CPF DO CLIENTE):\s*(.*?)\n/im;
        const n = /^(?:Número do Banco de Dados|NÚMERO DO BANCO DE DADOS):\s*(.*?)\n/im;
        const a = (t.match(r) || [])[1] || '';
        const p = (t.match(c) || [])[1] || '';
        const b = (t.match(n) || [])[1] || '';
        console.log('Dados extraídos:', { razaoSocial: a, cnpjCpf: p, numeroBanco: b });

        // Substitui o prompt por modal para capturar a coluna A
        showMessage(
          'Digite o texto da coluna A da linha atual no Excel:',
          true,
          function (colunaA) {
            if (!colunaA) {
              showMessage(CONFIG.messages.noColunaA, false);
            }
            // Extrai o número do ticket
            const ticketNumber = getTicketNumber();
            // Formata a frase para a coluna H: "1ª texto_preenchido_pelo_usuario solicitou ticket [ticket_number]"
            const textoFormatado = colunaA ? `1ª ${colunaA} solicitou ticket ${ticketNumber || 'não identificado'}` : '';
            localStorage.setItem('octadesk_text_formatado', textoFormatado);
            console.log('Texto formatado armazenado no localStorage:', textoFormatado);
            const hoje = new Date();
            const dataCorrente = `${hoje.getDate().toString().padStart(2, '0')}/${(hoje.getMonth() + 1).toString().padStart(2, '0')}/${hoje.getFullYear()}`;
            // Primeira cópia: apenas colunas B, C, D, E
            const d1 = `${a}\t${p}\t${dataCorrente}\t${b}`;
            navigator.clipboard
              .writeText(d1)
              .then(() => {
                showMessage(
                  CONFIG.messages.copyBE,
                  false,
                  function () {
                    performSecondCopy(); // Executa a cópia da coluna H diretamente
                  },
                  'Próximo'
                );
              })
              .catch((e) => {
                console.error('Erro ao copiar os dados das colunas B a E:', e);
                showMessage(CONFIG.messages.copyErrorBE + e, false);
              });
          },
          'Próximo'
        );
      }
    });
  }, 500); // Aguarda 500ms para garantir que a página esteja carregada
})();
