document.addEventListener("DOMContentLoaded", () => {
  const inputText = document.getElementById("inputText");
  const outputText = document.getElementById("outputText");
  const fromLang = document.getElementById("fromLang");
  const toLang = document.getElementById("toLang");
  const historyList = document.getElementById("historyList");
  const themeBtn = document.getElementById("themeBtn");
  const heroSubtitle = document.getElementById("heroSubtitle");

  const languages = {
    auto: "Detect Language",
    en: "English",
    ta: "Tamil",
    hi: "Hindi",
    ml: "Malayalam",
    te: "Telugu",
    kn: "Kannada",
    ur: "Urdu",
    ar: "Arabic",
    fr: "French",
    de: "German",
    es: "Spanish",
    it: "Italian",
    pt: "Portuguese",
    ru: "Russian",
    ja: "Japanese",
    ko: "Korean",
    zh: "Chinese",
    tr: "Turkish",
    nl: "Dutch",
    pl: "Polish",
    th: "Thai",
    vi: "Vietnamese",
    id: "Indonesian",
    bn: "Bengali",
    gu: "Gujarati",
    mr: "Marathi",
    pa: "Punjabi"
  };

  function loadLanguages() {
    fromLang.innerHTML = "";
    toLang.innerHTML = "";

    Object.keys(languages).forEach(code => {
      const opt1 = document.createElement("option");
      opt1.value = code;
      opt1.textContent = languages[code];
      fromLang.appendChild(opt1);

      if (code !== "auto") {
        const opt2 = document.createElement("option");
        opt2.value = code;
        opt2.textContent = languages[code];
        toLang.appendChild(opt2);
      }
    });

    fromLang.value = "auto";
    toLang.value = "ta";
  }

  async function translateText() {
    const text = inputText.value.trim();
    if (!text) {
      alert("Please enter text to translate");
      return;
    }

    outputText.value = "Translating...";

    const source = fromLang.value === "auto" ? "auto" : fromLang.value;
    const target = toLang.value;

    try {
      const googleUrl =
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${source}&tl=${target}&dt=t&q=${encodeURIComponent(text)}`;

      const res = await fetch(googleUrl);
      const data = await res.json();

      const translated = data[0].map(item => item[0]).join("");

      if (translated) {
        outputText.value = translated;
        saveHistory(text, translated, source, target);
        return;
      }
    } catch (err) {
      console.log("Google free endpoint failed. Trying backup API...");
    }

    try {
      const backupSource = source === "auto" ? "en" : source;
      const url =
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${backupSource}|${target}`;

      const res = await fetch(url);
      const data = await res.json();

      const translated = data.responseData.translatedText;
      outputText.value = translated;
      saveHistory(text, translated, backupSource, target);
    } catch (err) {
      outputText.value = "Translation failed. Please check internet connection.";
    }
  }

  function startVoice() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice input works only in Chrome browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = getSpeechLang(fromLang.value === "auto" ? "en" : fromLang.value);
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.start();
    inputText.placeholder = "Listening...";

    recognition.onresult = event => {
      inputText.value = event.results[0][0].transcript;
      inputText.placeholder = "Enter your text here...";
    };

    recognition.onerror = () => {
      inputText.placeholder = "Enter your text here...";
      alert("Voice recognition failed.");
    };

    recognition.onend = () => {
      inputText.placeholder = "Enter your text here...";
    };
  }

  function speakOutput() {
    if (!outputText.value.trim()) {
      alert("No text to speak");
      return;
    }

    speechSynthesis.cancel();
    const speech = new SpeechSynthesisUtterance(outputText.value);
    speech.lang = getSpeechLang(toLang.value);
    speech.rate = 0.9;
    speech.pitch = 1;
    speechSynthesis.speak(speech);
  }

  function copyText() {
    if (!outputText.value.trim()) {
      alert("No translated text to copy");
      return;
    }

    navigator.clipboard.writeText(outputText.value);
    alert("Copied successfully!");
  }

  function clearText() {
    inputText.value = "";
    outputText.value = "";
  }

  function swapLang() {
    if (fromLang.value === "auto") {
      alert("Detect Language cannot be swapped.");
      return;
    }

    const tempLang = fromLang.value;
    fromLang.value = toLang.value;
    toLang.value = tempLang;

    const tempText = inputText.value;
    inputText.value = outputText.value;
    outputText.value = tempText;
  }

  function saveHistory(original, translated, source, target) {
    let history = JSON.parse(localStorage.getItem("afxxHistory")) || [];

    history.unshift({
      original,
      translated,
      source: languages[source] || source,
      target: languages[target] || target,
      time: new Date().toLocaleString()
    });

    history = history.slice(0, 6);
    localStorage.setItem("afxxHistory", JSON.stringify(history));
    loadHistory();
  }

  function loadHistory() {
    const history = JSON.parse(localStorage.getItem("afxxHistory")) || [];
    historyList.innerHTML = "";

    if (history.length === 0) {
      historyList.innerHTML = "<p>No recent translations yet.</p>";
      return;
    }

    history.forEach(item => {
      const div = document.createElement("div");
      div.className = "history-item";
      div.innerHTML = `
        <small>${item.source} → ${item.target} | ${item.time}</small>
        <p><b>Input:</b> ${item.original}</p>
        <p><b>Output:</b> ${item.translated}</p>
      `;
      historyList.appendChild(div);
    });
  }

  function getSpeechLang(code) {
    const map = {
      en: "en-US", ta: "ta-IN", hi: "hi-IN", ml: "ml-IN", te: "te-IN",
      kn: "kn-IN", ur: "ur-PK", ar: "ar-SA", fr: "fr-FR", de: "de-DE",
      es: "es-ES", it: "it-IT", pt: "pt-PT", ru: "ru-RU", ja: "ja-JP",
      ko: "ko-KR", zh: "zh-CN", tr: "tr-TR", nl: "nl-NL", th: "th-TH",
      vi: "vi-VN", id: "id-ID", bn: "bn-IN", mr: "mr-IN", gu: "gu-IN",
      pa: "pa-IN", auto: "en-US"
    };
    return map[code] || "en-US";
  }

  function revealOnScroll() {
    const reveals = document.querySelectorAll(".reveal");
    reveals.forEach(el => {
      const windowHeight = window.innerHeight;
      const elementTop = el.getBoundingClientRect().top;
      if (elementTop < windowHeight - 80) {
        el.classList.add("active");
      }
    });
  }

  function typingEffect() {
    const text = "Translate smarter, faster and beautifully with AFXX AI.";
    let index = 0;

    function type() {
      if (index < text.length) {
        heroSubtitle.textContent += text.charAt(index);
        index++;
        setTimeout(type, 55);
      }
    }

    type();
  }

  function createStar(x, y) {
    const star = document.createElement("div");
    star.className = "star";
    star.innerHTML = "✦";
    star.style.left = x + "px";
    star.style.top = y + "px";
    document.body.appendChild(star);

    setTimeout(() => star.remove(), 800);
  }

  let lastStar = 0;

  document.addEventListener("mousemove", e => {
    const now = Date.now();
    if (now - lastStar > 25) {
      createStar(e.clientX, e.clientY);
      lastStar = now;
    }
  });

  document.addEventListener("touchmove", e => {
    const touch = e.touches[0];
    if (touch) createStar(touch.clientX, touch.clientY);
  });

  themeBtn.addEventListener("click", () => {
    document.body.classList.toggle("light");

    themeBtn.innerHTML = document.body.classList.contains("light")
      ? `<i class="fa-solid fa-sun"></i>`
      : `<i class="fa-solid fa-moon"></i>`;
  });

  inputText.addEventListener("keydown", event => {
    if (event.ctrlKey && event.key === "Enter") {
      translateText();
    }
  });

  window.translateText = translateText;
  window.startVoice = startVoice;
  window.speakOutput = speakOutput;
  window.copyText = copyText;
  window.clearText = clearText;
  window.swapLang = swapLang;

  loadLanguages();
  loadHistory();
  typingEffect();
  revealOnScroll();
  window.addEventListener("scroll", revealOnScroll);
});