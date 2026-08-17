# Fé Diária — Ficha de loja (Google Play + App Store)

## Textos prontos para colar

**Nome do app** (máx. 30 caracteres): `Fé Diária`

**Descrição curta** (Google Play, máx. 80 caracteres):
`Devocional, Bíblia, louvor e comunidade cristã em um só app`

**Subtítulo** (App Store, máx. 30 caracteres):
`Bíblia, oração e comunidade`

**Descrição completa** (máx. 4000 caracteres, serve para as duas lojas):
```
Fé Diária é o seu devocional completo para todos os dias do ano.

📖 BÍBLIA COMPLETA
Todos os 66 livros, em NVI ou ACF, com marcador de "onde parei" e
versículos favoritos salvos para sempre.

🙏 ORAÇÃO E MOMENTO COM DEUS
Uma oração diferente a cada dia, e uma pausa guiada de silêncio para
respirar na presença de Deus.

🎵 LOUVOR GOSPEL
Uma música por dia do mês, direto no app — Isaias Saad, Gabriela Rocha,
Fernandinho, Aline Barros e muito mais.

📅 AGENDA E DIÁRIO
Plano de leitura de 30 dias, lista de tarefas, e um diário pessoal com
sugestão de leitura bíblica gerada por IA a partir do que você escreveu.

👥 COMUNIDADE
Um mural para compartilhar testemunhos, pedidos de oração e encorajamento
com outros cristãos — com moderação automática para manter o espaço seguro.

🌗 MODO CLARO E ESCURO, SEM ANÚNCIOS (OPCIONAL)
Personalize sua experiência e, se quiser, remova os anúncios com um
pagamento único.

Fé Diária é gratuito para usar todos os dias.
```

**Palavras-chave** (App Store, máx. 100 caracteres, separadas por vírgula):
`biblia,devocional,oracao,gospel,louvor,cristao,evangelico,fe,jejum,igreja`

**Categoria:** Estilo de vida (Lifestyle) ou Educação — as duas encaixam; Estilo de vida costuma converter melhor para apps devocionais.

## Assets prontos (nesta entrega)

| Arquivo | Uso |
|---|---|
| `icon-512-play.png` | Ícone na ficha do Google Play |
| `icon-1024-ios.png` | Ícone na ficha da App Store (sem transparência, como a Apple exige) |
| `icon-foreground-android.png` | Camada de primeiro plano do ícone adaptativo Android — combine com fundo sólido `#1B2333` no `@capacitor/assets` |
| `feature-graphic.png` | Banner 1024x500 do topo da ficha no Google Play |
| `screenshots/*.png` | 5 capturas reais do app (1080x1920 — dentro do exigido pelo Google Play) |

**Gerar todos os tamanhos derivados automaticamente:**
```bash
npm install @capacitor/assets --save-dev
npx capacitor-assets generate --iconBackgroundColor '#1B2333' --iconBackgroundColorDark '#1B2333'
```
Isso lê `icon-1024-ios.png` (renomeie para `resources/icon.png`) e gera todas as
resoluções para Android e iOS de uma vez.

**Screenshots da App Store:** a Apple pede tamanhos específicos por aparelho
(hoje em dia, o principal é 1290x2796 para iPhone 6.7"). As 5 capturas que
enviei estão em 1080x1920 (aceitas pelo Google Play direto); para a Apple,
rode `store_screenshots.js` de novo num viewport 1290x2796, ou use uma
ferramenta como o próprio Xcode Simulator para capturar nesse tamanho exato.

## Política de Privacidade — passo obrigatório

As duas lojas exigem uma **URL pública** (não um arquivo) com sua política de
privacidade. Publique o `PRIVACY-POLICY.md` que já te enviei como uma página
do seu site (ex.: `https://seudominio.com/privacidade`) antes de submeter.

## Classificação indicativa (content rating)

No questionário de cada loja, o ponto que muda sua classificação é o **mural
da comunidade** (conteúdo gerado por usuário, interação entre desconhecidos).
Responda "sim" para "conteúdo gerado pelo usuário" e "interação entre
usuários" — isso normalmente resulta em classificação livre/12+ dependendo da
loja, não é um problema, só precisa ser respondido com precisão (respostas
erradas nesse questionário são o motivo mais comum de apps serem suspensos
depois da publicação).

## Checklist antes de enviar

- [ ] Política de privacidade publicada numa URL real
- [ ] App testado num aparelho físico (não só emulador)
- [ ] AdMob com IDs reais (não os de teste) antes da versão final
- [ ] Conta Google Play Console (US$25, pagamento único) ou Apple Developer (US$99/ano) criada
- [ ] Contato de suporte (e-mail) preenchido na ficha
- [ ] Testado o fluxo de "Apagar minha conta" (a Google exige isso visível na ficha se o app tem conta de usuário)
