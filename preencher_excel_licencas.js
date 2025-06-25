// ==UserScript==
// @name         Preencher Excel Licenças (v0.29)
// @namespace    http://tampermonkey.net/
// @version      0.29
// @description  Executa o bookmarklet Preencher Excel com hotkey Ctrl+Q na página de tickets.
// @author       Douglas Silva (Refatorado por Arquiteto Sênior)
// @match        https://app.octadesk.com/*
// @grant        none
// ==/UserScript==

/* Changelog:
 * ... (changelog anterior) ...
 * 0.29 - 2025-06-17: Arquitetura refeita para ser "consciente" de iframes.
 * - O script agora só opera quando executado dentro de um iframe.
 * - Removida toda a complexa lógica de monitoramento de rotas.
 * - A validação da URL é feita checando 'window.top.location.pathname' a cada execução do atalho.
 * - Solução mais simples, robusta e definitiva.
 */

(function () {
  'use strict';

  // Se o script estiver rodando na janela principal (top-level), ele não faz nada.
  if (window.self === window.top) {
    console.log('[Octadesk Script] Rodando no frame principal (TOP). Nenhuma ação necessária aqui.');
    return; // Encerra a execução do script para o frame principal.
  }

  console.log('[Octadesk Script] Rodando dentro de um IFrame. Listener de atalho está ativo.');

  // --- Configurações ---
  const PREFIXO_ALVO = '/ticket/';
  const SCRIPT_VERSION = '0.29';

  // Funções auxiliares (showMessage, getTicketNumber, etc.) permanecem as mesmas
  // ... (Omitidas por brevidade, mas estão no código final abaixo)
  const CONFIG = {
    messages: { selectText: 'Selecione o texto do e-mail no Octadesk.', noColunaA: 'Nenhum texto fornecido para a coluna A. Prosseguindo sem preenchimento na coluna H.', copyBE: 'Dados das colunas B a E copiados! Cole na célula B da linha desejada no Excel Online (Ctrl+V).', copyH: 'Dados da coluna H copiados! Cole na célula H da mesma linha no Excel Online (Ctrl+V).' },
    styles: {
      modal: { backgroundColor: 'white', padding: '30px', borderRadius: '15px', boxShadow: '0 6px 12px rgba(0, 0, 0, 0.3)', maxWidth: '600px', width: '90%', fontFamily: 'Arial, sans-serif', fontSize: '18px', zIndex: '10001' },
      overlay: { backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: '9999' },
      button: { padding: '15px 30px', backgroundColor: '#297ee4', hoverColor: '#1b5ea6', color: 'white', border: 'none', borderRadius: '8px', fontSize: '18px', transition: 'background-color 0.2s ease' },
      cancelButton: { backgroundColor: '#ff0000', hoverColor: '#cc0000' },
      input: { width: '90%', padding: '10px', marginBottom: '25px', border: '2px solid #ccc', borderRadius: '8px', fontSize: '18px', zIndex: '10002' },
    },
  };
  let modalOverlay = null;
  let modal = null;
  function hideModal() {
    if (modalOverlay) {
      modalOverlay.remove();
      modalOverlay = null;
    }
    if (modal) {
      modal.remove();
      modal = null;
    }
  }
  function cancelProcess() {
    localStorage.removeItem('octadesk_text_formatado');
    hideModal();
  }
  function getTicketNumber() {
    const el = document.querySelector('span.label.label-md.label-default.ng-binding');
    if (el) {
      const text = el.textContent.trim().split('\n')[0].trim();
      return text.match(/\d+/) ? text.match(/\d+/)[0] : null;
    }
    return null;
  }
  function showMessage(message, isInput = false, callback = null, buttonText = 'OK', showCancel = true) {
    try {
      hideModal();
      if (!document.body) {
        isInput ? callback(prompt(message) || '') : alert(message);
        return;
      }
      modalOverlay = document.createElement('div');
      Object.assign(modalOverlay.style, { position: 'fixed', top: '0', left: '0', width: '100%', height: '100%', pointerEvents: 'none', ...CONFIG.styles.overlay });
      modal = document.createElement('div');
      Object.assign(modal.style, { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', ...CONFIG.styles.modal });
      modal.tabIndex = 0;
      const messageDiv = document.createElement('div');
      Object.assign(messageDiv.style, { whiteSpace: 'pre-wrap', marginBottom: '30px' });
      messageDiv.textContent = message;
      modal.appendChild(messageDiv);
      let inputField = null;
      if (isInput) {
        inputField = document.createElement('input');
        inputField.type = 'text';
        Object.assign(inputField.style, CONFIG.styles.input);
        modal.appendChild(inputField);
      }
      const buttonContainer = document.createElement('div');
      Object.assign(buttonContainer.style, { display: 'flex', justifyContent: 'center', gap: '15px' });
      const actionButton = document.createElement('button');
      actionButton.textContent = buttonText;
      Object.assign(actionButton.style, CONFIG.styles.button, { cursor: 'pointer' });
      actionButton.addEventListener('mouseover', () => (actionButton.style.backgroundColor = CONFIG.styles.button.hoverColor));
      actionButton.addEventListener('mouseout', () => (actionButton.style.backgroundColor = CONFIG.styles.button.backgroundColor));
      const handleAction = () => {
        const action = () => {
          if (isInput && inputField && callback) callback(inputField.value.trim());
          else if (callback) callback();
          hideModal();
        };
        if (buttonText !== 'Finalizar') {
          actionButton.textContent = 'Copiando...';
          setTimeout(action, 300);
        } else {
          action();
        }
      };
      actionButton.addEventListener('click', handleAction);
      buttonContainer.appendChild(actionButton);
      if (showCancel) {
        const cancelButton = document.createElement('button');
        cancelButton.textContent = 'Encerrar';
        Object.assign(cancelButton.style, CONFIG.styles.button, CONFIG.styles.cancelButton, { cursor: 'pointer' });
        cancelButton.addEventListener('mouseover', () => (cancelButton.style.backgroundColor = CONFIG.styles.cancelButton.hoverColor));
        cancelButton.addEventListener('mouseout', () => (cancelButton.style.backgroundColor = CONFIG.styles.cancelButton.backgroundColor));
        cancelButton.addEventListener('click', cancelProcess);
        buttonContainer.appendChild(cancelButton);
      }
      modal.appendChild(buttonContainer);
      document.body.appendChild(modalOverlay);
      document.body.appendChild(modal);
      if (isInput && inputField) {
        setTimeout(() => inputField.focus(), 500);
      } else {
        modal.focus();
      }
      modal.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleAction();
        }
      });
    } catch (e) {
      isInput ? callback(prompt(message) || '') : alert(message);
    }
  }
  function performSecondCopy() {
    const texto = localStorage.getItem('octadesk_text_formatado') || '';
    if (texto) {
      navigator.clipboard
        .writeText(texto)
        .then(() => {
          showMessage(CONFIG.messages.copyH, false, null, 'Finalizar', false);
          localStorage.removeItem('octadesk_text_formatado');
        })
        .catch((e) => alert('Erro ao copiar: ' + e));
    } else {
      alert('Erro: texto para coluna H não encontrado.');
    }
  }

  // Listener principal que só age se a URL da janela PAI for a correta.
  document.addEventListener('keydown', (e) => {
    // CONDIÇÃO DE GUARDA: Verifica a URL do PAI antes de fazer qualquer coisa.
    // `window.top` refere-se à janela principal do navegador, ignorando os iframes.
    if (!window.top.location.pathname.startsWith(PREFIXO_ALVO)) {
      // Este log é opcional, mas útil para confirmar que o script está ignorando o atalho corretamente.
      // console.log(`%c[Octadesk Script] Atalho ignorado. URL principal (${window.top.location.pathname}) não corresponde ao alvo.`, 'color: gray;');
      return;
    }

    // Se a URL do PAI for válida, a lógica do atalho é executada.
    if (e.ctrlKey && e.key === 'q') {
      e.preventDefault();
      console.log('%c[Octadesk Script] Atalho Ctrl+Q ACIONADO! URL principal é válida.', 'color: green; font-weight: bold;');

      let t = '';
      // `getSelection()` aqui se refere à seleção dentro deste iframe, que é o correto.
      try {
        t = window.getSelection().toString().trim();
      } catch (err) {}
      if (!t) {
        showMessage(CONFIG.messages.selectText, false);
        return;
      }

      const r = /^(?:Razão Social do Cliente|RAZÃO SOCIAL DO CLIENTE):\s*(.*?)\n/im;
      const c = /^(?:Cnpj ou Cpf cliente|CNPJ OU CPF DO CLIENTE):\s*(.*?)\n/im;
      const n = /^(?:Número do Banco de Dados|NÚMERO DO BANCO DE DADOS):\s*(.*?)\n/im;
      const a = (t.match(r) || [])[1] || '';
      const p = (t.match(c) || [])[1] || '';
      const b = (t.match(n) || [])[1] || '';

      showMessage(
        'Digite o texto da coluna A da linha atual no Excel:',
        true,
        (colunaA) => {
          if (!colunaA) showMessage(CONFIG.messages.noColunaA, false);
          const ticketNumber = getTicketNumber();
          const textoFormatado = colunaA ? `1ª ${colunaA} solicitou ticket ${ticketNumber || 'não identificado'}` : '';
          localStorage.setItem('octadesk_text_formatado', textoFormatado);
          const hoje = new Date();
          const dataCorrente = `${hoje.getDate().toString().padStart(2, '0')}/${(hoje.getMonth() + 1).toString().padStart(2, '0')}/${hoje.getFullYear()}`;
          const d1 = `${a}\t${p}\t${dataCorrente}\t${b}`;

          navigator.clipboard
            .writeText(d1)
            .then(() => {
              showMessage(CONFIG.messages.copyBE, false, () => performSecondCopy(), 'Próximo');
            })
            .catch((err) => alert('Erro ao copiar: ' + err));
        },
        'Próximo'
      );
    }
  });

  // Checagem de versão na inicialização do iframe
  const storedVersion = localStorage.getItem('octadesk_script_version');
  if (storedVersion !== SCRIPT_VERSION) {
    // Usamos um timeout para não sobrecarregar o usuário com modais se vários iframes recarregarem
    setTimeout(() => {
      showMessage(`Script atualizado para a versão ${SCRIPT_VERSION}!`, false, null, 'OK', false);
    }, 1500);
    localStorage.setItem('octadesk_script_version', SCRIPT_VERSION);
  }
})();
