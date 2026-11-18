<div align="center">

<h1>Liquid Glass</h1>
<p><strong>Surfaces translucides et fonds d’écran personnalisés pour DeepSeek Harness.</strong></p>
<p><code>dsh-liquid-glass</code></p>

<p><a href="README.zh.md">简体中文</a> · <a href="README.md">English</a> · <a href="README.ja.md">日本語</a> · <a href="README.es.md">Español</a> · <strong>Français</strong> · <a href="README.de.md">Deutsch</a> · <a href="README.ru.md">Русский</a> · <a href="README.pt-BR.md">Português (Brasil)</a></p>
<p><a href="CHANGELOG.md">Journal des modifications</a> · <a href="LICENSE">Licence MIT</a></p>

<p>
  <a href="https://www.npmjs.com/package/dsh-liquid-glass"><img alt="Version npm" src="https://img.shields.io/npm/v/dsh-liquid-glass?style=flat-square"></a>
  <a href="https://www.npmjs.com/package/dsh-liquid-glass"><img alt="Téléchargements npm au total" src="https://img.shields.io/npm/dt/dsh-liquid-glass?style=flat-square&amp;label=total%20downloads"></a>
  <a href="https://github.com/Ultroncn/dsh-liquid-glass/actions/workflows/ci.yml"><img alt="CI" src="https://img.shields.io/github/actions/workflow/status/Ultroncn/dsh-liquid-glass/ci.yml?branch=main&amp;style=flat-square&amp;label=CI"></a>
  <a href="docs/v0.4.0-validation.md"><img alt="DSH Web" src="https://img.shields.io/badge/DSH-Web-2563eb?style=flat-square"></a>
  <a href="LICENSE"><img alt="Licence MIT" src="https://img.shields.io/badge/License-MIT-2ea44f?style=flat-square"></a>
  <a href="https://dsh-insights.com/p/Ultroncn/dsh-liquid-glass/"><img alt="DSH Insights" src="https://dsh-insights.com/badge/Ultroncn/dsh-liquid-glass.svg"></a>
</p>

<p><a href="https://awesome-dsh-plugin.com/p/Ultroncn/dsh-liquid-glass/">Catalogue des modules</a> · <a href="https://www.npmjs.com/package/dsh-liquid-glass">npm</a> · <a href="https://github.com/Ultroncn/dsh-liquid-glass/releases">Versions</a> · <a href="https://github.com/Ultroncn/dsh-liquid-glass/issues">Tickets</a></p>

</div>

Liquid Glass ajoute des surfaces translucides et des fonds d’écran avec des images ou des vidéos à [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (DSH). Ce module est maintenu par la communauté.

> **Version 0.6.0.** La rotation se trouve dans la section des fonds d’écran. Vous pouvez ajouter plusieurs images, les remplacer une par une et parcourir jusqu’à six vignettes sur une seule ligne à défilement horizontal. Le [journal des modifications](CHANGELOG.md) décrit la suppression de l’importation et de l’exportation de l’apparence ainsi que les autres nouveautés.

## Installation et ouverture

Cherchez `dsh-liquid-glass` dans le catalogue de modules de DSH et vérifiez que l’auteur est **Ultroncn**. Dans le champ d’ajout de l’application, saisissez `dsh-liquid-glass@0.6.0`. En ligne de commande, remplacez `web` par le profil que vous utilisez pour DSH.

```sh
dsh plugin --profile web add dsh-liquid-glass@0.6.0 --registry=https://registry.npmjs.org/
```

Redémarrez DSH après l’installation ou la mise à jour. Ouvrez **Settings → General → Theme background** (**设置 → 通用 → 主题背景**), sous **Appearance**. L’interrupteur principal commande à la fois l’effet de verre et le fond d’écran. Vos réglages restent enregistrés lorsqu’il est désactivé.

Pour passer à la version 0.6.0, exécutez la même commande. Elle fixe la version et utilise le registre npm officiel. En cas d’erreur `ERR_PNPM_ADDING_TO_ROOT`, ajoutez `-w` après `add`.

## Utilisation

1. Choisissez **Regular**, **Clear** ou **Frost**, puis ajustez la transparence de l’interface entre 3 % et 95 %.
2. Dans **Background**, choisissez une image locale, une URL d’image ou une vidéo MP4/WebM locale de 100 MiB maximum. Le navigateur doit prendre en charge le codec. Dans le sélecteur principal, prévisualisez le fond puis cliquez sur **Save**. Les vidéos tournent en boucle sans son et peuvent être mises en pause.
3. Dans **Background**, cliquez sur **Add images** pour sélectionner plusieurs photos. Cliquez sur une vignette pour l’appliquer ou utilisez le bouton de remplacement. **Rotation settings** règle l’ordre et le moment du changement. La rotation est évaluée à l’ouverture de DSH.
4. Ouvrez **Advanced settings** pour régler les modes clair et sombre séparément, la lisibilité, la teinte, le flou des menus, le cadrage, la position, la luminosité, l’assombrissement et l’affichage d’une image fixe tirée de la vidéo.

## Aperçu

Interface de la version 0.4.0 dans DSH 0.2.2-rc.2 Web.

![Réglages des effets et du fond d’écran dans DSH Web](https://raw.githubusercontent.com/Ultroncn/dsh-liquid-glass/v0.4.0/assets/screenshots/v0.4.0/02-settings-background.jpg)

## Compatibilité et données

Le module est conçu pour DSH Web. L’interface du module est disponible en anglais et en chinois simplifié. Consultez les [résultats de validation](docs/v0.4.0-validation.md) et le [journal des modifications](CHANGELOG.md).

Les réglages et images sont conservés dans le `localStorage` du site, et les vidéos dans IndexedDB. Le module fonctionne sans serveur propre ni télémétrie. Exécutez `dsh plugin --profile web remove dsh-liquid-glass` avec le même profil pour le désinstaller. Supprimez les fonds enregistrés dans les réglages au préalable pour libérer l’espace occupé.
