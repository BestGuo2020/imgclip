// src/i18n.js — imgcrop 四语言文案与语言状态
//
// 文案字典由迁移前的 script.js（原 `const i18n = {...}`，第 4-286 行）
// 原样抽出，键名与四种语言的取值均未改动，保证多语言表现与迁移前逐字一致。
// 语言代码沿用站点既有的 'zh-CN' | 'en' | 'ja' | 'ko'，与 _worker.js 的语言包一一对应。

import { reactive } from 'vue';

const messages = {
    'zh-CN': {
        'nav.home': '首页', 'nav.features': '功能', 'nav.faq': '常见问题', 'nav.scene': '场景',
        'title': '智能图片素材拆分工具 - 一键将拼图切分为多个PNG文件',
        'subtitle': '一键将包含多个元素的图片自动拆分为单独的PNG文件，支持批量处理',
        
        // 演示流程
        'demo.step1': '📂 上传拼图/素材图',
        'demo.step2': '⚡ 自动识别拆分',
        'demo.step3': '💾 导出多个PNG',

        // 上传区域
        'upload.text': '点击或拖拽图片到此处上传',
        'upload.sub': '支持 Sprite Sheet, 贴纸拼图, 电商素材 (JPG/PNG)',
        'privacy.badge': '🔒 本地计算，图片不上传服务器',

        // 按钮
        'btn.smartCrop': '⚡ 智能拆分', 
        'btn.manualCrop': '🖐 手动拆分',
        'btn.gridSplit': '🔲 网格拆分', 
        'btn.reset': '🔄 重置', 
        'btn.downloadAll': '📥 打包下载',
        'btn.bgRemove': '一键去底',
        'btn.bgRemoveThenCrop': '先去底再拆分',
        'loading': '正在分析画布并拆分素材...',
        
        // 结果
        'results.title': '拆分结果',
        'result.size': '尺寸:', 
        'btn.download': '下载', 
        'btn.delete': '删除',

        // 功能特点
        'f.title.1': '智能素材提取', 'f.desc.1': '自动检测图片中互不相连的多个物体，将它们从画布中“抠”出来，并保存为独立的图片文件。',
        'f.title.2': '批量极速切图', 'f.desc.2': '非常适合处理游戏 Sprite Sheet（精灵图）或电商贴纸拼图。拖入一张大图，瞬间获得几十张小图。',
        'f.title.3': '隐私级安全', 'f.desc.3': '所有拆分计算均在浏览器端完成。您的素材图不需要上传到服务器，绝对安全，断网也能用。',

        // SEO 内容区 (新增)
        'seo.title': '为什么需要 ImgCrop 图片素材拆分工具?',
        'seo.p1': '在游戏开发、平面设计和电商运营中，我们经常遇到需要将“一张大图”里的“多个小元素”拆分出来的场景。手动用 PS 切图费时费力，而 ImgCrop 可以一键搞定。',
        'seo.h3.1': '游戏开发者的利器 (Sprite Slicer)',
        'seo.p2': '如果您手头有 Sprite Sheet（精灵图）资源，ImgCrop 不仅能自动识别透明区域精准切割，还能严格按照原图“从上到下、从左到右”的视觉顺序导出素材，确保动画帧序不乱。',
        'seo.h3.2': '手账与电商素材整理',
        'seo.p3': '对于电商美工或手账爱好者，经常需要从一张包含多个贴纸、标签或商品的拼图中提取素材。使用本工具，只需拖入图片，即可自动识别并分割所有独立商品图。',

        // FAQ
        'faq.title': '常见问题',
        'faq.q1': '这个工具能做什么？',
        'faq.a1': '它可以将一张包含多个独立元素（如贴纸、游戏角色、图标）的图片，自动识别并拆分成多个独立的 PNG 图片文件。',
        'faq.q2': '支持什么格式的导出？',
        'faq.a2': '无论您上传的是 JPG 还是 PNG，拆分后的素材默认导出为 PNG 格式，如果原图背景是透明的，拆分后也会保留透明背景。',
        'faq.q3': '图片元素靠得很近能拆分吗？',
        'faq.a3': '只要元素之间有像素间隔（即使只有 1px），工具就能识别为两个物体。如果元素重叠，建议使用“手动拆分”功能。',
        'faq.q4': '有文件大小限制吗？',
        'faq.a4': '没有硬性限制，但由于是本地浏览器处理，过大的图片（如超过 50MB）可能会受限于您设备的内存大小。',
        'faq.q5': '去底后边缘为什么还有杂色？',
        'faq.a5': '这是由于原图的“抗锯齿”处理或JPG压缩导致的半透明过渡像素。为了防止误删物体本身的细节（如头发、眼睛），算法会保留这些边缘。对于高精度需求，建议使用专业PS软件微调。',
        'faq.q6': '相比下载桌面软件，使用在线工具有什么优势？',
        'faq.a6': '跨平台：无论 Windows/Mac/iPad，打开浏览器即用。<br>零安装：无病毒风险，无需配置环境。<br>隐私保护：利用 WebAssembly 技术，图片仅在本地浏览器内存中处理，不上传云端，断网也能用。',
        'faq.q7': '图片裁切时原素材被削减或抠没了，怎么办？',
        'faq.a7': '这种情况通常发生在使用"一键去底"功能时，尤其是当素材边缘与背景颜色相近时。建议您尝试使用"先去底再拆分"功能，该功能会先对整图进行去底处理，再进行智能拆分，能更好地保留素材的完整性和细节。',
        
        'copyright': '© 2026 智能图片素材拆分工具. 保留所有权利.',
        'alert.image': '请上传图片文件！',

        // 新增 Schema 翻译
        'schema.websiteName': '智能图片素材拆分工具',
        'schema.websiteDesc': '免费在线将一张图片拆分为多个素材文件',
        'schema.toolDesc': '免费在线工具，用于将包含多个元素的单个图像自动分割成多个独立的PNG文件。支持批量上传和本地处理。',
        'schema.featureList': [
            "自动识别一张图中的多个独立素材区域",
            "一键将大图拆分为多个单独的PNG小图",
            "100%本地处理，断网可用，保护隐私",
            "批量处理，支持一次上传多张拼图",
            "支持打包下载拆分后的素材"
        ]
    },
    'en': {
        'nav.home': 'Home', 'nav.features': 'Features', 'nav.faq': 'FAQ', 'nav.scene': 'Use Cases',
        'title': 'Smart Image Splitter - Auto Crop & Extract Sprites Online',
        'subtitle': 'Automatically split images containing multiple elements into separate PNG files.',
        
        'demo.step1': '📂 Upload Sprite/Image',
        'demo.step2': '⚡ Auto Split',
        'demo.step3': '💾 Export PNGs',

        'upload.text': 'Click or drag image here to upload',
        'upload.sub': 'Supports Sprite Sheet, Stickers, Assets (JPG/PNG)',
        'privacy.badge': '🔒 Local processing, images not uploaded',

        'btn.smartCrop': '⚡ Smart Split', 
        'btn.manualCrop': '🖐 Manual Split',
        'btn.gridSplit': '🔲 Grid Split', 
        'btn.reset': '🔄 Reset', 
        'btn.downloadAll': '📥 Download All',
        'btn.bgRemove': 'Remove Background',
        'btn.bgRemoveThenCrop': 'Remove BG Then Split',
        'loading': 'Analyzing and splitting...',
        
        'results.title': 'Results',
        'result.size': 'Size:', 
        'btn.download': 'Download', 
        'btn.delete': 'Delete',

        'f.title.1': 'Smart Extraction', 'f.desc.1': 'Automatically detects disconnected objects in an image and extracts them as separate files.',
        'f.title.2': 'Batch Slicing', 'f.desc.2': 'Perfect for Game Sprite Sheets or Sticker packs. Drag in one image, get dozens of assets instantly.',
        'f.title.3': 'Privacy First', 'f.desc.3': 'All calculations happen in your browser. Your assets are never uploaded to any server.',

        'seo.title': 'Why use ImgCrop Image Splitter?',
        'seo.p1': 'In game dev and design, separating multiple elements from a single image is common. ImgCrop automates this tedious process instantly.',
        'seo.h3.1': 'For Game Developers (Sprite Slicer)',
        'seo.p2': 'Easily split Sprite Sheets into single frames. ImgCrop cuts precisely and exports assets in the exact visual order (Top-to-Bottom, Left-to-Right) to keep animation frames organized.',
        'seo.h3.2': 'For Designers & Scrapbooking',
        'seo.p3': 'Extract individual stickers, labels, or products from composite images. Just drag and drop to identify and split all items.',

        'faq.title': 'FAQ',
        'faq.q1': 'What does this tool do?',
        'faq.a1': 'It automatically identifies and splits a single image containing multiple elements (like stickers, game sprites) into separate PNG files.',
        'faq.q2': 'What is the export format?',
        'faq.a2': 'It exports as PNG. Transparency is preserved if the original image has a transparent background.',
        'faq.q3': 'Can it split close objects?',
        'faq.a3': 'Yes, as long as there is at least 1px gap between elements. If they overlap, use "Manual Split".',
        'faq.q4': 'Is there a file size limit?',
        'faq.a4': 'No hard limit, but since it processes locally, very large images (50MB+) depend on your device memory.',
        'faq.q5': 'Why are there still colored edges?',
        'faq.a5': 'This is caused by anti-aliasing or JPG compression artifacts. To prevent deleting object details, the algorithm preserves these transition pixels.',
        'faq.q6': 'Advantages over desktop software?',
        'faq.a6': 'Cross-platform: Works on Windows, Mac, or iPad via browser. <br>Zero Install: No complex config or virus risks. <br>Privacy: Uses WebAssembly for local processing; images remain in your browser memory and are never uploaded, working even offline.',
        'faq.q7': 'What to do if the original material is cut off or lost during cropping?',
        'faq.a7': 'This usually happens when using the "Remove Background" function, especially when the material edges are close to the background color. We recommend trying the "Remove BG Then Split" function, which first removes the background from the entire image and then performs intelligent splitting, better preserving the integrity and details of the material.',

        'copyright': '© 2026 Smart Image Splitter. All Rights Reserved.',
        'alert.image': 'Please upload an image file!',

        'schema.websiteName': 'Smart Image Splitter',
        'schema.websiteDesc': 'Free online tool to split one image into multiple image files',
        'schema.toolDesc': 'Free online tool to automatically split a single image containing multiple elements into separate PNG files. Supports batch upload and local processing.',

        'schema.featureList': [
            "Auto-detect multiple independent objects in one image",
            "One-click split large image into separate small PNGs",
            "100% local processing, works offline, privacy safe",
            "Batch processing, upload multiple sprite sheets at once",
            "Download all cropped assets as a ZIP file"
        ]
    },
    'ja': {
        'nav.home': 'ホーム', 'nav.features': '機能', 'nav.faq': 'FAQ', 'nav.scene': '利用シーン',
        'title': '画像自動分割ツール - スプライトシートや素材を一括切り抜き',
        'subtitle': '複数の要素を含む画像を自動的に個別のPNGファイルに分割します',
        
        'demo.step1': '📂 画像をアップロード',
        'demo.step2': '⚡ 自動分割',
        'demo.step3': '💾 PNGを保存',

        'upload.text': 'クリックまたはドラッグしてアップロード',
        'upload.sub': 'スプライトシート、ステッカー、素材 (JPG/PNG)',
        'privacy.badge': '🔒 ローカル処理、サーバーへのアップロードなし',

        'btn.smartCrop': '⚡ スマート分割', 
        'btn.manualCrop': '🖐 手動分割',
        'btn.gridSplit': '🔲 グリッド分割', 
        'btn.reset': '🔄 リセット', 
        'btn.downloadAll': '📥 一括DL',
        'btn.bgRemove': '背景除去',
        'btn.bgRemoveThenCrop': '背景除去後分割',
        'loading': '解析中...',
        
        'results.title': '分割結果',
        'result.size': 'サイズ:', 
        'btn.download': 'DL', 
        'btn.delete': '削除',

        'f.title.1': 'スマート抽出', 'f.desc.1': '画像内の独立したオブジェクトを自動検出し、個別のファイルとして保存します。',
        'f.title.2': '一括スライス', 'f.desc.2': 'ゲームのスプライトシートやステッカー画像に最適。1枚の画像から多数の素材を瞬時に生成。',
        'f.title.3': 'プライバシー保護', 'f.desc.3': 'すべての処理はブラウザ内で行われます。素材がサーバーに送信されることはありません。',

        'seo.title': 'なぜ ImgCrop 画像分割ツールなのか？',
        'seo.p1': 'ゲーム開発やデザインにおいて、1枚の画像から複数の要素を切り出す作業は面倒です。ImgCropなら一瞬で完了します。',
        'seo.h3.1': 'ゲーム開発者向け (Sprite Slicer)',
        'seo.p2': 'スプライトシートを個別のフレームに分割します。元画像の並び順（上から下、左から右）通りに正確に書き出すため、アニメーションの順番が崩れません。',
        'seo.h3.2': 'デザイン・素材整理',
        'seo.p3': '複数の商品やステッカーが含まれる画像から、個々のアイテムを抽出します。ドラッグ＆ドロップするだけです。',

        'faq.title': 'よくある質問',
        'faq.q1': '何ができるツールですか？',
        'faq.a1': '複数の要素（ステッカー、キャラなど）を含む1枚の画像を、自動的に個別のPNG画像に分割します。',
        'faq.q2': '書き出し形式は？',
        'faq.a2': 'PNG形式で書き出されます。元画像が透過背景の場合、透明度も保持されます。',
        'faq.q3': '要素が近くても分割できますか？',
        'faq.a3': '1ピクセルでも隙間があれば分割可能です。重なっている場合は「手動分割」を使用してください。',
        'faq.q4': 'ファイルサイズ制限は？',
        'faq.a4': '制限はありませんが、ブラウザで処理するため、メモリ依存となります（50MB以上は注意）。',
        'faq.q5': '背景除去後に縁が残るのはなぜ？',
        'faq.a5': 'アンチエイリアス処理やJPG圧縮による半透明ピクセルが原因です。物体の細部（目や髪など）を保護するため、これらは保持されます。',
        'faq.q6': 'デスクトップソフトと比較した利点は？',
        'faq.a6': 'マルチプラットフォーム：Windows/Mac/iPadなど、ブラウザがあれば即座に使えます。<br>インストール不要：ウイルスリスクや設定の手間がありません。<br>プライバシー保護：WebAssembly技術により、画像はローカルメモリ内でのみ処理され、サーバーには送信されません。<br>オフラインでも動作します。',
        'faq.q7': '画像を切り抜くと元の素材が削られたり消えたりするのはなぜですか？',
        'faq.a7': 'これは主に「背景除去」機能を使用した場合に発生し、特に素材のエッジと背景色が近い場合に顕著です。「背景除去後分割」機能をお試しください。この機能はまず全体の画像から背景を削除し、その後にスマート分割を行うため、素材の完全性と詳細をより良く保持できます。',
        
        'copyright': '© 2026 Smart Image Splitter. All Rights Reserved.',
        'alert.image': '画像ファイルをアップロードしてください！',

        'schema.websiteName': '画像自動分割ツール',
        'schema.websiteDesc': '1枚の画像を複数の素材ファイルに無料オンライン分割',
        'schema.toolDesc': '複数の要素を含む画像を自動的に個別のPNGファイルに分割する無料オンラインツール。一括アップロードとローカル処理に対応。',
        'schema.featureList': [
            "画像内の複数の独立したオブジェクトを自動検出",
            "ワンクリックで大きな画像を小さなPNGに分割",
            "100%ローカル処理、オフライン対応、プライバシー保護",
            "一括処理、複数のスプライトシートを同時アップロード",
            "分割した素材をZIPで一括ダウンロード"
        ]
    },
    'ko': {
        'nav.home': '홈', 'nav.features': '기능', 'nav.faq': 'FAQ', 'nav.scene': '사용 사례',
        'title': '스마트 이미지 분할 도구 - 스프라이트 및 사진 자동 자르기',
        'subtitle': '여러 요소가 포함된 이미지를 개별 PNG 파일로 자동 분할합니다.',
        
        'demo.step1': '📂 이미지 업로드',
        'demo.step2': '⚡ 자동 분할',
        'demo.step3': '💾 PNG 저장',

        'upload.text': '클릭하거나 드래그하여 업로드',
        'upload.sub': '스프라이트 시트, 스티커, 소재 (JPG/PNG)',
        'privacy.badge': '🔒 로컬 처리, 서버 업로드 없음',

        'btn.smartCrop': '⚡ 스마트 분할', 
        'btn.manualCrop': '🖐 수동 분할',
        'btn.gridSplit': '🔲 그리드 분할', 
        'btn.reset': '🔄 초기화', 
        'btn.downloadAll': '📥 전체 다운로드',
        'btn.bgRemove': '배경 제거',
        'btn.bgRemoveThenCrop': '배경 제거 후 분할',
        'loading': '분석 중...',
        
        'results.title': '분할 결과',
        'result.size': '크기:', 
        'btn.download': '다운로드', 
        'btn.delete': '삭제',

        'f.title.1': '스마트 추출', 'f.desc.1': '이미지 내의 분리된 객체를 자동 감지하여 개별 파일로 저장합니다.',
        'f.title.2': '일괄 슬라이스', 'f.desc.2': '게임 스프라이트 시트나 스티커 이미지 처리에 최적. 한 장의 이미지에서 수십 개의 소재를 즉시 생성.',
        'f.title.3': '개인정보 보호', 'f.desc.3': '모든 계산은 브라우저에서 수행됩니다. 이미지는 서버로 전송되지 않습니다.',

        'seo.title': '왜 ImgCrop 이미지 분할 도구인가요?',
        'seo.p1': '게임 개발 및 디자인에서 하나의 이미지에서 여러 요소를 분리하는 작업은 번거롭습니다. ImgCrop으로 자동화하세요.',
        'seo.h3.1': '게임 개발자용 (Sprite Slicer)',
        'seo.p2': '스프라이트 시트를 개별 프레임으로 분할합니다. 원본 이미지의 순서(위에서 아래, 왼쪽에서 오른쪽) 그대로 내보내어 애니메이션 프레임 순서를 유지합니다.',
        'seo.h3.2': '디자인 및 소재 정리',
        'seo.p3': '여러 상품이나 스티커가 포함된 이미지에서 개별 아이템을 추출합니다. 드래그 앤 드롭만 하세요.',

        'faq.title': '자주 묻는 질문',
        'faq.q1': '어떤 도구인가요?',
        'faq.a1': '여러 요소(스티커, 게임 캐릭터 등)가 포함된 하나의 이미지를 자동으로 식별하여 별도의 PNG 파일로 분할합니다.',
        'faq.q2': '내보내기 형식은?',
        'faq.a2': 'PNG 형식으로 내보냅니다. 원본 배경이 투명하면 투명도도 유지됩니다.',
        'faq.q3': '요소가 가까워도 분할되나요?',
        'faq.a3': '1픽셀이라도 간격이 있으면 분할 가능합니다. 겹쳐 있는 경우 "수동 분할"을 사용하세요.',
        'faq.q4': '파일 크기 제한이 있나요?',
        'faq.a4': '제한은 없지만 로컬 브라우저 처리이므로 장치 메모리에 따라 다릅니다 (50MB 이상 주의).',
        'faq.q5': '배경 제거 후 가장자리에 색이 남는 이유는?',
        'faq.a5': '안티앨리어싱 처리나 JPG 압축 노이즈 때문입니다. 객체의 디테일을 보호하기 위해 알고리즘은 이러한 가장자리를 보존합니다.',
        'faq.q6': '데스크톱 소프트웨어보다 나은 점은 무엇인가요?',
        'faq.a6': '크로스 플랫폼: Windows, Mac, iPad 어디서든 브라우저만 열면 됩니다. <br>설치 불필요: 바이러스 위험이나 복잡한 설정이 없습니다. <br>개인정보 보호: WebAssembly 기술을 사용하여 이미지가 로컬 브라우저 메모리에서만 처리되며, 서버로 전송되지 않습니다. 오프라인에서도 작동합니다.',
        'faq.q7': '이미지 자르기 중 원본 재료가 잘려나가거나 사라졌어요. 어떻게 해야 하나요?',
        'faq.a7': '이런 경우는 주로 "배경 제거" 기능을 사용할 때 발생하며, 특히 재료의 가장자리가 배경색과 유사할 때 더 자주 발생합니다. "배경 제거 후 분할" 기능을 사용해 보세요. 이 기능은 전체 이미지에서 먼저 배경을 제거한 후 스마트 분할을 수행하므로, 재료의 완전성과 세부 사항을 더 잘 유지할 수 있습니다.',
        
        'copyright': '© 2026 Smart Image Splitter. All Rights Reserved.',
        'alert.image': '이미지 파일을 업로드해주세요!',

        'schema.websiteName': '스마트 이미지 분할 도구',
        'schema.websiteDesc': '하나의 이미지를 여러 소재 파일로 분할하는 무료 온라인 도구',
        'schema.toolDesc': '여러 요소가 포함된 단일 이미지를 별도의 PNG 파일로 자동 분할하는 무료 온라인 도구입니다. 일괄 업로드 및 로컬 처리를 지원합니다.',
        'schema.featureList': [
            "이미지 내의 여러 독립 개체 자동 감지",
            "원클릭으로 큰 이미지를 별도의 작은 PNG로 분할",
            "100% 로컬 처리, 오프라인 사용 가능, 개인정보 보호",
            "일괄 처리, 여러 스프라이트 시트 동시 업로드 지원",
            "분할된 소재를 ZIP 파일로 일괄 다운로드"
        ]
    }
};


