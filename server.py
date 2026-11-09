# ─────────────────────────────────────────────────────────────
# 🌐 작은 웹 서버
#
# 🔐 왜 서버가 필요하냐면:
#    Groq 열쇠를 웹페이지 안에 넣으면 '소스 보기' 로 누구나 봅니다.
#    그래서 열쇠는 서버(이 파일)만 들고 있고,
#    웹페이지는 서버에게 "회의 좀 돌려줘" 라고 부탁만 합니다.
#
# 주소
#   /              화면
#   /api/team      팀원 소개 (열쇠 없이도 됨)
#   /api/run?q=…   회의 중계 (한 줄씩 실시간으로 보냄)
# ─────────────────────────────────────────────────────────────

import json
import logging
import os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

import 팀

logging.basicConfig(
    format="%(asctime)s  %(levelname)s  %(message)s", level=logging.INFO
)
로그 = logging.getLogger("server")

여기 = os.path.dirname(os.path.abspath(__file__))
정적폴더 = os.path.join(여기, "static")
포트 = int(os.environ.get("PORT", "8000"))


class 손님응대(SimpleHTTPRequestHandler):
    def __init__(self, *인자, **옵션):
        super().__init__(*인자, directory=정적폴더, **옵션)

    def log_message(self, 형식, *인자):
        pass  # 화면이 지저분해져서 끕니다

    def _보내기(self, 코드, 내용, 종류="application/json; charset=utf-8"):
        몸통 = 내용.encode("utf-8")
        self.send_response(코드)
        self.send_header("Content-Type", 종류)
        self.send_header("Content-Length", str(len(몸통)))
        self.end_headers()
        self.wfile.write(몸통)

    def do_GET(self):
        길 = urlparse(self.path)

        if 길.path == "/api/team":
            열쇠있나 = any(
                (os.environ.get(공급["열쇠이름"]) or "").strip()
                and not any("가" <= 글 <= "힣" for 글 in os.environ[공급["열쇠이름"]])
                for 공급 in 팀.공급자들
            )
            self._보내기(
                200,
                json.dumps(
                    {"팀원": 팀.팀원정보(), "열쇠있음": 열쇠있나},
                    ensure_ascii=False,
                ),
            )
            return

        if 길.path == "/api/run":
            표현 = (parse_qs(길.query).get("q") or [""])[0].strip()
            if not 표현:
                self._보내기(400, json.dumps({"오류": "표현이 비었습니다"}, ensure_ascii=False))
                return
            self._회의중계(표현)
            return

        super().do_GET()

    def _회의중계(self, 표현):
        """한 줄씩 바로바로 보냅니다 (NDJSON). 브라우저가 실시간으로 읽습니다."""
        self.send_response(200)
        self.send_header("Content-Type", "application/x-ndjson; charset=utf-8")
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()

        로그.info("🧑‍🤝‍🧑 회의 시작: %s", 표현)
        try:
            for 소식 in 팀.회의하기(표현):
                종류 = 소식.get("종류")
                if 종류 == "말풍선":
                    로그.info("💬 %s 가 말함 (%s)", 소식["누구"], 소식.get("모델"))
                elif 종류 == "오류":
                    로그.warning("❌ %s", 소식["내용"])
                self.wfile.write(
                    (json.dumps(소식, ensure_ascii=False) + "\n").encode("utf-8")
                )
                self.wfile.flush()
        except (BrokenPipeError, ConnectionResetError):
            로그.info("손님이 창을 닫았습니다")
        except Exception as 오류:
            로그.exception("회의 중 문제: %s", 오류)
        로그.info("🧑‍🤝‍🧑 회의 끝")


if __name__ == "__main__":
    로그.info("번역 교정 팀 사무실을 엽니다 → http://localhost:%d", 포트)
    ThreadingHTTPServer(("0.0.0.0", 포트), 손님응대).serve_forever()
