let currentItem = null;
let totalCount = 0;

const USED_IDS_KEY = "jlpt_n3_used_ids";
const UNSPLASH_ACCESS_KEY = "SKJ70jrAhrPxiZiG3yKwi6bxxR1F7Or9PnbNbpCtsvY"; // Replace with your Unsplash API key

// Function to search Unsplash with a specific query
async function searchUnsplash(query) {
  const response = await fetch(
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
    {
      headers: {
        'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
      }
    }
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch image');
  }
  
  return await response.json();
}

// Function to fetch image from Unsplash API with hybrid search
async function fetchMeaningImage(vocabulary, meaning, romaji) {
  try {
    // Show loading indicator
    document.getElementById("imageLoading").style.display = "block";
    document.getElementById("meaningImage").style.display = "none";
    
    let data = null;
    let searchQuery = "";
    let imageFound = false;
    
    // Strategy 1: Try Japanese vocabulary first
    if (!imageFound && vocabulary) {
      searchQuery = vocabulary.trim();
      console.log('Searching with Japanese:', searchQuery);
      data = await searchUnsplash(searchQuery);
      if (data.results && data.results.length > 0) {
        imageFound = true;
      }
    }
    
    // Strategy 2: Try English meaning as fallback
    if (!imageFound && meaning) {
      searchQuery = meaning.split(',')[0].trim();
      console.log('Searching with English:', searchQuery);
      data = await searchUnsplash(searchQuery);
      if (data.results && data.results.length > 0) {
        imageFound = true;
      }
    }
    
    // Strategy 3: Try romaji as last resort
    if (!imageFound && romaji) {
      searchQuery = romaji.trim();
      console.log('Searching with romaji:', searchQuery);
      data = await searchUnsplash(searchQuery);
      if (data.results && data.results.length > 0) {
        imageFound = true;
      }
    }
    
    if (imageFound && data.results.length > 0) {
      const imageUrl = data.results[0].urls.small;
      const imageElement = document.getElementById("meaningImage");
      
      imageElement.src = imageUrl;
      imageElement.alt = `Image representing: ${vocabulary} (${meaning})`;
      
      // Hide loading and show image when loaded
      imageElement.onload = () => {
        document.getElementById("imageLoading").style.display = "none";
        imageElement.style.display = "block";
        console.log('Image loaded successfully with query:', searchQuery);
      };
      
      imageElement.onerror = () => {
        document.getElementById("imageLoading").style.display = "none";
        console.log('Image failed to load');
      };
    } else {
      // No image found with any strategy
      document.getElementById("imageLoading").style.display = "none";
      console.log('No images found with any search strategy');
    }
  } catch (error) {
    console.error('Error fetching image:', error);
    document.getElementById("imageLoading").style.display = "none";
  }
}

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
  
  // Reset image
  document.getElementById("meaningImage").style.display = "none";
  document.getElementById("imageLoading").style.display = "none";
  document.getElementById("meaningImage").src = "";

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
  
  // Fetch and display image using hybrid search strategy
  fetchMeaningImage(currentItem.vocabulary, currentItem.meaning, currentItem.romaji);
  
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