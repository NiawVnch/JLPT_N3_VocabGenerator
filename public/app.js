let currentItem = null;
let totalCount = 0;

const USED_IDS_KEY = "jlpt_n3_used_ids";

function getUsedIds() {
  const raw = localStorage.getItem(USED_IDS_KEY);

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveUsedIds(ids) {
  localStorage.setItem(USED_IDS_KEY, JSON.stringify(ids));
}

function updateStatus() {
  const usedIds = getUsedIds();

  document.getElementById("totalCount").textContent = totalCount;
  document.getElementById("usedCount").textContent = usedIds.length;
  document.getElementById("remainingCount").textContent =
    totalCount > 0 ? totalCount - usedIds.length : "-";
}

function resetCardView() {
  const vocabularyBox = document.getElementById("vocabularyBox");
  const meaningBox = document.getElementById("meaningBox");
  
  vocabularyBox.style.display = "none";
  meaningBox.style.display = "none";

  document.getElementById("vocabulary").textContent = "";
  document.getElementById("meaning").textContent = "";
  document.getElementById("romaji").textContent = "";

  document.getElementById("showVocabBtn").disabled = false;
  document.getElementById("showMeaningBtn").disabled = false;
  document.getElementById("nextBtn").disabled = true;
}

async function loadTotalCount() {
  const response = await fetch("/api/vocabulary/count");
  const data = await response.json();

  totalCount = data.total;
  updateStatus();
}

async function getRandomCard() {
  const usedIds = getUsedIds();

  const response = await fetch("/api/vocabulary/random", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ usedIds }),
  });

  const data = await response.json();

  if (data.finished) {
    currentItem = null;

    document.getElementById("reading").textContent =
      "ครบทุกคำแล้ว กรุณากด Reset Random Memory";

    document.getElementById("showVocabBtn").disabled = true;
    document.getElementById("showMeaningBtn").disabled = true;
    document.getElementById("nextBtn").disabled = true;
    document.getElementById("startBtn").style.display = "block";
    document.getElementById("startBtn").disabled = true;

    return;
  }

  currentItem = data.item;

  const newUsedIds = [...usedIds, currentItem.id];
  saveUsedIds(newUsedIds);

  resetCardView();

  document.getElementById("reading").textContent = currentItem.reading;

  updateStatus();
}

async function startGame() {
  document.getElementById("startBtn").style.display = "none";
  await getRandomCard();
}

function showVocabulary() {
  if (!currentItem) return;

  const vocabularyBox = document.getElementById("vocabularyBox");
  document.getElementById("vocabulary").textContent = currentItem.vocabulary;
  vocabularyBox.style.display = "block";
  
  // Add smooth scroll to vocabulary section
  setTimeout(() => {
    vocabularyBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 100);
}

function showMeaning() {
  if (!currentItem) return;

  const meaningBox = document.getElementById("meaningBox");
  document.getElementById("meaning").textContent = currentItem.meaning;
  document.getElementById("romaji").textContent = currentItem.romaji;
  meaningBox.style.display = "block";

  document.getElementById("nextBtn").disabled = false;
  document.getElementById("showMeaningBtn").disabled = true;
  
  // Add smooth scroll to meaning section
  setTimeout(() => {
    meaningBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 100);
}

async function nextCard() {
  await getRandomCard();
}

function resetMemory() {
  const confirmed = confirm(
    "ต้องการล้างความจำการสุ่มใช่ไหม? หลังจากนี้คำเดิมจะกลับมาสุ่มได้อีกครั้ง"
  );

  if (!confirmed) return;

  localStorage.removeItem(USED_IDS_KEY);

  currentItem = null;

  document.getElementById("reading").textContent = "กด Start เพื่อเริ่มใหม่";
  document.getElementById("vocabularyBox").style.display = "none";
  document.getElementById("meaningBox").style.display = "none";

  // Reset all buttons to initial state
  document.getElementById("startBtn").style.display = "block";
  document.getElementById("startBtn").disabled = false;
  document.getElementById("startBtn").textContent = "🚀 Start";
  document.getElementById("showVocabBtn").disabled = true;
  document.getElementById("showMeaningBtn").disabled = true;
  document.getElementById("nextBtn").disabled = true;
  document.getElementById("nextBtn").textContent = "➡️ Next";

  updateStatus();
}

window.addEventListener("load", async () => {
  try {
    await loadTotalCount();
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      switch(e.key) {
        case ' ': // Spacebar
        case 'Enter':
          e.preventDefault();
          if (document.getElementById("startBtn").style.display !== "none" && !document.getElementById("startBtn").disabled) {
            startGame();
          } else if (!document.getElementById("showVocabBtn").disabled) {
            showVocabulary();
          } else if (!document.getElementById("showMeaningBtn").disabled) {
            showMeaning();
          } else if (!document.getElementById("nextBtn").disabled) {
            nextCard();
          }
          break;
        case 'v':
        case 'V':
          if (!document.getElementById("showVocabBtn").disabled) {
            showVocabulary();
          }
          break;
        case 'm':
        case 'M':
          if (!document.getElementById("showMeaningBtn").disabled) {
            showMeaning();
          }
          break;
        case 'n':
        case 'N':
          if (!document.getElementById("nextBtn").disabled) {
            nextCard();
          }
          break;
        case 'r':
        case 'R':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            resetMemory();
          }
          break;
      }
    });
    
  } catch (error) {
    console.error(error);
    alert("เชื่อมต่อ Server หรือ Database ไม่สำเร็จ");
  }
});