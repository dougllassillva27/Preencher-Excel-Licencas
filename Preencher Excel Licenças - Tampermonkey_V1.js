// ==UserScript==
// @name         Octadesk Bookmarklet Hotkey
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Executa o bookmarklet Preencher Excel com hotkey Ctrl+Q
// @author       You
// @match        https://app.octadesk.com/*
// @grant        none
// ==/UserScript==

(function () {
  'use strict';
  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey && e.key === 'q') {
      e.preventDefault(); // Evita conflitos com outros atalhos
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
        alert('Selecione o texto do e-mail no Octadesk. Verifique o console (F12).');
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
      if (!a || !p || !b) {
        alert('Erro ao extrair dados:\n' + t);
        return;
      }
      const hoje = new Date();
      const dataCorrente = `${hoje.getDate().toString().padStart(2, '0')}/${(hoje.getMonth() + 1).toString().padStart(2, '0')}/${hoje.getFullYear()}`;
      const d = `${a}\t${p}\t${dataCorrente}\t${b}`;
      navigator.clipboard
        .writeText(d)
        .then(() => {
          alert('Dados copiados! Cole no Excel Online (Ctrl+V).');
        })
        .catch((e) => alert('Erro ao copiar: ' + e));
    }
  });
})();
