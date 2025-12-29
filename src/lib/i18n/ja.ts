export const ja = {
  common: {
    copy: 'コピー',
    open: '開く',
    close: '閉じる',
    cancel: 'キャンセル',
    confirm: '確認',
    reset: 'リセット',
    download: 'ダウンロード',
    upload: 'アップロード',
    delete: '削除',
    remove: '削除',
    start: '開始',
    stop: '停止',
    enable: '有効',
    disable: '無効',
    transparent: '透明',
    custom: 'カスタム',
    auto: '自動',
    none: 'なし',
    more: 'もっと…',
    switchType: '種類を切り替え',
    copyContent: '内容をコピー',
    generating: '生成中…',
    popular: '人気',
    openNav: 'ナビゲーションを開く'
  },

  pwa: {
    install: {
      title: 'QRcode-PWA をインストール',
      subtitle: 'ホーム画面に追加して、より快適に利用できます',
      description: 'ホーム画面に追加して、より快適に利用できます',
      benefit1: 'オフラインで利用（通信不要）',
      benefit2: 'アプリ風の独立ウィンドウで集中',
      benefit3: '高速起動ですぐ使える',
      later: '後で',
      dismiss: '今はしない',
      install: '今すぐインストール',
      button: '今すぐインストール',
      installing: 'インストール中…'
    },

    update: {
      title: '新しいバージョンがあります',
      message: '更新の準備ができました',
      later: '後で',
      reload: '今すぐ更新'
    }
  },

  commonExtras: {
    currentLogoAlt: '現在のロゴ',
    deleteLogo: 'ロゴを削除'
  },

  errors: {
    invalidSettings: '設定オブジェクトが不正です',
    unsupportedMode: '未対応のモード：{mode}'
  },

  generator: {
    title: 'QRコード生成＆デザイン',
    previewLabel: 'プレビュー',

    tabs: {
      content: '内容',
      design: 'デザイン'
    },

    modes: {
      text: 'テキスト',
      url: 'URL',
      wifi: 'Wi‑Fi',
      email: 'メール',
      tel: '電話',
      sms: 'SMS',
      vcard: '連絡先'
    },

    modeHints: {
      text: 'プレーンテキスト / メモ',
      url: 'http/https のWebサイト',
      wifi: 'スキャンしてWi‑Fiに接続',
      email: 'mailto スキーム',
      tel: 'タップで発信',
      sms: '宛先と本文を事前設定',
      vcard: 'vCard 3.0'
    },

    modeDescriptions: {
      text: '基本は「テキスト」がおすすめ。必要に応じてテンプレートを選択してください。',
      url: 'WebサイトのURL'
    },

    fields: {
      textContent: 'テキスト内容',
      textPlaceholder: 'エンコードする内容を入力',

      linkAddress: 'URL',
      linkPlaceholder: 'https://example.com',

      ssidPlaceholder: '例：QR_Studio',
      passwordPlaceholder: '任意',

      emailPlaceholder: 'team@example.com',
      emailSubjectPlaceholder: '例：イベント招待',
      emailBodyPlaceholder: '本文を入力',

      telPlaceholder: '+81 90 0000 0000',
      smsNumberPlaceholder: '+81 90 0000 0000',
      smsMessagePlaceholder: '例：QRcode-PWA について教えてください',

      vcardNamePlaceholder: '氏名',
      vcardCompanyPlaceholder: '会社名',
      vcardTitlePlaceholder: '役職',
      vcardPhonePlaceholder: '電話番号',
      vcardEmailPlaceholder: 'メール',
      vcardWebsitePlaceholder: 'https://',
      vcardAddressPlaceholder: '住所（市区町村 / 番地 / 郵便番号）',

      wifiName: 'Wi‑Fi 名',
      wifiPassword: 'パスワード',
      wifiEncryption: '暗号化',
      wifiHidden: '非公開ネットワーク',

      emailAddress: 'メール',
      emailSubject: '件名',
      emailBody: '本文',

      phoneNumber: '電話番号',

      smsNumber: 'SMS 宛先',
      smsMessage: 'SMS 本文',

      vcardName: '氏名',
      vcardCompany: '会社名',
      vcardTitle: '役職',
      vcardPhone: '電話番号',
      vcardEmail: 'メール',
      vcardWebsite: 'Webサイト',
      vcardAddress: '住所'
    },

    encryption: {
      wpa: 'WPA/WPA2',
      wep: 'WEP',
      nopass: 'パスワードなし'
    },

    design: {
      stylePresets: 'プリセット',
      moduleShape: 'モジュール形状',
      moduleColor: 'モジュール',

      directions: {
        'to-r': '右',
        'to-br': '右下',
        'to-b': '下',
        'to-bl': '左下',
        'to-l': '左',
        'to-tl': '左上',
        'to-t': '上',
        'to-tr': '右上'
      },

      color: '色',
      gradient: 'グラデーション',
      gradientStart: '開始',
      gradientEnd: '終了',
      gradientDirection: '方向',

      gradientDirections: {
        horizontal: '水平',
        vertical: '垂直',
        diagonal: '斜め'
      },

      gradientHint: '有効にすると、モジュールが線形グラデーションで塗りつぶされます。',

      finder: 'ファインダー',
      finderBorder: '外枠',
      finderCenter: '中心',

      background: '背景',

      output: '出力',
      displaySize: '表示サイズ',
      margin: '余白',
      marginUnit: 'モジュール',

      logo: 'ロゴ',
      logoHint: '有効にすると中央にロゴを配置（誤り訂正は最低でも Q）',
      logoSize: 'サイズ',
      logoPadding: '余白（パディング）',
      logoShape: '形状',
      logoBackground: '土台',
      logoBackgroundColor: '土台の色',

      logoShapes: {
        rounded: '角丸',
        circle: '円',
        square: '四角'
      },

      logoBackgroundModes: {
        auto: '自動',
        custom: 'カスタム',
        none: 'なし'
      },

      logoUploadHint: 'アップロード',
      defaultLogos: 'デフォルトロゴ'
    },

    presets: {
      classic: { name: 'クラシック', hint: '白黒の基本スタイル' },
      dots: { name: 'ドット', hint: 'やわらかい印象' },
      rounded: { name: '角丸', hint: '軽い角丸モジュール' },
      fluid: { name: '流体', hint: 'つながる角丸' },
      neon: { name: 'ネオン（グラデ）', hint: '高コントラスト' },
      invert: { name: '反転', hint: '暗い背景で見やすい' }
    },

    shapes: {
      square: { label: 'ピクセル', desc: '基本の四角モジュール' },
      circle: { label: 'ドット', desc: '円形モジュール' },
      rounded: { label: '角丸', desc: '軽い角丸モジュール' },
      fluid: { label: '流体', desc: '隣接に応じて角を丸める' }
    },

    eyeShapes: {
      square: '四角',
      circle: '円'
    },

    errorCorrection: {
      label: '誤り訂正',
      logoHint: 'ロゴ有効：最低レベルは Q'
    },

    formats: {
      png: 'PNG',
      jpg: 'JPG',
      svg: 'SVG'
    },

    templatePreview: {
      title: 'テンプレートプレビュー',
      show: '表示',
      hide: '非表示',
      hint: '必要なときだけ展開してスペースを節約します。'
    },

    previewEmpty: '内容を入力すると自動でプレビューを生成します',
    fullscreenPreview: '全画面プレビュー',

    defaults: {
      content: '',
      linkUrl: '',
      emailAddress: '',
      emailSubject: '',
      emailBody: '',
      telNumber: '',
      smsNumber: '',
      smsMessage: '',
      vcardFullName: '',
      vcardCompany: '',
      vcardTitle: '',
      vcardPhone: '',
      vcardEmail: '',
      vcardWebsite: '',
      vcardAddress: ''
    },

    messages: {
      copied: '内容をコピーしました',
      qrCopied: 'QRコードをコピーしました',
      generateFailed: '生成に失敗しました',
      copyFailed: 'コピーに失敗しました'
    }
  },

  scanner: {
    title: 'QRコードスキャン',

    subtitle: 'カメラでスキャンするか、QRコード画像をアップロード。',

    cameraLabel: 'カメラ',
    noCameraDetected: 'カメラが見つかりません',
    cameraDefault: 'カメラ',

    startScanning: 'スキャン開始',
    stopScanning: 'スキャン停止',
    scanFromImage: '画像から解析',

    toggleTorch: {
      on: 'ライトを消す',
      off: 'ライトを点ける'
    },

    openOrCopy: '開く / コピー',
    copyText: 'テキストをコピー',

    waitingCamera: 'カメラを準備中：',
    scanning: 'スキャン中…',

    result: {
      title: '結果',
      label: '解析結果：',
      empty: 'まだ結果がありません。スキャン開始または画像をアップロードしてください。'
    },

    history: {
      title: '履歴',
      empty: '履歴はありません',
      content: '内容：',
      sources: {
        camera: 'camera',
        upload: 'upload'
      }
    },

    errors: {
      notSupported: 'このブラウザはカメラアクセスに対応していません',
      permissionDenied: 'カメラ権限が拒否されました。システムまたはブラウザ設定で許可してください',
      startFailed: 'カメラを開始できませんでした。権限や他アプリの使用状況を確認してください',
      uploadFailed: '画像を読み取れませんでした。より鮮明なQR画像をお試しください',
      copyNotSupported: 'この環境では自動コピーに対応していません。手動でコピーしてください'
    }
  },

  about: {
    title: 'このサイトについて',

    hero: {
      tagline: 'SvelteKit + Tailwind CSS',
      title: 'QRコード生成＆スキャンをひとつに',
      body: 'PC/スマホ/タブレットで一貫した体験。デザインQR生成、ライブスキャン、オフラインキャッシュ、テーマ適応に対応。',
      ctaStart: '生成を開始',
      ctaScan: 'スキャナーへ'
    },

    pwa: {
      ready: 'PWA 対応',
      response: '高速レスポンス',
      hint: 'オフラインキャッシュ、ダークモード、多言語プレースホルダー'
    },

    stats: {
      crossPlatform: 'クロスプラットフォーム',
      fps: 'スキャン FPS',
      max: '最大容量',
      offline: 'オフライン対応'
    },

    features: {
      f1: {
        title: 'スマート生成',
        body: 'テンプレートと色を自由に組み合わせ、プレビューをリアルタイムで同期。'
      },
      f2: {
        title: '安全なスキャン',
        body: 'ブラウザ内 ZXing + HTTPS カメラ権限。URL/テキストを自動判別し、注意を促します。'
      },
      f3: {
        title: 'PWA オフライン',
        body: 'Service Worker + Manifest により、オフラインキャッシュ、インストール、拡張に対応。'
      }
    },

    sections: {
      install: {
        title: 'デスクトップにインストール',
        body: '対応ブラウザでは、アドレスバーの「インストール」アイコンからアプリのように利用できます。'
      },
      https: {
        title: 'HTTPS について',
        body: 'カメラ権限は HTTPS 環境でのみ利用できます。ローカルネットワークでの利用は `npm run dev -- --host --https` を有効にしてください。'
      },
      extend: {
        title: '拡張性',
        body: 'バックエンドAPIを連携して、危険URLチェック、生成統計、アカウント同期などを追加できます。'
      }
    }
  },

  app: {
    title: 'QRcode-PWA - QRコード生成＆スキャナー',
    description:
      '無料のQRコード生成＆スキャナー。URL、Wi‑Fi、vCard、メールなどを作成し、色やロゴでカスタマイズ。ブラウザでスキャンでき、PWA でオフライン利用も可能。',
    keywords:
      'QRコード 生成, QRコード スキャナー, QRコード 作成, QRコード 読み取り, Wi‑Fi QR, vCard QR, オンライン QR ツール'
  },

  seo: {
    generator: {
      title: 'QRコード生成 - URL/Wi‑Fi/vCard などを簡単作成',
      description: 'URL、Wi‑Fi、メール、電話、vCard のQRコードを作成。色・グラデーション・ロゴに対応し、即時プレビューできます。',
      keywords: 'QRコード 生成, QRコード 作成, Wi‑Fi QR, vCard QR, ロゴ入り QR'
    },

    scan: {
      title: 'QRコードスキャナー - カメラ/画像でオンライン解析',
      description: 'ブラウザでカメラを使ってQRコードをスキャン、または画像をアップロードして解析・コピーできます。',
      keywords: 'QRコード 読み取り, QRコード スキャン, QRコード 解析, カメラ QR, オンライン QR'
    },

    about: {
      title: 'QRcode-PWA について - 機能とオフライン対応',
      description: 'QRcode-PWA の機能：デザインQR生成、ブラウザスキャン、PWA インストール、オフライン対応。',
      keywords: 'PWA QR, オフライン QR 生成, QR ツール, QR 機能'
    },

    language: {
      title: '言語を選択 | QRcode-PWA',
      description: 'QRコード生成・スキャンを利用する言語を選択してください。',
      keywords: '言語選択, QRコード 生成 言語'
    }
  },

  language: {
    eyebrow: '言語',
    title: '言語を選択',
    description: 'QRコード生成、スキャナー、ヘルプページを開く言語を選んでください。'
  },

  nav: {
    generator: '生成',
    scan: 'スキャン',
    about: '概要'
  },

  footer: {
    tagline: 'クロスデバイス QR 体験'
  },

  payloads: {
    errors: {
      enterText: 'テキストを入力してください',
      textTooLong: 'テキストが長すぎます（4000 文字以内にしてください）',
      enterLink: 'URL を入力してください',
      invalidLink: '有効な HTTP / HTTPS URL を入力してください',
      linkTooLong: 'URL が長すぎます（2048 文字以内にしてください）',
      enterSsid: 'Wi‑Fi 名（SSID）を入力してください',
      wifiNeedPassword: '{encryption} のネットワークにはパスワードが必要です',
      enterEmail: 'メールアドレスを入力してください',
      invalidEmail: '有効なメールアドレスを入力してください',
      enterValidPhone: '有効な電話番号を入力してください',
      enterValidSms: '有効な SMS 宛先を入力してください',
      enterContactName: '連絡先の名前を入力してください'
    }
  },

  utils: {
    renderSvgToBlob: {
      browserError: 'renderSvgToBlob はブラウザ環境が必要です',
      viewBoxError: 'SVG に有効な viewBox がありません',
      rasterSizeError: '指定したラスタサイズが大きすぎます',
      failedLoadSvg: 'SVG の読み込みに失敗しました',
      failedExport: 'ラスタ画像の書き出しに失敗しました'
    },

    qrStylize: {
      imageUrl: '画像 URL：',
      bgRole: '背景',
      moduleRole: 'モジュール'
    },

    qrencode: {
      svgTag: 'SVG タグ',
      rectTag: 'Rect タグ'
    },

    errors: {
      context2DUnavailable: '2D コンテキストを取得できません',
      imageDataAccess: '画像データにアクセスできません（canvas がクロスオリジンで汚染されている可能性があります）',
      imageNoSize: '画像に固有サイズがありません',
      videoNoFrame: '動画のフレームサイズが未確定です。準備ができるまでお待ちください',
      unsupportedElement: '未対応の要素タイプです',
      fileNotImage: '画像ファイルではありません',
      failedLoadImage: '画像の読み込みに失敗しました',
      noFileProvided: 'ファイルが指定されていません',
      invalidQrMatrix: 'QR マトリクスが不正です',
      jaggedQrMatrix: '非矩形の QR マトリクスには対応していません'
    },

    qrcore: {
      unexpectedMatrixSize: 'QR マトリクスサイズが不正：{w}x{h}（有効なモジュールグリッドではありません）',
      rgbaLengthMismatch: 'RGBA 長さが一致しません：{got} / {expected}（{w}x{h}）'
    }
  },

  pages: {},
  layout: {
    appName: 'QRcode-PWA'
  },

  components: {
    stylePicker: {
      ariaLabel: 'スタイル選択',
      noneSelected: '未選択',
      mobileToggle: 'スタイル︾',
      close: '閉じる'
    },

    colorSwatch: {
      ariaLabel: '色を選択'
    },

    colorPicker: {
      label: '色',
      close: '閉じる',
      copy: '色をコピー',
      cancel: 'キャンセル',
      confirm: '確認',
      hexPlaceholder: '6 桁の HEX（#なし）を入力',
      hexError: '6 桁の HEX（#なし）を入力してください'
    },

    logoPicker: {
      defaultLogos: 'デフォルトロゴ一覧',
      currentLogo: '現在のロゴプレビュー',
      uploadArea: 'アップロードエリア',
      hasLogo: 'プレビュー + 削除ボタンを表示',
      noLogo: 'ロゴがない場合はアップロードを表示',
      sizeAndPadding: 'サイズ + 余白スライダー',
      shapeAndBackground: '形状 + 土台',
      customBgColor: '土台色をカスタム'
    }
  }
};

export type Translations = typeof ja;
