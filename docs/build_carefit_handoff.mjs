import fs from "node:fs";
import path from "node:path";

const root = path.resolve("docs/carefit-docx-package");
fs.rmSync(root, { recursive: true, force: true });
for (const d of ["_rels", "docProps", "word", "word/_rels", "word/theme"]) fs.mkdirSync(path.join(root, d), { recursive: true });

const esc = (s) => String(s).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const run = (text, { bold=false, size=21, color="202422" }={}) => `<w:r><w:rPr><w:rFonts w:ascii="Malgun Gothic" w:hAnsi="Malgun Gothic" w:eastAsia="맑은 고딕"/><w:sz w:val="${size}"/><w:szCs w:val="${size}"/><w:color w:val="${color}"/>${bold?"<w:b/>":""}</w:rPr><w:t xml:space="preserve">${esc(text)}</w:t></w:r>`;
const para = (text, opts={}) => {
  const { style="Normal", align, before=0, after=100, pageBreak=false, keep=false, bold=false, size=21, color="202422" } = opts;
  return `<w:p><w:pPr><w:pStyle w:val="${style}"/>${align?`<w:jc w:val="${align}"/>`:""}<w:spacing w:before="${before}" w:after="${after}" w:line="290" w:lineRule="auto"/>${pageBreak?"<w:pageBreakBefore/>":""}${keep?"<w:keepNext/>":""}</w:pPr>${run(text,{bold,size,color})}</w:p>`;
};
const bullet = (text, level=0) => `<w:p><w:pPr><w:pStyle w:val="Normal"/><w:numPr><w:ilvl w:val="${level}"/><w:numId w:val="1"/></w:numPr><w:spacing w:after="70" w:line="290" w:lineRule="auto"/></w:pPr>${run(text)}</w:p>`;
const heading = (text, level=1, pageBreak=false) => para(text, {style:`Heading${level}`, before: level===1?300:210, after: level===1?150:100, pageBreak, keep:true, bold:true, size:level===1?34:26, color:level===1?"23483F":"4F7669"});
const page = () => `<w:p><w:r><w:br w:type="page"/></w:r></w:p>`;
const callout = (label, text) => table([[`${label}  ${text}`]], [9360], false, "EAF2EF");

function cell(text, width, fill, center=false, bold=false, color="202422") {
  return `<w:tc><w:tcPr><w:tcW w:w="${width}" w:type="dxa"/><w:tcMar><w:top w:w="90" w:type="dxa"/><w:start w:w="120" w:type="dxa"/><w:bottom w:w="90" w:type="dxa"/><w:end w:w="120" w:type="dxa"/></w:tcMar>${fill?`<w:shd w:fill="${fill}"/>`:""}<w:vAlign w:val="center"/></w:tcPr>${para(text,{align:center?"center":undefined,after:0,bold,size:19,color})}</w:tc>`;
}
function table(rows, widths, header=true, oneFill=null) {
  let out = `<w:tbl><w:tblPr><w:tblW w:w="9360" w:type="dxa"/><w:tblInd w:w="120" w:type="dxa"/><w:tblLayout w:type="fixed"/><w:tblBorders><w:top w:val="single" w:sz="4" w:color="B9C8C3"/><w:left w:val="single" w:sz="4" w:color="B9C8C3"/><w:bottom w:val="single" w:sz="4" w:color="B9C8C3"/><w:right w:val="single" w:sz="4" w:color="B9C8C3"/><w:insideH w:val="single" w:sz="4" w:color="D8E1DE"/><w:insideV w:val="single" w:sz="4" w:color="D8E1DE"/></w:tblBorders></w:tblPr><w:tblGrid>${widths.map(w=>`<w:gridCol w:w="${w}"/>`).join("")}</w:tblGrid>`;
  rows.forEach((r, ri) => {
    out += `<w:tr>${header&&ri===0?"<w:trPr><w:tblHeader/></w:trPr>":""}`;
    r.forEach((v, ci) => out += cell(v, widths[ci], oneFill || (header&&ri===0?"4F7669":(ri%2===0?"F5F8F7":null)), ci===0 || ci===r.length-1, header&&ri===0, header&&ri===0?"FFFFFF":"202422"));
    out += `</w:tr>`;
  });
  return out + `</w:tbl>${para("",{after:20})}`;
}

