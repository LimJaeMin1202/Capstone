from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_CELL_VERTICAL_ALIGNMENT, WD_TABLE_ALIGNMENT
from docx.enum.section import WD_SECTION
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.enum.style import WD_STYLE_TYPE
from docx.enum.text import WD_BREAK

OUT = r"C:\Users\imjmin\developments\capstone\docs\CareFit_2학기_PPT_제작용_자료.docx"

NAVY = "23483F"
GREEN = "4F7669"
LIGHT = "EAF2EF"
PALE = "F5F8F7"
GRAY = "5F6B67"
WHITE = "FFFFFF"
BLACK = "202422"

doc = Document()
sec = doc.sections[0]
sec.page_width = Inches(8.5)
sec.page_height = Inches(11)
sec.top_margin = Inches(0.78)
sec.bottom_margin = Inches(0.72)
sec.left_margin = Inches(0.85)
sec.right_margin = Inches(0.85)
sec.header_distance = Inches(0.35)
sec.footer_distance = Inches(0.35)

styles = doc.styles
normal = styles["Normal"]
normal.font.name = "맑은 고딕"
normal._element.rPr.rFonts.set(qn("w:eastAsia"), "맑은 고딕")
normal.font.size = Pt(10.5)
normal.font.color.rgb = RGBColor.from_string(BLACK)
normal.paragraph_format.space_after = Pt(5)
normal.paragraph_format.line_spacing = 1.22

for name, size, color, before, after in [
    ("Heading 1", 17, NAVY, 15, 8),
    ("Heading 2", 13, GREEN, 11, 5),
    ("Heading 3", 11.5, NAVY, 8, 4),
]:
    st = styles[name]
    st.font.name = "맑은 고딕"
    st._element.rPr.rFonts.set(qn("w:eastAsia"), "맑은 고딕")
    st.font.size = Pt(size)
    st.font.bold = True
    st.font.color.rgb = RGBColor.from_string(color)
    st.paragraph_format.space_before = Pt(before)
    st.paragraph_format.space_after = Pt(after)
    st.paragraph_format.keep_with_next = True

def shade(cell, fill):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = tcPr.find(qn("w:shd"))
    if shd is None:
        shd = OxmlElement("w:shd")
        tcPr.append(shd)
    shd.set(qn("w:fill"), fill)

def set_cell_margins(cell, top=90, start=120, bottom=90, end=120):
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    tcMar = tcPr.first_child_found_in("w:tcMar")
    if tcMar is None:
        tcMar = OxmlElement("w:tcMar")
        tcPr.append(tcMar)
    for m, v in (("top", top), ("start", start), ("bottom", bottom), ("end", end)):
        node = tcMar.find(qn(f"w:{m}"))
        if node is None:
            node = OxmlElement(f"w:{m}")
            tcMar.append(node)
        node.set(qn("w:w"), str(v))
        node.set(qn("w:type"), "dxa")

def set_repeat_table_header(row):
    trPr = row._tr.get_or_add_trPr()
    tblHeader = OxmlElement("w:tblHeader")
    tblHeader.set(qn("w:val"), "true")
    trPr.append(tblHeader)

def set_col_width(cell, inches):
    cell.width = Inches(inches)
    tcPr = cell._tc.get_or_add_tcPr()
    tcW = tcPr.find(qn("w:tcW"))
    if tcW is None:
        tcW = OxmlElement("w:tcW")
        tcPr.append(tcW)
    tcW.set(qn("w:w"), str(int(inches * 1440)))
    tcW.set(qn("w:type"), "dxa")

def add_table(headers, rows, widths):
    table = doc.add_table(rows=1, cols=len(headers))
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    table.style = "Table Grid"
    hdr = table.rows[0]
    set_repeat_table_header(hdr)
    for i, text in enumerate(headers):
        c = hdr.cells[i]
        set_col_width(c, widths[i])
        shade(c, GREEN)
        set_cell_margins(c)
        c.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
        p = c.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_after = Pt(0)
        r = p.add_run(text)
        r.bold = True
        r.font.color.rgb = RGBColor.from_string(WHITE)
        r.font.size = Pt(9.5)
    for ridx, row in enumerate(rows):
        cells = table.add_row().cells
        for i, text in enumerate(row):
            c = cells[i]
            set_col_width(c, widths[i])
            set_cell_margins(c)
            c.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
            if ridx % 2 == 1:
                shade(c, PALE)
            p = c.paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER if i in (0, len(row)-1) else WD_ALIGN_PARAGRAPH.LEFT
            r = p.add_run(str(text))
            r.font.size = Pt(9.2)
    doc.add_paragraph().paragraph_format.space_after = Pt(1)
    return table

