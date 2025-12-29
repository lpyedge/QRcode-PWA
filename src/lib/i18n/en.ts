export const en = {
  common: {
    copy: 'Copy',
    open: 'Open',
    close: 'Close',
    cancel: 'Cancel',
    confirm: 'Confirm',
    reset: 'Reset',
    download: 'Download',
    upload: 'Upload',
    delete: 'Delete',
    remove: 'Remove',
    start: 'Start',
    stop: 'Stop',
    enable: 'Enable',
    disable: 'Disable',
    transparent: 'Transparent',
    custom: 'Custom',
    auto: 'Auto',
    none: 'None',
    more: 'More…',
    switchType: 'Switch type',
    copyContent: 'Copy content',
    generating: 'Generating…',
    popular: 'Popular',
    openNav: 'Open navigation'
  },

  // PWA offline features
  pwa: {
    install: {
      title: 'Install QRcode-PWA',
      subtitle: 'Add to your home screen for a smoother experience',
      description: 'Add to your home screen for a smoother experience',
      benefit1: 'Use offline, no network required',
      benefit2: 'Standalone window, stay focused',
      benefit3: 'Fast launch, ready instantly',
      later: 'Later',
      dismiss: 'Not now',
      install: 'Install now',
      button: 'Install now',
      installing: 'Installing…'
    },

    update: {
      title: 'New version available',
      message: 'Update is ready',
      later: 'Later',
      reload: 'Reload now'
    }
  },

  commonExtras: {
    currentLogoAlt: 'Current logo',
    deleteLogo: 'Remove logo'
  },

  errors: {
    invalidSettings: 'Invalid settings object',
    unsupportedMode: 'Unsupported mode: {mode}'
  },

  // QR generator page
  generator: {
    title: 'QR Code Generator & Styling',
    previewLabel: 'Preview',

    // Tabs
    tabs: {
      content: 'Content',
      design: 'Design'
    },

    // Content modes
    modes: {
      text: 'Text',
      url: 'URL',
      wifi: 'Wi‑Fi',
      email: 'Email',
      tel: 'Phone',
      sms: 'SMS',
      vcard: 'Contact'
    },

    modeHints: {
      text: 'Plain text / notes',
      url: 'http/https website or H5 page',
      wifi: 'Scan to join hotspot',
      email: 'mailto scheme',
      tel: 'Tap to call',
      sms: 'Preset number and message',
      vcard: 'vCard 3.0'
    },

    modeDescriptions: {
      text: 'Text mode is recommended by default. Use other templates when needed.',
      url: 'Website URL'
    },

    // Form fields
    fields: {
      textContent: 'Text content',
      textPlaceholder: 'Enter text to encode',

      linkAddress: 'URL',
      linkPlaceholder: 'https://example.com',

      ssidPlaceholder: 'e.g. QR_Studio',
      passwordPlaceholder: 'Optional',

      emailPlaceholder: 'team@example.com',
      emailSubjectPlaceholder: 'e.g. Event invitation',
      emailBodyPlaceholder: 'Enter email body',

      telPlaceholder: '+86 138 0000 0000',
      smsNumberPlaceholder: '+86 138 0000 0000',
      smsMessagePlaceholder: 'e.g. I want to learn about QRcode-PWA',

      vcardNamePlaceholder: 'Full name',
      vcardCompanyPlaceholder: 'Company',
      vcardTitlePlaceholder: 'Job title',
      vcardPhonePlaceholder: 'Phone',
      vcardEmailPlaceholder: 'Email',
      vcardWebsitePlaceholder: 'https://',
      vcardAddressPlaceholder: 'City / Street / Postal code',

      wifiName: 'Wi‑Fi name',
      wifiPassword: 'Password',
      wifiEncryption: 'Encryption',
      wifiHidden: 'Hidden network',

      emailAddress: 'Email',
      emailSubject: 'Subject',
      emailBody: 'Body',

      phoneNumber: 'Phone number',

      smsNumber: 'SMS number',
      smsMessage: 'SMS message',

      vcardName: 'Full name',
      vcardCompany: 'Company',
      vcardTitle: 'Job title',
      vcardPhone: 'Phone',
      vcardEmail: 'Email',
      vcardWebsite: 'Website',
      vcardAddress: 'Address'
    },

    // Encryption options
    encryption: {
      wpa: 'WPA/WPA2',
      wep: 'WEP',
      nopass: 'No password'
    },

    // Design options
    design: {
      stylePresets: 'Style presets',
      moduleShape: 'Module shape',
      moduleColor: 'Modules',

      directions: {
        'to-r': 'Right',
        'to-br': 'Bottom-right',
        'to-b': 'Down',
        'to-bl': 'Bottom-left',
        'to-l': 'Left',
        'to-tl': 'Top-left',
        'to-t': 'Up',
        'to-tr': 'Top-right'
      },

      color: 'Color',
      gradient: 'Gradient',
      gradientStart: 'Start',
      gradientEnd: 'End',
      gradientDirection: 'Direction',

      gradientDirections: {
        horizontal: 'Horizontal',
        vertical: 'Vertical',
        diagonal: 'Diagonal'
      },

      gradientHint: 'When enabled, modules are filled with a linear gradient.',

      // Finders
      finder: 'Finders',
      finderBorder: 'Border',
      finderCenter: 'Center',

      // Background
      background: 'Background',

      // Output
      output: 'Output',
      displaySize: 'Display size',
      margin: 'Margin',
      marginUnit: 'Modules',

      // Logo
      logo: 'Logo',
      logoHint: 'When enabled, a logo is placed in the center (error correction forced to ≥ Q)',
      logoSize: 'Size',
      logoPadding: 'Padding',
      logoShape: 'Shape',
      logoBackground: 'Base',
      logoBackgroundColor: 'Base color',

      logoShapes: {
        rounded: 'Rounded',
        circle: 'Circle',
        square: 'Square'
      },

      logoBackgroundModes: {
        auto: 'Auto',
        custom: 'Custom',
        none: 'None'
      },

      logoUploadHint: 'Upload',
      defaultLogos: 'Default logos'
    },

    // Presets
    presets: {
      classic: { name: 'Classic', hint: 'Black & white pixels' },
      dots: { name: 'Dots', hint: 'Softer look' },
      rounded: { name: 'Rounded', hint: 'Lightly rounded modules' },
      fluid: { name: 'Fluid', hint: 'Smooth connected corners' },
      neon: { name: 'Neon gradient', hint: 'High-contrast gradient' },
      invert: { name: 'Inverted', hint: 'More visible on dark backgrounds' }
    },

    // Shape options
    shapes: {
      square: { label: 'Pixel', desc: 'Classic square modules' },
      circle: { label: 'Dot', desc: 'Circular modules' },
      rounded: { label: 'Rounded', desc: 'Lightly rounded modules' },
      fluid: { label: 'Fluid', desc: 'Round corners based on adjacency' }
    },

    // Finder shapes
    eyeShapes: {
      square: 'Square',
      circle: 'Circle'
    },

    // Error correction level
    errorCorrection: {
      label: 'Error correction',
      logoHint: 'Logo enabled: minimum level is Q'
    },

    // Download formats
    formats: {
      png: 'PNG',
      jpg: 'JPG',
      svg: 'SVG'
    },

    // Template preview
    templatePreview: {
      title: 'Template preview',
      show: 'Show',
      hide: 'Hide',
      hint: 'Expand only when needed to save space.'
    },

    previewEmpty: 'Enter content to generate a preview automatically',
    fullscreenPreview: 'Fullscreen preview',

    // Default form values (for initialization)
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

    // Messages
    messages: {
      copied: 'Content copied',
      qrCopied: 'QR code copied',
      generateFailed: 'Generation failed',
      copyFailed: 'Copy failed'
    }
  },

  // QR scanner page
  scanner: {
    title: 'QR Code Scanner',

    subtitle: 'Scan using camera or upload a QR code image.',

    // Form
    cameraLabel: 'Camera',
    noCameraDetected: 'No camera detected',
    cameraDefault: 'Camera',

    // Buttons
    startScanning: 'Start scanning',
    stopScanning: 'Stop scanning',
    scanFromImage: 'Scan from image',

    toggleTorch: {
      on: 'Turn off light',
      off: 'Turn on light'
    },

    openOrCopy: 'Open / Copy',
    copyText: 'Copy text',

    // Status
    waitingCamera: 'Waiting for camera: ',
    scanning: 'Scanning…',

    // Result
    result: {
      title: 'Result',
      label: 'Scan result:',
      empty: 'No result yet. Start scanning or upload a QR image.'
    },

    // History
    history: {
      title: 'History',
      empty: 'No history',
      content: 'Content:',
      sources: {
        camera: 'camera',
        upload: 'upload'
      }
    },

    // Errors
    errors: {
      notSupported: 'This browser does not support camera access',
      permissionDenied: 'Camera permission denied. Enable it in system or browser settings',
      startFailed: 'Failed to start camera. Check permission or device usage.',
      uploadFailed: 'Could not read the uploaded image. Try a clearer QR code.',
      copyNotSupported: 'Auto-copy is not supported here. Please copy manually'
    }
  },

  // About page
  about: {
    title: 'About',

    hero: {
      tagline: 'SvelteKit + Tailwind CSS',
      title: 'All-in-one QR generation and scanning',
      body: 'Enjoy a consistent, smooth experience across desktop, mobile, and tablets. Supports styled QR generation, live scanning, offline cache, and theme adaptation.',
      ctaStart: 'Start generating',
      ctaScan: 'Go to scanner'
    },

    pwa: {
      ready: 'PWA ready',
      response: '100% Response',
      hint: 'Offline cache, dark mode, multilingual placeholders'
    },

    stats: {
      crossPlatform: 'Cross-platform',
      fps: 'Scan FPS',
      max: 'Max capacity',
      offline: 'Offline support'
    },

    features: {
      f1: {
        title: 'Smart generation',
        body: 'Mix templates and colors freely, with real-time preview synced across desktop and mobile.'
      },
      f2: {
        title: 'Secure scanning',
        body: 'ZXing in-browser + HTTPS camera permission, auto-detect URL/text and warn about risks.'
      },
      f3: {
        title: 'PWA offline',
        body: 'Service worker + manifest for offline cache, installation, and extensibility.'
      }
    },

    sections: {
      install: {
        title: 'Install to desktop',
        body: 'In supported browsers, click the “Install” icon in the address bar to get an app-like experience on desktop/mobile.'
      },
      https: {
        title: 'HTTPS note',
        body: 'Camera permission is only available under HTTPS. For local network use, enable `npm run dev -- --host --https`.'
      },
      extend: {
        title: 'Extensibility',
        body: 'Backend APIs can be integrated for scan safety checks, generation stats, or account sync.'
      }
    }
  },

  app: {
    title: 'QRcode-PWA - QR Code Generator & Scanner',
    description:
      'Free QR code generator and scanner. Create QR codes for URL, Wi-Fi, vCard, email, and more. Style with colors and logos, and scan in your browser. PWA works offline.',
    keywords:
      'qr code generator, qr code scanner, qr code maker, create qr code, qr code reader, wifi qr, vcard qr, online qr tool'
  },

  seo: {
    generator: {
      title: 'QR Code Generator - Create QR Codes for URL, Wi-Fi & vCard',
      description:
        'Create custom QR codes for links, Wi-Fi, email, phone, and vCard. Add colors, gradients, and logos with instant preview.',
      keywords: 'qr code generator, create qr code, qr code maker, wifi qr code, vcard qr code, qr code with logo'
    },

    scan: {
      title: 'QR Code Scanner - Scan Online with Camera or Image',
      description:
        'Scan QR codes directly in your browser using your camera, or upload a QR image to decode and copy results.',
      keywords: 'qr code scanner, qr code reader, scan qr code online, camera qr, decode qr code'
    },

    about: {
      title: 'About QRcode-PWA - Features, PWA, and Offline Support',
      description: 'Learn about QRcode-PWA features: styled QR generation, browser scanning, PWA install, and offline support.',
      keywords: 'pwa qr code, offline qr generator, qr code features, qr tool'
    },

    language: {
      title: 'Choose Language | QRcode-PWA',
      description: 'Select your preferred language for the QR code generator and scanner.',
      keywords: 'language selection, qr code generator language'
    }
  },

  language: {
    eyebrow: 'Language',
    title: 'Choose your language',
    description: 'Pick a language to open the QR code generator, scanner, and help pages.'
  },

  nav: {
    generator: 'Generate',
    scan: 'Scan',
    about: 'About'
  },

  footer: {
    tagline: 'Cross-device QR experience'
  },

  payloads: {
    errors: {
      enterText: 'Please enter text content',
      textTooLong: 'Text is too long. Please keep it within 4000 characters',
      enterLink: 'Please enter a URL',
      invalidLink: 'Please enter a valid HTTP or HTTPS URL',
      linkTooLong: 'URL is too long. Please keep it within 2048 characters',
      enterSsid: 'Please enter the Wi‑Fi network name (SSID)',
      wifiNeedPassword: '{encryption} networks require a password',
      enterEmail: 'Please enter an email address',
      invalidEmail: 'Please enter a valid email address',
      enterValidPhone: 'Please enter a valid phone number',
      enterValidSms: 'Please enter a valid SMS number',
      enterContactName: 'Please enter a contact name'
    }
  },

  utils: {
    renderSvgToBlob: {
      browserError: 'renderSvgToBlob requires a browser environment',
      viewBoxError: 'SVG is missing a valid viewBox',
      rasterSizeError: 'Requested raster size is too large',
      failedLoadSvg: 'Failed to load SVG image',
      failedExport: 'Failed to export raster image'
    },

    qrStylize: {
      imageUrl: 'Image URL for ',
      bgRole: 'Background',
      moduleRole: 'Modules'
    },

    qrencode: {
      svgTag: 'SVG tag',
      rectTag: 'Rect tag'
    },

    errors: {
      context2DUnavailable: '2D context is unavailable',
      imageDataAccess: 'Cannot access image data (canvas may be tainted by cross-origin content)',
      imageNoSize: 'Image has no intrinsic size',
      videoNoFrame: 'Video has no frame size yet. Please wait until it is ready',
      unsupportedElement: 'Unsupported element type',
      fileNotImage: 'File is not an image',
      failedLoadImage: 'Failed to load image',
      noFileProvided: 'No file provided',
      invalidQrMatrix: 'Invalid QR matrix',
      jaggedQrMatrix: 'Non-rectangular QR matrices are not supported'
    },

    qrcore: {
      unexpectedMatrixSize: 'Unexpected QR matrix size: {w}x{h}. This is not a valid QR module grid.',
      rgbaLengthMismatch: 'RGBA length mismatch: got {got}, expected {expected} ({w}x{h})'
    }
  },

  pages: {},
  layout: {
    appName: 'QRcode-PWA'
  },

  components: {
    stylePicker: {
      ariaLabel: 'Style picker',
      noneSelected: 'None selected',
      mobileToggle: 'Styles︾',
      close: 'Close'
    },

    colorSwatch: {
      ariaLabel: 'Choose color'
    },

    colorPicker: {
      label: 'Color',
      close: 'Close',
      copy: 'Copy color',
      cancel: 'Cancel',
      confirm: 'Confirm',
      hexPlaceholder: 'Enter a 6-digit hex color (without #)',
      hexError: 'Enter a 6-digit hex color (without #)'
    },

    logoPicker: {
      defaultLogos: 'Default logo grid',
      currentLogo: 'Current logo preview',
      uploadArea: 'Upload area',
      hasLogo: 'Show preview + delete button',
      noLogo: 'Show upload when there is no logo',
      sizeAndPadding: 'Size + padding sliders',
      shapeAndBackground: 'Shape + base',
      customBgColor: 'Custom base color'
    }
  }
};

export type Translations = typeof en;