let body = "";
body += para("CAREFIT", {align:"center", before:760, after:120, bold:true, size:30, color:"4F7669"});
body += para("2학기 진행상황 발표자료 제작용 원고", {align:"center", after:180, bold:true, size:52, color:"23483F"});
body += para("사회적 약자의 의료 접근성 향상을 위한 AI 기반 재활 운동 자세 피드백 시스템", {align:"center", after:500, size:28, color:"5F6B67"});
body += callout("제작 방향", "1학기 개발 결과를 기준선으로 정리하고, 방학 중 고도화 내용과 2학기 검증·배포 계획을 명확히 보여준다.");
body += para("팀장 임재민 | 팀원 유성희 · 정서연\n2026학년도 캡스톤디자인 II", {align:"center", before:500, size:22, color:"5F6B67"});
body += page();

body += heading("문서 사용 방법",1);
["학교 필수 항목을 목차와 슬라이드 제목에 그대로 사용한다.","기존 기말발표 PPT의 디자인을 유지하고 오래된 설명만 현재 구현에 맞게 교체한다.","실제 서비스 화면 캡처를 중심으로 구성하며 한 슬라이드에는 하나의 핵심 메시지만 넣는다.","역할 분담은 실제 개발 기여도를 반영하되 조사·검증·발표 제작 등 협업 흐름이 보이도록 작성한다."].forEach(x=>body+=bullet(x));
body += heading("권장 구성",2);
body += table([["순서","필수 항목","권장 분량"],["1","표지 및 목차","2장"],["2","프로젝트(연구·설계) 목표","1장"],["3","계획 대비 진행 상황","1~2장"],["4","역할 분담","1장"],["5","설계 사양","2장"],["6","연구 내용","3장"],["7","중간 결과물 - 방학 중 진행 내용","2~3장"],["8","프로젝트 향후 계획","1~2장"],["9","참고자료 및 마무리","2장"]],[900,6500,1960]);
body += callout("권장 장수", "총 15~18장. 기존 실행 방법 설명은 줄이고 방학 중 결과와 2학기 계획을 보강한다.");
body += page();

body += heading("1. 프로젝트(연구·설계) 목표",1);
body += callout("핵심 문장", "웹캠만으로 재활 운동 자세를 분석하고, 사회적 약자가 가정에서도 안전하게 운동을 지속할 수 있도록 돕는다.");
[
"별도의 웨어러블이나 고가 장비 없이 웹캠과 웹 브라우저만으로 이용 가능한 서비스 개발",
"MoveNet을 활용한 신체 관절 실시간 인식과 관절 각도 기반 자세 판정",
"고령자·장애인의 가동범위를 고려한 정상·허용 두 단계 목표 제공",
"운동 횟수·시간·정확도 기록을 통한 지속적인 재활 운동 관리",
"영상 데이터를 서버로 전송하지 않는 브라우저 내 AI 분석으로 개인정보 보호",
"큰 글씨, 단순한 안내, 모바일 대응을 통한 디지털 취약계층의 접근성 강화"
].forEach(x=>body+=bullet(x));
body += heading("슬라이드 구성 제안",2);
body += bullet("왼쪽에는 재활 접근성 문제, 오른쪽에는 웹캠 → AI 분석 → 실시간 피드백 흐름을 배치한다.");
body += bullet("하단 강조 문구: 설치 없이, 웹캠 하나로, 집에서 시작하는 재활 운동");
body += page();