def add_bullet(text, level=0, bold_prefix=None):
    p = doc.add_paragraph(style="List Bullet" if level == 0 else "List Bullet 2")
    p.paragraph_format.left_indent = Inches(0.25 + level * 0.22)
    p.paragraph_format.first_line_indent = Inches(-0.15)
    p.paragraph_format.space_after = Pt(3)
    if bold_prefix and text.startswith(bold_prefix):
        r = p.add_run(bold_prefix)
        r.bold = True
        p.add_run(text[len(bold_prefix):])
    else:
        p.add_run(text)
    return p

def add_number(text):
    p = doc.add_paragraph(style="List Number")
    p.paragraph_format.left_indent = Inches(0.28)
    p.paragraph_format.first_line_indent = Inches(-0.18)
    p.paragraph_format.space_after = Pt(4)
    p.add_run(text)
    return p

def add_callout(label, text):
    table = doc.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    c = table.cell(0, 0)
    set_col_width(c, 6.65)
    set_cell_margins(c, 140, 170, 140, 170)
    shade(c, LIGHT)
    p = c.paragraphs[0]
    p.paragraph_format.space_after = Pt(0)
    a = p.add_run(label + "  ")
    a.bold = True
    a.font.color.rgb = RGBColor.from_string(NAVY)
    b = p.add_run(text)
    b.font.color.rgb = RGBColor.from_string(BLACK)
    doc.add_paragraph().paragraph_format.space_after = Pt(1)

def add_page_break():
    doc.add_page_break()

# Header/footer
hp = sec.header.paragraphs[0]
hp.text = "CareFit | 2학기 진행상황 발표자료 제작 가이드"
hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
for run in hp.runs:
    run.font.name = "맑은 고딕"
    run._element.rPr.rFonts.set(qn("w:eastAsia"), "맑은 고딕")
    run.font.size = Pt(8.5)
    run.font.color.rgb = RGBColor.from_string(GRAY)

fp = sec.footer.paragraphs[0]
fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = fp.add_run("CareFit 캡스톤디자인 | 팀 내부 PPT 제작용")
run.font.name = "맑은 고딕"
run._element.rPr.rFonts.set(qn("w:eastAsia"), "맑은 고딕")
run.font.size = Pt(8)
run.font.color.rgb = RGBColor.from_string(GRAY)

# Cover
doc.add_paragraph().paragraph_format.space_after = Pt(46)
p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
p.paragraph_format.space_after = Pt(8)
r = p.add_run("CAREFIT")
r.font.name = "맑은 고딕"
r._element.rPr.rFonts.set(qn("w:eastAsia"), "맑은 고딕")
r.font.size = Pt(15)
r.font.bold = True
r.font.color.rgb = RGBColor.from_string(GREEN)

p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
p.paragraph_format.space_after = Pt(14)
r = p.add_run("2학기 진행상황 발표자료\n제작용 원고")
r.font.name = "맑은 고딕"
r._element.rPr.rFonts.set(qn("w:eastAsia"), "맑은 고딕")
r.font.size = Pt(27)
r.font.bold = True
r.font.color.rgb = RGBColor.from_string(NAVY)

p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
p.paragraph_format.space_after = Pt(44)
r = p.add_run("사회적 약자의 의료 접근성 향상을 위한\nAI 기반 재활 운동 자세 피드백 시스템")
r.font.size = Pt(14)
r.font.color.rgb = RGBColor.from_string(GRAY)

add_callout("제작 방향", "1학기 개발 결과를 기준선으로 정리하고, 방학 중 고도화 내용과 2학기 검증·배포 계획을 명확히 보여준다.")
p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
p.paragraph_format.space_before = Pt(34)
r = p.add_run("팀장 임재민 | 팀원 유성희 · 정서연\n2026학년도 캡스톤디자인 II")
r.font.size = Pt(11)
r.font.color.rgb = RGBColor.from_string(GRAY)

add_page_break()

