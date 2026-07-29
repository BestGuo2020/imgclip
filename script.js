// --- START OF FILE script.js ---

// 多语言配置
const i18n = {
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

let cropper = null;
let croppedImages = [];
let currentLang = 'zh-CN';

// 进度条控制函数
function showProgress() {
    const progressContainer = document.getElementById('progressContainer');
    progressContainer.style.display = 'block';
}

function hideProgress() {
    const progressContainer = document.getElementById('progressContainer');
    progressContainer.style.display = 'none';
}

function updateProgress(percent, text) {
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const progressPercent = document.getElementById('progressPercent');
    
    // 确保百分比在0-100之间
    percent = Math.max(0, Math.min(100, percent));
    
    progressBar.style.width = percent + '%';
    progressText.textContent = text || `正在处理...`;
    progressPercent.textContent = percent + '%';
}

// 路径映射
const langToPath = { 'zh-CN': '/zh', 'en': '/en', 'ja': '/ja', 'ko': '/ko' };
const pathToLang = { '/zh': 'zh-CN', '/en': 'en', '/ja': 'ja', '/ko': 'ko' };

document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('fileInput');
    const uploadArea = document.getElementById('uploadArea');
    const cropBtn = document.getElementById('cropBtn');
    const manualCropBtn = document.getElementById('manualCropBtn');
    const resetBtn = document.getElementById('resetBtn');
    const downloadAllBtn = document.getElementById('downloadAllBtn');

    // 1. 初始化多语言
    initI18n();

    // 2. 上传逻辑 (防止双重触发)
    uploadArea.addEventListener('click', function(e) {
        fileInput.click();
    });
    
    fileInput.addEventListener('click', function(e) {
        e.stopPropagation();
    });

    // 拖拽上传
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#4f46e5';
        uploadArea.style.background = '#eef2ff';
    });
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.borderColor = '';
        uploadArea.style.background = '';
    });
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '';
        uploadArea.style.background = '';
        if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]);
    });

    fileInput.addEventListener('change', function() {
        if (this.files.length > 0) handleFile(this.files[0]);
    });

    // 下拉菜单交互
    const cropDropdown = document.getElementById('cropDropdown');
    const bgRemoveBtn = document.getElementById('bgRemoveBtn');
    
    // 按钮事件
    cropBtn.addEventListener('click', function(e) {
        // 执行智能拆分功能
        smartCrop();
    });
    manualCropBtn.addEventListener('click', manualCrop);
    resetBtn.addEventListener('click', reset);
    downloadAllBtn.addEventListener('click', downloadAll);

    // 添加鼠标悬停显示下拉菜单的功能
    cropBtn.parentElement.addEventListener('mouseenter', function() {
        this.classList.add('show');
    });
    
    cropBtn.parentElement.addEventListener('mouseleave', function() {
        this.classList.remove('show');
    });
    
    // 点击"一键去底"按钮
    bgRemoveBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        backgroundRemove();
        cropDropdown.parentElement.classList.remove('show');
    });
    
    // 点击"先去底再拆分"按钮
    const bgRemoveThenCropBtn = document.getElementById('bgRemoveThenCropBtn');
    bgRemoveThenCropBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        bgRemoveThenCrop();
        cropDropdown.parentElement.classList.remove('show');
    });
    
    // 点击外部区域关闭下拉菜单
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.dropdown')) {
            document.querySelectorAll('.dropdown').forEach(dropdown => {
                dropdown.classList.remove('show');
            });
        }
    });
    
    // 阻止菜单内点击关闭菜单
    cropDropdown.addEventListener('click', function(e) {
        e.stopPropagation();
    });
});

// 文件处理函数
function handleFile(file) {
    if (!file.type.startsWith('image/')) {
        alert(i18n[currentLang]['alert.image']);
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const image = document.getElementById('image');
        image.src = e.target.result;
        
        // 强制显示预览容器
        const previewContainer = document.getElementById('previewContainer');
        previewContainer.style.display = 'block'; 

        if (cropper) cropper.destroy();
        
        cropper = new Cropper(image, {
            viewMode: 1,
            autoCropArea: 1,
            responsive: true,
            background: false // 不显示网格背景
        });

        // 启用按钮
        document.getElementById('cropBtn').disabled = false;
        document.getElementById('manualCropBtn').disabled = false;
        document.getElementById('resetBtn').disabled = false;
        
        // 隐藏上传提示，只留图
        // 注意：这里隐藏父元素中的文字部分，保留容器大小
        const hints = document.querySelectorAll('.upload-icon, .upload-hint, .upload-sub, .privacy-badge');
        hints.forEach(el => el.style.display = 'none');
    };
    reader.readAsDataURL(file);
}

// 从URL中获取语言
function getLanguageFromURL() {
    const path = window.location.pathname;
    const normalizedPath = path.endsWith('/') ? path.slice(0, -1) : path;
    
    if (pathToLang[normalizedPath]) {
        return pathToLang[normalizedPath];
    }
    
    const firstSegment = normalizedPath.split('/')[1] || '';
    const langPath = '/' + firstSegment;
    if (pathToLang[langPath]) {
        return pathToLang[langPath];
    }
    
    return null;
}

// 更新URL
function updateURL() {
    const path = langToPath[currentLang] || '';
    const url = window.location.origin + path + window.location.search + window.location.hash;
    history.pushState({ lang: currentLang }, '', url);
}