body += heading("2. 계획 대비 진행 상황",1);
body += callout("핵심 문장", "핵심 서비스 개발은 대부분 완료했으며, 2학기에는 실사용 검증과 안정화 단계로 전환한다.");
body += table([["계획 항목","현재 성과","상태"],["재활 운동 데이터","3개 자세 유형, 총 29종 운동","완료"],["서비스 기반","React·Spring Boot·PostgreSQL 연동","완료"],["AI 자세 인식","MoveNet 기반 17개 관절 추출","완료"],["자세 판정","각도 기반 미달·허용·정상 피드백","완료"],["횟수·유지시간","반복·유지 운동 상태 머신","완료"],["사용자 인증","JWT 일반 로그인·카카오 로그인","완료"],["운동 기록","주차별 통계·주간 목표","완료"],["접근성·모바일","반응형 UI·글씨 크기·전체화면","완료"],["배포 환경","Docker Compose·nginx 구성","구성 완료"],["사용자 검증","실사용 테스트와 정확도 측정","2학기 예정"]],[2100,5800,1460]);
body += bullet("완료와 예정 항목을 구분하되 근거 없는 진행률 퍼센트는 만들지 않는다.");
body += page();

body += heading("3. 역할 분담",1);
body += callout("표현 원칙", "개발 총괄 기여는 임재민에게 명확히 집중시키고, 팀원은 실제 수행 가능한 조사·검토·테스트·발표 업무로 배치한다.");
body += table([["담당자","주요 역할","세부 업무"],["임재민\n팀장·개발 총괄","서비스 전체 설계 및 구현","AI 모델 연동, 자세 판정 알고리즘, 프론트엔드, 백엔드, DB, 인증, 배포 환경, 시스템 통합 및 오류 수정"],["유성희\n재활 데이터·검증","운동 콘텐츠 조사 및 기준 검토","재활 운동 자료 조사, 29종 운동 분류·설명 검토, 기록 요구사항 정리, 운동별 테스트 시나리오와 결과 점검"],["정서연\nUI·테스트·발표자료","사용성 검토 및 결과물 정리","고령자 친화 UI 의견, 모바일·브라우저 테스트, 화면 가독성 점검, 시연 화면·발표자료 구성"]],[1700,2500,5160]);
body += bullet("임재민 영역은 가장 크게 배치하고 ‘전체 개발 총괄’로 표기한다.");
body += bullet("‘공동 개발’처럼 사실과 다른 표현 대신 조사 → 구현 → 검증 → 발표의 협업 구조를 보여준다.");
body += page();

body += heading("4. 설계 사양",1);
body += heading("4-1. 시스템 환경",2);
body += table([["구분","설계 사양"],["사용 환경","Chrome·Edge·Safari 등 표준 웹 브라우저"],["지원 기기","웹캠이 있는 PC·노트북·스마트폰"],["카메라 조건","localhost 또는 HTTPS 환경"],["AI 처리","사용자 브라우저에서 MoveNet 직접 실행"],["서버 역할","사용자·운동 정보·기록·목표 관리"],["개인정보","카메라 영상은 서버로 전송하지 않음"]],[2200,7160]);
body += heading("4-2. 기술 스택",2);
body += table([["영역","기술","역할"],["AI","TensorFlow.js, MoveNet","17개 관절 인식"],["프론트엔드","React, TypeScript, Vite","사용자 화면·운동 흐름"],["시각화","Canvas API, Recharts","골격선·기록 그래프"],["백엔드","Java 17, Spring Boot 4","REST API·비즈니스 로직"],["인증","Spring Security, JWT, Kakao OAuth","일반·소셜 로그인"],["DB","PostgreSQL 16","사용자·기록 저장"],["배포","Docker Compose, nginx","통합 실행·API 프록시"]],[1500,3800,4060]);
body += page();

body += heading("5. 연구 내용",1);
body += heading("5-1. 실시간 자세 분석 과정",2);
["웹캠 영상 입력","MoveNet으로 17개 관절 좌표 추출","운동별 세 관절의 사잇각 계산","정상·허용 목표 기준으로 자세 판정","색상·문구·골격선으로 즉시 피드백","완료 후 횟수·시간·정확도 저장"].forEach(x=>body+=bullet(x));
body += heading("5-2. 재활 맞춤형 판정",2);
body += bullet("미달: 목표 각도에 도달하지 못한 상태");
body += bullet("허용 도달: 고령자·장애인을 고려한 최소 가동범위로 성공 인정");
body += bullet("정상 도달: 일반적인 정상 목표범위로 완벽한 자세 안내");
body += callout("연구 차별점", "정상 각도만 강요하지 않고 허용 범위를 별도로 두어 부상 위험과 실패 경험을 줄인다.");
body += heading("5-3. 자세 사이클 기반 횟수 판정",2);
body += bullet("준비 → 자세 진입 → 권장 시간 유지 → 충족 → 자세 해제 → 1회 인정");
body += bullet("300ms 이탈 유예와 400ms 해제 확인으로 오인식 방지");
body += bullet("운동별 1~12초 유지시간, 플랭크 등은 누적 유지시간 측정");
body += callout("중요 수정", "기존 PPT의 0.8초 유지·1.5초 잠금 설명은 삭제하고 현재 상태 머신 방식으로 교체한다.");
body += page();

