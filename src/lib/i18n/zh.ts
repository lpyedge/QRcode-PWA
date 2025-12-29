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
    auto: '自动',
    none: '无',
    more: '更多…',
    switchType: '切换类型',
    copyContent: '复制内容',
    generating: '生成中…',
    popular: '常用',
    openNav: '打开导航'
  },

  pwa: {
    install: {
      title: '安装 QRcode-PWA',
      subtitle: '添加到主屏幕，体验更流畅',
      description: '添加到主屏幕，体验更流畅',
      benefit1: '离线使用，无需网络',
      benefit2: '独立窗口，更加专注',
      benefit3: '快速启动，即开即用',
      later: '稍后再说',
      dismiss: '暂不',
      install: '立即安装',
      button: '立即安装',
      installing: '正在安装…'
    },

    update: {
      title: '发现新版本',
      message: '更新已就绪',
      later: '稍后',
      reload: '立即刷新'
    }
  },

  commonExtras: {
    currentLogoAlt: '当前 Logo',
    deleteLogo: '删除 Logo'
  },

  errors: {
    invalidSettings: '无效的设置对象',
    unsupportedMode: '不支持的模式：{mode}'
  },

  generator: {
    title: '二维码生成与风格化',
    subtitle: '移动端默认固定预览；支持渐变、定位点样式、流体模块与 Logo 挖空。',
    previewLabel: '预览',

    tabs: {
      content: '内容',
      design: '设计'
    },

    modes: {
      text: '文本',
      url: '链接',
      wifi: 'Wi‑Fi',
      email: '邮件',
      tel: '电话',
      sms: '短信',
      vcard: '名片'
    },

    modeHints: {
      text: '纯文本 / 备注说明',
      url: 'http/https 网站或 H5',
      wifi: '扫码即连热点',
      email: 'mailto 协议',
      tel: '一键拨号',
      sms: '预设号码与内容',
      vcard: 'vCard 3.0'
    },

    modeDescriptions: {
      text: '默认推荐使用「文本」，其它模板按需选择。',
      url: '网址'
    },

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
      vcardAddress: '地址'
    },

    encryption: {
      wpa: 'WPA/WPA2',
      wep: 'WEP',
      nopass: '无密码'
    },

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
        'to-tr': '右上'
      },

      color: '颜色',
      gradient: '渐变',
      gradientStart: '起始',
      gradientEnd: '结束',
      gradientDirection: '方向',

      gradientDirections: {
        horizontal: '水平',
        vertical: '垂直',
        diagonal: '对角'
      },

      gradientHint: '开启后模块使用线性渐变填充。',

      finder: '定位点',
      finderBorder: '外框',
      finderCenter: '中心',

      background: '背景',

      output: '输出参数',
      displaySize: '显示尺寸',
      margin: '边距',
      marginUnit: '模块',

      logo: 'Logo',
      logoHint: '启用后在中心放置 Logo（容错强制 ≥ Q）',
      logoSize: '大小',
      logoPadding: '留白',
      logoShape: '形状',
      logoBackground: '底板',
      logoBackgroundColor: '底板色',

      logoShapes: {
        rounded: '圆角',
        circle: '圆形',
        square: '方形'
      },

      logoBackgroundModes: {
        auto: '自动',
        custom: '自定义',
        none: '无'
      },

      logoUploadHint: '上传',
      defaultLogos: '默认 Logo'
    },

    presets: {
      classic: { name: '经典', hint: '黑白像素' },
      dots: { name: '圆点', hint: '更柔和' },
      rounded: { name: '圆角', hint: '轻圆角模块' },
      fluid: { name: '流体', hint: '边角圆润连接' },
      neon: { name: '霓虹渐变', hint: '强对比渐变' },
      invert: { name: '反白', hint: '深色背景更醒目' }
    },

    shapes: {
      square: { label: '像素', desc: '经典模块方块' },
      circle: { label: '圆点', desc: '圆形模块' },
      rounded: { label: '圆角', desc: '轻圆角模块' },
      fluid: { label: '流体', desc: '按邻接圆润边角' }
    },

    eyeShapes: {
      square: '方形',
      circle: '圆形'
    },

    errorCorrection: {
      label: '容错',
      logoHint: '已启用 Logo：容错最低为 Q'
    },

    formats: {
      png: 'PNG',
      jpg: 'JPG',
      svg: 'SVG'
    },

    templatePreview: {
      title: '模板预览',
      show: '查看',
      hide: '隐藏',
      hint: '需要时再展开，减少页面占用。'
    },

    previewEmpty: '输入内容后自动生成预览',
    fullscreenPreview: '全屏预览',

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
      copied: '内容已复制',
      qrCopied: '二维码已复制',
      generateFailed: '生成失败',
      copyFailed: '复制失败'
    }
  },

  scanner: {
    title: '浏览器端扫码识别',
    subtitle: 'ZXing 支持 HTTPS 摄像头实时解码，并可复制或跳转内容。',

    scannerTitle: '实时摄像头扫码',
    scannerSubtitle: '推荐在 HTTPS 环境使用，移动端请允许摄像头权限。',

    cameraLabel: '摄像头',
    noCameraDetected: '未检测到摄像头',
    cameraDefault: '摄像头',

    startScanning: '开始扫描',
    stopScanning: '停止扫描',
    scanFromImage: '从图片识别',

    toggleTorch: {
      on: '关闭补光',
      off: '开启补光'
    },

    openOrCopy: '打开 / 复制',
    copyText: '复制文本',

    waitingCamera: '等待相机就绪：',
    scanning: '扫描中…',

    result: {
      title: '结果',
      label: '扫描结果：',
      empty: '暂无结果，开始扫描或上传二维码图片。'
    },

    history: {
      title: '历史记录',
      empty: '暂无历史记录',
      content: '内容：',
      sources: {
        camera: 'camera',
        upload: 'upload'
      }
    },

    errors: {
      notSupported: '当前浏览器不支持摄像头调用',
      permissionDenied: '摄像头权限被拒绝，请在系统或浏览器中开启权限',
      startFailed: '无法启动摄像头，请检查权限或设备占用情况',
      uploadFailed: '无法识别上传的图片，请尝试更清晰的二维码',
      copyNotSupported: '当前环境不支持自动复制，请手动复制'
    }
  },

  about: {
    title: '关于',

    hero: {
      tagline: 'SvelteKit + Tailwind CSS',
      title: '一站式二维码生成与扫码体验',
      body: '在电脑、手机、平板等多端保持一致的流畅体验。支持个性化二维码生成、实时扫码、离线缓存和主题适配。',
      ctaStart: '开始生成',
      ctaScan: '进入扫码'
    },

    pwa: {
      ready: 'PWA 已就绪',
      response: '响应迅速',
      hint: '离线缓存、暗色模式、多语言占位'
    },

    stats: {
      crossPlatform: '跨端适配',
      fps: '扫码帧率',
      max: '生成上限',
      offline: '离线支持'
    },

    features: {
      f1: {
        title: '智能生成',
        body: '多模板与色彩系统随心组合，实时预览可在桌面与移动端保持一致。'
      },
      f2: {
        title: '安全扫码',
        body: '浏览器内 ZXing + HTTPS 摄像头权限，自动识别 URL/文本并提示潜在风险。'
      },
      f3: {
        title: 'PWA 离线',
        body: 'Service Worker + Manifest 组合，支持离线缓存、安装与扩展。'
      }
    },

    sections: {
      install: {
        title: '安装到桌面',
        body: '在支持的浏览器中点击地址栏的“安装”图标，即可在桌面/手机上获得类原生体验。'
      },
      https: {
        title: 'HTTPS 提示',
        body: '摄像头权限仅在 HTTPS 下可用；如需在局域网测试，可开启 `npm run dev -- --host --https`。'
      },
      extend: {
        title: '扩展能力',
        body: '可集成后端接口用于扫码安全校验、生成统计或账号同步。'
      }
    }
  },

  app: {
    title: 'QRcode-PWA - 二维码生成器与扫描器',
    description:
      '免费在线二维码生成器与扫描器。支持 URL、Wi‑Fi、vCard、Email 等格式，可自定义颜色、渐变与 Logo，并在浏览器内快速扫描。PWA 支持离线使用。',
    keywords: '二维码, QR Code, 二维码生成器, 二维码扫描器, 二维码解析, Wi‑Fi 二维码, vCard 二维码, 在线工具'
  },

  seo: {
    generator: {
      title: '二维码生成器 - 创建 URL/Wi‑Fi/vCard 二维码',
      description: '创建 URL、Wi‑Fi、Email、电话、vCard 等二维码，支持颜色、渐变、Logo 与即时预览。',
      keywords: '二维码生成器, 二维码生成, QR Code 制作, Wi‑Fi 二维码, vCard 二维码, 带 Logo 的二维码'
    },

    scan: {
      title: '二维码扫描器 - 浏览器相机在线扫描与解析',
      description: '使用相机在线扫描二维码，或上传图片解码并复制结果。',
      keywords: '二维码扫描, 二维码识别, 二维码解析, QR Code 读取, 在线扫码'
    },

    about: {
      title: '关于 QRcode-PWA - 功能介绍与离线支持',
      description: '了解 QRcode-PWA：风格化二维码生成、浏览器扫码、PWA 安装与离线使用。',
      keywords: 'PWA 二维码, 离线二维码生成, 二维码工具, 二维码功能'
    },

    language: {
      title: '语言选择 | QRcode-PWA',
      description: '选择偏好的语言以使用二维码生成与扫码功能。',
      keywords: '语言选择, 二维码生成器 语言'
    }
  },

  language: {
    eyebrow: '语言',
    title: '选择语言',
    description: '请选择语言以进入二维码生成器、扫码与说明页。'
  },

  nav: {
    generator: '生成',
    scan: '扫描',
    about: '关于'
  },

  footer: {
    tagline: '跨端二维码体验'
  },

  payloads: {
    errors: {
      enterText: '请输入文本内容',
      textTooLong: '文本内容过长，请限制在 4000 字符以内',
      enterLink: '请输入链接地址',
      invalidLink: '请输入有效的 HTTP 或 HTTPS 链接',
      linkTooLong: '链接地址过长，请限制在 2048 字符以内',
      enterSsid: '请输入 Wi‑Fi 网络名称（SSID）',
      wifiNeedPassword: '{encryption} 加密的网络需要密码',
      enterEmail: '请输入邮箱地址',
      invalidEmail: '请输入有效的邮箱地址',
      enterValidPhone: '请输入有效的电话号码',
      enterValidSms: '请输入有效的短信号码',
      enterContactName: '请输入联系人姓名'
    }
  },

  utils: {
    renderSvgToBlob: {
      browserError: 'renderSvgToBlob 需要浏览器环境',
      viewBoxError: 'SVG 缺少有效的 viewBox',
      rasterSizeError: '请求的栅格尺寸过大',
      failedLoadSvg: 'SVG 图像加载失败',
      failedExport: '导出栅格图像失败'
    },

    qrStylize: {
      imageUrl: '图片 URL 用于 ',
      bgRole: '背景',
      moduleRole: '模块'
    },

    qrencode: {
      svgTag: 'SVG 标签',
      rectTag: 'Rect 标签'
    },

    errors: {
      context2DUnavailable: '2D 上下文不可用',
      imageDataAccess: '无法访问图像数据（画布可能被跨域内容污染）',
      imageNoSize: '图像没有固有尺寸',
      videoNoFrame: '视频尚未有画面尺寸，请等待就绪',
      unsupportedElement: '不支持的元素类型',
      fileNotImage: '文件不是图像',
      failedLoadImage: '加载图像失败',
      noFileProvided: '未提供文件',
      invalidQrMatrix: '无效的二维码矩阵',
      jaggedQrMatrix: '不支持非矩形二维码矩阵'
    },

    qrcore: {
      unexpectedMatrixSize: '二维码矩阵大小异常：{w}x{h}，这不是有效的二维码模块网格。',
      rgbaLengthMismatch: 'RGBA 长度不匹配：得到 {got}，预期 {expected}（{w}x{h}）'
    }
  },

  pages: {
    generator: {
      title: 'QRcode-PWA 生成器'
    }
  },

  layout: {
    appName: 'QRcode-PWA'
  },

  components: {
    stylePicker: {
      ariaLabel: '样式选择器',
      noneSelected: '未选择',
      mobileToggle: '样式︾',
      close: '关闭'
    },

    colorSwatch: {
      ariaLabel: '选择颜色'
    },

    colorPicker: {
      label: '颜色',
      close: '关闭',
      copy: '复制颜色',
      cancel: '取消',
      confirm: '确认',
      hexPlaceholder: '请输入 6 位十六进制颜色（不含 #）',
      hexError: '请输入 6 位十六进制颜色（不含 #）'
    },

    logoPicker: {
      defaultLogos: '默认 Logo 列表',
      currentLogo: '当前 Logo 预览',
      uploadArea: '上传区域',
      hasLogo: '显示预览 + 删除按钮',
      noLogo: '没有 Logo 时显示上传',
      sizeAndPadding: '大小 + 留白滑块',
      shapeAndBackground: '形状 + 底板',
      customBgColor: '自定义底板颜色'
    }
  }
};

export type Translations = typeof zh;