// 初始化多语言
function initI18n() {
    const urlLang = getLanguageFromURL();
    if (urlLang && i18n[urlLang]) {
        currentLang = urlLang;
        document.getElementById('language').value = urlLang;
        localStorage.setItem('language', urlLang);
    } else {
        const savedLang = localStorage.getItem('language');
        if (savedLang && i18n[savedLang]) {
            currentLang = savedLang;
            document.getElementById('language').value = savedLang;
        }
        updateURL();
    }
    applyI18n();
}

// 应用多语言
function applyI18n() {
    const t = i18n[currentLang];
    if (!t) return;

    const setText = (selector, key) => {
        const el = document.querySelector(selector);
        if (el && t[key]) el.innerHTML = t[key];
    };

    // 更新title标签
    if (t['title']) {
        let titleText = t['title'];
        let ogTitleText = t['title'];
        
        // 使用完整的标题（已在i18n对象中包含副标题）
        titleText = t['title'];
        ogTitleText = t['title'];
        
        // 更新页面title
        document.title = titleText;
        
        // 更新Open Graph和Twitter Card title
        const ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle) ogTitle.setAttribute('content', ogTitleText);
        
        const twitterTitle = document.querySelector('meta[name="twitter:title"]');
        if (twitterTitle) twitterTitle.setAttribute('content', ogTitleText);
    }

    // 导航
    setText('.nav-home', 'nav.home');
    setText('.nav-features', 'nav.features');
    setText('.nav-faq', 'nav.faq');
    // 新增导航项
    const sceneNav = document.querySelector('a[href="#seo-content"]');
    if(sceneNav) sceneNav.textContent = t['nav.scene'];

    // 头部
    setText('.page-title', 'title');
    setText('.page-subtitle', 'subtitle');

    // 演示流程 (通过 nth-child 或 querySelectorAll 定位)
    const demoSteps = document.querySelectorAll('.demo-step');
    if (demoSteps.length >= 3) {
        demoSteps[0].textContent = t['demo.step1'];
        demoSteps[1].textContent = t['demo.step2'];
        demoSteps[2].textContent = t['demo.step3'];
    }

    // 上传区域
    setText('.upload-hint', 'upload.text');
    setText('.upload-sub', 'upload.sub');
    setText('.privacy-badge', 'privacy.badge');

    // 按钮
    const btns = {
        'cropBtn': 'btn.smartCrop',
        'manualCropBtn': 'btn.manualCrop',
        'resetBtn': 'btn.reset',
        'downloadAllBtn': 'btn.downloadAll',
        'bgRemoveBtn': 'btn.bgRemove',
        'bgRemoveThenCropBtn': 'btn.bgRemoveThenCrop'
    };
    for (let id in btns) {
        const btn = document.getElementById(id);
        if (btn) btn.textContent = t[btns[id]];
    }
    
    // 结果标题
    setText('.results-title', 'results.title');
    setText('.loading-text', 'loading');

    // Features
    setText('.f-title-1', 'f.title.1'); setText('.f-desc-1', 'f.desc.1');
    setText('.f-title-2', 'f.title.2'); setText('.f-desc-2', 'f.desc.2');
    setText('.f-title-3', 'f.title.3'); setText('.f-desc-3', 'f.desc.3');

    // SEO Content (新增区域)
    const seoContent = document.querySelector('.seo-content');
    if (seoContent) {
        const h2 = seoContent.querySelector('h2');
        if(h2) h2.textContent = t['seo.title'];

        // 获取该区域内的所有 h3 和 p
        const h3s = seoContent.querySelectorAll('h3');
        const ps = seoContent.querySelectorAll('p');

        if(ps[0]) ps[0].textContent = t['seo.p1'];
        
        if(h3s[0]) h3s[0].textContent = t['seo.h3.1'];
        if(ps[1]) ps[1].textContent = t['seo.p2'];
        
        if(h3s[1]) h3s[1].textContent = t['seo.h3.2'];
        if(ps[2]) ps[2].textContent = t['seo.p3'];
    }

    // 更新meta标签（描述和关键词）
    const descriptions = {
        'zh-CN': '免费在线图片素材拆分工具，自动识别一张图片中的多个独立元素并裁剪为单独的PNG文件。适合游戏Sprite精灵图拆分、贴纸素材提取、电商拼图切片。',
        'en': 'Free online tool to auto-split sprite sheets and scanned photos into separate PNG images. One-click batch extraction. Local processing, privacy safe.',
        'ja': 'スプライトシートやスキャンした写真を自動的に個別のPNG画像に分割・切り抜きできる無料オンラインツール。ブラウザ完結でプライバシーも安心。',
        'ko': '스프라이트 시트나 스캔한 사진에서 여러 이미지를 자동으로 감지하여 개별 PNG로 분할해 주는 무료 온라인 도구입니다. 100% 로컬 처리로 안전합니다.'
    };
    
    const ogDescriptions = {
        'zh-CN': '自动识别并拆分一张图片中的多个独立素材，一键导出为单独的PNG文件。纯本地处理，保护隐私。',
        'en': 'Automatically detect and split multiple objects from a single image. Export as separate PNGs. 100% local processing.',
        'ja': '一枚の画像に含まれる複数の要素を自動認識して分割し、個別のPNGとして保存します。インストール不要、完全無料。',
        'ko': '하나의 이미지에 포함된 여러 요소를 자동으로 인식하여 분할하고 저장합니다. 서버 업로드 없이 브라우저에서 바로 처리하세요.'
    };
    
    const keywords = {
        'zh-CN': '图片素材拆分,图片分割工具,Sprite切片,精灵图拆分,在线切图,图片素材提取,批量裁剪,PNG分割',
        'en': 'image splitter, sprite sheet cutter, auto crop multiple photos, extract images from image, sprite slicer, online image separator',
        'ja': '画像分割, スプライトシート分割, 画像切り抜き, 自動切り抜き, 一括保存, 素材抽出, オンラインツール',
        'ko': '이미지 분할, 스프라이트 자르기, 사진 자동 자르기, 이미지 추출, 누끼따기, 온라인 이미지 편집'
    };
    
    // 更新meta description
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && descriptions[currentLang]) {
        metaDesc.setAttribute('content', descriptions[currentLang]);
    }
    
    // 更新meta keywords
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords && keywords[currentLang]) {
        metaKeywords.setAttribute('content', keywords[currentLang]);
    }
    
    // 更新og:description和twitter:description
    const ogDesc = document.querySelector('meta[property="og:description"]');
    const twitterDesc = document.querySelector('meta[name="twitter:description"]');
    if (ogDesc && twitterDesc && ogDescriptions[currentLang]) {
        ogDesc.setAttribute('content', ogDescriptions[currentLang]);
        twitterDesc.setAttribute('content', ogDescriptions[currentLang]);
    }

    // FAQ
    setText('.faq-header', 'faq.title');
    setText('.q1', 'faq.q1'); setText('.a1', 'faq.a1');
    setText('.q2', 'faq.q2'); setText('.a2', 'faq.a2');
    setText('.q3', 'faq.q3'); setText('.a3', 'faq.a3');
    setText('.q4', 'faq.q4'); setText('.a4', 'faq.a4');
    setText('.q5', 'faq.q5'); setText('.a5', 'faq.a5');
    setText('.q6', 'faq.q6'); setText('.a6', 'faq.a6');
    setText('.q7', 'faq.q7'); setText('.a7', 'faq.a7');

    // 页脚
    setText('.copyright', 'copyright');

    // --- 新增：更新 JSON-LD (Schema) ---
    // 更新 WebSite Schema
    const websiteScript = document.getElementById('ld-website');
    if (websiteScript) {
        try {
            const data = JSON.parse(websiteScript.textContent);
            data.name = t['schema.websiteName'];
            data.description = t['schema.websiteDesc'];
            // 可选：更新 URL 以匹配当前语言路径
            // data.url = window.location.href; 
            websiteScript.textContent = JSON.stringify(data, null, 4);
        } catch (e) { console.error('Error updating WebSite schema', e); }
    }

    // 更新 Tool Schema
    const toolScript = document.getElementById('ld-tool');
    if (toolScript) {
        try {
            const data = JSON.parse(toolScript.textContent);
            data.name = t['schema.websiteName'];
            data.description = t['schema.toolDesc'];
            data.featureList = t['schema.featureList'];
            toolScript.textContent = JSON.stringify(data, null, 4);
        } catch (e) { console.error('Error updating Tool schema', e); }
    }
}