/** 站点支持的四种语言，顺序与导航栏下拉一致 */
export const LANGS = ['zh-CN', 'en', 'ja', 'ko'];

/** <html lang> 取值 */
export const HTML_LANG = { 'zh-CN': 'zh-CN', en: 'en', ja: 'ja', ko: 'ko' };

// 路径映射：与 _worker.js 的语言包、sitemap.xml 的 hreflang 保持一致。
// 中文的 canonical 就是根路径，所以 zh-CN 也映射到 '/'：切语言时不会再把地址栏
// 改写成 /zh，避免出现一个「内容与根路径完全相同、却只能靠 canonical 合并」的重复 URL。
// 历史 /zh 链接仍然可用（_redirects 的 /* → /index.html 200 兜底，渲染出来的就是中文页）。
export const langToPath = { 'zh-CN': '/', en: '/en', ja: '/ja', ko: '/ko' };
export const pathToLang = { '/zh': 'zh-CN', '/en': 'en', '/ja': 'ja', '/ko': 'ko' };

const STORAGE_KEY = 'imgcrop-lang';
/** 迁移前的 localStorage 键名，读取时作为兜底，避免老用户的语言选择丢失 */
const LEGACY_STORAGE_KEY = 'language';

function normalizeLang(value) {
  if (typeof value !== 'string') return null;
  if (LANGS.includes(value)) return value;
  // 容忍 navigator.language 给出的 zh / zh-CN / zh-Hans 等形式
  const lower = value.toLowerCase();
  if (lower.startsWith('zh')) return 'zh-CN';
  if (lower.startsWith('ja')) return 'ja';
  if (lower.startsWith('ko')) return 'ko';
  if (lower.startsWith('en')) return 'en';
  return null;
}

