<div align="center">

<h1>Liquid Glass</h1>
<p><strong>Transparente Oberflächen und eigene Hintergründe für DeepSeek Harness.</strong></p>
<p><code>dsh-liquid-glass</code></p>

<p><a href="README.md">简体中文</a> · <a href="README.en.md">English</a> · <a href="README.ja.md">日本語</a> · <a href="README.es.md">Español</a> · <a href="README.fr.md">Français</a> · <strong>Deutsch</strong> · <a href="README.ru.md">Русский</a> · <a href="README.pt-BR.md">Português (Brasil)</a></p>
<p><a href="CHANGELOG.md">Änderungsprotokoll</a> · <a href="LICENSE">MIT-Lizenz</a></p>

<p>
  <a href="https://www.npmjs.com/package/dsh-liquid-glass"><img alt="npm-Version" src="https://img.shields.io/npm/v/dsh-liquid-glass?style=flat-square"></a>
  <a href="https://www.npmjs.com/package/dsh-liquid-glass"><img alt="npm-Downloads insgesamt" src="https://img.shields.io/npm/dt/dsh-liquid-glass?style=flat-square&amp;label=total%20downloads"></a>
  <a href="https://github.com/Ultroncn/dsh-liquid-glass/actions/workflows/ci.yml"><img alt="CI" src="https://img.shields.io/github/actions/workflow/status/Ultroncn/dsh-liquid-glass/ci.yml?branch=main&amp;style=flat-square&amp;label=CI"></a>
  <a href="docs/v0.4.0-validation.md"><img alt="DSH Web" src="https://img.shields.io/badge/DSH-Web-2563eb?style=flat-square"></a>
  <a href="LICENSE"><img alt="MIT-Lizenz" src="https://img.shields.io/badge/License-MIT-2ea44f?style=flat-square"></a>
  <a href="https://dsh-insights.com/p/Ultroncn/dsh-liquid-glass/"><img alt="DSH Insights" src="https://dsh-insights.com/badge/Ultroncn/dsh-liquid-glass.svg"></a>
</p>

<p><a href="https://awesome-dsh-plugin.com/p/Ultroncn/dsh-liquid-glass/">Plugin-Marktplatz</a> · <a href="https://www.npmjs.com/package/dsh-liquid-glass">npm</a> · <a href="https://github.com/Ultroncn/dsh-liquid-glass/releases">Veröffentlichungen</a> · <a href="https://github.com/Ultroncn/dsh-liquid-glass/issues">Fehler melden</a></p>

</div>

Liquid Glass ergänzt [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (DSH) um einstellbare Glasflächen und Hintergründe aus Bildern oder Videos. Das Plugin wird von der Community gepflegt.

> **Version 0.7.1.** Die Schaltfläche für das nächste Hintergrundbild hat einen dauerhaft sichtbaren Hintergrund. Die Upload-Karte erklärt, dass mehrere Bilder oder jeweils ein Video ausgewählt werden können. Siehe [Änderungsprotokoll](CHANGELOG.md).

## Installieren und öffnen

Suche im DSH-Plugin-Marktplatz nach `dsh-liquid-glass` und prüfe, ob **Ultroncn** als Autor angegeben ist. Gib im Eingabefeld zum Hinzufügen von Plugins `dsh-liquid-glass@0.7.1` ein. Ersetze bei der Installation im Terminal `web` durch dein DSH-Profil.

```sh
dsh plugin --profile web add dsh-liquid-glass@0.7.1 --registry=https://registry.npmjs.org/
```

Starte DSH nach der Installation oder Aktualisierung neu. Öffne **Settings → General → Theme background** (**设置 → 通用 → 主题背景**) unterhalb von **Appearance**. Der Hauptschalter steuert den Glaseffekt und den Hintergrund gemeinsam. Deine Einstellungen bleiben beim Ausschalten gespeichert.

Zum Update auf 0.7.1 führst du denselben Befehl aus. Er gibt die Version vor und nutzt die offizielle npm-Registry. Bei `ERR_PNPM_ADDING_TO_ROOT` füge nach `add` die Option `-w` ein.

## Bedienung

1. Wähle **Regular**, **Clear** oder **Frost** und stelle die Transparenz der Oberfläche zwischen 3 % und 95 % ein.
2. Wähle unter **Background** ein lokales Bild, eine Bild-URL oder ein lokales MP4-/WebM-Video bis 100 MiB. Der Browser muss den Videocodec unterstützen. Prüfe die Vorschau im Hauptbereich und klicke dann auf **Save**. Das Video läuft ohne Ton in einer Schleife und lässt sich anhalten.
3. Wähle unter **Background** mit **Add images or video** mehrere Fotos gleichzeitig. Klicke auf ein Vorschaubild, um es zu verwenden, oder nutze die Schaltfläche zum Ersetzen. Unter **Rotation settings** legst du Reihenfolge und Zeitpunkt fest. DSH prüft beim Start, ob der Hintergrund gewechselt wird.
4. In **Advanced settings** findest du separate Stile für hell und dunkel, Leseschutz, Farbton, Menüunschärfe, Skalierung, Position, Helligkeit und Abdunklung. Für Videos kannst du ein Standbild wählen.

## Bildschirmfoto

Oberfläche der Version 0.4.0 in DSH 0.2.2-rc.2 Web.

![Material- und Hintergrundeinstellungen in DSH Web](https://raw.githubusercontent.com/Ultroncn/dsh-liquid-glass/v0.4.0/assets/screenshots/v0.4.0/02-settings-background.jpg)

## Kompatibilität und Daten

Das Plugin ist für DSH Web vorgesehen. Die Plugin-Oberfläche ist auf Englisch und vereinfachtem Chinesisch verfügbar. Einzelheiten stehen in den [Testergebnissen](docs/v0.4.0-validation.md) und im [Änderungsprotokoll](CHANGELOG.md).

Einstellungen und Bilder liegen im `localStorage` der Website, Videos in IndexedDB. Das Plugin hat keinen eigenen Server und sendet keine Telemetrie. Verwende zum Deinstallieren dasselbe Profil mit `dsh plugin --profile web remove dsh-liquid-glass`. Entferne gespeicherte Hintergründe vorher in den Einstellungen, um den belegten Speicher freizugeben.
