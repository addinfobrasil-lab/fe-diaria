# Política de Privacidade — Fé Diária

**Versão 1.0 — não substitui revisão por advogado especializado em LGPD antes do lançamento.**

## Por que este app tem atenção redobrada de privacidade

Duas coisas tornam este aplicativo um caso de atenção maior que a média sob a
LGPD (Lei nº 13.709/2018), e é importante que você, como responsável pelo
projeto, saiba disso antes de lançar amplamente:

1. **Conteúdo de fé é dado pessoal sensível.** O Art. 5º, II da LGPD classifica
   dado sobre convicção religiosa como sensível. Publicações no mural, pedidos
   de oração e o diário pessoal se enquadram aqui. Dados sensíveis exigem base
   legal mais restrita (Art. 11) — normalmente consentimento específico e
   destacado, não uma aceitação genérica de termos.
2. **O público provavelmente inclui menores de idade**, e o mural/mensagens
   privadas não têm hoje verificação de idade robusta. Em setembro de 2025 foi
   sancionado o **ECA Digital** (Lei nº 15.211/2025), com vigência a partir de
   março de 2026, colocando a ANPD como fiscalizadora ativa da proteção de
   crianças e adolescentes no ambiente digital — uma das duas prioridades
   máximas da agência para 2026-2027 (a outra é IA, que este app também usa).
   Isso, junto com o conteúdo sensível, **provavelmente tira este app do
   regime simplificado para pequenas empresas/startups (LC 182/2021)** — esse
   regime não vale quando há dado de criança, dado sensível ou decisão
   automatizada (como a moderação por IA), mesmo para negócios pequenos.

## 1. Quem trata os dados

[Nome/CNPJ do responsável pelo app — preencha antes de publicar]. Contato para
assuntos de privacidade: [e-mail do encarregado/DPO — a LGPD recomenda indicar
um encarregado mesmo para operações pequenas].

## 2. Quais dados coletamos e por quê

| Dado | Finalidade | Base legal (Art. 7º/11) |
|---|---|---|
| Nome, e-mail, foto (login Google) | Autenticação e identificação na comunidade | Execução de contrato |
| Publicações, pedidos de oração, diário | Funcionalidade principal do app | Consentimento específico (dado sensível) |
| Localização (aproximada, sob permissão) | Encontrar igrejas próximas | Consentimento |
| Mensagens privadas | Comunicação entre usuários | Execução de contrato |
| Textos enviados à IA (moderação e sugestões) | Segurança do mural e sugestão devocional | Legítimo interesse / consentimento |

## 3. Com quem compartilhamos (transferência a terceiros)

- **Supabase** (banco de dados e armazenamento) — pode processar dados fora do Brasil; verifique a política de residência de dados do Supabase antes de decidir a região do projeto.
- **Google** (login e, se usado, a API Gemini) — sujeito à política de privacidade do Google. No nível gratuito do Gemini, o conteúdo enviado pode ser usado para melhorar produtos do Google — por isso, para o diário pessoal, recomendamos consentimento específico e separado, destacando esse ponto.
- Não vendemos dados a terceiros para publicidade.

## 4. Direitos do titular (Art. 18 da LGPD)

Você pode, a qualquer momento, direto no app (tela "Meus Dados"):
- **Confirmar e acessar** quais dados temos sobre você.
- **Corrigir** dados incompletos ou desatualizados.
- **Baixar seus dados** (portabilidade) em formato legível (JSON).
- **Excluir sua conta** e os dados associados.
- **Revogar consentimento** a qualquer momento — o que pode limitar o uso de funções que dependem dele (ex.: sugestão por IA no diário).
- **Peticionar à ANPD** caso não resolvamos sua solicitação.

Solicitações fora do app: [e-mail de contato].

## 5. Crianças e adolescentes

Recomendamos fortemente **exigir 18 anos** para o mural público e mensagens
privadas, dado o histórico de risco dessas funcionalidades e o novo ECA
Digital. Para uso geral do app por adolescentes (13-17), a LGPD permite
tratamento com base no melhor interesse (Art. 14), mas recursos de maior
risco (contato com estranhos, IA, dados sensíveis) pedem consentimento
específico do responsável legal. Para menores de 13, é necessário
consentimento específico e destacado de um responsável (Art. 14, §1º).
Implementamos um seletor de faixa etária no cadastro; o bloqueio efetivo de
funcionalidades por idade ainda precisa de decisão de produto e jurídica.

## 6. Segurança e incidentes

Usamos Row Level Security no banco (cada pessoa só acessa o que é seu ou o
que é público por natureza) e conexões criptografadas (HTTPS/TLS). Em caso de
incidente de segurança envolvendo dados sensíveis, de crianças ou em larga
escala, a LGPD exige comunicação à ANPD em até 3 dias úteis (6 para pequenas
empresas) pelo sistema Super.GOV.BR, e registro interno do incidente por pelo
menos 5 anos, mesmo os não comunicáveis. Tenha um processo definido para isso
antes de operar com dados reais.

## 7. Alterações

Esta política pode mudar; a versão vigente sempre estará disponível no app,
com a data da última atualização.

---
*Este documento é um ponto de partida técnico-informativo, não uma peça
jurídica finalizada. Como o app processa dado sensível (fé) e pode ser usado
por menores, o cenário de risco é maior que o de um app comum — vale a pena
priorizar a consulta com um advogado especializado em proteção de dados antes
de abrir para o público em geral.*