function readStoredLang() {
  try {
    return (
      normalizeLang(localStorage.getItem(STORAGE_KEY)) ||
      normalizeLang(localStorage.getItem(LEGACY_STORAGE_KEY))
    );
  } catch {
    /* 隐私模式下 localStorage 不可用 */
    return null;
  }
}

/** 从 URL 路径前缀取语言（/en /ja /ko），取不到返回 null */
export function langFromPath(pathname) {
  const segment = '/' + (String(pathname || '').split('/')[1] || '');
  return pathToLang[segment] || null;
}

function detectLang() {
  return (
    langFromPath(window.location.pathname) ||
    readStoredLang() ||
    normalizeLang(navigator.language) ||
    'zh-CN'
  );
}

export const i18n = reactive({
  lang: detectLang(),

  /**
   * 取文案。缺失时按 当前语言 → 中文 → key 本身 的顺序兜底，
   * 与迁移前 applyI18n 里 `t[key]` 取值的行为一致（旧实现缺键时直接跳过不改写 DOM）。
   */
  t(key, params) {
    let text = messages[this.lang]?.[key] ?? messages['zh-CN']?.[key] ?? key;
    if (params) {
      for (const [name, value] of Object.entries(params)) {
        text = text.replaceAll(`{${name}}`, String(value));
      }
    }
    return text;
  },

  /** 取数组类文案（如 schema.featureList），缺失时回退中文 */
  list(key) {
    const value = messages[this.lang]?.[key] ?? messages['zh-CN']?.[key];
    return Array.isArray(value) ? value : [];
  },
});

/** 切换语言：写 localStorage、同步 <html lang>、按需改写地址栏路径前缀 */
export function setLang(lang, { updateUrl = true } = {}) {
  const next = normalizeLang(lang) || 'zh-CN';
  i18n.lang = next;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    /* 隐私模式下 localStorage 不可用 */
  }
  document.documentElement.lang = HTML_LANG[next];

  if (updateUrl) {
    // 与迁移前 updateURL() 行为一致：把路径前缀换成目标语言，并保留 hash
    const hash = window.location.hash || '';
    const target = langToPath[next] + hash;
    if (window.location.pathname + hash !== target) {
      window.history.replaceState(null, '', target);
    }
  }
}
