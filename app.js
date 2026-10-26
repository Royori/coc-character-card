const STORAGE_KEY = "coc-investigator-card";
const form = document.querySelector("#character-form");
const statusMessage = document.querySelector("#status-message");
const skillsList = document.querySelector("#skills-list");
const avatarInput = document.querySelector("#avatar-input");
const avatarPreview = document.querySelector("#avatar-preview");
const avatarImage = document.querySelector("#avatar-image");
const importInput = document.querySelector("#import-input");
const defaultSkills = ["信用", "閃避", "圖書館使用", "聆聽", "心理學", "急救"];
const attributeRolls = {
  str: { dice: 3, sides: 6, bonus: 0 },
  con: { dice: 3, sides: 6, bonus: 0 },
  siz: { dice: 2, sides: 6, bonus: 6 },
  dex: { dice: 3, sides: 6, bonus: 0 },
  app: { dice: 3, sides: 6, bonus: 0 },
  int: { dice: 2, sides: 6, bonus: 6 },
  pow: { dice: 3, sides: 6, bonus: 0 },
  edu: { dice: 2, sides: 6, bonus: 6 },
  luck: { dice: 3, sides: 6, bonus: 0 }
};

function number(name) { return Number(form.elements[name].value) || 0; }
function rounded(value) { return Math.floor(value); }
function rollDice(count, sides) {
  let total = 0;
  for (let index = 0; index < count; index += 1) {
    total += Math.floor(Math.random() * sides) + 1;
  }
  return total;
}
function rollAttribute(name) {
  const rule = attributeRolls[name];
  if (!rule) return;
  form.elements[name].value = (rollDice(rule.dice, rule.sides) + rule.bonus) * 5;
  updateDerived();
}
function rollAllAttributes() {
  Object.keys(attributeRolls).forEach(rollAttribute);
  statusMessage.textContent = "已依照 CoC 7版規則擲出全部能力值。";
  setTimeout(() => { statusMessage.textContent = ""; }, 3000);
}
function updateDerived() {
  const con = number("con"), siz = number("siz"), pow = number("pow"), dex = number("dex");
  document.querySelector("#hp-value").textContent = rounded((con + siz) / 10);
  document.querySelector("#mp-value").textContent = rounded(pow / 5);
  document.querySelector("#san-value").textContent = pow;
  document.querySelector("#dodge-value").textContent = rounded(dex / 2);
  document.querySelector("#know-value").textContent = rounded(number("edu") / 5);
  document.querySelector("#idea-value").textContent = rounded(number("int") / 5);
  const sum = number("str") + siz;
  let build = "0", damage = "0";
  if (sum >= 65 && sum <= 84) { build = "1"; damage = "1D4"; }
  else if (sum >= 85 && sum <= 124) { build = "2"; damage = "1D6"; }
  else if (sum >= 125 && sum <= 164) { build = "3"; damage = "2D6"; }
  else if (sum >= 165) { build = "4"; damage = "3D6"; }
  else if (sum <= 64 && sum >= 45) { build = "-1"; damage = "-1"; }
  else if (sum < 45) { build = "-2"; damage = "-2"; }
  document.querySelector("#build-value").textContent = `${damage} / ${build}`;
}
function addSkill(name = "", initial = 0, occupation = 0, interest = 0, adjustment = 0) {
  const row = document.createElement("div");
  row.className = "skill-row";
  row.innerHTML = `<input class="skill-name" type="text" placeholder="技能名稱" value="${escapeHtml(name)}"><input class="skill-number" type="number" min="0" max="99" value="${initial}"><input class="skill-number" type="number" min="0" max="99" value="${occupation}"><input class="skill-number" type="number" min="0" max="99" value="${interest}"><div class="adjustment"><button class="adjust-button" type="button" data-adjust="-1" aria-label="減少技能總值">−</button><input class="skill-adjustment" type="number" min="-99" max="99" value="${adjustment}"><button class="adjust-button" type="button" data-adjust="1" aria-label="增加技能總值">＋</button></div><span class="total">0</span><button class="remove-skill" type="button" aria-label="移除技能">×</button>`;
  skillsList.append(row);
  row.querySelectorAll(".skill-number").forEach(input => input.addEventListener("input", () => {
    limitSkillParts(row, input);
    updateSkills();
  }));
  row.querySelector(".skill-adjustment").addEventListener("input", updateSkills);
  row.querySelectorAll(".adjust-button").forEach(button => button.addEventListener("click", () => {
    const adjustmentInput = row.querySelector(".skill-adjustment");
    adjustmentInput.value = Math.max(-99, Math.min(99, (Number(adjustmentInput.value) || 0) + Number(button.dataset.adjust)));
    updateSkills();
  }));
  row.querySelector(".remove-skill").addEventListener("click", () => row.remove());
  normalizeSkillParts(row);
  updateSkills();
}
function normalizeSkillParts(row) {
  let remaining = 99;
  row.querySelectorAll(".skill-number").forEach(input => {
    const value = Math.max(0, Math.min(remaining, Number(input.value) || 0));
    input.value = value;
    remaining -= value;
  });
}
function limitSkillParts(row, changedInput) {
  const parts = [...row.querySelectorAll(".skill-number")];
  const changedIndex = parts.indexOf(changedInput);
  const otherTotal = parts.reduce((sum, input, index) => index === changedIndex ? sum : sum + (Number(input.value) || 0), 0);
  const maximum = Math.max(0, 99 - otherTotal);
  changedInput.value = Math.max(0, Math.min(maximum, Number(changedInput.value) || 0));
}
function updateSkills() {
  skillsList.querySelectorAll(".skill-row").forEach(row => {
    const rolledTotal = [...row.querySelectorAll(".skill-number")].reduce((sum, input) => sum + (Number(input.value) || 0), 0);
    const total = Math.max(0, Math.min(99, rolledTotal + (Number(row.querySelector(".skill-adjustment").value) || 0)));
    row.querySelector(".total").textContent = total;
  });
}
function randomSkillValues() {
  const initial = Math.floor(Math.random() * 33) + 1;
  const occupation = Math.floor(Math.random() * (99 - initial - 1)) + 1;
  const interest = Math.floor(Math.random() * (99 - initial - occupation + 1));
  return [initial, occupation, interest];
}
function rollSkills() {
  skillsList.querySelectorAll(".skill-row").forEach(row => {
    const values = randomSkillValues();
    row.querySelectorAll(".skill-number").forEach((input, index) => { input.value = values[index]; });
    row.querySelector(".skill-adjustment").value = 0;
  });
  updateSkills();
  statusMessage.textContent = "已為每項技能隨機擲出初始、職業與興趣值。";
  setTimeout(() => { statusMessage.textContent = ""; }, 3000);
}
function escapeHtml(value) { return String(value).replace(/[&<>"']/g, char => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;" }[char])); }
function collectData() {
  const data = Object.fromEntries(new FormData(form).entries());
  data.avatar = avatarImage.getAttribute("src") || "";
  data.skills = [...skillsList.querySelectorAll(".skill-row")].map(row => [
    row.querySelector(".skill-name").value,
    ...[...row.querySelectorAll(".skill-number, .skill-adjustment")].map(input => input.value)
  ]);
  return data;
}
function exportCharacterCard() {
  const data = collectData();
  const file = new Blob([JSON.stringify({ format: "coc-character-card", version: 1, data }, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  const safeName = (data.name || "未命名調查員").replace(/[\\/:*?"<>|]/g, "_").trim();
  link.href = url;
  link.download = `${safeName || "未命名調查員"}.coc.json`;
  link.click();
  URL.revokeObjectURL(url);
  statusMessage.textContent = "角色卡檔案已下載。";
  setTimeout(() => { statusMessage.textContent = ""; }, 3000);
}
function importCharacterCard(file) {
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    try {
      const imported = JSON.parse(String(reader.result));
      const data = imported?.format === "coc-character-card" ? imported.data : imported;
      if (!data || typeof data !== "object" || (!data.name && !data.skills && !data.str)) {
        throw new Error("檔案不是有效的 CoC 角色卡");
      }
      loadData(data);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(collectData()));
      statusMessage.textContent = "角色卡已開啟，可以繼續修改。";
    } catch (error) {
      statusMessage.textContent = `開啟失敗：${error.message}`;
    }
    importInput.value = "";
    setTimeout(() => { statusMessage.textContent = ""; }, 4000);
  });
  reader.addEventListener("error", () => {
    statusMessage.textContent = "檔案讀取失敗，請重新選擇。";
    importInput.value = "";
  });
  reader.readAsText(file);
}
function setAvatar(source) {
  const hasAvatar = Boolean(source);
  avatarImage.src = hasAvatar ? source : "";
  avatarImage.hidden = !hasAvatar;
  avatarPreview.classList.toggle("has-avatar", hasAvatar);
}
avatarInput.addEventListener("change", () => {
  const file = avatarInput.files?.[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    statusMessage.textContent = "請選擇圖片檔案。";
    avatarInput.value = "";
    return;
  }
  const reader = new FileReader();
  reader.addEventListener("load", () => setAvatar(String(reader.result)));
  reader.addEventListener("error", () => { statusMessage.textContent = "頭像讀取失敗，請重新選擇。"; });
  reader.readAsDataURL(file);
});
document.querySelector("#clear-avatar-button").addEventListener("click", () => {
  avatarInput.value = "";
  setAvatar("");
  statusMessage.textContent = "已清除頭像。";
  setTimeout(() => { statusMessage.textContent = ""; }, 2000);
});
function discordText(data) {
  const skills = data.skills
    .filter(skill => skill[0].trim())
    .map(skill => `- ${skill[0]}：${Math.max(0, Math.min(99, (Number(skill[1]) || 0) + (Number(skill[2]) || 0) + (Number(skill[3]) || 0) + (Number(skill[4]) || 0)))}%`)
    .join("\n") || "- 尚未填寫";
  return [
    `## ${data.name || "未命名調查員"}｜CoC 7版角色卡`,
    `**玩家：** ${data.player || "未填寫"}　**職業：** ${data.occupation || "未填寫"}　**年代：** ${data.era || "未填寫"}`,
    `**年齡：** ${data.age || "未填寫"}　**住址：** ${data.address || "未填寫"}`,
    "",
    "**能力值**",
    `STR ${data.str || 0} ｜ CON ${data.con || 0} ｜ SIZ ${data.siz || 0} ｜ DEX ${data.dex || 0}`,
    `APP ${data.app || 0} ｜ INT ${data.int || 0} ｜ POW ${data.pow || 0} ｜ EDU ${data.edu || 0} ｜ LUCK ${data.luck || 0}`,
    "",
    `**衍生數值**　生命 ${document.querySelector("#hp-value").textContent} ｜ 魔法 ${document.querySelector("#mp-value").textContent} ｜ 理智 ${document.querySelector("#san-value").textContent} ｜ 閃避 ${document.querySelector("#dodge-value").textContent}`,
    `**傷害加值／體格：** ${document.querySelector("#build-value").textContent}`,
    "",
    "**技能**",
    skills,
    "",
    `**背景描述：** ${data.appearance || "未填寫"}`,
    `**信念與重要人物：** ${data.beliefs || "未填寫"}`,
    `**裝備與財產：** ${data.equipment || "未填寫"}`,
    "",
    `> 生命 ${data["current-hp"] || "—"} ｜ 理智 ${data["current-san"] || "—"} ｜ 魔法 ${data["current-mp"] || "—"} ｜ 狀態：${data.conditions || "正常"}`
  ].join("\n");
}
async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const temporary = document.createElement("textarea");
  temporary.value = text;
  temporary.style.position = "fixed";
  temporary.style.opacity = "0";
  document.body.append(temporary);
  temporary.select();
  const copied = document.execCommand("copy");
  temporary.remove();
  if (!copied) throw new Error("瀏覽器拒絕複製操作");
}
function loadData(data) {
  Object.entries(data).forEach(([key, value]) => {
    if (key === "skills" || !form.elements[key]) return;
    form.elements[key].value = value;
  });
  skillsList.replaceChildren();
  setAvatar(data.avatar || "");
  (data.skills?.length ? data.skills : defaultSkills.map(name => [name, 0, 0, 0, 0])).forEach(skill => addSkill(...skill));
  updateDerived();
}
form.addEventListener("input", updateDerived);
document.querySelector("#add-skill-button").addEventListener("click", () => addSkill());
document.querySelector("#export-button").addEventListener("click", exportCharacterCard);
document.querySelector("#import-button").addEventListener("click", () => importInput.click());
importInput.addEventListener("change", () => {
  const file = importInput.files?.[0];
  if (file) importCharacterCard(file);
});
document.querySelector("#roll-skills-button").addEventListener("click", rollSkills);
document.querySelectorAll("[data-roll]").forEach(button => {
  button.addEventListener("click", () => {
    rollAttribute(button.dataset.roll);
    statusMessage.textContent = `${button.closest(".attribute").querySelector("span span").textContent} 已重新擲骰。`;
    setTimeout(() => { statusMessage.textContent = ""; }, 2000);
  });
});
document.querySelector("#roll-all-button").addEventListener("click", rollAllAttributes);
document.querySelector("#save-button").addEventListener("click", () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(collectData()));
  statusMessage.textContent = "角色卡已儲存到這個瀏覽器。";
  setTimeout(() => { statusMessage.textContent = ""; }, 3000);
});
document.querySelector("#copy-discord-button").addEventListener("click", async () => {
  try {
    await copyText(discordText(collectData()));
    statusMessage.textContent = "已複製 Discord 格式，現在可以貼到聊天室。";
  } catch (error) {
    statusMessage.textContent = `複製失敗：${error.message}`;
  }
  setTimeout(() => { statusMessage.textContent = ""; }, 4000);
});
document.querySelector("#reset-button").addEventListener("click", () => {
  if (!confirm("確定要清除目前表單嗎？")) return;
  form.reset();
  localStorage.removeItem(STORAGE_KEY);
  loadData({});
  statusMessage.textContent = "已清除角色卡。";
});
const saved = localStorage.getItem(STORAGE_KEY);
loadData(saved ? JSON.parse(saved) : {});
