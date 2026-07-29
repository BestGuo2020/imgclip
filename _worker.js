export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // 1. 定义多语言配置包 (增加了 schema 字段)
    const translations = {
      '/en': {
        lang: 'en',
        title: 'Smart Image Splitter - Auto Crop & Extract Sprites Online',
        description: 'Free online tool to auto-split sprite sheets and scanned photos into separate PNG images. One-click batch extraction. Local processing, privacy safe.',
        keywords: 'image splitter, sprite sheet cutter, auto crop multiple photos, extract images from image, sprite slicer, online image separator',
        ogTitle: 'Smart Image Splitter - Extract Multiple Images in One Click',
        ogDesc: 'Automatically detect and split multiple objects from a single image. Export as separate PNGs. 100% local processing.',
        // 新增 Schema 数据
        schema: {
            websiteName: 'Smart Image Splitter',
            websiteDesc: 'Free online tool to split one image into multiple image files',
            toolDesc: 'Free online tool to automatically split a single image containing multiple elements into separate PNG files. Supports batch upload and local processing.',
            featureList: [
                "Auto-detect multiple independent objects in one image",
                "One-click split large image into separate small PNGs",
                "100% local processing, works offline, privacy safe",
                "Batch processing, upload multiple sprite sheets at once",
                "Download all cropped assets as a ZIP file"
            ]
        }
      },
      '/ja': {
        lang: 'ja',
        title: '画像自動分割ツール - スプライトシートや素材を一括切り抜き',
        description: 'スプライトシートやスキャンした写真を自動的に個別のPNG画像に分割・切り抜きできる無料オンラインツール。ブラウザ完結でプライバシーも安心。',
        keywords: '画像分割, スプライトシート分割, 画像切り抜き, 自動切り抜き, 一括保存, 素材抽出, オンラインツール',
        ogTitle: '画像自動分割ツール - 複数の素材を一括切り抜き',
        ogDesc: '一枚の画像に含まれる複数の要素を自動認識して分割し、個別のPNGとして保存します。インストール不要、完全無料。',
        schema: {
            websiteName: '画像自動分割ツール',
            websiteDesc: '1枚の画像を複数の素材ファイルに無料オンライン分割',
            toolDesc: '複数の要素を含む画像を自動的に個別のPNGファイルに分割する無料オンラインツール。一括アップロードとローカル処理に対応。',
            featureList: [
                "画像内の複数の独立したオブジェクトを自動検出",
                "ワンクリックで大きな画像を小さなPNGに分割",
                "100%ローカル処理、オフライン対応、プライバシー保護",
                "一括処理、複数のスプライトシートを同時アップロード",
                "分割した素材をZIPで一括ダウンロード"
            ]
        }
      },
      '/ko': {
        lang: 'ko',
        title: '스마트 이미지 분할 도구 - 스프라이트 및 사진 자동 자르기',
        description: '스프라이트 시트나 스캔한 사진에서 여러 이미지를 자동으로 감지하여 개별 PNG로 분할해 주는 무료 온라인 도구입니다. 100% 로컬 처리로 안전합니다.',
        keywords: '이미지 분할, 스프라이트 자르기, 사진 자동 자르기, 이미지 추출, 누끼따기, 온라인 이미지 편집',
        ogTitle: '스마트 이미지 분할 도구 - 한 번의 클릭으로 이미지 추출',
        ogDesc: '하나의 이미지에 포함된 여러 요소를 자동으로 인식하여 분할하고 저장합니다. 서버 업로드 없이 브라우저에서 바로 처리하세요.',
        schema: {
            websiteName: '스마트 이미지 분할 도구',
            websiteDesc: '하나의 이미지를 여러 소재 파일로 분할하는 무료 온라인 도구',
            toolDesc: '여러 요소가 포함된 단일 이미지를 별도의 PNG 파일로 자동 분할하는 무료 온라인 도구입니다. 일괄 업로드 및 로컬 처리를 지원합니다.',
            featureList: [
                "이미지 내의 여러 독립 개체 자동 감지",
                "원클릭으로 큰 이미지를 별도의 작은 PNG로 분할",
                "100% 로컬 처리, 오프라인 사용 가능, 개인정보 보호",
                "일괄 처리, 여러 스프라이트 시트 동시 업로드 지원",
                "분할된 소재를 ZIP 파일로 일괄 다운로드"
            ]
        }
      }
    };

    const cleanPath = path.endsWith('/') && path.length > 1 ? path.slice(0, -1) : path;
    const config = translations[cleanPath];

    // 3. 如果是静态资源 (js, css, png) 或者不匹配语言包，直接放行 (Pass-through)
    // 注意：如果访问的是根目录 / (中文)，也会直接放行，显示原始 index.html
    if (!config || path.includes('.')) {
      return env.ASSETS.fetch(request);
    }

    // 4. 获取原始的 index.html (作为模板)
    // 无论用户访问 /en 还是 /ja，我们都去拿根目录的 index.html
    const originalResponse = await env.ASSETS.fetch(new URL("/", request.url));

    // 5. 使用 HTMLRewriter 动态替换 Meta 信息
    return new HTMLRewriter()
      .on('html', { element(e) { e.setAttribute('lang', config.lang); } })
      .on('title', { element(e) { e.setInnerContent(config.title); } })
      .on('meta[name="description"]', { element(e) { e.setAttribute('content', config.description); } })
      .on('meta[name="keywords"]', { element(e) { e.setAttribute('content', config.keywords); } })
      .on('meta[property="og:title"]', { element(e) { e.setAttribute('content', config.ogTitle); } })
      .on('meta[property="og:description"]', { element(e) { e.setAttribute('content', config.ogDesc); } })
      .on('meta[name="twitter:title"]', { element(e) { e.setAttribute('content', config.ogTitle); } })
      .on('meta[name="twitter:description"]', { element(e) { e.setAttribute('content', config.ogDesc); } })
      
      // --- 新增：处理 JSON-LD Schema ---
      // 1. 修改 WebSite Schema
      .on('script#ld-website', {
        element(e) {
          // 构建新的 JSON 对象
          const newJson = {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": config.schema.websiteName,
            "url": "https://imgcrop.bestguo.top" + cleanPath, // URL 也加上语言后缀比较好，或者保持根目录
            "description": config.schema.websiteDesc
          };
          e.setInnerContent(JSON.stringify(newJson, null, 4), { html: true });
        }
      })
      // 2. 修改 Tool Schema
      .on('script#ld-tool', {
        element(e) {
          // 这里我们需要重构整个 Tool 对象，为了安全起见，我们手动构建它
          // 这里的静态数据（如 author, rating）保持不变，只替换文本
          const newJson = {
            "@context": "https://schema.org",
            "@type": "Tool",
            "name": config.schema.websiteName, // 使用相同的名字
            "description": config.schema.toolDesc,
            "url": "https://imgcrop.bestguo.top" + cleanPath,
            "image": "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>✂️</text></svg>",
            "author": { "@type": "Person", "name": "BestGuo2020" },
            "publisher": { "@type": "Organization", "name": "BestGuo2020" },
            "dateCreated": "2025-01-01",
            "dateModified": "2025-12-01",
            "softwareVersion": "1.0.0",
            "operatingSystem": "All",
            "applicationCategory": "ImageEditing",
            "offers": { "@type": "Offer", "price": "0", "priceCurrency": "CNY" },
            "featureList": config.schema.featureList, // 使用翻译后的特性列表
            "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.9", "reviewCount": "128" }
          };
          e.setInnerContent(JSON.stringify(newJson, null, 4), { html: true });
        }
      })
      
      .transform(originalResponse);
  }
};