// 切换语言
function changeLanguage() {
    const langSelect = document.getElementById('language');
    currentLang = langSelect.value;
    localStorage.setItem('language', currentLang);
    
    const path = langToPath[currentLang] || '/';
    window.history.replaceState(null, '', path);
    
    applyI18n();
}

// 智能拆分 (原 smartCrop)
function smartCrop() {
    const loading = document.getElementById('loading');
    loading.style.display = 'inline-block';
    showProgress();
    updateProgress(0, '正在分析图像...');
    document.getElementById('cropBtn').disabled = true;
    document.getElementById('manualCropBtn').disabled = true;
    
    // 延迟一点执行，让loading显示出来
    setTimeout(() => {
        const canvas = cropper.getCroppedCanvas();
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // 核心检测算法
        updateProgress(20, '正在检测区域...');
        let regions = detectRange(imageData);

        // 使用统一的排序函数，确保与先去底再拆分功能排序一致
        regions = sortRegions(regions);
        
        croppedImages = [];
        const totalRegions = regions.length;
        
        regions.forEach((region, index) => {
            const progress = 20 + Math.round((index + 1) / totalRegions * 80);
            updateProgress(progress, `正在生成第 ${index + 1} 个素材...`);
            
            const croppedCanvas = document.createElement('canvas');
            croppedCanvas.width = region.width;
            croppedCanvas.height = region.height;
            const croppedCtx = croppedCanvas.getContext('2d');
            
            croppedCtx.drawImage(canvas, region.x, region.y, region.width, region.height, 0, 0, region.width, region.height);
            
            const dataURL = croppedCanvas.toDataURL('image/png');
            croppedImages.push({
                id: index, // 排序后的索引，保证文件名 split_1, split_2 顺序正确
                dataURL: dataURL,
                width: region.width,
                height: region.height
            });
        });
        
        updateProgress(100, '处理完成！');
        displayResults();
        
        // 延迟隐藏进度条，让用户看到100%的状态
        setTimeout(() => {
            loading.style.display = 'none';
            hideProgress();
        }, 300);
        
        document.getElementById('cropBtn').disabled = false;
        document.getElementById('manualCropBtn').disabled = false;
        document.getElementById('downloadAllBtn').disabled = false;
    }, 50);
}

