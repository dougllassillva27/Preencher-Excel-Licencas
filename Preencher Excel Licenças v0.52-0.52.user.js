// ==UserScript==
// @name         Preencher Excel Licenças v0.52
// @namespace    http://tampermonkey.net/
// @version      0.52
// @description  Adiciona múltiplos atalhos para automação de cópia e consulta de CNPJ no Octadesk.
// @author       Douglas Silva
// @match        https://app.octadesk.com/*
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function() {
    'use strict';

    if (window.self === window.top) {
        console.log('[Octadesk Script] Rodando no frame principal (TOP). Nenhuma ação necessária aqui.');
        return;
    }
    console.log('[Octadesk Script] Rodando dentro de um IFrame. Listener de atalhos está ativo.');

    // --- Configurações ---
    const PREFIXO_ALVO = '/ticket/';
    const SCRIPT_VERSION = '0.52';

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
        navigator.clipboard.writeText(texto).then(() => {
            exibirModal(mensagemSucesso, false, null, 'Finalizar', false);
        }).catch(erro => {
            exibirModal('Falha ao copiar o texto: ' + erro, false, null, 'OK', false);
        });
    }

    function extrairDado(padroes) {
        const containerEmail = document.querySelector('.content-comment-interaction');
        if (!containerEmail) return '';

        const allStrongTags = containerEmail.querySelectorAll('strong');

        for(const strongTag of allStrongTags) {
            const strongText = strongTag.textContent.trim().replace(':', '');
            for(const padrao of padroes) {
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
    // PARTE 2: UI (MODAIS)
    // ===================================================================================

    let modalOverlay = null, modal = null;
    function ocultarModal() { if (modalOverlay) { modalOverlay.remove(); modalOverlay = null; } if (modal) { modal.remove(); modal = null; } }
    function encerrarProcesso() { localStorage.removeItem('octadesk_texto_formatado_licenca'); ocultarModal(); }

    function exibirModal(mensagem, comInput = false, callback = null, textoBotao = 'OK', mostrarCancelar = true) {
        try {
            ocultarModal();
            if (!document.body) { comInput ? callback(prompt(mensagem) || '') : alert(mensagem); return; }
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
                botaoAcao.addEventListener('mouseover', () => botaoAcao.style.backgroundColor = '#1b5ea6');
                botaoAcao.addEventListener('mouseout', () => botaoAcao.style.backgroundColor = '#297ee4');
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
                botaoCancelar.addEventListener('mouseover', () => botaoCancelar.style.backgroundColor = '#cc0000');
                botaoCancelar.addEventListener('mouseout', () => botaoCancelar.style.backgroundColor = '#ff0000');
                botaoCancelar.addEventListener('click', encerrarProcesso);
                containerBotoes.appendChild(botaoCancelar);
            }
            modal.appendChild(containerBotoes);
            document.body.appendChild(modalOverlay);
            document.body.appendChild(modal);
            if (comInput && campoInput) { setTimeout(() => campoInput.focus(), 100); } else { modal.focus(); }
        } catch (e) {
            console.error('[Octadesk Script] Erro ao criar modal:', e);
            if(comInput && callback) { callback(prompt(mensagem) || ''); } else { alert(mensagem); }
        }
    }


    // ===================================================================================
    // PARTE 3: FLUXOS DE TRABALHO
    // ===================================================================================

    const PADROES_RAZAO_SOCIAL = ['Razão Social do Cliente', 'Nome do Cliente'];
    const PADROES_CNPJ = ['CPF/CNPJ do Cliente', 'Cnpj ou Cpf cliente'];
    const PADROES_BANCO = ['Número do Banco de Dados'];

    function executarFluxoDeLicenca() {
        const numeroTicket = obterNumeroTicket();
        if (!numeroTicket) {
            exibirModal('Nenhum ticket aberto ou número não encontrado.', false, null, 'OK', false);
            return;
        }

        const razaoSocial = extrairDado(PADROES_RAZAO_SOCIAL);
        const cnpj = extrairDado(PADROES_CNPJ);
        const banco = extrairDado(PADROES_BANCO);
        const dataCorrente = formatarDataAtual();

        exibirModal('Digite o texto da coluna A da linha atual no Excel:', true, (colunaA) => {
            if (!colunaA) {
                exibirModal('Nenhum texto fornecido para a coluna A.', false, null, 'OK', false);
                return;
            }
            const textoFormatadoH = `1ª ${colunaA} solicitou ticket ${numeroTicket}`;
            localStorage.setItem('octadesk_texto_formatado_licenca', textoFormatadoH);

            const dadosParaCopiaBE = `${razaoSocial}\t${cnpj}\t${dataCorrente}\t${banco}`;

            navigator.clipboard.writeText(dadosParaCopiaBE).then(() => {
                const callbackProximo = () => {
                    const textoH = localStorage.getItem('octadesk_texto_formatado_licenca') || '';
                               if (textoH) {
                        copiarParaAreaDeTransferencia(textoH, 'Dados da coluna H copiados!');
                    }
                    localStorage.removeItem('octadesk_texto_formatado_licenca');
                };
                exibirModal('Dados das colunas B a E copiados!', false, callbackProximo, 'Próximo');
            }).catch(err => exibirModal('Erro ao copiar: ' + err, false, null, 'OK', false));
        }, 'Próximo');
    }

    function executarFluxoDeTroca() {
        const numeroTicket = obterNumeroTicket();
        if (!numeroTicket) {
            exibirModal('Nenhum ticket aberto ou número não encontrado.', false, null, 'OK', false);
            return;
        }

        exibirModal('Digite o nome da revenda:', true, (nomeRevenda) => {
            if (!nomeRevenda) return;
            const dataAtual = formatarDataAtual();
            const textoFinal = `${nomeRevenda} solicitou troca ticket ${numeroTicket} ${dataAtual}`;
            copiarParaAreaDeTransferencia(textoFinal);
        }, 'Próximo');
    }

    function executarFluxoDeCancelamento() {
        const numeroTicket = obterNumeroTicket();
        if (!numeroTicket) {
            exibirModal('Nenhum ticket aberto ou número não encontrado.', false, null, 'OK', false);
            return;
        }

        exibirModal('Digite o nome da revenda:', true, (nomeRevenda) => {
            if (!nomeRevenda) return;
            const textoFinal = `1ª ${nomeRevenda} solicitou cancelamento ticket ${numeroTicket}`;
            copiarParaAreaDeTransferencia(textoFinal, 'Texto de cancelamento copiado com sucesso!');
        }, 'Copiar');
    }

    function executarFluxoDeConsultaCNPJ() {
        exibirModal('Digite o CNPJ para consulta:', true, (cnpj) => {
            if (!cnpj || !/^\d+$/.test(cnpj.replace(/[^\d]/g, ''))) {
                exibirModal('CNPJ inválido. Por favor, digite apenas números.', false, null, 'OK', false);
                return;
            }
            const cnpjLimpo = cnpj.replace(/[^\d]/g, '');

            const username = 'api';
            const password = '31982bd2-f692-4691-8d55-0a67d16906d3.0d4c37c9-4fad-410d-8664-617d1952160d';
            const credentials = btoa(`${username}:${password}`);

            exibirModal('Consultando API...', false, null, '', false);

            GM_xmlhttpRequest({
                method: "GET",
                url: `http://20.206.161.75:10000/revendas/${cnpjLimpo}`,
                headers: { "Authorization": `Basic ${credentials}` },
                timeout: 15000,
                onload: function(response) {
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
                onerror: function(response) {
                    ocultarModal();
                    exibirModal('Falha ao conectar com a API. (Erro de rede)', false, null, 'OK', false);
                },
                ontimeout: function(response) {
                    ocultarModal();
                    exibirModal('Falha ao conectar com a API. (Tempo esgotado)', false, null, 'OK', false);
                }
            });
        }, 'Consultar');
    }


// ===================================================================================
    // PARTE 4: LISTENER PRINCIPAL (ROTEADOR DE EVENTOS)
    // ===================================================================================

    document.addEventListener('keydown', (evento) => {
        if (!window.top.location.pathname.startsWith(PREFIXO_ALVO)) {
            return;
        }

        const atalhoTroca = evento.ctrlKey && evento.shiftKey && evento.key.toLowerCase() === 'q';
        const atalhoLicenca = evento.ctrlKey && !evento.shiftKey && evento.key.toLowerCase() === 'q';
        const atalhoCancelamento = evento.ctrlKey && evento.shiftKey && evento.key.toLowerCase() === 'c';
        const atalhoConsultaCnpj = evento.ctrlKey && evento.shiftKey && evento.key.toLowerCase() === 's';

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
        }
    });

})();