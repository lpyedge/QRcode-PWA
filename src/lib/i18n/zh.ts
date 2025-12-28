export const zh = {
  common: {
    copy: '复制',
    open: '打开',
    close: '关闭',
    cancel: '取消',
    confirm: '确认',
    reset: '重置',
    download: '下载',
    upload: '上传',
    delete: '删除',
    remove: '移除',
    start: '开始',
    stop: '停止',
    enable: '启用',
    disable: '禁用',
    transparent: '透明',
    custom: '自定义',
    auto: '跟随',
    none: '无',
    more: '更多…',
    switchType: '切换类型',
    copyContent: '复制内容',
    generating: '生成中…',
    popular: '常用',
    openNav: '打开导航',
  },

  // PWA 离线功能
  pwa: {
    install: {
      title: '安装 QRcode-PWA',
      subtitle: '添加到主屏幕，体验更流畅',
      description: '添加到主屏幕，体验更流畅',
      benefit1: '离线使用，无需网络',
      benefit2: '独立窗口，更加专注',
      benefit3: '快速启动，即开即用',
      later: '稍后再说',
      dismiss: '稍后再说',
      install: '立即安装',
      button: '立即安装',
      installing: '正在安装…',
    },
    update: {
      title: '发现新版本',
      message: '已准备好更新内容',
      later: '稍后',
      reload: '立即刷新',
    },
  },
  commonExtras: {
    currentLogoAlt: '当前 Logo',
    deleteLogo: '删除 Logo',
  },
 
  errors: {
    invalidSettings: '无效的設定物件',
    unsupportedMode: '不支援的模式：{mode}',
  },

  // 二维码生成页面
  generator: {
    title: '二维码生成与风格化',
    subtitle: '移动端默认固定预览；支持渐变、定位点样式、流体模块与 Logo 挖空。',
    previewLabel: '预览',
    
    // 标签页
    tabs: {
      content: '内容',
      design: '设计',
    },

    // 内容模式
    modes: {
      text: '文本',
      url: '链接',
      wifi: 'Wi‑Fi',
      email: '邮件',
      tel: '电话',
      sms: '短信',
      vcard: '名片',
    },

    modeHints: {
      text: '纯文本 / 备注说明',
      url: 'http/https 网站或 H5',
      wifi: '扫码即连热点',
      email: 'mailto 协议',
      tel: '一键拨号',
      sms: '预设号码与内容',
      vcard: 'vCard 3.0',
    },

    modeDescriptions: {
      text: '默认推荐使用「文本」，其它模板按需选择。',
      url: '网址',
    },

    // 表单字段
    fields: {
      textContent: '文本内容',
      textPlaceholder: '输入要编码的文本',
      linkAddress: '链接地址',
      linkPlaceholder: 'https://example.com',
      ssidPlaceholder: '例如 QR_Studio',
      passwordPlaceholder: '可留空',
      emailPlaceholder: 'team@example.com',
      emailSubjectPlaceholder: '例如 活动邀请',
      emailBodyPlaceholder: '请输入邮件内容',
      telPlaceholder: '+86 138 0000 0000',
      smsNumberPlaceholder: '+86 138 0000 0000',
      smsMessagePlaceholder: '例如 我想了解 QRcode-PWA',
      vcardNamePlaceholder: '姓名',
      vcardCompanyPlaceholder: '公司',
      vcardTitlePlaceholder: '职位',
      vcardPhonePlaceholder: '电话',
      vcardEmailPlaceholder: '邮箱',
      vcardWebsitePlaceholder: 'https://',
      vcardAddressPlaceholder: '省市 / 街道 / 邮编',
      wifiName: 'Wi‑Fi 名称',
      wifiPassword: '密码',
      wifiEncryption: '加密',
      wifiHidden: '隐藏网络',
      emailAddress: '邮箱',
      emailSubject: '主题',
      emailBody: '正文',
      phoneNumber: '电话号码',
      smsNumber: '短信号码',
      smsMessage: '短信内容',
      vcardName: '姓名',
      vcardCompany: '公司',
      vcardTitle: '职位',
      vcardPhone: '电话',
      vcardEmail: '邮箱',
      vcardWebsite: '网站',
      vcardAddress: '地址',
    },

    // 加密选项
    encryption: {
      wpa: 'WPA/WPA2',
      wep: 'WEP',
      nopass: '无密码',
    },

    // 设计选项
    design: {
      stylePresets: '风格预设',
      moduleShape: '模块形状',
      moduleColor: '模块',
      directions: {
        'to-r': '右',
        'to-br': '右下',
        'to-b': '下',
        'to-bl': '左下',
        'to-l': '左',
        'to-tl': '左上',
        'to-t': '上',
        'to-tr': '右上',
      },
      color: '颜色',
      gradient: '渐变',
      gradientStart: '起始',
      gradientEnd: '结束',
      gradientDirection: '方向',
      gradientDirections: {
        horizontal: '水平',
        vertical: '垂直',
        diagonal: '对角',
      },
      gradientHint: '开启后模块使用线性渐变填充。',
      
      // 定位点
      finder: '定位点',
      finderBorder: '外框',
      finderCenter: '中心',
      
      // 背景
      background: '背景',
      
      // 输出参数
      output: '输出参数',
      displaySize: '显示尺寸',
      margin: '边距',
      marginUnit: '模块',
      
      // Logo
      logo: 'Logo',
      logoHint: '启用后在中心填充 Logo（容错强制 ≥ Q）',
      logoSize: '大小',
      logoPadding: '留白',
      logoShape: '形状',
      logoBackground: '底板',
      logoBackgroundColor: '底板色',
      logoShapes: {
        rounded: '圆角',
        circle: '圆形',
        square: '方形',
      },
      logoBackgroundModes: {
        auto: '跟随',
        custom: '自定义',
        none: '无',
      },
      logoUploadHint: '上传',
      defaultLogos: '默认 Logo',
    },

    // 风格预设
    presets: {
      classic: {
        name: '经典',
        hint: '黑白像素',
      },
      dots: {
        name: '圆点',
        hint: '更柔和',
      },
      rounded: {
        name: '圆角',
        hint: '轻圆角模块',
      },
      fluid: {
        name: '流体',
        hint: '边角圆润连接',
      },
      neon: {
        name: '霓虹渐变',
        hint: '强对比渐变',
      },
      invert: {
        name: '反白',
        hint: '深色背景更醒目',
      },
    },

    // 形状选项
    shapes: {
      square: { label: '像素', desc: '经典模块方块' },
      circle: { label: '圆点', desc: '圆形模块' },
      rounded: { label: '圆角', desc: '轻圆角模块' },
      fluid: { label: '流体', desc: '按邻接圆润边角' },
    },

    // 定位点形状
    eyeShapes: {
      square: '方形',
      circle: '圆形',
    },

    // 容错级别
    errorCorrection: {
      label: '容错',
      logoHint: 'Logo 已启用：容错最低为 Q',
    },

    // 下载格式
    formats: {
      png: 'PNG',
      jpg: 'JPG',
      svg: 'SVG',
    },

    // 模板预览
    templatePreview: {
      title: '模板预览',
      show: '查看',
      hide: '隐藏',
      hint: '需要时再展开，减少页面占用。',
    },

    previewEmpty: '输入内容后自动生成预览',
    fullscreenPreview: '全屏预览',

    // 默认表单值（用于初始化表单）
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
      vcardAddress: '',
    },

    // 消息
    messages: {
      copied: '内容已复制',
      qrCopied: '二维码已复制',
      generateFailed: '生成失败',
      copyFailed: '复制失败',
    },
  },

  // 二维码扫描页面
  scanner: {
    title: '浏览器端扫码识别',
    subtitle: 'ZXing 支持 HTTPS 摄像头实时解码，并可复制或跳转内容。',
    
    // 扫描器标题
    scannerTitle: '实时摄像头扫码',
    scannerSubtitle: '推荐在 HTTPS 环境使用，移动端请允许摄像头权限。',
    
    // 表单
    cameraLabel: '摄像头',
    noCameraDetected: '未检测到摄像头',
    cameraDefault: '摄像头',
    
    // 按钮
    startScanning: '开始扫描',
    stopScanning: '停止扫描',
    scanFromImage: '从图片识别',
    toggleTorch: {
      on: '关闭补光',
      off: '开启补光',
    },
    openOrCopy: '打开 / 复制',
    copyText: '复制文本',
    
    // 状态
    waitingCamera: '等待相机就绪：',
    scanning: '扫描中…',
    
    // 结果
    result: {
      title: '结果',
      label: '扫描结果：',
      empty: '暂无结果，开始扫描或上传二维码图片。',
    },
    
    // 历史记录
    history: {
      title: '历史记录',
      empty: '暂无历史记录',
      content: '内容：',
      sources: {
        camera: 'camera',
        upload: 'upload',
      },
    },
    
    // 错误消息
    errors: {
      notSupported: '当前浏览器不支持摄像头调用',
      permissionDenied: '摄像头权限被拒绝，请在系统或浏览器中开启权限',
      startFailed: '无法启动摄像头，请检查权限或设备占用情况',
      uploadFailed: '无法识别上传的图片，请尝试清晰二维码',
      copyNotSupported: '当前环境不支持自动复制，请手动复制',
    },
  },

  // 关于页面
  about: {
    title: '关于',
    hero: {
      tagline: 'SvelteKit + Tailwind CSS',
      title: '一站式二维码生成与扫码体验',
      body: '在电脑、手机、平板等多端保持一致的流畅体验。支持个性化生成二维码、实时扫码、离线缓存和主题适配。',
      ctaStart: '开始生成',
      ctaScan: '进入扫码',
    },
    pwa: {
      ready: 'PWA ready',
      response: '100% Response',
      hint: '离线缓存、适配暗色模式、多语言占位',
    },
    stats: {
      crossPlatform: '跨端适配',
      fps: '扫码帧率',
      max: '生成上限',
      offline: '离线支持',
    },
    features: {
      f1: { title: '智能生成', body: '多模板与色彩系统随心组合，实时预览精准同步到桌面与移动端。' },
      f2: { title: '安全扫码', body: 'ZXing 浏览器内核 + HTTPS 摄像头权限，自动识别 URL/文本并提示风险。' },
      f3: { title: 'PWA 离线', body: 'service worker + manifest 组合，支持离线缓存、安装与推送扩展。' },
    },
    sections: {
      install: { title: '安装到桌面', body: '在支持的浏览器中点击地址栏的“安装”图标，即可在桌面/手机上获得类原生体验。' },
      https: { title: 'HTTPS 提示', body: '摄像头权限仅在 HTTPS 下可用，若使用本地网络请开启 `npm run dev -- --host --https`。' },
      extend: { title: '扩展能力', body: '可挂载后端接口进行扫码安全校验、生成统计或账号同步。' },
    },
  },

  app: {
    title: 'QRcode-PWA - 二维码生成与扫描',
    description: '免费在线二维码生成器与扫描器。支持自定义颜色、Logo，快速识别二维码。PWA支持离线使用。',
    keywords: '二维码, QR Code, 生成器, 扫描器, PWA, 在线工具',
  },

  nav: {
    generator: 'QR 生成',
    scan: 'QR 识别',
    about: '关于',
  },

  footer: {
    tagline: '跨端二维码体验',
  },

  payloads: {
    errors: {
      enterText: '请输入文本内容',
      textTooLong: '文本内容过长，请限制在 4000 字符以内',
      enterLink: '请输入链接地址',
      invalidLink: '请输入有效的 HTTP 或 HTTPS 链接',
      linkTooLong: '链接地址过长，请限制在 2048 字符以内',
      enterSsid: '请输入 Wi-Fi 网络名称 (SSID)',
      wifiNeedPassword: '{encryption} 加密的网络需要密码',
      enterEmail: '请输入邮箱地址',
      invalidEmail: '请输入有效的邮箱地址',
      enterValidPhone: '请输入有效的电话号码',
      enterValidSms: '请输入有效的短信号码',
      enterContactName: '请输入联系人姓名',
    },
  },

  utils: {
    renderSvgToBlob: {
      browserError: "renderSvgToBlob 需要瀏覽器環境",
      viewBoxError: "SVG 缺少有效的 viewBox",
      rasterSizeError: "請求的光柵大小過大",
      failedLoadSvg: 'SVG 圖像載入失敗',
      failedExport: '導出光柵圖像失敗',
    },
    qrStylize: {
      imageUrl: "圖片 URL 用於 <image href=\"...\">",
      bgRole: "背景",
      moduleRole: "模塊",
    },
    qrencode: {
      svgTag: "SVG 標籤",
      rectTag: "矩形標籤",
    },
    errors: {
      context2DUnavailable: '2D 上下文不可用',
      imageDataAccess: '無法訪問圖像數據（畫布可能被跨域內容污染）',
      imageNoSize: '圖像沒有內建尺寸',
      videoNoFrame: '視頻當前尚未有畫面尺寸，請等待準備就緒',
      unsupportedElement: '不支援的元素類型',
      fileNotImage: '檔案不是圖像',
      failedLoadImage: '載入圖像失敗',
      noFileProvided: '未提供檔案',
      invalidQrMatrix: '無效的 QR 矩陣',
      jaggedQrMatrix: '不支援不規則的 QR 矩陣',
    },
    qrcore: {
      unexpectedMatrixSize: 'QR 矩陣大小不正確：{w}x{h}，不是有效的 QR 模組網格。',
      rgbaLengthMismatch: 'RGBA 長度不匹配：得到 {got}，預期 {expected} ({w}x{h})',
    },
  },

  pages: {
    generator: {
      title: "QRcode-PWA 生成器",
    },
  },

  layout: {
    appName: "QRcode-PWA",
  },
  components: {
    stylePicker: {
      ariaLabel: '样式选择器',
      noneSelected: '未选择',
      mobileToggle: '样式︾',
      close: '关闭',
    },
    colorSwatch: {
      ariaLabel: '选择颜色',
    },
    colorPicker: {
      label: '颜色',
      close: '关闭',
      copy: '复制颜色',
      cancel: '取消',
      confirm: '确认',
      hexPlaceholder: '请输入 6 位十六进制颜色（不含 #）',
      hexError: '请输入 6 位十六进制颜色（不含 #）',
    },
    logoPicker: {
      defaultLogos: '默认 Logo 网格',
      currentLogo: '当前 Logo 预览',
      uploadArea: '上传区域',
      hasLogo: '显示预览 + 删除按钮',
      noLogo: '没有 Logo 时显示上传',
      sizeAndPadding: '大小 + 留白滑块',
      shapeAndBackground: '形状 + 底板',
      customBgColor: '自定义底板颜色',
    },
  },
};

export type Translations = typeof zh;
