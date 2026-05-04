# Pendências - CAMFOR App

## Aguardando Celula Web adicionar registros DNS:

### 1. Hospedagem (CNAME)
- Tipo: CNAME
- Nome: loja
- Conteúdo: 7244aa62e5e30cb1.vercel-dns-017.com.

### 2. Envio de Emails (DKIM/MX/SPF)

**Registro 1 (DKIM):**
- Tipo: TXT
- Nome: resend._domainkey.loja
- Conteúdo: p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDbNrzPlPM+Tgns/GWeBv2Nc+mHngNLIPLUGn3thfdH2vYFgix00zKgxh9UEG+FeM3um9z9WDF0lEXIkGZp88NDX/Cu1VKkWxoB+895NeWtMK2TzdKI5U/RLwxQyCxvklzfntCOVMaJP2RlAO7bvhot23Xu8wQhq8FK0NAJh5qHNQIDAQAB

**Registro 2 (MX):**
- Tipo: MX
- Nome: send.loja
- Conteúdo: feedback-smtp.sa-east-1.amazonses.com
- Prioridade: 10

**Registro 3 (SPF):**
- Tipo: TXT
- Nome: send.loja
- Conteúdo: v=spf1 include:amazonses.com ~all

---

## Após DNS configurado, fazer:

### 1. Verificar domínio no Resend
- [ ] Acessar https://resend.com/domains
- [ ] Clicar em "Verify" no domínio loja.camffor.com.br
- [ ] Aguardar ficar verde

### 2. Alterar remetente no código
- [ ] Editar api/send-daily-report.js
- [ ] Alterar linha 631 de `'CAMFOR <onboarding@resend.dev>'` para `'CAMFOR <sistema@loja.camffor.com.br>'`
- [ ] Fazer commit e push

### 3. Verificar hospedagem na Vercel
- [ ] Acessar https://vercel.com → projeto → Settings → Domains
- [ ] Clicar em "Refresh" no domínio loja.camffor.com.br
- [ ] Aguardar "Invalid Configuration" sumir

### 4. Atualizar URLs no cron-job.org
- [ ] Acessar https://cron-job.org
- [ ] Atualizar job "CAMFOR - Relatório Diário":
      - URL antiga: https://camfor.vercel.app/api/send-daily-report?secret=...
      - URL nova: https://loja.camffor.com.br/api/send-daily-report?secret=...
- [ ] Atualizar job "CAMFOR - Limpeza Diária" (se existir):
      - URL antiga: https://camfor.vercel.app/api/daily-cleanup?secret=...
      - URL nova: https://loja.camffor.com.br/api/daily-cleanup?secret=...

---

## Resumo dos Serviços

| Serviço | URL | Função |
|---------|-----|--------|
| Vercel | https://vercel.com | Hospedagem |
| Firebase | https://firebase.google.com | Banco de dados |
| Resend | https://resend.com | Envio de emails |
| cron-job.org | https://cron-job.org | Agendamento de tarefas |

---

## Contatos

- Email de relatórios: financeiro@camffor.com.br
- Domínio: loja.camffor.com.br

---

*Última atualização: 04/05/2026*