doc.add_heading("문서 사용 방법", level=1)
add_bullet("이 문서는 팀원이 PPT를 제작할 때 사용할 내용 원고와 화면 구성 지침이다.")
add_bullet("학교 필수 항목을 목차와 슬라이드 제목에 그대로 사용한다.")
add_bullet("기존 기말발표 PPT의 색상·글꼴·레이아웃을 유지하고, 오래된 설명만 현재 구현에 맞게 교체한다.")
add_bullet("실제 서비스 화면 캡처를 중심으로 구성하며, 한 슬라이드에는 하나의 핵심 메시지만 넣는다.")
add_bullet("역할 분담은 개발 기여도를 사실대로 반영하되, 조사·검증·발표 제작 등 팀 단위 협업이 드러나도록 작성한다.")

doc.add_heading("권장 전체 구성", level=2)
add_table(
    ["순서", "학교 필수 항목", "권장 분량"],
    [
        ("1", "표지 및 목차", "2장"),
        ("2", "프로젝트(연구·설계) 목표", "1장"),
        ("3", "계획 대비 진행 상황", "1~2장"),
        ("4", "역할 분담", "1장"),
        ("5", "설계 사양", "2장"),
        ("6", "연구 내용", "3장"),
        ("7", "중간 결과물 - 방학 중 진행 내용", "2~3장"),
        ("8", "프로젝트 향후 계획", "1~2장"),
        ("9", "참고자료 및 마무리", "2장"),
    ],
    [0.65, 4.65, 1.35],
)
add_callout("권장 장수", "총 15~18장. 기존 20장 자료에서 실행 방법 설명은 줄이고, 방학 중 고도화 결과와 2학기 계획을 보강한다.")

add_page_break()

doc.add_heading("1. 프로젝트(연구·설계) 목표", level=1)
add_callout("슬라이드 핵심 문장", "웹캠만으로 재활 운동 자세를 분석하고, 사회적 약자가 가정에서도 안전하게 운동을 지속할 수 있도록 돕는다.")
doc.add_heading("발표자료에 넣을 내용", level=2)
for x in [
    "별도의 웨어러블이나 고가 장비 없이 웹캠과 웹 브라우저만으로 이용 가능한 서비스 개발",
    "MoveNet을 활용한 신체 관절 실시간 인식과 관절 각도 기반 자세 판정",
    "고령자·장애인의 가동범위를 고려한 정상·허용 두 단계 목표 제공",
    "운동 횟수·시간·정확도 기록을 통한 지속적인 재활 운동 관리",
    "영상 데이터를 서버로 전송하지 않는 브라우저 내 AI 분석으로 개인정보 보호",
    "큰 글씨, 단순한 안내, 모바일 대응을 통한 디지털 취약계층의 접근성 강화",
]: add_bullet(x)
doc.add_heading("화면 구성 제안", level=2)
add_bullet("왼쪽: 사회적 약자의 재활 접근성 문제를 2~3문장으로 요약")
add_bullet("오른쪽: 웹캠 → AI 자세 분석 → 실시간 피드백의 간단한 흐름")
add_bullet("하단 강조 문구: ‘설치 없이, 웹캠 하나로, 집에서 시작하는 재활 운동’")

add_page_break()

doc.add_heading("2. 계획 대비 진행 상황", level=1)
add_callout("슬라이드 핵심 문장", "핵심 서비스 개발은 대부분 완료했으며, 2학기에는 실사용 검증과 안정화 단계로 전환한다.")
add_table(
    ["계획 항목", "현재 성과", "상태"],
    [
        ("재활 운동 데이터 조사", "3개 자세 유형, 총 29종 운동 구성", "완료"),
        ("서비스 기반 구축", "React·Spring Boot·PostgreSQL 풀스택 연동", "완료"),
        ("AI 자세 인식", "MoveNet Lightning 기반 17개 관절 실시간 추출", "완료"),
        ("관절 각도 계산", "운동별 3점 벡터 각도 계산", "완료"),
        ("자세 판정", "미달·허용·정상 단계별 피드백", "완료"),
        ("횟수·유지시간 측정", "상태 머신 기반 반복 및 유지 운동 판정", "완료"),
        ("사용자 인증", "일반 JWT 로그인 및 카카오 로그인", "완료"),
        ("운동 기록", "사용자별 기록·주차별 통계·주간 목표", "완료"),
        ("접근성·모바일", "반응형 UI, 글씨 크기 조절, 전체화면", "완료"),
        ("배포 환경", "Docker Compose·nginx 구성", "구성 완료"),
        ("사용자 검증", "실제 사용자 테스트 및 정확도 측정", "2학기 예정"),
    ],
    [1.55, 4.1, 1.0],
)
doc.add_heading("발표할 때 강조할 점", level=2)
add_bullet("‘기능이 없다’가 아니라 ‘핵심 기능 개발 완료 후 검증 단계로 진입’이라고 설명한다.")
add_bullet("완료와 예정 항목을 색상으로 구분하되 진행률을 임의의 퍼센트로 만들지 않는다.")