// 针对游戏素材的常见背景色列表
const commonBgColors = [
    { r: 192, g: 176, b: 144, a: 255 }, // 浅棕色（游戏素材常见背景）
    { r: 255, g: 255, b: 255, a: 255 }, // 白色
    { r: 0, g: 0, b: 0, a: 255 },       // 黑色
    { r: 128, g: 128, b: 128, a: 255 }  // 灰色
];

// 一键去底功能
async function backgroundRemove() {
    const loading = document.getElementById('loading');
    loading.style.display = 'inline-block';
    showProgress();
    updateProgress(0, '准备中...');
    // 禁用按钮防止重复点击
    toggleButtons(true);
    
    try {
        // 1. 如果还没有拆分图片，先执行智能拆分
        if (croppedImages.length === 0) {
            // 这里调用你原本的逻辑生成 croppedImages
            // 为了代码简洁，假设这里已经有 croppedImages 或者复用 smartCrop 的逻辑
            smartCrop(); 
            // 注意：smartCrop 是异步带延时的，实际项目中最好把 smartCrop 封装成返回 Promise 的函数
            // 这里为了稳健，建议用户先点击“智能拆分”，再点“一键去底”
            // 如果必须自动触发，请确保 croppedImages 已生成
            await new Promise(r => setTimeout(r, 100)); 
        }

        if (croppedImages.length === 0) {
            alert('请先进行智能拆分！');
            hideProgress();
            return;
        }
        
        // 2. 批量处理图片
        const processedImages = [];
        const totalImages = croppedImages.length;
        
        for (let i = 0; i < totalImages; i++) {
            updateProgress(Math.round((i / totalImages) * 100), `正在处理第 ${i + 1} 个素材...`);
            processedImages.push(await processSingleImageBackground(croppedImages[i]));
        }
        
        // 3. 更新结果
        updateProgress(100, '处理完成！');
        croppedImages = processedImages;
        displayResults();
        
    } catch (error) {
        console.error('Background removal error:', error);
        hideProgress();
    } finally {
        // 延迟隐藏进度条，让用户看到100%的状态
        setTimeout(() => {
            loading.style.display = 'none';
            hideProgress();
        }, 300);
        toggleButtons(false);
    }
}

// 先去底再拆分功能
async function bgRemoveThenCrop() {
    const loading = document.getElementById('loading');
    loading.style.display = 'inline-block';
    showProgress();
    updateProgress(0, '准备中...');
    // 禁用按钮防止重复点击
    toggleButtons(true);
    
    try {
        // 1. 获取当前预览图片
        updateProgress(10, '正在获取图片...');
        const canvas = cropper.getCroppedCanvas();
        const imageData = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
        
        // 2. 对图片进行去底处理（不修改预览区域）
        updateProgress(20, '正在创建临时画布...');
        // 创建临时画布
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        
        // 复制原始图像数据到临时画布
        tempCtx.putImageData(imageData, 0, 0);
        
        // 3. 对临时画布进行去底处理
        updateProgress(30, '正在检测背景色...');
        const bgColor = detectBorderBackgroundColor(imageData);
        
        updateProgress(40, '正在去除背景...');
        removeBackgroundFloodFill(imageData, bgColor);
        
        updateProgress(50, '正在净化边缘...');
        cleanEdges(imageData, bgColor, 60);
        
        updateProgress(60, '正在去除噪点...');
        removeSpeckles(imageData, 30);
        
        // 将去底后的图像数据放回临时画布
        tempCtx.putImageData(imageData, 0, 0);
        
        // 4. 对去底后的图片进行智能拆分
        updateProgress(70, '正在检测区域...');
        const processedImageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        
        // 使用智能拆分的核心检测算法，并应用统一的排序函数
        let regions = detectRange(processedImageData);
        regions = sortRegions(regions);
        
        // 5. 生成拆分结果
        updateProgress(80, '正在生成素材...');
        croppedImages = [];
        const totalRegions = regions.length;
        
        regions.forEach((region, index) => {
            const progress = 80 + Math.round((index + 1) / totalRegions * 20);
            updateProgress(progress, `正在生成第 ${index + 1} 个素材...`);
            
            const croppedCanvas = document.createElement('canvas');
            croppedCanvas.width = region.width;
            croppedCanvas.height = region.height;
            const croppedCtx = croppedCanvas.getContext('2d');
            
            croppedCtx.drawImage(tempCanvas, region.x, region.y, region.width, region.height, 0, 0, region.width, region.height);
            
            const dataURL = croppedCanvas.toDataURL('image/png');
            croppedImages.push({
                id: index,
                dataURL: dataURL,
                width: region.width,
                height: region.height
            });
        });
        
        // 6. 显示拆分结果
        updateProgress(100, '处理完成！');
        displayResults();
        
    } catch (error) {
        console.error('Background removal then crop error:', error);
        hideProgress();
    } finally {
        // 延迟隐藏进度条，让用户看到100%的状态
        setTimeout(() => {
            loading.style.display = 'none';
            hideProgress();
        }, 300);
        toggleButtons(false);
    }
}

// 辅助函数：切换按钮状态
function toggleButtons(disabled) {
    const ids = ['cropBtn', 'manualCropBtn', 'downloadAllBtn'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if(el) el.disabled = disabled;
    });
}