body += heading("6. 중간 결과물 - 방학 중 진행 내용",1);
body += callout("핵심 문장", "방학 동안 핵심 기능을 실제 서비스 수준으로 고도화하고 배포 가능한 구조를 준비했다.");
body += table([["영역","방학 중 반영 내용"],["간편 인증","카카오 로그인, 신규 사용자의 출생연도 입력"],["사용자 설정","이름·연령대·주간 목표 변경"],["운동 기록","과거 52주 주차별 조회와 목표 진행률"],["운동 판정","반복·유지 운동 분리, 운동별 유지시간"],["시작 UX","카메라 위치 안내, 시작 버튼, 3·2·1 카운트다운"],["운동 화면","유지 카운트다운, 전체화면과 핵심 통계"],["접근성","모바일 반응형, 글씨 크기, 쉬운 안내"],["배포","PostgreSQL·Spring Boot·nginx Docker 구성"]],[2100,7260]);
body += heading("넣을 화면 캡처",2);
["카카오 로그인 화면","29종 운동 선택·필터 화면","카메라 위치 안내·시작 화면","실시간 골격선·각도·횟수 화면","전체화면 운동 화면","결과 화면","주간 목표·주차별 기록 화면","사용자 설정 화면"].forEach(x=>body+=bullet(x));
body += bullet("한 슬라이드에는 화면 2개 정도만 크게 배치하고 각 화면 아래 한 줄 설명을 붙인다.");
body += page();

body += heading("7. 프로젝트 향후 계획",1);
body += callout("2학기 방향", "기능 추가 중심에서 실제 사용자 환경의 검증·안정화·배포 중심으로 전환한다.");
body += table([["기간","주요 목표","담당 중심"],["9월","기능 점검, 테스트 기준, 서버 배포·HTTPS 검토","임재민"],["10월","운동별 정확도와 모바일·조명 환경 테스트","전원"],["11월","판정 임계값·UI·접근성 개선","임재민·정서연"],["12월","안정화, 매뉴얼, 시연, 보고서·발표자료","전원"]],[1000,6500,1860]);
["연구실 또는 학교 서버 실제 배포","운동별 정상·허용 각도와 유지시간 재검토","거리·조명·가림 상황별 오류 수집","발끝 미지원과 특수 운동 판정 보완","고령자 친화 사용성 테스트","음성 안내 등 접근성 강화 검토","사용자 매뉴얼과 테스트 결과 보고서 작성"].forEach(x=>body+=bullet(x));
body += page();

body += heading("8. 참고자료",1);
body += heading("기술 자료",2);
["TensorFlow.js - https://www.tensorflow.org/js","MoveNet - https://www.tensorflow.org/hub/tutorials/movenet","Pose Detection - https://github.com/tensorflow/tfjs-models/tree/master/pose-detection","React - https://react.dev","Vite - https://vite.dev","Spring Boot - https://spring.io/projects/spring-boot","Spring Security - https://spring.io/projects/spring-security","PostgreSQL - https://www.postgresql.org","Docker - https://docs.docker.com","카카오 로그인 - https://developers.kakao.com/docs/latest/ko/kakaologin/common"].forEach(x=>body+=bullet(x));
body += heading("출처 작성 원칙",2);
body += bullet("통계 수치는 자료명·발행기관·발행연도·페이지 또는 URL까지 표시한다.");
body += bullet("장애인 의료 이용, 고령자 디지털 접근성, 재활 관절 가동범위 자료는 공공기관·공식문서를 우선한다.");
body += callout("주의", "출처가 확인되지 않은 통계 수치는 발표자료에 넣지 않는다.");
body += page();

