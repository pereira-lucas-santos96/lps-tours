# LPS Tours · Lucas Pereira

Site em português para turismo regional em São Paulo, litoral e região, com fotografias reais, seis propostas de roteiro, filtros, álbum ampliável, formulário e painel de solicitações.

## Abrir neste computador

1. Dê dois cliques em **iniciar.cmd**. Mantenha a janela aberta enquanto usar o site.
2. Abra **http://localhost:3000** no navegador.
3. A área do guia está em **http://localhost:3000/admin.html**.
4. A senha é gerada no primeiro início e fica no arquivo **data/admin-key.txt**. Abra esse arquivo para copiar a senha. Ela não aparece no site nem é exposta pelo servidor.

O projeto inclui um Node.js portátil em `.tools/node.exe`. Em outro computador, instale Node.js 22 ou superior e use `npm start` ou `node server.mjs`. Não há dependências para instalar. O arquivo `public/index.html` também pode ser aberto diretamente para visualizar o layout; nesse modo o formulário oferece envio pelo WhatsApp e o painel não funciona.

## Atendimento

- O formulário registra nome, telefone, e-mail opcional, interesses, data opcional, quantidade de pessoas, perfil, observações e consentimento.
- Após o registro, o visitante pode abrir o WhatsApp com o resumo pronto. Ele precisa confirmar o envio no aplicativo.
- Os contatos feitos apenas pelo WhatsApp não são importados automaticamente para o painel. Não há disparo automático de WhatsApp ou e-mail.
- No painel: busca, filtros, etapas de atendimento, anotações internas, contato por WhatsApp/e-mail, exportação CSV e exclusão com confirmação.
- Etapas: Novo → Em conversa → Proposta enviada → Confirmado → Concluído, com opção de Cancelado.
- A solicitação não confirma disponibilidade, contratação ou pagamento.

## Personalização

- **public/config.js**: WhatsApp `5513981435302`, e-mail e nome.
- **public/index.html**: apresentação, conteúdo e privacidade. Ao alterar telefone/e-mail, atualize também os links HTML de fallback e os textos visíveis.
- **public/app.js**: roteiros, detalhes, sugestões de duração e álbum.
- **public/styles.css**: cores, fontes, layout e adaptação para celular.
- **public/assets/**: imagens otimizadas e fontes locais. Os arquivos originais do usuário foram preservados.

O e-mail foi aproveitado da base fornecida: `lucas.foster41@gmail.com`. O WhatsApp foi confirmado pelo usuário. Não foram publicados depoimentos, avaliações, fluência em idiomas ou registro CADASTUR sem confirmação. As vivências internacionais são apresentadas como **12 países e regiões**, respeitando Inglaterra e Escócia como regiões do Reino Unido.

## Dados e publicação

Os pedidos ficam em `data/requests.json`, no servidor. Faça backup regular e restrinja acesso à pasta `data`. A senha inicial fica em `data/admin-key.txt`; nunca publique essa pasta como conteúdo estático. Exporte dados apenas para uso do atendimento e exclua também cópias exportadas quando necessário. O aviso de privacidade orienta exclusão manual de pedidos sem contratação após 180 dias; não há exclusão automática.

Para receber solicitações de clientes pela internet, publique o servidor Node.js em uma hospedagem com **disco persistente** e HTTPS. Uma publicação somente dos arquivos estáticos permite o WhatsApp, mas não disponibiliza o painel nem salva solicitações no servidor.

Variáveis de ambiente:

| Variável | Uso |
| --- | --- |
| `PORT` | Porta HTTP, padrão 3000 |
| `HOST` | Padrão 127.0.0.1; na hospedagem use 0.0.0.0 |
| `DATA_DIR` | Diretório privado persistente para os pedidos |
| `ADMIN_PASSWORD` | Senha forte com pelo menos 12 caracteres; substitui a senha gerada |
| `NODE_ENV` | Defina `production` na hospedagem |
| `PUBLIC_ORIGIN` | URL pública exata, com HTTPS e sem barra final; obrigatória em produção |

Use uma única instância do processo com esse armazenamento em JSON. Se precisar de vários servidores simultâneos, migre a persistência para um banco de dados. O servidor faz gravações atômicas, valida entradas, restringe arquivos servidos, exige autenticação no painel, usa cookie HttpOnly/SameSite, protege mudanças contra origens externas e limita tentativas de login/envio. O limite considera o IP da conexão; atrás de proxy, configure limites na borda conforme a hospedagem. As sessões duram até oito horas e terminam ao reiniciar o servidor.

Antes da divulgação pública, revise a disponibilidade real dos roteiros, as condições comerciais e seu cadastro profissional. O site ainda não foi publicado em um domínio.

## Verificação

`npm test` ou `.\.tools\node.exe --test tests/server.test.mjs` executa testes com dados temporários, sem alterar solicitações reais: formulário, validação, autenticação, proteção dos dados, alteração de status, exportação, persistência, exclusão e logout.

## Créditos

- Fotografias de viagens e retratos: acervo pessoal fornecido por Lucas Pereira; nove imagens utilizadas. O e-mail anexo contém links para Google Drive. Foram usadas as nove fotos fornecidas localmente, sem depender de acesso a arquivos privados do Drive.
- Fotografia da Avenida Paulista: [Unsplash, arquivo original](https://images.unsplash.com/photo-1543059080-f9b1272213d5), utilizada sob a [licença Unsplash](https://unsplash.com/license).
- Fontes: [DM Sans](https://fonts.google.com/specimen/DM+Sans) e [DM Serif Display](https://fonts.google.com/specimen/DM+Serif+Display), SIL Open Font License. Licenças em `public/assets/`.
- Ilustrações dos roteiros: SVGs criados para este projeto; não são fotografias dos locais.
