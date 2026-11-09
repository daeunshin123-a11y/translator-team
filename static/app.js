// 🎮 화면을 움직이는 부분
//
// 서버가 한 줄씩 보내주는 소식을 받아서
// 캐릭터의 상태와 말풍선을 바꿉니다.
//
// 🔐 여기엔 열쇠가 없습니다. 서버한테 부탁만 합니다.

const 배우들 = document.getElementById("배우들");
const 기록 = document.getElementById("기록");
const 입력 = document.getElementById("입력");
const 시작버튼 = document.getElementById("시작버튼");
const 연습버튼 = document.getElementById("연습버튼");
const 안내 = document.getElementById("안내");
const 결과판 = document.getElementById("결과판");
const 결과 = document.getElementById("결과");

let 팀원들 = [];
const 자리들 = {};   // 아이디 -> 화면 조각
let 돌아가는중 = false;

// 방 안에서 각자 앉을 위치 (책상 상판 위)
// 숫자는 방 그림(1000x640) 기준 비율입니다.
//   앉은자리 = 엉덩이가 닿는 곳,  이름자리 = 예전 머그컵이 있던 곳
const 자리배치 = [
  { 앉은자리: { left: "25%", top: "66%"   }, 이름자리: { left: "18.8%", top: "69.1%" } },  // 🦉
  { 앉은자리: { left: "50%", top: "45.5%" }, 이름자리: { left: "43.8%", top: "48.8%" } },  // 🐱
  { 앉은자리: { left: "75%", top: "66%"   }, 이름자리: { left: "68.8%", top: "69.1%" } },  // 🦜
  { 앉은자리: { left: "50%", top: "84%"   }, 이름자리: { left: "43.8%", top: "87.2%" } },  // 🐻
];

// ── 팀원 자리 만들기 ─────────────────────────
function 사무실차리기(목록) {
  팀원들 = 목록;
  배우들.innerHTML = "";
  목록.forEach((사람, 번호) => {
    const 자리 = document.createElement("div");
    자리.className = "자리 쉬는중";
    자리.style.setProperty("--내색", 사람.색);
    const 곳 = 자리배치[번호] || {
      앉은자리: { left: "50%", top: "50%" },
      이름자리: { left: "50%", top: "55%" },
    };
    자리.style.left = 곳.앉은자리.left;
    자리.style.top = 곳.앉은자리.top;
    자리.title = 사람.한줄소개;
    자리.dataset.누구 = 사람.아이디;
    자리.innerHTML = `
      <div class="말풍선"></div>
      <div class="상태알림">
        <i class="점 쉬는중"></i><span class="상태글">쉬는 중</span>
        <span class="점셋"><span>·</span><span>·</span><span>·</span></span>
      </div>
      <div class="얼굴">${사람.얼굴}</div>
      <div class="그림자"></div>`;
    배우들.appendChild(자리);
    자리들[사람.아이디] = 자리;

    // 📛 이름은 예전에 머그컵이 있던 책상 위 자리에
    const 이름패 = document.createElement("div");
    이름패.className = "이름패";
    이름패.style.setProperty("--내색", 사람.색);
    이름패.style.left = 곳.이름자리.left;
    이름패.style.top = 곳.이름자리.top;
    이름패.textContent = 사람.이름;
    배우들.appendChild(이름패);
  });
}

function 상태바꾸기(아이디, 상태) {
  const 자리 = 자리들[아이디];
  if (!자리) return;
  자리.classList.remove("일하는중", "기다리는중", "쉬는중");
  자리.classList.add(상태);
  자리.querySelector(".점").className = "점 " + 상태;
  const 말 = { 일하는중: "일하는 중", 기다리는중: "기다리는 중", 쉬는중: "쉬는 중" }[상태];
  자리.querySelector(".상태글").textContent = 말;
}

function 말하기(아이디, 글) {
  const 자리 = 자리들[아이디];
  if (!자리) return;
  자리.querySelector(".말풍선").textContent = 글;
  자리.classList.add("말함");
}

function 모두초기화() {
  결과판.hidden = true;
  기록.innerHTML = "";
  for (const 사람 of 팀원들) {
    const 자리 = 자리들[사람.아이디];
    자리.classList.remove("말함", "넘기는중");
    자리.querySelector(".말풍선").textContent = "";
    상태바꾸기(사람.아이디, "쉬는중");
  }
  // 아직 차례가 안 온 사람들은 '기다리는 중'
  for (const 사람 of 팀원들) 상태바꾸기(사람.아이디, "기다리는중");
}