// 处理单张图片的去底逻辑
async function processSingleImageBackground(imgObj) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const image = new Image();
    image.crossOrigin = "Anonymous";
    
    await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
        image.src = imgObj.dataURL;
    });
    
    canvas.width = image.width;
    canvas.height = image.height;
    ctx.drawImage(image, 0, 0);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // --- 1. 获取背景色 ---
    const bgColor = detectBorderBackgroundColor(imageData);
    
    // --- 2. 核心去底 (泛洪填充) ---
    // 这一步负责把大面积背景去掉
    removeBackgroundFloodFill(imageData, bgColor); // 注意：把 bgColor 传进去，避免重复计算
    
    // --- 3. 新增：边缘净化 (消除杂边) ---
    // tolerance 设为 60-80，比泛洪的容差大，专门对付边缘那些顽固的半透明像素
    cleanEdges(imageData, bgColor, 60); 
    
    // --- 4. 新增：去除噪点 (消除角落残留) ---
    // 小于 30 像素的独立小块会被删掉
    removeSpeckles(imageData, 30);
    
    ctx.putImageData(imageData, 0, 0);
    
    return {
        ...imgObj,
        dataURL: canvas.toDataURL('image/png')
    };
}

/**
 * 核心去底算法：边缘采样 + 泛洪填充 (Flood Fill)
 * 优点：保护物体内部颜色，只去除外部连通背景
 */
function removeBackgroundFloodFill(imageData, bgColor) {
    const { width, height, data } = imageData;
    const visited = new Uint8Array(width * height); // 标记已处理像素

    // 2. 初始化队列，将图像四周的像素加入种子队列
    const queue = [];
    
    // 定义容差 (0-255)，对于 JPG 压缩图，建议 20-40，PNG 原图可以 10
    // 你之前的代码针对某特定颜色用了超大容差，这里我们使用动态容差
    let tolerance = 30; 
    
    // 辅助：检查颜色是否匹配背景
    function isMatch(idx) {
        const r = data[idx], g = data[idx+1], b = data[idx+2], a = data[idx+3];
        // 欧氏距离计算颜色差异
        const diff = Math.sqrt(
            Math.pow(r - bgColor.r, 2) + 
            Math.pow(g - bgColor.g, 2) + 
            Math.pow(b - bgColor.b, 2)
        );
        return diff <= tolerance && Math.abs(a - bgColor.a) <= tolerance;
    }

    // 扫描上下左右四条边
    for (let x = 0; x < width; x++) {
        addSeed(x, 0);            // Top
        addSeed(x, height - 1);   // Bottom
    }
    for (let y = 0; y < height; y++) {
        addSeed(0, y);            // Left
        addSeed(width - 1, y);    // Right
    }

    function addSeed(x, y) {
        const idx = (y * width + x);
        if (visited[idx]) return;
        
        const pos = idx * 4;
        if (isMatch(pos)) {
            queue.push(idx);
            visited[idx] = 1;
        }
    }
    
    // 3. 开始泛洪填充 (BFS)
    // 只有与边缘背景连通的像素才会被变成透明
    while (queue.length > 0) {
        const currIdx = queue.shift();
        const cx = currIdx % width;
        const cy = Math.floor(currIdx / width);
        
        // 将当前像素设为透明
        const pos = currIdx * 4;
        data[pos] = 0;
        data[pos+1] = 0;
        data[pos+2] = 0;
        data[pos+3] = 0;
        
        // 检查 4 邻域
        const neighbors = [
            {x: cx, y: cy - 1}, // Up
            {x: cx, y: cy + 1}, // Down
            {x: cx - 1, y: cy}, // Left
            {x: cx + 1, y: cy}  // Right
        ];
        
        for (let n of neighbors) {
            if (n.x >= 0 && n.x < width && n.y >= 0 && n.y < height) {
                const nIdx = n.y * width + n.x;
                if (visited[nIdx] === 0) {
                    const nPos = nIdx * 4;
                    // 如果邻居颜色也接近背景色，加入队列继续腐蚀
                    if (isMatch(nPos)) {
                        visited[nIdx] = 1;
                        queue.push(nIdx);
                    }
                }
            }
        }
    }
}

/**
 * 优化后的背景色检测：只统计图片边缘一圈的像素
 * 防止把物体主体颜色误判为背景
 */
function detectBorderBackgroundColor(imageData) {
    const { width, height, data } = imageData;
    const colorCounts = {};
    let maxCount = 0;
    let bestColor = { r: 0, g: 0, b: 0, a: 0 }; // 默认
    
    // 辅助统计函数
    function countPixel(x, y) {
        const i = (y * width + x) * 4;
        const r = data[i], g = data[i+1], b = data[i+2], a = data[i+3];
        
        // 忽略已经完全透明的像素
        if (a === 0) return;
        
        // 简单的量化键值 (降低精度以聚合相似颜色)
        // 例如：将 255 种颜色压缩到 51 个桶，容忍噪点
        const bin = 5; 
        const key = `${Math.floor(r/bin)},${Math.floor(g/bin)},${Math.floor(b/bin)}`;
        
        if (!colorCounts[key]) {
            colorCounts[key] = { count: 0, r, g, b, a };
        }
        colorCounts[key].count++;
        
        if (colorCounts[key].count > maxCount) {
            maxCount = colorCounts[key].count;
            bestColor = { r: colorCounts[key].r, g: colorCounts[key].g, b: colorCounts[key].b, a: colorCounts[key].a };
        }
    }
    
    // 扫描四条边
    // 步长 step 可以设为 1，如果图很大可以设为 2 或 4 提高性能
    const step = 1; 
    
    // Top & Bottom
    for (let x = 0; x < width; x += step) {
        countPixel(x, 0);
        countPixel(x, height - 1);
    }
    // Left & Right
    for (let y = 1; y < height - 1; y += step) {
        countPixel(0, y);
        countPixel(width - 1, y);
    }
    
    return bestColor;
}

