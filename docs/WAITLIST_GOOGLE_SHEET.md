# リリース通知メールを Google スプレッドシートに保存する

「もうすぐリリース」のメールアドレスを Google スプレッドシートに追記するための Google Apps Script です。

## 1. スプレッドシートを用意する

1. [Google スプレッドシート](https://sheets.google.com)で新規作成
2. 1行目に見出しを入れる（例: `メールアドレス` / `登録日時`）
3. ブラウザのURLから **スプレッドシートID** をコピー  
   `https://docs.google.com/spreadsheets/d/【ここがID】/edit`

## 2. Apps Script を設置する

1. スプレッドシートで **拡張機能** → **Apps Script**
2. 出てきたエディタに下のコードを **そのまま貼り付け**
3. 先頭の `SPREADSHEET_ID` を、コピーしたスプレッドシートIDに書き換え
4. **保存**（Ctrl+S / Cmd+S）

```javascript
// スプレッドシートのID（URLの /d/ と /edit のあいだ）
var SPREADSHEET_ID = 'ここにスプレッドシートIDを貼る';

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getActiveSheet();
    var body = e.postData ? JSON.parse(e.postData.contents) : {};
    var email = (body.email || '').trim();
    if (!email) {
      return createResponse(400, { ok: false, error: 'email required' });
    }
    sheet.appendRow([email, new Date()]);
    return createResponse(200, { ok: true });
  } catch (err) {
    return createResponse(500, { ok: false, error: String(err.message) });
  }
}

function createResponse(code, obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
```

## 3. Web アプリとしてデプロイする

1. Apps Script エディタで **デプロイ** → **新しいデプロイ**
2. 種類で **ウェブアプリ** を選択
3. 設定:
   - **説明**: 任意（例: Waitlist）
   - **次のユーザーとして実行**: 自分
   - **アクセスできるユーザー**: **全員**（匿名でフォーム送信できるようにする）
4. **デプロイ** を押す
5. **ウェブアプリの URL** が表示されるのでコピー（`https://script.google.com/macros/s/.../exec`）

## 4. プロジェクトの .env に URL を設定する

Billia のプロジェクト直下の `.env` に次を追加（値はコピーしたURLに置き換え）:

```env
NEXT_PUBLIC_WAITLIST_WEBHOOK_URL=https://script.google.com/macros/s/xxxxxxxx/exec
```

設定後、LP の「通知を受け取る」送信で、同じスプレッドシートの2列目以降にメールアドレスと登録日時が追記されます。

## 補足

- 初回アクセス時に「アプリの確認」が出る場合は **詳細** → **（プロジェクト名）に移動** で続行できます。
- スクリプトを編集し直した場合は **デプロイ** → **デプロイを管理** から **バージョン: 新バージョン** で再デプロイし、同じ URL がそのまま使えます。