function 기록남기기(사람, 글, 모델) {
  const 줄 = document.createElement("li");
  줄.style.setProperty("--내색", 사람.색);
  줄.innerHTML =
    `<span class="누구">${사람.얼굴} ${사람.이름}</span>` +
    (모델 ? `<span class="모델">${모델}</span>` : "") +
    `<div></div>`;
  줄.querySelector("div").textContent = 글;
  기록.appendChild(줄);
  줄.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

const 찾기 = (아이디) => 팀원들.find((사람) => 사람.아이디 === 아이디);

// ── 소식 한 건 처리하기 ──────────────────────
function 소식처리(소식) {
  switch (소식.종류) {
    case "상태":
      상태바꾸기(소식.누구, 소식.상태);
      break;
    case "넘김": {
      const 앞 = 자리들[소식.부터];
      if (앞) {
        앞.classList.add("넘기는중");
        setTimeout(() => 앞.classList.remove("넘기는중"), 1400);
      }
      break;
    }
    case "말풍선":
      말하기(소식.누구, 소식.내용);
      기록남기기(찾기(소식.누구), 소식.내용, 소식.모델);
      break;
    case "끝":
      결과.textContent = 소식.결과;
      결과판.hidden = false;
      안내.textContent = "🏁 회의가 끝났습니다.";
      break;
    case "오류":
      안내.textContent = "❌ " + 소식.내용;
      break;
  }
}

// ── 진짜 회의 (서버 → AI) ────────────────────
async function 회의시작() {
  const 표현 = 입력.value.trim();
  if (!표현) { 입력.focus(); return; }
  if (돌아가는중) return;

  돌아가는중 = true;
  시작버튼.disabled = 연습버튼.disabled = true;
  모두초기화();
  안내.textContent = "🧑‍🤝‍🧑 회의 중… (AI 를 4번 부릅니다)";

  try {
    const 응답 = await fetch("/api/run?q=" + encodeURIComponent(표현));
    const 읽개 = 응답.body.getReader();
    const 해독기 = new TextDecoder();
    let 찌꺼기 = "";

    while (true) {
      const { done, value } = await 읽개.read();
      if (done) break;
      찌꺼기 += 해독기.decode(value, { stream: true });
      const 줄들 = 찌꺼기.split("\n");
      찌꺼기 = 줄들.pop();
      for (const 줄 of 줄들) {
        if (줄.trim()) 소식처리(JSON.parse(줄));
      }
    }
  } catch (오류) {
    안내.textContent = "❌ 서버와 연결이 끊겼어요: " + 오류.message;
  } finally {
    돌아가는중 = false;
    시작버튼.disabled = 연습버튼.disabled = false;
  }
}

// ── 연습 모드 (AI 안 부름, 0원) ──────────────
const 연습대본 = {
  researcher:
    "'내로남불' = 내가 하면 로맨스, 남이 하면 불륜.\n같은 행동인데 자기에게만 관대한 이중잣대를 비꼬는 말.\n구어체이고 비꼬는 뉘앙스가 강합니다.",
  translator:
    "1) doble rasero — 가장 표준적인 '이중잣대'\n2) ley del embudo — 관용구, 비꼬는 맛이 삶\n3) tener dos varas de medir — 설명적이고 부드러움",
  region:
    "1) 중립 — 스페인·중남미 어디서나 통합니다\n2) 스페인 — 중남미에서는 덜 쓰입니다\n3) 중립 — 다만 문어체 느낌이 조금 있습니다",
  reviewer:
    "최종: doble rasero\n중남미 전체에 통하는 중립 표현이고, 원문의 '이중잣대' 뜻을 정확히 담습니다.\n자막처럼 짧아야 하는 곳에서도 길이가 알맞습니다.",
};

const 잠깐 = (밀리초) => new Promise((r) => setTimeout(r, 밀리초));

async function 연습시작() {
  if (돌아가는중) return;
  돌아가는중 = true;
  시작버튼.disabled = 연습버튼.disabled = true;
  입력.value = "내로남불";
  모두초기화();
  안내.textContent = "🎬 연습 모드 — AI 를 부르지 않습니다 (0원)";

  let 앞사람 = null;
  for (const 사람 of 팀원들) {
    소식처리({ 종류: "상태", 누구: 사람.아이디, 상태: "일하는중" });
    if (앞사람) 소식처리({ 종류: "넘김", 부터: 앞사람.아이디, 까지: 사람.아이디 });
    await 잠깐(1600);
    소식처리({
      종류: "말풍선",
      누구: 사람.아이디,
      내용: 연습대본[사람.아이디],
      모델: "연습 모드",
    });
    소식처리({ 종류: "상태", 누구: 사람.아이디, 상태: "쉬는중" });
    await 잠깐(900);
    앞사람 = 사람;
  }
  소식처리({ 종류: "끝", 결과: 연습대본.reviewer });
  안내.textContent = "🎬 연습 모드로 돌려봤습니다 (0원)";
  돌아가는중 = false;
  시작버튼.disabled = 연습버튼.disabled = false;
}

// ── 시작 ─────────────────────────────────────
시작버튼.addEventListener("click", 회의시작);
연습버튼.addEventListener("click", 연습시작);
입력.addEventListener("keydown", (e) => { if (e.key === "Enter") 회의시작(); });

fetch("/api/team")
  .then((r) => r.json())
  .then((답) => {
    사무실차리기(답.팀원);
    for (const 사람 of 답.팀원) 상태바꾸기(사람.아이디, "쉬는중");
    if (!답.열쇠있음) {
      안내.textContent = "⚠️ AI 열쇠가 없어요. '연습 모드' 는 그대로 됩니다.";
      시작버튼.disabled = true;
    }
  })
  .catch(() => { 안내.textContent = "❌ 서버에 연결하지 못했어요."; });
