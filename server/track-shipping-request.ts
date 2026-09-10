(function() {
    const TARGET_URL = 'checkout/cart?operation=calculaFreteProduto';

    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
        const url = args[0] instanceof Request ? args[0].url : args[0];
        let reqData = { cep: '', sku: '' };

        if (url && url.includes(TARGET_URL)) {
            try {
                const body = args[1] ? args[1].body : null;
                if (body && typeof body === 'string') {
                    const params = new URLSearchParams(body);
                    reqData.cep = params.get('cep') || '';
                    reqData.sku = params.get('codigo') || '';
                }
            } catch(e) {}
        }

        const response = await originalFetch.apply(this, args);

        if (url && url.includes(TARGET_URL)) {
            response.clone().json().then(data => {
                dispararGA4(data, reqData);
            }).catch(err => console.error('Erro ao ler fetch do frete:', err));
        }
        return response;
    };

    const originalXhrOpen = XMLHttpRequest.prototype.open;
    const originalXhrSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function(method, url, ...rest) {
        this._interceptUrl = url;
        return originalXhrOpen.call(this, method, url, ...rest);
    };

    XMLHttpRequest.prototype.send = function(...args) {
        let reqData = { cep: '', sku: '' };
        
        if (this._interceptUrl && this._interceptUrl.includes(TARGET_URL)) {
            if (args[0] && typeof args[0] === 'string') {
                try {
                    const params = new URLSearchParams(args[0]);
                    reqData.cep = params.get('cep') || '';
                    reqData.sku = params.get('codigo') || ''; // Pega o código enviado no payload
                } catch(e) {}
            }
        }

        this.addEventListener('load', function() {
            if (this._interceptUrl && this._interceptUrl.includes(TARGET_URL)) {
                try {
                    const data = JSON.parse(this.responseText);
                    dispararGA4(data, reqData); 
                } catch(e) {
                    console.error('Erro ao ler XHR do frete:', e);
                }
            }
        });
        return originalXhrSend.apply(this, args);
    };

    function dispararGA4(dadosFrete, reqData) {
        try {
            let menorValor = Infinity;
            let servicoMaisBarato = null;

            // 1. Achar o frete mais barato e salvar o objeto completo
            if (dadosFrete && dadosFrete.agencias && Array.isArray(dadosFrete.agencias)) {
                dadosFrete.agencias.forEach(agencia => {
                    if (agencia.servico && Array.isArray(agencia.servico)) {
                        agencia.servico.forEach(servico => {
                            if (typeof servico.valor === 'number' && servico.valor < menorValor) {
                                menorValor = servico.valor;
                                servicoMaisBarato = servico;
                            }
                        });
                    }
                });
            }

            if (menorValor === Infinity) return; // Aborta se não achou frete
            menorValor = parseFloat(menorValor.toFixed(2));

            let cepFinal = reqData.cep || (dadosFrete.agencias && dadosFrete.agencias[0] ? dadosFrete.agencias[0].cep : '');
            let transportadora = servicoMaisBarato ? (servicoMaisBarato.nomeTransportadora || servicoMaisBarato.nome) : '';
            let prazoDias = servicoMaisBarato ? (servicoMaisBarato.prazoFinal || servicoMaisBarato.prazoInicial) : 0;

            // 2. Extrair informações do produto direto do view_item nativo da loja
            let nomeProduto = '';
            let categoriaProduto = '';
            let precoProduto = 0;
            let skuProduto = reqData.sku; // Preferência pro SKU exato do payload da requisição

            if (window.dataLayer) {
                // Lê o dataLayer de trás pra frente pra pegar o evento mais recente
                for (let i = window.dataLayer.length - 1; i >= 0; i--) {
                    const itemDL = window.dataLayer[i];
                    // Como a loja usa gtag(), o formato inserido é um arguments: ["event", "view_item", {...}]
                    if (itemDL && itemDL[0] === 'event' && itemDL[1] === 'view_item' && itemDL[2] && itemDL[2].items) {
                        const produto = itemDL[2].items[0];
                        if (produto) {
                            if (!skuProduto) skuProduto = produto.item_id || '';
                            nomeProduto = produto.item_name || '';
                            categoriaProduto = produto.item_category || '';
                            precoProduto = typeof produto.price === 'number' ? produto.price : parseFloat(produto.price);
                        }
                        break; 
                    }
                }
            }

            // 3. Disparar o novo formato completo
            window.dataLayer = window.dataLayer || [];
            window.dataLayer.push({
                'event': 'calculate_shipping',
                'shipping_cost': menorValor,
                'currency': 'BRL',
                'postal_code': cepFinal,
                'sku': skuProduto,
                'product_name': nomeProduto,
                'product_category': categoriaProduto,
                'product_price': precoProduto,
                'carrier': transportadora,
                'delivery_days': prazoDias
            });

            console.log('👍')

        } catch (erro) {
            console.error('Erro ao processar dados pro dataLayer:', erro);
        }
    }
})();