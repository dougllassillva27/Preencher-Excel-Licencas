// ==UserScript==
// @name         Preencher Excel Licenças v0.58
// @namespace    http://tampermonkey.net/
// @version      0.58
// @description  Adiciona múltiplos atalhos para automação de cópia e consulta de CNPJ no Octadesk.
// @author       Douglas Silva
// @match        https://app.octadesk.com/*
// @grant        GM_xmlhttpRequest
// ==/UserScript==

// Mostrar atalhos disponíveis no console
console.log(`
🚀 [OCTADESK SCRIPT v0.58] Atalhos Disponíveis:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⌨️  Ctrl + Q          → Fluxo de Licença
⌨️  Ctrl + Shift + Q  → Fluxo de Troca
⌨️  Ctrl + Shift + C  → Fluxo de Cancelamento
⌨️  Ctrl + Shift + S  → Consulta CNPJ
⌨️  Ctrl + Shift + F  → Consulta Banco
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

(function () {
  'use strict';

  if (window.self === window.top) {
    console.log('[Octadesk Script] Rodando no frame principal (TOP). Nenhuma ação necessária aqui.');
    return;
  }
  console.log('[Octadesk Script] Rodando dentro de um IFrame. Listener de atalhos está ativo.');

  // ===================================================================================
  // 🔧 CONFIGURAÇÕES CENTRALIZADAS
  // ===================================================================================

  // 📍 Configurações Gerais
  const CONFIG = {
    SCRIPT_VERSION: '0.58',
    PREFIXO_ALVO: '/ticket/',
  };

  // 🌐 APIs e Endpoints
  const API_ENDPOINTS = {
    // API de Consulta de Banco (Secullum/Listar-Licenças)
    CONSULTA_BANCO: 'XXXXXXXXXXXX',

    // API de Consulta CNPJ
    CONSULTA_CNPJ: 'XXXXXXXXXX',
  };

  // 🔐 Credenciais de Autenticação
  const API_CREDENTIALS = {
    // Credenciais para API de CNPJ (Basic Auth)
    CNPJ_API: {
      username: 'XXXXXXX',
      password: 'XXXXXXX',
    },
  };

  // ⏱️ Timeouts (em milissegundos)
  const TIMEOUTS = {
    CONSULTA_BANCO: 20000, // 20 segundos
    CONSULTA_CNPJ: 15000, // 15 segundos
  };

  // 🎯 Padrões de Extração de Dados do DOM
  const PADROES_EXTRACAO = {
    RAZAO_SOCIAL: ['Razão Social do Cliente', 'Nome do Cliente'],
    CNPJ: ['CPF/CNPJ do Cliente', 'Cnpj ou Cpf cliente'],
    BANCO: ['Número do Banco de Dados'],
  };

  // ===================================================================================
  // PARTE 1: FUNÇÕES UTILITÁRIAS
  // ===================================================================================

  function obterNumeroTicket() {
    const candidatos = document.querySelectorAll('span.label.label-md.label-default.ng-binding');
    for (const elemento of candidatos) {
      const texto = elemento.textContent.trim().split('\n')[0].trim();
      if (/^\d+$/.test(texto)) {
        return texto;
      }
    }
    return null;
  }

  function formatarDataAtual() {
    const hoje = new Date();
    const dia = hoje.getDate().toString().padStart(2, '0');
    const mes = (hoje.getMonth() + 1).toString().padStart(2, '0');
    const ano = hoje.getFullYear();
    return `${dia}/${mes}/${ano}`;
  }

  function copiarParaAreaDeTransferencia(texto, mensagemSucesso = 'Texto copiado com sucesso!') {
    navigator.clipboard
      .writeText(texto)
      .then(() => {
        exibirModal(mensagemSucesso, false, null, 'Finalizar', false);
      })
      .catch((erro) => {
        exibirModal('Falha ao copiar o texto: ' + erro, false, null, 'OK', false);
      });
  }

  function extrairDado(padroes) {
    const containerEmail = document.querySelector('.content-comment-interaction');
    if (!containerEmail) return '';

    const allStrongTags = containerEmail.querySelectorAll('strong');

    for (const strongTag of allStrongTags) {
      const strongText = strongTag.textContent.trim().replace(':', '');
      for (const padrao of padroes) {
        if (strongText === padrao.trim()) {
          const valorNode = strongTag.nextSibling;
          if (valorNode) {
            return valorNode.textContent.trim();
          }
        }
      }
    }
    return '';
  }

  // ===================================================================================
  // PARTE 2: UI (MODAIS) - VERSÃO MELHORADA
  // ===================================================================================

  let modalOverlay = null,
    modal = null;
  function ocultarModal() {
    if (modalOverlay) {
      modalOverlay.remove();
      modalOverlay = null;
    }
    if (modal) {
      modal.remove();
      modal = null;
    }
  }
  function encerrarProcesso() {
    localStorage.removeItem('octadesk_texto_formatado_licenca');
    ocultarModal();
  }

  function exibirModal(mensagem, comInput = false, callback = null, textoBotao = 'OK', mostrarCancelar = true) {
    try {
      ocultarModal();
      if (!document.body) {
        comInput ? callback(prompt(mensagem) || '') : alert(mensagem);
        return;
      }
      modalOverlay = document.createElement('div');
      Object.assign(modalOverlay.style, { position: 'fixed', top: '0', left: '0', width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: '9999' });
      modal = document.createElement('div');
      Object.assign(modal.style, { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', backgroundColor: 'white', padding: '30px', borderRadius: '15px', boxShadow: '0 6px 12px rgba(0, 0, 0, 0.3)', maxWidth: '600px', width: '90%', fontFamily: 'Arial, sans-serif', fontSize: '18px', zIndex: '10001' });
      modal.tabIndex = 0;
      const divMensagem = document.createElement('div');
      Object.assign(divMensagem.style, { whiteSpace: 'pre-wrap', marginBottom: '30px' });
      divMensagem.textContent = mensagem;
      modal.appendChild(divMensagem);
      let campoInput = null;
      if (comInput) {
        campoInput = document.createElement('input');
        campoInput.type = 'text';
        Object.assign(campoInput.style, { width: '90%', padding: '10px', marginBottom: '25px', border: '2px solid #ccc', borderRadius: '8px', fontSize: '18px' });
        modal.appendChild(campoInput);
      }
      const containerBotoes = document.createElement('div');
      Object.assign(containerBotoes.style, { display: 'flex', justifyContent: 'center', gap: '15px' });

      if (textoBotao) {
        const botaoAcao = document.createElement('button');
        botaoAcao.textContent = textoBotao;
        Object.assign(botaoAcao.style, { cursor: 'pointer', padding: '15px 30px', backgroundColor: '#297ee4', color: 'white', border: 'none', borderRadius: '8px', fontSize: '18px', transition: 'background-color 0.2s ease' });
        botaoAcao.addEventListener('mouseover', () => (botaoAcao.style.backgroundColor = '#1b5ea6'));
        botaoAcao.addEventListener('mouseout', () => (botaoAcao.style.backgroundColor = '#297ee4'));
        const executarAcao = () => {
          if (comInput && campoInput && callback) callback(campoInput.value.trim());
          else if (callback) callback();
          ocultarModal();
        };
        botaoAcao.addEventListener('click', executarAcao);
        containerBotoes.appendChild(botaoAcao);
        modal.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            executarAcao();
          }
        });
      }

      if (mostrarCancelar) {
        const botaoCancelar = document.createElement('button');
        botaoCancelar.textContent = 'Encerrar';
        Object.assign(botaoCancelar.style, { cursor: 'pointer', padding: '15px 30px', backgroundColor: '#ff0000', color: 'white', border: 'none', borderRadius: '8px', fontSize: '18px', transition: 'background-color 0.2s ease' });
        botaoCancelar.addEventListener('mouseover', () => (botaoCancelar.style.backgroundColor = '#cc0000'));
        botaoCancelar.addEventListener('mouseout', () => (botaoCancelar.style.backgroundColor = '#ff0000'));
        botaoCancelar.addEventListener('click', encerrarProcesso);
        containerBotoes.appendChild(botaoCancelar);
      }
      modal.appendChild(containerBotoes);
      document.body.appendChild(modalOverlay);
      document.body.appendChild(modal);
      if (comInput && campoInput) {
        setTimeout(() => campoInput.focus(), 100);
      } else {
        modal.focus();
      }
    } catch (e) {
      console.error('[Octadesk Script] Erro ao criar modal:', e);
      if (comInput && callback) {
        callback(prompt(mensagem) || '');
      } else {
        alert(mensagem);
      }
    }
  }

  // 🎨 NOVA FUNÇÃO: Modal Tabular para Resultados de Banco
  function exibirModalTabular(bancoPesquisado, resultados, metadados) {
    try {
      ocultarModal();

      modalOverlay = document.createElement('div');
      Object.assign(modalOverlay.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: '9999',
      });

      modal = document.createElement('div');
      Object.assign(modal.style, {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: 'white',
        padding: '25px',
        borderRadius: '15px',
        boxShadow: '0 8px 16px rgba(0, 0, 0, 0.3)',
        maxWidth: '95%',
        width: '1200px',
        maxHeight: '90%',
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        zIndex: '10001',
        overflowY: 'auto',
      });
      modal.tabIndex = 0;

      // Cabeçalho
      const cabecalho = document.createElement('div');
      Object.assign(cabecalho.style, {
        textAlign: 'center',
        marginBottom: '20px',
        borderBottom: '2px solid #e0e0e0',
        paddingBottom: '15px',
      });
      cabecalho.innerHTML = `
                <h2 style="margin: 0 0 10px 0; color: #2e7d32; font-size: 24px;">✅ BANCO ${bancoPesquisado} ENCONTRADO!</h2>
                <p style="margin: 0; color: #666; font-size: 16px;">🎯 ${resultados.length} registro(s) encontrado(s)</p>
            `;
      modal.appendChild(cabecalho);

      // Tabela de Resultados
      if (resultados.length > 0) {
        const tabelaContainer = document.createElement('div');
        Object.assign(tabelaContainer.style, {
          overflowX: 'auto',
          marginBottom: '20px',
          border: '1px solid #ddd',
          borderRadius: '8px',
        });

        const tabela = document.createElement('table');
        Object.assign(tabela.style, {
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '13px',
          backgroundColor: 'white',
        });

        // Cabeçalho da Tabela
        const thead = document.createElement('thead');
        thead.innerHTML = `
                    <tr style="background: linear-gradient(135deg, #42a5f5, #1976d2); color: white;">
                        <th style="padding: 12px 8px; border: 1px solid #ddd; font-weight: bold; text-align: center; min-width: 60px;">Linha</th>
                        <th style="padding: 12px 8px; border: 1px solid #ddd; font-weight: bold; text-align: left; min-width: 200px;">Revenda</th>
                        <th style="padding: 12px 8px; border: 1px solid #ddd; font-weight: bold; text-align: left; min-width: 200px;">Cliente</th>
                        <th style="padding: 12px 8px; border: 1px solid #ddd; font-weight: bold; text-align: center; min-width: 120px;">Documento</th>
                        <th style="padding: 12px 8px; border: 1px solid #ddd; font-weight: bold; text-align: center; min-width: 90px;">Data</th>
                        <th style="padding: 12px 8px; border: 1px solid #ddd; font-weight: bold; text-align: center; min-width: 70px;">Banco</th>
                        <th style="padding: 12px 8px; border: 1px solid #ddd; font-weight: bold; text-align: center; min-width: 80px;">Nº Licença</th>
                        <th style="padding: 12px 8px; border: 1px solid #ddd; font-weight: bold; text-align: center; min-width: 80px;">Tipo</th>
                        <th style="padding: 12px 8px; border: 1px solid #ddd; font-weight: bold; text-align: center; min-width: 70px;">Isento</th>
                        <th style="padding: 12px 8px; border: 1px solid #ddd; font-weight: bold; text-align: left; min-width: 150px;">Ticket</th>
                    </tr>
                `;

        tabela.appendChild(thead);

        // Corpo da Tabela
        const tbody = document.createElement('tbody');
        resultados.forEach((resultado, index) => {
          const cor = index % 2 === 0 ? '#f8f9fa' : '#ffffff';
          const row = document.createElement('tr');
          row.style.backgroundColor = cor;
          row.style.transition = 'background-color 0.2s ease';
          row.addEventListener('mouseover', () => (row.style.backgroundColor = '#e3f2fd'));
          row.addEventListener('mouseout', () => (row.style.backgroundColor = cor));

          row.innerHTML = `
                        <td style="padding: 10px 8px; border: 1px solid #ddd; text-align: center; font-weight: bold; color: #1976d2;">${resultado.linha}</td>
                        <td style="padding: 10px 8px; border: 1px solid #ddd; text-align: left; font-weight: 500;">${resultado.revenda || '-'}</td>
                        <td style="padding: 10px 8px; border: 1px solid #ddd; text-align: left;">${resultado.cliente || '-'}</td>
                        <td style="padding: 10px 8px; border: 1px solid #ddd; text-align: center; font-family: monospace;">${resultado.documento || '-'}</td>
                        <td style="padding: 10px 8px; border: 1px solid #ddd; text-align: center;">${resultado.data_liberacao || '-'}</td>
                        <td style="padding: 10px 8px; border: 1px solid #ddd; text-align: center; font-weight: bold; color: #2e7d32; background-color: #e8f5e8;">${resultado.banco}</td>
                        <td style="padding: 10px 8px; border: 1px solid #ddd; text-align: center;">${resultado.numero_licenca || '-'}</td>
                        <td style="padding: 10px 8px; border: 1px solid #ddd; text-align: center;">${resultado.tipo_licenca || '-'}</td>
                        <td style="padding: 10px 8px; border: 1px solid #ddd; text-align: center; font-weight: bold; color: #2e7d32; background-color: #e8f5e8;">${resultado.isento || '-'}</td>
                        <td style="padding: 10px 8px; border: 1px solid #ddd; text-align: left; font-size: 12px;">${resultado.ticket || '-'}</td>
                    `;

          tbody.appendChild(row);
        });
        tabela.appendChild(tbody);
        tabelaContainer.appendChild(tabela);
        modal.appendChild(tabelaContainer);
      }

      // Metadados (Estatísticas)
      if (metadados) {
        const metadadosDiv = document.createElement('div');
        Object.assign(metadadosDiv.style, {
          backgroundColor: '#f5f5f5',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px',
          fontSize: '13px',
          color: '#555',
        });
        metadadosDiv.innerHTML = `
                    <h4 style="margin: 0 0 10px 0; color: #333; font-size: 16px;">📊 Estatísticas da Consulta:</h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
                        <div><strong>Estrutura detectada:</strong> ${metadados.estrutura_detectada}</div>
                        <div><strong>Linhas analisadas:</strong> ${metadados.linhas_analisadas?.toLocaleString() || 'N/A'}</div>
                        <div><strong>Linhas com banco:</strong> ${metadados.linhas_com_banco?.toLocaleString() || 'N/A'}</div>
                        <div><strong>Linhas vazias:</strong> ${metadados.linhas_vazias?.toLocaleString() || 'N/A'}</div>
                    </div>
                `;
        modal.appendChild(metadadosDiv);
      }

      // Botões
      const containerBotoes = document.createElement('div');
      Object.assign(containerBotoes.style, {
        display: 'flex',
        justifyContent: 'center',
        gap: '15px',
      });

      const botaoOK = document.createElement('button');
      botaoOK.textContent = 'OK';
      Object.assign(botaoOK.style, {
        cursor: 'pointer',
        padding: '12px 25px',
        backgroundColor: '#1976d2',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '16px',
        fontWeight: 'bold',
        transition: 'all 0.2s ease',
      });
      botaoOK.addEventListener('mouseover', () => {
        botaoOK.style.backgroundColor = '#1565c0';
        botaoOK.style.transform = 'translateY(-1px)';
      });
      botaoOK.addEventListener('mouseout', () => {
        botaoOK.style.backgroundColor = '#1976d2';
        botaoOK.style.transform = 'translateY(0)';
      });
      botaoOK.addEventListener('click', ocultarModal);
      containerBotoes.appendChild(botaoOK);

      modal.appendChild(containerBotoes);
      document.body.appendChild(modalOverlay);
      document.body.appendChild(modal);
      modal.focus();
    } catch (e) {
      console.error('[Octadesk Script] Erro ao criar modal tabular:', e);
      exibirModal('Erro ao exibir resultados. Verifique o console.', false, null, 'OK', false);
    }
  }

  // ===================================================================================
  // PARTE 3: FLUXOS DE TRABALHO
  // ===================================================================================

  function executarFluxoDeLicenca() {
    const numeroTicket = obterNumeroTicket();
    if (!numeroTicket) {
      exibirModal('Nenhum ticket aberto ou número não encontrado.', false, null, 'OK', false);
      return;
    }

    const razaoSocial = extrairDado(PADROES_EXTRACAO.RAZAO_SOCIAL);
    const cnpj = extrairDado(PADROES_EXTRACAO.CNPJ);
    const banco = extrairDado(PADROES_EXTRACAO.BANCO);
    const dataCorrente = formatarDataAtual();

    exibirModal(
      'Digite o texto da coluna A da linha atual no Excel:',
      true,
      (colunaA) => {
        if (!colunaA) {
          exibirModal('Nenhum texto fornecido para a coluna A.', false, null, 'OK', false);
          return;
        }
        const textoFormatadoH = `1ª ${colunaA} solicitou ticket ${numeroTicket}`;
        localStorage.setItem('octadesk_texto_formatado_licenca', textoFormatadoH);

        const dadosParaCopiaBE = `${razaoSocial}\t${cnpj}\t${dataCorrente}\t${banco}`;

        navigator.clipboard
          .writeText(dadosParaCopiaBE)
          .then(() => {
            const callbackProximo = () => {
              const textoH = localStorage.getItem('octadesk_texto_formatado_licenca') || '';
              if (textoH) {
                copiarParaAreaDeTransferencia(textoH, 'Dados da coluna H copiados!');
              }
              localStorage.removeItem('octadesk_texto_formatado_licenca');
            };
            exibirModal('Dados das colunas B a E copiados!', false, callbackProximo, 'Próximo');
          })
          .catch((err) => exibirModal('Erro ao copiar: ' + err, false, null, 'OK', false));
      },
      'Próximo'
    );
  }

  function executarFluxoDeTroca() {
    const numeroTicket = obterNumeroTicket();
    if (!numeroTicket) {
      exibirModal('Nenhum ticket aberto ou número não encontrado.', false, null, 'OK', false);
      return;
    }

    exibirModal(
      'Digite o nome da revenda:',
      true,
      (nomeRevenda) => {
        if (!nomeRevenda) return;
        const dataAtual = formatarDataAtual();
        const textoFinal = `${nomeRevenda} solicitou troca ticket ${numeroTicket} ${dataAtual}`;
        copiarParaAreaDeTransferencia(textoFinal);
      },
      'Próximo'
    );
  }

  function executarFluxoDeCancelamento() {
    const numeroTicket = obterNumeroTicket();
    if (!numeroTicket) {
      exibirModal('Nenhum ticket aberto ou número não encontrado.', false, null, 'OK', false);
      return;
    }

    exibirModal(
      'Digite o nome da revenda:',
      true,
      (nomeRevenda) => {
        if (!nomeRevenda) return;
        const textoFinal = `1ª ${nomeRevenda} solicitou cancelamento ticket ${numeroTicket}`;
        copiarParaAreaDeTransferencia(textoFinal, 'Texto de cancelamento copiado com sucesso!');
      },
      'Copiar'
    );
  }

  function executarFluxoDeConsultaCNPJ() {
    exibirModal(
      'Digite o CNPJ para consulta:',
      true,
      (cnpj) => {
        if (!cnpj || !/^\d+$/.test(cnpj.replace(/[^\d]/g, ''))) {
          exibirModal('CNPJ inválido. Por favor, digite apenas números.', false, null, 'OK', false);
          return;
        }
        const cnpjLimpo = cnpj.replace(/[^\d]/g, '');

        const credentials = btoa(`${API_CREDENTIALS.CNPJ_API.username}:${API_CREDENTIALS.CNPJ_API.password}`);

        exibirModal('Consultando API...', false, null, '', false);

        GM_xmlhttpRequest({
          method: 'GET',
          url: `${API_ENDPOINTS.CONSULTA_CNPJ}/${cnpjLimpo}`,
          headers: { Authorization: `Basic ${credentials}` },
          timeout: TIMEOUTS.CONSULTA_CNPJ,
          onload: function (response) {
            ocultarModal();
            if (response.status === 200) {
              try {
                const dados = JSON.parse(response.responseText);

                if (Array.isArray(dados) && dados.length > 0) {
                  const nomeCliente = dados[0].Nome;
                  if (nomeCliente) {
                    copiarParaAreaDeTransferencia(nomeCliente, `Nome "${nomeCliente}" copiado com sucesso!`);
                  } else {
                    exibirModal('O campo "Nome" não foi encontrado no objeto da API.', false, null, 'OK', false);
                  }
                } else {
                  exibirModal('A API retornou uma resposta vazia ou em formato inesperado.', false, null, 'OK', false);
                }
              } catch (e) {
                exibirModal('Falha ao processar a resposta da API (não é um JSON válido).', false, null, 'OK', false);
              }
            } else if (response.status === 404) {
              exibirModal('CNPJ não localizado.', false, null, 'OK', false);
            } else {
              exibirModal(`Falha ao conectar com a API. (Status: ${response.status})`, false, null, 'OK', false);
            }
          },
          onerror: function (response) {
            ocultarModal();
            exibirModal('Falha ao conectar com a API. (Erro de rede)', false, null, 'OK', false);
          },
          ontimeout: function (response) {
            ocultarModal();
            exibirModal('Falha ao conectar com a API. (Tempo esgotado)', false, null, 'OK', false);
          },
        });
      },
      'Consultar'
    );
  }

  function executarFluxoDeConsultaBanco() {
    exibirModal(
      'Digite o número do banco para consulta:',
      true,
      (numeroBanco) => {
        if (!numeroBanco || !/^\d+$/.test(numeroBanco.trim())) {
          exibirModal('Número do banco inválido. Digite apenas números.', false, null, 'OK', false);
          return;
        }

        const numeroBancoLimpo = numeroBanco.trim();
        exibirModal('🔍 Consultando banco de dados...', false, null, '', false);

        GM_xmlhttpRequest({
          method: 'GET',
          url: `${API_ENDPOINTS.CONSULTA_BANCO}?banco=${encodeURIComponent(numeroBancoLimpo)}`,
          timeout: TIMEOUTS.CONSULTA_BANCO,
          onload: function (response) {
            ocultarModal();
            if (response.status === 200) {
              try {
                const resultado = JSON.parse(response.responseText);

                if (resultado.sucesso) {
                  if (resultado.encontrado) {
                    exibirModalTabular(numeroBancoLimpo, resultado.resultados, resultado.metadados);
                  } else {
                    const metadados = resultado.metadados ? `\n\n📊 Análise realizada:\n• Estrutura: ${resultado.metadados.estrutura_detectada}\n• ${resultado.metadados.linhas_analisadas?.toLocaleString()} linhas verificadas\n• ${resultado.metadados.linhas_com_banco?.toLocaleString()} com banco válido` : '';

                    exibirModal(`❌ BANCO ${numeroBancoLimpo} NÃO ENCONTRADO\n\nO número do banco não foi localizado no sistema.${metadados}\n\nVerifique se o número está correto.`, false, null, 'OK', false);
                  }
                } else {
                  exibirModal('⚠️ Erro na consulta:\n' + resultado.erro, false, null, 'OK', false);
                }
              } catch (e) {
                console.error('Erro ao processar resposta:', e);
                exibirModal('❌ Erro ao processar resposta do servidor.\n\nTente novamente em alguns instantes.', false, null, 'OK', false);
              }
            } else {
              exibirModal(`❌ Erro de conexão\n\nStatus HTTP: ${response.status}`, false, null, 'OK', false);
            }
          },
          onerror: function () {
            ocultarModal();
            exibirModal('❌ Erro de rede\n\nVerifique sua conexão e tente novamente.', false, null, 'OK', false);
          },
          ontimeout: function () {
            ocultarModal();
            exibirModal('⏱️ Timeout na consulta\n\nO servidor demorou para responder. Tente novamente.', false, null, 'OK', false);
          },
        });
      },
      'Consultar'
    );
  }

  // ===================================================================================
  // PARTE 4: LISTENER PRINCIPAL (ROTEADOR DE EVENTOS)
  // ===================================================================================

  document.addEventListener('keydown', (evento) => {
    if (!window.top.location.pathname.startsWith(CONFIG.PREFIXO_ALVO)) {
      return;
    }

    const atalhoTroca = evento.ctrlKey && evento.shiftKey && evento.key.toLowerCase() === 'q';
    const atalhoLicenca = evento.ctrlKey && !evento.shiftKey && evento.key.toLowerCase() === 'q';
    const atalhoCancelamento = evento.ctrlKey && evento.shiftKey && evento.key.toLowerCase() === 'c';
    const atalhoConsultaCnpj = evento.ctrlKey && evento.shiftKey && evento.key.toLowerCase() === 's';
    const atalhoConsultaBanco = evento.ctrlKey && evento.shiftKey && evento.key.toLowerCase() === 'f';

    if (atalhoTroca) {
      evento.preventDefault();
      executarFluxoDeTroca();
    } else if (atalhoLicenca) {
      evento.preventDefault();
      executarFluxoDeLicenca();
    } else if (atalhoCancelamento) {
      evento.preventDefault();
      executarFluxoDeCancelamento();
    } else if (atalhoConsultaCnpj) {
      evento.preventDefault();
      executarFluxoDeConsultaCNPJ();
    } else if (atalhoConsultaBanco) {
      evento.preventDefault();
      executarFluxoDeConsultaBanco();
    }
  });
})();
