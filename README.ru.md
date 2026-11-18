<div align="center">

<h1>Liquid Glass</h1>
<p><strong>Полупрозрачный интерфейс и собственные фоны для DeepSeek Harness.</strong></p>
<p><code>dsh-liquid-glass</code></p>

<p><a href="README.zh.md">简体中文</a> · <a href="README.md">English</a> · <a href="README.ja.md">日本語</a> · <a href="README.es.md">Español</a> · <a href="README.fr.md">Français</a> · <a href="README.de.md">Deutsch</a> · <strong>Русский</strong> · <a href="README.pt-BR.md">Português (Brasil)</a></p>
<p><a href="CHANGELOG.md">История изменений</a> · <a href="LICENSE">Лицензия MIT</a></p>

<p>
  <a href="https://www.npmjs.com/package/dsh-liquid-glass"><img alt="Версия в npm" src="https://img.shields.io/npm/v/dsh-liquid-glass?style=flat-square"></a>
  <a href="https://www.npmjs.com/package/dsh-liquid-glass"><img alt="Всего загрузок из npm" src="https://img.shields.io/npm/dt/dsh-liquid-glass?style=flat-square&amp;label=total%20downloads"></a>
  <a href="https://github.com/Ultroncn/dsh-liquid-glass/actions/workflows/ci.yml"><img alt="CI" src="https://img.shields.io/github/actions/workflow/status/Ultroncn/dsh-liquid-glass/ci.yml?branch=main&amp;style=flat-square&amp;label=CI"></a>
  <a href="docs/v0.4.0-validation.md"><img alt="DSH Web" src="https://img.shields.io/badge/DSH-Web-2563eb?style=flat-square"></a>
  <a href="LICENSE"><img alt="Лицензия MIT" src="https://img.shields.io/badge/License-MIT-2ea44f?style=flat-square"></a>
  <a href="https://dsh-insights.com/p/Ultroncn/dsh-liquid-glass/"><img alt="DSH Insights" src="https://dsh-insights.com/badge/Ultroncn/dsh-liquid-glass.svg"></a>
</p>

<p><a href="https://awesome-dsh-plugin.com/p/Ultroncn/dsh-liquid-glass/">Каталог плагинов</a> · <a href="https://www.npmjs.com/package/dsh-liquid-glass">npm</a> · <a href="https://github.com/Ultroncn/dsh-liquid-glass/releases">Релизы</a> · <a href="https://github.com/Ultroncn/dsh-liquid-glass/issues">Сообщить о проблеме</a></p>

</div>

Liquid Glass добавляет в [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (DSH) полупрозрачные поверхности и фоны из изображений или видео. Плагин поддерживает сообщество.

> **На npm опубликована версия 0.5.0.** В ней есть исходный список смены обоев и импорт и экспорт настроек оформления в JSON. В [ветке main](https://github.com/Ultroncn/dsh-liquid-glass/pull/30) список перенесён в раздел фона. В нём можно разместить до шести миниатюр в одном ряду с горизонтальной прокруткой. Импорт и экспорт настроек удалены. Эти изменения пока не опубликованы в npm.

## Установка и запуск

Найдите `dsh-liquid-glass` в каталоге плагинов DSH и убедитесь, что автор — **Ultroncn**. В поле добавления плагина введите `dsh-liquid-glass@0.5.0`. При установке из терминала замените `web` на профиль, с которым запускаете DSH.

```sh
dsh plugin --profile web add dsh-liquid-glass@0.5.0 --registry=https://registry.npmjs.org/
```

Перезапустите DSH после установки или обновления. Откройте **Settings → General → Theme background** (**设置 → 通用 → 主题背景**) под разделом **Appearance**. Главный переключатель управляет эффектом стекла и фоном одновременно. При выключении настройки сохраняются.

Для обновления до 0.5.0 выполните ту же команду. В ней указана нужная версия и официальный реестр npm. При ошибке `ERR_PNPM_ADDING_TO_ROOT` добавьте `-w` после `add`.

## Использование

1. Выберите **Regular**, **Clear** или **Frost** и настройте прозрачность интерфейса в пределах 3–95 %.
2. В разделе **Background** выберите локальное изображение, ссылку на изображение или локальное видео MP4/WebM размером до 100 MiB. Браузер должен поддерживать видеокодек. Проверьте предпросмотр основного фона и нажмите **Save**. Видео воспроизводится без звука по кругу, его можно приостановить.
3. В версии 0.5.0 добавьте сохранённый фон в **Wallpaper rotation**. По умолчанию смена обоев выключена. Если её включить, DSH проверяет необходимость смены при запуске. В main кнопка **Add images** позволяет выбрать сразу несколько изображений. Нажмите на миниатюру, чтобы применить фон, или замените отдельное изображение.
4. В **Advanced settings** доступны отдельные настройки светлой и тёмной тем, режим для удобства чтения, оттенок, размытие меню, масштаб, положение, яркость и затемнение фона. Для видео можно выбрать стоп-кадр.

## Снимок экрана

Интерфейс версии 0.4.0 в DSH 0.2.2-rc.2 Web.

![Настройки эффектов и фона в DSH Web](https://raw.githubusercontent.com/Ultroncn/dsh-liquid-glass/v0.4.0/assets/screenshots/v0.4.0/02-settings-background.jpg)

## Совместимость и данные

Плагин предназначен для DSH Web. Интерфейс доступен на английском и упрощённом китайском. См. [результаты проверки](docs/v0.4.0-validation.md) и [историю изменений](CHANGELOG.md).

Настройки и изображения хранятся в `localStorage` сайта, видео — в IndexedDB. У плагина нет собственного сервера или телеметрии. Для удаления выполните `dsh plugin --profile web remove dsh-liquid-glass` в том же профиле. Если нужно освободить место, перед удалением плагина уберите сохранённые фоны в настройках.