// 检测背景色（优化算法：分析整个图片的像素分布）
function detectBackgroundColor(imageData) {
    const { width, height, data } = imageData;
    const colorCounts = {};
    let maxCount = 0;
    let mostCommonColor = { r: 255, g: 255, b: 255, a: 255 };
    
    // 分析整个图片的像素分布
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];
        
        // 跳过完全透明的像素
        if (a === 0) continue;
        
        const key = `${r},${g},${b}`; // 忽略alpha通道，只考虑RGB
        colorCounts[key] = (colorCounts[key] || 0) + 1;
        
        if (colorCounts[key] > maxCount) {
            maxCount = colorCounts[key];
            mostCommonColor = { r, g, b, a };
        }
    }
    
    // 检查是否匹配常见背景色
    for (const commonColor of commonBgColors) {
        const key = `${commonColor.r},${commonColor.g},${commonColor.b}`;
        if (colorCounts[key] && colorCounts[key] > maxCount * 0.5) {
            return commonColor;
        }
    }
    
    return mostCommonColor;
}

// 检测两个颜色是否相似（优化版本）
function isSimilarColor(r1, g1, b1, a1, r2, g2, b2, a2, tolerance) {
    // 针对游戏素材的背景色，使用更宽松的阈值
    if (r2 === 192 && g2 === 176 && b2 === 144) {
        // 游戏素材常见浅棕色背景，使用更宽松的阈值
        const colorDiff = Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2);
        return colorDiff < tolerance * 4;
    }
    
    // 普通颜色比较
    const colorDiff = Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2);
    const alphaDiff = Math.abs(a1 - a2);
    return colorDiff < tolerance * 3 && alphaDiff < tolerance;
}

/**
 * 统一区域排序函数：按照视觉顺序（从上到下，从左到右）排序区域
 * @param {Array} regions - 待排序的区域数组
 * @returns {Array} - 排序后的区域数组
 */
function sortRegions(regions) {
    // 1. 为每个区域计算中心点坐标
    const regionsWithCenters = regions.map(region => ({
        ...region,
        centerX: region.x + region.width / 2,
        centerY: region.y + region.height / 2
    }));
    
    // 2. 首先按照区域顶部坐标排序，初步确定行顺序
    regionsWithCenters.sort((a, b) => a.y - b.y);
    
    // 3. 分组行
    const rows = [];
    let currentRow = [];
    let currentRowY = null;
    let currentRowHeight = null;
    
    regionsWithCenters.forEach(region => {
        // 如果是第一行或者当前区域的顶部坐标与当前行的Y坐标之差小于行高的1/2，则认为是同一行
        if (currentRow.length === 0 || 
            Math.abs(region.y - currentRowY) < (currentRowHeight || region.height) / 2) {
            currentRow.push(region);
            currentRowY = region.y;
            currentRowHeight = region.height;
        } else {
            // 新的一行
            rows.push(currentRow);
            currentRow = [region];
            currentRowY = region.y;
            currentRowHeight = region.height;
        }
    });
    
    // 添加最后一行
    if (currentRow.length > 0) {
        rows.push(currentRow);
    }
    
    // 4. 对每行内的区域按照中心点X坐标排序（从左到右）
    const sortedRegions = rows.flatMap(row => {
        return row.sort((a, b) => a.centerX - b.centerX);
    });
    
    // 5. 返回排序后的区域（移除中心点信息）
    return sortedRegions.map(({ centerX, centerY, ...region }) => region);
}

/**
 * 后处理步骤1：边缘净化（腐蚀算法）
 * 作用：扫描所有“不透明但接触透明区域”的边缘像素，如果颜色接近背景色，强制删除。
 * 解决：图中的边缘杂色环
 */
function cleanEdges(imageData, bgColor, tolerance = 50) {
    const { width, height, data } = imageData;
    // 复制一份数据用于检测邻居，防止处理过程中影响判断
    const oldData = new Uint8Array(data); 

    let deletedCount = 0;
    
    // 辅助：获取某个位置的 alpha 值
    const getAlpha = (x, y) => {
        if (x < 0 || x >= width || y < 0 || y >= height) return 0;
        return oldData[(y * width + x) * 4 + 3];
    };

    // 辅助：计算颜色差异
    const getColorDiff = (i) => {
        const r = oldData[i], g = oldData[i+1], b = oldData[i+2];
        return Math.sqrt(
            Math.pow(r - bgColor.r, 2) + 
            Math.pow(g - bgColor.g, 2) + 
            Math.pow(b - bgColor.b, 2)
        );
    };

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            
            // 只有当前像素不透明时才处理
            if (oldData[idx + 3] > 0) {
                // 检查 4 邻域是否有透明像素（说明这是边缘）
                const isEdge = 
                    getAlpha(x, y-1) === 0 ||
                    getAlpha(x, y+1) === 0 ||
                    getAlpha(x-1, y) === 0 ||
                    getAlpha(x+1, y) === 0;

                if (isEdge) {
                    // 如果是边缘，且颜色还挺像背景的（使用比泛洪填充更大的容差），删掉！
                    if (getColorDiff(idx) < tolerance) {
                        data[idx + 3] = 0; // 变透明
                        deletedCount++;
                    }
                }
            }
        }
    }
    // 如果处理了很多像素，说明边缘很脏，可以递归再洗一遍（可选）
    // if (deletedCount > 0) cleanEdges(imageData, bgColor, tolerance); 
}