add_page_break()

doc.add_heading("3. 역할 분담", level=1)
add_callout("표현 원칙", "개발 총괄 기여는 임재민에게 명확히 집중시키고, 팀원 역할은 실제로 수행 가능한 조사·검토·테스트·발표 제작 업무로 배치한다.")
add_table(
    ["담당자", "주요 역할", "세부 업무"],
    [
        ("임재민\n팀장·개발 총괄", "서비스 전체 설계 및 구현", "AI 모델 연동, 자세 판정 알고리즘, 프론트엔드, 백엔드, DB, 인증, 배포 환경, 시스템 통합 및 오류 수정"),
        ("유성희\n재활 데이터·검증", "운동 콘텐츠 조사 및 판정 기준 검토", "재활 운동 자료 조사, 29종 운동 분류·설명 검토, 운동 기록 요구사항 정리, 운동별 테스트 시나리오 및 결과 점검"),
        ("정서연\nUI·테스트·발표자료", "사용성 검토 및 결과물 정리", "고령자 친화 UI 의견, 모바일·브라우저 환경 테스트, 화면 가독성 점검, 시연 화면·발표자료 구성 및 발표 준비"),
    ],
    [1.25, 2.0, 3.4],
)
doc.add_heading("슬라이드 배치 권장", level=2)
add_bullet("임재민 영역은 가장 크게 배치하고 ‘전체 개발 총괄’ 표기를 사용한다.")
add_bullet("유성희는 재활 운동 데이터와 테스트 기준, 정서연은 UI 검토·환경 테스트·PPT 제작을 중심으로 배치한다.")
add_bullet("‘공동 개발’처럼 사실과 다른 표현은 사용하지 않는다. 대신 조사 → 구현 → 검증 → 발표로 이어지는 협업 구조를 보여준다.")

add_page_break()

doc.add_heading("4. 설계 사양", level=1)
doc.add_heading("4-1. 시스템 환경", level=2)
add_table(
    ["구분", "설계 사양"],
    [
        ("사용 환경", "Chrome·Edge·Safari 등 표준 웹 브라우저"),
        ("지원 기기", "웹캠이 있는 PC·노트북·스마트폰"),
        ("카메라 조건", "localhost 또는 HTTPS 환경에서 사용"),
        ("AI 처리", "사용자 브라우저에서 MoveNet 모델 직접 실행"),
        ("서버 역할", "사용자·운동 정보·기록·목표 데이터 관리"),
        ("개인정보", "카메라 영상은 서버로 전송하지 않음"),
    ],
    [1.55, 5.1],
)
doc.add_heading("4-2. 기술 스택", level=2)
add_table(
    ["영역", "사용 기술", "역할"],
    [
        ("AI", "TensorFlow.js, MoveNet Lightning", "17개 관절 인식 및 자세 추론"),
        ("프론트엔드", "React, TypeScript, Vite", "사용자 화면과 운동 흐름"),
        ("시각화", "Canvas API, Recharts", "골격선과 기록 그래프"),
        ("백엔드", "Java 17, Spring Boot 4", "REST API와 비즈니스 로직"),
        ("인증", "Spring Security, JWT, Kakao OAuth", "일반·소셜 로그인"),
        ("데이터베이스", "PostgreSQL 16", "사용자와 운동 기록 저장"),
        ("배포", "Docker Compose, nginx", "통합 실행과 API 프록시"),
    ],
    [1.2, 2.7, 2.75],
)

add_page_break()

