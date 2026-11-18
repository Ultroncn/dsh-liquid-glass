<div align="center">

<h1>Liquid Glass</h1>
<p><strong>Superficies translúcidas y fondos personalizados para DeepSeek Harness.</strong></p>
<p><code>dsh-liquid-glass</code></p>

<p><a href="README.zh.md">简体中文</a> · <a href="README.md">English</a> · <a href="README.ja.md">日本語</a> · <strong>Español</strong> · <a href="README.fr.md">Français</a> · <a href="README.de.md">Deutsch</a> · <a href="README.ru.md">Русский</a> · <a href="README.pt-BR.md">Português (Brasil)</a></p>
<p><a href="CHANGELOG.md">Historial de cambios</a> · <a href="LICENSE">Licencia MIT</a></p>

<p>
  <a href="https://www.npmjs.com/package/dsh-liquid-glass"><img alt="Versión en npm" src="https://img.shields.io/npm/v/dsh-liquid-glass?style=flat-square"></a>
  <a href="https://www.npmjs.com/package/dsh-liquid-glass"><img alt="Descargas totales en npm" src="https://img.shields.io/npm/dt/dsh-liquid-glass?style=flat-square&amp;label=total%20downloads"></a>
  <a href="https://github.com/Ultroncn/dsh-liquid-glass/actions/workflows/ci.yml"><img alt="CI" src="https://img.shields.io/github/actions/workflow/status/Ultroncn/dsh-liquid-glass/ci.yml?branch=main&amp;style=flat-square&amp;label=CI"></a>
  <a href="docs/v0.4.0-validation.md"><img alt="DSH Web" src="https://img.shields.io/badge/DSH-Web-2563eb?style=flat-square"></a>
  <a href="LICENSE"><img alt="Licencia MIT" src="https://img.shields.io/badge/License-MIT-2ea44f?style=flat-square"></a>
  <a href="https://dsh-insights.com/p/Ultroncn/dsh-liquid-glass/"><img alt="DSH Insights" src="https://dsh-insights.com/badge/Ultroncn/dsh-liquid-glass.svg"></a>
</p>

<p><a href="https://awesome-dsh-plugin.com/p/Ultroncn/dsh-liquid-glass/">Catálogo de complementos</a> · <a href="https://www.npmjs.com/package/dsh-liquid-glass">npm</a> · <a href="https://github.com/Ultroncn/dsh-liquid-glass/releases">Versiones</a> · <a href="https://github.com/Ultroncn/dsh-liquid-glass/issues">Incidencias</a></p>

</div>

Liquid Glass añade superficies translúcidas y fondos con imágenes o vídeos a [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (DSH). Es un complemento mantenido por la comunidad.

> **Versión 0.6.0.** La rotación está integrada en la sección de fondos. Puedes añadir varias imágenes a la vez, sustituirlas individualmente y recorrer hasta seis miniaturas en una sola fila con desplazamiento horizontal. Consulta el [historial de cambios](CHANGELOG.md) para ver la retirada de la importación y exportación de apariencia y las demás novedades.

## Instalación y acceso

Busca `dsh-liquid-glass` en el catálogo de complementos de DSH y comprueba que el autor sea **Ultroncn**. En el campo para añadir complementos, introduce `dsh-liquid-glass@0.6.0`. Para usar la terminal, sustituye `web` por el perfil con el que ejecutas DSH.

```sh
dsh plugin --profile web add dsh-liquid-glass@0.6.0 --registry=https://registry.npmjs.org/
```

Reinicia DSH tras instalar o actualizar. Abre **Settings → General → Theme background** (**设置 → 通用 → 主题背景**), debajo de **Appearance**. El interruptor principal activa juntos el efecto de cristal y el fondo. Tus preferencias se conservan al desactivarlo.

Para actualizar a 0.6.0, ejecuta el mismo comando. Fija la versión y usa el registro oficial de npm. Si aparece `ERR_PNPM_ADDING_TO_ROOT`, añade `-w` después de `add`.

## Uso

1. Elige **Regular**, **Clear** o **Frost** y ajusta la transparencia de la interfaz entre el 3 % y el 95 %.
2. En **Background**, selecciona una imagen local, una URL de imagen o un vídeo local MP4/WebM de hasta 100 MiB. El navegador debe admitir el códec. En el selector de fondo principal, revisa la vista previa y pulsa **Save**. Los vídeos se repiten sin sonido y se pueden pausar.
3. En **Background**, usa **Add images** para seleccionar varias fotos de una vez. Pulsa una miniatura para aplicarla o usa su botón de reemplazo. En **Rotation settings** puedes elegir el orden y el intervalo. DSH comprueba si debe cambiar de fondo al abrirse.
4. En **Advanced settings** puedes guardar ajustes distintos para el modo claro y oscuro y configurar la protección de lectura, el tono, el desenfoque de los menús, el encuadre, la posición, el brillo y el oscurecimiento. También puedes mostrar un fotograma fijo del vídeo.

## Vista previa

Interfaz de la versión 0.4.0 en DSH 0.2.2-rc.2 Web.

![Ajustes de materiales y fondos en DSH Web](https://raw.githubusercontent.com/Ultroncn/dsh-liquid-glass/v0.4.0/assets/screenshots/v0.4.0/02-settings-background.jpg)

## Compatibilidad y datos

El complemento está pensado para DSH Web. La interfaz está disponible en inglés y chino simplificado. Consulta las [pruebas de compatibilidad](docs/v0.4.0-validation.md) y el [historial de cambios](CHANGELOG.md).

Las preferencias y las imágenes se guardan en el `localStorage` del sitio y los vídeos en IndexedDB. El complemento funciona sin servidor propio ni telemetría. Para desinstalarlo, ejecuta `dsh plugin --profile web remove dsh-liquid-glass` con el mismo perfil. Para liberar el espacio ocupado por los fondos guardados, elimínalos desde los ajustes antes de desinstalar.
