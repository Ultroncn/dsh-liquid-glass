<div align="center">

<h1>Liquid Glass</h1>
<p><strong>DeepSeek Harness にガラス効果と画像・動画の背景を追加。</strong></p>
<p><code>dsh-liquid-glass</code></p>

<p><a href="README.zh.md">简体中文</a> · <a href="README.md">English</a> · <strong>日本語</strong> · <a href="README.es.md">Español</a> · <a href="README.fr.md">Français</a> · <a href="README.de.md">Deutsch</a> · <a href="README.ru.md">Русский</a> · <a href="README.pt-BR.md">Português (Brasil)</a></p>
<p><a href="CHANGELOG.md">変更履歴</a> · <a href="LICENSE">MIT ライセンス</a></p>

<p>
  <a href="https://www.npmjs.com/package/dsh-liquid-glass"><img alt="npm バージョン" src="https://img.shields.io/npm/v/dsh-liquid-glass?style=flat-square"></a>
  <a href="https://www.npmjs.com/package/dsh-liquid-glass"><img alt="npm の総ダウンロード数" src="https://img.shields.io/npm/dt/dsh-liquid-glass?style=flat-square&amp;label=total%20downloads"></a>
  <a href="https://github.com/Ultroncn/dsh-liquid-glass/actions/workflows/ci.yml"><img alt="CI" src="https://img.shields.io/github/actions/workflow/status/Ultroncn/dsh-liquid-glass/ci.yml?branch=main&amp;style=flat-square&amp;label=CI"></a>
  <a href="docs/v0.4.0-validation.md"><img alt="DSH Web" src="https://img.shields.io/badge/DSH-Web-2563eb?style=flat-square"></a>
  <a href="LICENSE"><img alt="MIT ライセンス" src="https://img.shields.io/badge/License-MIT-2ea44f?style=flat-square"></a>
  <a href="https://dsh-insights.com/p/Ultroncn/dsh-liquid-glass/"><img alt="DSH Insights" src="https://dsh-insights.com/badge/Ultroncn/dsh-liquid-glass.svg"></a>
</p>

<p><a href="https://awesome-dsh-plugin.com/p/Ultroncn/dsh-liquid-glass/">プラグインマーケット</a> · <a href="https://www.npmjs.com/package/dsh-liquid-glass">npm</a> · <a href="https://github.com/Ultroncn/dsh-liquid-glass/releases">リリース</a> · <a href="https://github.com/Ultroncn/dsh-liquid-glass/issues">問題報告</a></p>

</div>

Liquid Glass は [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（DSH）の画面に、透明度を調整できるガラス効果と画像・動画の背景を追加するコミュニティ製プラグインです。

> **npm で公開中の 0.5.0** には、従来の壁紙ローテーションと外観設定の JSON インポート・エクスポートがあります。[main ブランチの変更](https://github.com/Ultroncn/dsh-liquid-glass/pull/30)では、ローテーションを背景欄に移し、最大 6 件のサムネイルを横スクロールできる 1 行にまとめています。外観設定のインポート・エクスポートは削除されました。これらの変更は次回のパッケージ公開待ちです。

## インストールと起動

DSH のプラグインマーケットで `dsh-liquid-glass` を検索し、作者が **Ultroncn** であることを確認します。アプリのプラグイン追加欄には `dsh-liquid-glass@0.5.0` と入力します。CLI の例では `web` プロファイルを使っています。実際のプロファイル名に置き換えてください。

```sh
dsh plugin --profile web add dsh-liquid-glass@0.5.0 --registry=https://registry.npmjs.org/
```

インストールや更新のあとに DSH を再起動し、**Settings → General → Theme background**（**设置 → 通用 → 主题背景**）を開きます。メインスイッチでガラス効果と背景をまとめて切り替えます。オフにしても設定は保持されます。

0.5.0 に更新するときも同じコマンドを実行します。バージョンを指定し、公式の npm レジストリを利用します。`ERR_PNPM_ADDING_TO_ROOT` が出た場合は、`add` のあとに `-w` を追加します。

## 使い方

1. **Regular**、**Clear**、**Frost** から質感を選び、画面の透明度を 3%〜95% の範囲で調整します。
2. **Background** でローカル画像、画像 URL、100 MiB 以下のローカル MP4/WebM を選びます。動画はブラウザーが対応する形式に限ります。メインの背景選択ではプレビューしてから **Save** を押します。動画は無音でループ再生され、一時停止もできます。
3. 0.5.0 では保存した背景を **Wallpaper rotation** に追加します。ローテーションは初期状態ではオフで、有効にすると DSH を開くときに切り替えを判定します。main では **Add images** から複数選択でき、サムネイルをクリックして適用したり、個別に置き換えたりできます。
4. **Advanced settings** では明暗テーマごとの外観、読みやすさの保護、色合い、メニューのぼかし、背景の大きさ・位置・明るさ・暗さ、動画の静止画を設定できます。

## スクリーンショット

DSH 0.2.2-rc.2 Web で撮影した 0.4.0 の画面です。

![DSH Web の質感と背景の設定](https://raw.githubusercontent.com/Ultroncn/dsh-liquid-glass/v0.4.0/assets/screenshots/v0.4.0/02-settings-background.jpg)

## 互換性とデータ

DSH Web 用です。表示言語は英語と簡体字中国語です。[検証記録](docs/v0.4.0-validation.md)と[変更履歴](CHANGELOG.md)で動作確認の詳細を参照できます。

設定と画像はサイトの `localStorage`、動画は IndexedDB に保存されます。サーバー機能やテレメトリーはありません。アンインストールには同じプロファイルで `dsh plugin --profile web remove dsh-liquid-glass` を実行します。保存済みのメディアを削除するには、先に設定で背景を取り除いてください。