body += heading("PPT 제작 체크리스트",1);
["학교 필수 8개 항목이 목차와 본문에 모두 있는가?","기존 향후 계획 기능을 현재 완료 기능으로 옮겼는가?","0.8초·1.5초 설명을 현재 자세 사이클로 바꿨는가?","임재민은 전체 개발 총괄, 팀원은 조사·검증·발표 지원으로 표현했는가?","방학 중 내용을 실제 화면으로 보여주는가?","2학기 계획이 검증·안정화·배포 중심인가?","외부 이미지와 통계 출처가 있는가?","오탈자·왜곡·작은 글씨·잘림이 없는가?"].forEach(x=>body+=bullet("□ "+x));
body += heading("팀원에게 전달할 요청문",2);
body += callout("요청", "기존 기말발표 PPT 디자인을 유지해 2학기 진행상황 발표자료를 제작해 주세요. 학교 필수 목차 8개 항목을 그대로 사용하고, 임재민은 전체 시스템 설계·AI·프론트엔드·백엔드·DB·인증·배포의 개발 총괄로 표시해 주세요. 유성희는 재활 데이터 조사·기준 검토·테스트, 정서연은 UI 의견·환경 테스트·화면 정리·PPT 제작 담당으로 구성해 주세요. 기존 향후 계획이었던 카카오 로그인, 모바일 대응, 유지 운동, 주차별 기록, 목표 관리, 전체화면, Docker 구조는 현재 완료 기능으로 옮기고, 완성본은 제출 전에 팀장 확인을 받아 주세요.");

const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:body>${body}<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1120" w:right="1224" w:bottom="1040" w:left="1224" w:header="500" w:footer="500"/><w:headerReference w:type="default" r:id="rId2"/><w:footerReference w:type="default" r:id="rId3"/></w:sectPr></w:body></w:document>`;
const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Malgun Gothic" w:hAnsi="Malgun Gothic" w:eastAsia="맑은 고딕"/><w:sz w:val="21"/></w:rPr></w:rPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:pPr><w:spacing w:after="100" w:line="290" w:lineRule="auto"/></w:pPr></w:style><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/></w:style><w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/></w:style></w:styles>`;
const numberingXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:abstractNum w:abstractNumId="0"><w:multiLevelType w:val="hybridMultilevel"/><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="•"/><w:lvlJc w:val="left"/><w:pPr><w:tabs><w:tab w:val="num" w:pos="540"/></w:tabs><w:ind w:left="540" w:hanging="260"/></w:pPr><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/></w:rPr></w:lvl><w:lvl w:ilvl="1"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="◦"/><w:pPr><w:ind w:left="900" w:hanging="260"/></w:pPr></w:lvl></w:abstractNum><w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num></w:numbering>`;
const headerXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">${para("CareFit | 2학기 진행상황 발표자료 제작 가이드",{align:"right",size:17,color:"5F6B67",after:0})}</w:hdr>`;
const footerXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">${para("CareFit 캡스톤디자인 | 팀 내부 PPT 제작용",{align:"center",size:16,color:"5F6B67",after:0})}</w:ftr>`;

const files = {
  "[Content_Types].xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/><Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/><Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>`,
  "_rels/.rels": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>`,
  "word/document.xml": documentXml,
  "word/styles.xml": stylesXml,
  "word/numbering.xml": numberingXml,
  "word/header1.xml": headerXml,
  "word/footer1.xml": footerXml,
  "word/_rels/document.xml.rels": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/><Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/></Relationships>`,
  "docProps/core.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>CareFit 2학기 PPT 제작용 자료</dc:title><dc:subject>캡스톤디자인 II 팀 내부 발표자료 제작 가이드</dc:subject><dc:creator>CareFit 팀</dc:creator><cp:keywords>CareFit, 캡스톤디자인, PPT, 재활 운동, MoveNet</cp:keywords></cp:coreProperties>`,
  "docProps/app.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>CareFit Document Builder</Application></Properties>`
};
for (const [f, content] of Object.entries(files)) fs.writeFileSync(path.join(root, f), content, "utf8");
console.log(root);