/**
 * 后处理步骤2：去除孤立噪点（连通域过滤）
 * 作用：如果有一团像素小于 N 个（比如小于20个像素），视为噪点直接删除
 * 解决：图一图二角落里的那些残留小点
 */
function removeSpeckles(imageData, minSize = 20) {
    const { width, height, data } = imageData;
    const visited = new Uint8Array(width * height);
    
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = y * width + x;
            
            // 如果该像素不透明且未访问，开始计算这个物体的面积
            if (data[idx * 4 + 3] > 0 && visited[idx] === 0) {
                const queue = [idx];
                visited[idx] = 1;
                const componentIndices = [idx]; // 记录这个物体包含的所有像素索引
                
                let ptr = 0;
                while(ptr < queue.length) {
                    const curr = queue[ptr++];
                    const cx = curr % width;
                    const cy = Math.floor(curr / width);
                    
                    // 8邻域搜索（连在一起就算一个物体）
                    const neighbors = [
                        [-1,-1], [0,-1], [1,-1],
                        [-1, 0],         [1, 0],
                        [-1, 1], [0, 1], [1, 1]
                    ];
                    
                    for(let n of neighbors) {
                        const nx = cx + n[0];
                        const ny = cy + n[1];
                        if(nx >= 0 && nx < width && ny >= 0 && ny < height) {
                            const nIdx = ny * width + nx;
                            // 如果邻居不透明且未访问
                            if(data[nIdx * 4 + 3] > 0 && visited[nIdx] === 0) {
                                visited[nIdx] = 1;
                                queue.push(nIdx);
                                componentIndices.push(nIdx);
                            }
                        }
                    }
                }
                
                // 核心逻辑：如果这个物体太小（比如只是角落的几个噪点），全部抹除
                if (componentIndices.length < minSize) {
                    for (let i of componentIndices) {
                        data[i * 4 + 3] = 0; // 设为透明
                    }
                }
            }
        }
    }
}

// 手动拆分
function manualCrop() {
    const croppedCanvas = cropper.getCroppedCanvas();
    const dataURL = croppedCanvas.toDataURL('image/png');
    
    croppedImages.push({
        id: croppedImages.length,
        dataURL: dataURL,
        width: croppedCanvas.width,
        height: croppedCanvas.height
    });
    
    displayResults();
    document.getElementById('downloadAllBtn').disabled = false;
}

/**
 * 优化后的检测算法：使用像素级连通域搜索（BFS）
 * 解决了素材垂直粘连和识别不全的问题
 */
function detectRange(imageData) {
    const { width, height, data } = imageData;
    // 使用 Uint8Array 标记已访问的像素，性能比 Set 快得多 (0:未访问, 1:已访问)
    const visited = new Uint8Array(width * height);
    const regions = [];
    
    // 获取背景色（取左上角第一个像素作为基准背景色）
    const bgR = data[0], bgG = data[1], bgB = data[2], bgA = data[3];
    
    // 颜色容差（防止轻微的噪点或压缩导致背景不纯）
    const tolerance = 15; 

    // 判断是否为背景像素的辅助函数
    function isBackground(r, g, b, a) {
        // 如果是完全透明，直接视为背景
        if (a === 0) return true;
        // 如果不透明，检查是否接近背景色
        return Math.abs(r - bgR) < tolerance &&
               Math.abs(g - bgG) < tolerance &&
               Math.abs(b - bgB) < tolerance &&
               Math.abs(a - bgA) < tolerance;
    }

    // 遍历所有像素
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const index = y * width + x;
            
            // 如果该像素已被访问过，跳过
            if (visited[index] === 1) continue;
            
            const pos = index * 4;
            const r = data[pos], g = data[pos+1], b = data[pos+2], a = data[pos+3];

            // 如果发现一个非背景像素，且未访问过，说明发现了一个新物体 -> 开始泛洪填充
            if (!isBackground(r, g, b, a)) {
                // 初始化包围盒
                let minX = x, maxX = x, minY = y, maxY = y;
                
                //以此像素为起点进行 BFS 广度优先搜索
                const queue = [index];
                visited[index] = 1; // 标记起点

                let pixelCount = 0; // 记录该物体包含的像素数，用于过滤噪点

                while (queue.length > 0) {
                    const currIndex = queue.shift(); // 取出队列头部
                    pixelCount++;

                    const cx = currIndex % width;
                    const cy = Math.floor(currIndex / width);

                    // 更新包围盒
                    if (cx < minX) minX = cx;
                    if (cx > maxX) maxX = cx;
                    if (cy < minY) minY = cy;
                    if (cy > maxY) maxY = cy;

                    // 检查 8 邻域 (上下左右 + 对角线)
                    // 如果希望分割得更细（不粘连对角线接触的物体），可以改成 4 邻域
                    const neighbors = [
                        [-1, -1], [0, -1], [1, -1],
                        [-1,  0],          [1,  0],
                        [-1,  1], [0,  1], [1,  1]
                    ];

                    for (let i = 0; i < neighbors.length; i++) {
                        const nx = cx + neighbors[i][0];
                        const ny = cy + neighbors[i][1];

                        // 边界检查
                        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                            const nIndex = ny * width + nx;
                            
                            if (visited[nIndex] === 0) {
                                const nPos = nIndex * 4;
                                const nr = data[nPos], ng = data[nPos+1], nb = data[nPos+2], na = data[nPos+3];
                                
                                // 如果邻居也不是背景，加入队列
                                if (!isBackground(nr, ng, nb, na)) {
                                    visited[nIndex] = 1; // 标记为已访问，防止重复加入
                                    queue.push(nIndex);
                                }
                            }
                        }
                    }
                }

                // 过滤极小的噪点（例如像素数小于10 或 宽高太小的）
                const w = maxX - minX + 1;
                const h = maxY - minY + 1;
                if (pixelCount > 20 && w > 4 && h > 4) {
                    regions.push({ 
                        x: minX, 
                        y: minY, 
                        width: w, 
                        height: h 
                    });
                }
            }
        }
    }
    
    return regions;
}