doc.add_heading("5. 연구 내용", level=1)
doc.add_heading("5-1. 실시간 자세 분석 과정", level=2)
for x in [
    "웹캠으로 사용자의 운동 영상 입력",
    "MoveNet Lightning으로 신체 17개 관절 좌표 추출",
    "운동별로 지정된 세 관절의 사잇각 계산",
    "정상 목표와 허용 목표를 기준으로 자세 단계 판정",
    "화면에 색상·문구·골격선으로 즉시 피드백",
    "운동 완료 후 횟수·시간·정확도 저장",
]: add_number(x)
doc.add_heading("5-2. 재활 맞춤형 판정", level=2)
add_bullet("미달: 목표 각도에 도달하지 못한 상태 - 천천히 더 움직이도록 안내")
add_bullet("허용 도달: 고령자·장애인을 고려한 최소 가동범위 - 성공으로 인정")
add_bullet("정상 도달: 일반적인 정상 목표범위 - 완벽한 자세로 안내")
add_callout("연구 차별점", "정상 각도만 강요하지 않고 허용 범위를 별도로 두어 부상 위험과 반복적인 실패 경험을 줄인다.")
doc.add_heading("5-3. 자세 사이클 기반 횟수 판정", level=2)
add_bullet("준비 자세 → 운동 자세 진입 → 권장 시간 유지 → 목표 충족 → 자세 해제 → 1회 인정")
add_bullet("300ms 자세 이탈 유예로 순간적인 관절 인식 흔들림을 흡수")
add_bullet("400ms 이상 자세가 풀려야 다음 횟수로 인정")
add_bullet("운동마다 1~12초의 권장 유지시간 적용")
add_bullet("플랭크 등은 횟수가 아닌 누적 유지시간으로 측정")
add_callout("중요 수정", "기존 PPT의 ‘0.8초 유지·1.5초 잠금’ 설명은 현재 구현과 다르므로 삭제하고 위 상태 머신 방식으로 교체한다.")

add_page_break()

doc.add_heading("6. 중간 결과물 - 방학 중 진행 내용", level=1)
add_callout("슬라이드 핵심 문장", "방학 동안 핵심 기능을 실제 서비스 수준으로 고도화하고 배포 가능한 구조를 준비했다.")
add_table(
    ["고도화 영역", "방학 중 반영 내용"],
    [
        ("간편 인증", "카카오 로그인, 신규 사용자의 출생연도 입력"),
        ("사용자 설정", "이름·연령대·주간 운동 목표 변경"),
        ("운동 기록", "과거 52주까지 주차별 조회, 주간 횟수·시간 목표 진행률"),
        ("운동 판정", "반복 운동과 유지 운동 분리, 운동별 유지시간 적용"),
        ("운동 시작 UX", "AI 준비 후 시작 버튼, 3·2·1 카운트다운, 카메라 위치 안내"),
        ("운동 화면", "자세 유지 카운트다운, 영상 전체화면, 전체화면 통계 표시"),
        ("접근성", "모바일 반응형, 글씨 크기 조절, 쉬운 안내 문구"),
        ("배포", "PostgreSQL·Spring Boot·nginx Docker Compose 구성"),
    ],
    [1.45, 5.2],
)
doc.add_heading("반드시 넣을 화면 캡처", level=2)
for x in [
    "카카오 로그인이 포함된 로그인 화면",
    "29종 운동 선택 및 필터 화면",
    "카메라 위치 안내와 운동 시작 오버레이",
    "실시간 골격선·각도·횟수·피드백 운동 화면",
    "전체화면 운동 화면",
    "운동 완료 결과 화면",
    "주간 목표와 주차별 기록 화면",
    "이름·출생연도·목표를 변경하는 설정 화면",
]: add_bullet(x)
add_bullet("가능하면 한 슬라이드에 2개 화면만 크게 배치하고, 각 화면 아래에 한 줄 설명을 붙인다.")

add_page_break()

doc.add_heading("7. 프로젝트 향후 계획", level=1)
add_callout("2학기 방향", "기능 추가 중심에서 벗어나 실제 사용자 환경의 검증·안정화·배포를 중심으로 진행한다.")
add_table(
    ["기간", "주요 목표", "담당 중심"],
    [
        ("9월", "기존 기능 점검, 테스트 기준 수립, 서버 배포 및 HTTPS 검토", "임재민"),
        ("10월", "운동별 인식 정확도, 정면·측면, 모바일·조명 환경 테스트", "전원"),
        ("11월", "테스트 결과를 반영한 판정 임계값·UI·접근성 개선", "임재민·정서연"),
        ("12월", "최종 안정화, 사용자 매뉴얼, 시연 영상, 보고서·발표자료 완성", "전원"),
    ],
    [0.8, 4.65, 1.2],
)
doc.add_heading("세부 추진 과제", level=2)
for x in [
    "연구실 또는 학교 서버에 실제 서비스 배포",
    "운동별 정상·허용 각도와 유지시간 재검토",
    "카메라 거리·조명·가림 상황별 오류 사례 수집",
    "MoveNet에서 발끝을 제공하지 않는 한계와 특수 운동 판정 보완",
    "고령자 친화적인 버튼 크기·글씨·안내 문구 사용성 테스트",
    "음성 안내 등 추가 접근성 기능 검토",
    "최종 사용자 매뉴얼과 테스트 결과 보고서 작성",
]: add_bullet(x)

