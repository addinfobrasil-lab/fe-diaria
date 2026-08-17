# Fé Diária — Virar app nativo (Capacitor) + AdMob real

O AdMob só existe dentro de um app nativo instalado — não roda em site/navegador,
nem dentro do preview do Claude.ai. Este guia faz as duas coisas juntas: empacota
o app com Capacitor e liga o AdMob de verdade.

## 1. Preparar o projeto React real

Isto parte do projeto real (Vite) que já vimos no guia do Supabase, não do
preview do Claude.ai.

```bash
npm create vite@latest fe-diaria -- --template react
cd fe-diaria
# copie fe-diaria-app.jsx para src/App.jsx, e as pastas src/lib/ que já te enviei
npm install
npm run build
```

## 2. Instalar o Capacitor

```bash
npm install @capacitor/core @capacitor/cli
npx cap init "Fé Diária" "com.seudominio.fediaria" --web-dir=dist
npm install @capacitor/android @capacitor/ios
npx cap add android
npx cap add ios      # só funciona em Mac, exige Xcode
```

O segundo argumento (`com.seudominio.fediaria`) é o **Application ID** — precisa
bater exatamente com o que você configurar no Google Play Console e no AdMob.
Troque `seudominio` antes de continuar.

Depois de qualquer mudança no código React:
```bash
npm run build
npx cap sync
```

## 3. Instalar o plugin do AdMob

```bash
npm install @capacitor-community/admob
npx cap sync
```

Este é o plugin oficialmente indicado na documentação do próprio Capacitor
(capacitorjs.com/docs/guides/ads) — confirmei isso agora antes de te passar.

## 4. Configurar o Android

No seu painel do AdMob (que você já tem), pegue o **App ID** (formato
`ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY`) e os **IDs de bloco de anúncio**
(ad unit, formato `ca-app-pub-XXXXXXXXXXXXXXXX/ZZZZZZZZZZ`) — um para o banner.

Em `android/app/src/main/res/values/strings.xml`, adicione:
```xml
<string name="admob_app_id">SEU_APP_ID_AQUI</string>
```

Em `android/app/src/main/AndroidManifest.xml`, dentro de `<application>`:
```xml
<meta-data android:name="com.google.android.gms.ads.APPLICATION_ID" android:value="@string/admob_app_id"/>
```

## 5. Configurar o iOS

Em `ios/App/App/Info.plist`, dentro do `<dict>` principal:
```xml
<key>GADIsAdManagerApp</key><true/>
<key>GADApplicationIdentifier</key><string>SEU_APP_ID_AQUI</string>
<key>SKAdNetworkItems</key>
<array>
  <dict><key>SKAdNetworkIdentifier</key><string>cstr6suwn9.skadnetwork</string></dict>
</array>
<key>NSUserTrackingUsageDescription</key>
<string>Usamos isso para mostrar anúncios mais relevantes para você.</string>
```

## 6. O código (já pronto, veja `src/lib/ads.js` e `src/components/AdBanner.jsx`)

Troque o `AD_UNIT_ID_BANNER` nesses arquivos pelo seu ID real de bloco de anúncio
(o do banner, não o App ID). Durante o desenvolvimento, use o ID de teste que já
deixei comentado — o Google pode suspender sua conta se detectar cliques reais
em anúncios de um app em teste.

## 7. Rodar e testar

```bash
npx cap open android   # abre no Android Studio
npx cap open ios       # abre no Xcode (Mac)
```

Rode num aparelho ou emulador real pelo próprio Android Studio/Xcode — não dá
para testar anúncios reais fora de um app instalado de verdade.

## 8. Publicar nas lojas

Isso é um projeto à parte (conta de desenvolvedor Google Play custa US$25 uma
vez; Apple Developer custa US$99/ano), com sua própria política de revisão.
Me avisa quando chegar nessa etapa que te ajudo com a ficha da loja, ícones nos
tamanhos certos e o checklist de revisão.
