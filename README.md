# AIの未来

「AIの未来」をテーマにした、ブラウザで動く日本語のプレゼンテーションです。[three.js](https://threejs.org/) で描く全画面の3Dシーンに、HTMLの文字を重ねて表示します。

- 参考にしたスライド: [The Last Boring Slide](https://claude.ai/artifact/Cy2d8Vn63CnzCtonA1LSah)（構成と一部の題材を参考に、日本語で再構成）

## シーン構成

1. AIの未来
2. 倍々の米
3. 任せられる仕事の長さ
4. 自分を作るAI
5. コピーできる知能
6. 一度のずれ
7. 二つの未来
8. いま、ここ
9. 何を望むのか

## 使い方

ビルドは不要です。`index.html` をWebサーバーで配信して、ブラウザで開きます。

```sh
python3 -m http.server
# http://localhost:8000/ を開く
```

WebGLに対応したブラウザ（最新のChrome、Edge、Safari、Firefox）が必要です。three.js とフォントはCDNから読み込みます。

URLのハッシュ（例: `#title-1`）で、シーンとビートを指定して開けます。

## 操作

| キー | 動作 |
| --- | --- |
| → / スペース / Enter | 次へ |
| ← / Backspace | 前へ |
| クリック | 右側で次へ・左端で前へ（左右スワイプも可） |
| N | 発表者ノート |
| O | シーン一覧 |
| F | 全画面 |
| B | 暗転 |
| Home / End | 最初 / 最後 |
| ? | ヘルプ |

## ファイル

| ファイル | 内容 |
| --- | --- |
| `index.html` | ページ本体（スタイルとUIの枠） |
| `deck.js` | シーンの定義と描画（日本語のまま編集する元ファイル） |
| `build.py` | `deck.js` の非ASCII文字を `\uXXXX` に置き換え、`build/deck.js` に書き出す |
| `build/deck.js` | ASCIIだけで書かれた `deck.js` |

`deck.js` を編集したら、次のコマンドで `build/deck.js` を更新します。

```sh
python3 build.py
```

## ライセンス

未定