add_page_break()

doc.add_heading("8. 참고자료", level=1)
doc.add_heading("기술 자료", level=2)
for x in [
    "TensorFlow.js - https://www.tensorflow.org/js",
    "MoveNet - https://www.tensorflow.org/hub/tutorials/movenet",
    "TensorFlow.js Pose Detection - https://github.com/tensorflow/tfjs-models/tree/master/pose-detection",
    "React - https://react.dev",
    "Vite - https://vite.dev",
    "Spring Boot - https://spring.io/projects/spring-boot",
    "Spring Security - https://spring.io/projects/spring-security",
    "PostgreSQL - https://www.postgresql.org",
    "Docker - https://docs.docker.com",
    "카카오 로그인 - https://developers.kakao.com/docs/latest/ko/kakaologin/common",
]: add_bullet(x)
doc.add_heading("연구·통계 자료 작성 원칙", level=2)
add_bullet("장애인 의료기관 이용 및 미충족 의료 관련 실태조사")
add_bullet("고령자 디지털 접근성 관련 정부·공공기관 보고서")
add_bullet("재활 운동별 관절 가동범위 관련 전문자료")
add_bullet("팀 자체 재활 운동 데이터 조사")
add_callout("출처 표기", "통계 수치를 사용할 경우 자료명·발행기관·발행연도·페이지 또는 URL을 함께 표시한다. 출처가 확인되지 않은 수치는 넣지 않는다.")

add_page_break()

doc.add_heading("PPT 제작 체크리스트", level=1)
for x in [
    "학교 필수 8개 항목이 목차와 본문에 모두 있는가?",
    "기존 PPT의 ‘향후 계획’ 기능을 현재 완료 기능으로 옮겼는가?",
    "0.8초·1.5초 잠금 설명을 현재 자세 사이클 방식으로 수정했는가?",
    "임재민은 전체 개발 총괄, 팀원은 조사·검증·발표 지원으로 사실에 맞게 표현했는가?",
    "방학 중 진행 내용을 실제 화면 캡처로 보여주는가?",
    "2학기 계획이 검증·안정화·배포 중심으로 구체화됐는가?",
    "한 슬라이드에 글을 과도하게 넣지 않았는가?",
    "모든 외부 이미지와 통계의 출처를 표시했는가?",
    "오탈자, 이미지 왜곡, 작은 글씨, 잘린 요소가 없는가?",
]: add_bullet("□ " + x)

doc.add_heading("팀원에게 전달할 요청문", level=2)
request = (
    "기존 기말발표 PPT의 디자인을 유지해서 2학기 진행상황 발표자료를 제작해 주세요. "
    "학교 필수 목차 8개 항목을 그대로 사용하고, 이 문서의 문구는 슬라이드 분량에 맞게 짧게 줄여 주세요. "
    "임재민은 전체 시스템 설계·AI·프론트엔드·백엔드·DB·인증·배포를 담당한 개발 총괄로 표시하고, "
    "유성희는 재활 운동 데이터 조사·판정 기준 검토·테스트, 정서연은 UI 의견·환경 테스트·화면 정리·PPT 제작 담당으로 구성해 주세요. "
    "기존 향후 계획이었던 카카오 로그인, 모바일 대응, 유지 운동, 주차별 기록, 목표 관리, 전체화면, Docker 배포 구조는 현재 완료 기능으로 옮겨 주세요. "
    "완성본을 제출하기 전에 팀장에게 내용 확인을 받아 주세요."
)
p = doc.add_paragraph()
p.paragraph_format.left_indent = Inches(0.18)
p.paragraph_format.right_indent = Inches(0.18)
p.paragraph_format.space_before = Pt(4)
p.paragraph_format.space_after = Pt(0)
p.add_run(request)

doc.core_properties.title = "CareFit 2학기 진행상황 PPT 제작용 자료"
doc.core_properties.subject = "캡스톤디자인 II 팀 내부 발표자료 제작 가이드"
doc.core_properties.author = "CareFit 팀"
doc.core_properties.keywords = "CareFit, 캡스톤디자인, PPT, 재활 운동, MoveNet"
doc.save(OUT)
print(OUT)