function isBackgroundColor(r, g, b, a, bgR, bgG, bgB, bgA) {
    const diff = Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB);
    return diff < 60 && Math.abs(a - bgA) < 50;
}

// 显示结果
function displayResults() {
    const resultsSection = document.getElementById('resultsSection');
    const grid = document.getElementById('resultsGrid');
    
    if (croppedImages.length > 0) resultsSection.style.display = 'block';
    else {
        resultsSection.style.display = 'none';
        return;
    }
    
    grid.innerHTML = '';
    const lang = i18n[currentLang];
    
    croppedImages.forEach((img, index) => {
        const div = document.createElement('div');
        div.className = 'result-item';
        div.innerHTML = `
            <img src="${img.dataURL}" alt="Result ${index + 1}">
            <div>${lang['result.size']} ${Math.round(img.width)}x${Math.round(img.height)}</div>
            <div style="display: flex; gap: 5px; margin-top: 5px; width: 100%;">
                <button class="btn btn-primary" style="flex:1; padding:6px; font-size:13px; justify-content: center;" onclick="downloadImage(${index})">
                    ${lang['btn.download']}
                </button>
                <button class="btn btn-outline" style="padding:6px 12px; font-size:13px;" onclick="deleteImage(${index})">
                    ${lang['btn.delete']}
                </button>
            </div>
        `;
        grid.appendChild(div);
    });
}

function downloadImage(index) {
    const link = document.createElement('a');
    link.download = `split_${index + 1}.png`;
    link.href = croppedImages[index].dataURL;
    link.click();
}

function deleteImage(index) {
    croppedImages.splice(index, 1);
    displayResults();
    if (croppedImages.length === 0) document.getElementById('downloadAllBtn').disabled = true;
}

function downloadAll() {
    if (croppedImages.length === 0) return;
    
    showProgress();
    updateProgress(0, '正在准备导出...');
    
    const zip = new JSZip();
    croppedImages.forEach((img, index) => {
        const blob = base64ToBlob(img.dataURL.split(',')[1], 'image/png');
        zip.file(`split_${index + 1}.png`, blob);
    });
    
    // 生成ZIP文件并显示进度
    zip.generateAsync({ 
        type: 'blob',
        // 添加进度回调
        onUpdate: (metadata) => {
            // metadata.percent 是一个从 0 到 1 的小数
            const percent = Math.round(metadata.percent * 100);
            updateProgress(percent, `正在生成ZIP文件...`);
        }
    }).then(c => {
        updateProgress(100, '导出完成！');
        saveAs(c, 'split_images.zip');
        // 延迟隐藏进度条，让用户看到100%的状态
        setTimeout(() => {
            hideProgress();
        }, 300);
    });
}

function base64ToBlob(base64, mime) {
    const byteChars = atob(base64);
    const byteArrays = [];
    for (let offset = 0; offset < byteChars.length; offset += 512) {
        const slice = byteChars.slice(offset, offset + 512);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) byteNumbers[i] = slice.charCodeAt(i);
        byteArrays.push(new Uint8Array(byteNumbers));
    }
    return new Blob(byteArrays, { type: mime });
}

function reset() {
    if (cropper) {
        cropper.destroy();
        cropper = null;
    }
    const image = document.getElementById('image');
    image.src = '';
    
    // 隐藏预览容器
    document.getElementById('previewContainer').style.display = 'none';
    
    // 恢复上传提示
    const hints = document.querySelectorAll('.upload-icon, .upload-hint, .upload-sub, .privacy-badge');
    hints.forEach(el => el.style.display = '');

    document.getElementById('cropBtn').disabled = true;
    document.getElementById('manualCropBtn').disabled = true;
    document.getElementById('resetBtn').disabled = true;
    document.getElementById('downloadAllBtn').disabled = true;
    
    clearResults();
    croppedImages = [];
    // 清空 input 允许重复上传同一文件
    document.getElementById('fileInput').value = '';
}

function clearResults() {
    document.getElementById('resultsGrid').innerHTML = '';
    document.getElementById('resultsSection').style.display = 'none';
}