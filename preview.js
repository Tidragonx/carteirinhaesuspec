(() => {
  const fields = [
    "nome",
    "nomeSocial",
    "nomeMae",
    "dataNascimento",
    "cpf",
    "cns",
    "sexo",
    "telefone",
    "endereco",
    "numero",
    "bairro",
    "municipio",
    "uf",
    "cep",
    "complemento",
    "unidadeResponsavel"
  ];
  const CARD_WIDTH = 380;
  const CARD_HEIGHT = 239;
  const frontImage = new Image();
  const backImage = new Image();
  frontImage.src = "extracted/obj_3.png";
  backImage.src = "extracted/obj_8.png";

  function decodeDataFromHash() {
    const hash = window.location.hash || "";
    const prefix = "#data=";
    if (!hash.startsWith(prefix)) {
      return {};
    }

    try {
      return JSON.parse(decodeURIComponent(hash.slice(prefix.length)));
    } catch {
      return {};
    }
  }

  function fillForm(data) {
    const form = document.getElementById("editorForm");
    for (const field of fields) {
      const input = form.elements.namedItem(field);
      if (input) {
        input.value = data[field] || "";
      }
    }
  }

  function readFormData() {
    const form = document.getElementById("editorForm");
    const current = {};

    for (const field of fields) {
      const input = form.elements.namedItem(field);
      current[field] = input ? String(input.value || "").trim() : "";
    }

    return current;
  }

  function normalizeSexo(value) {
    const lower = String(value || "").toLowerCase();
    if (lower.startsWith("m")) {
      return "M";
    }
    if (lower.startsWith("f")) {
      return "F";
    }
    return value || "";
  }

  function groupCns(value) {
    const digits = String(value || "").replace(/\D/g, "");
    if (digits.length !== 15) {
      return value || "";
    }
    return `${digits.slice(0, 3)} ${digits.slice(3, 7)} ${digits.slice(7, 11)} ${digits.slice(11)}`;
  }

  function code128Pattern() {
    return [
      "212222","222122","222221","121223","121322","131222","122213","122312","132212","221213",
      "221312","231212","112232","122132","122231","113222","123122","123221","223211","221132",
      "221231","213212","223112","312131","311222","321122","321221","312212","322112","322211",
      "212123","212321","232121","111323","131123","131321","112313","132113","132311","211313",
      "231113","231311","112133","112331","132131","113123","113321","133121","313121","211331",
      "231131","213113","213311","213131","311123","311321","331121","312113","312311","332111",
      "314111","221411","431111","111224","111422","121124","121421","141122","141221","112214",
      "112412","122114","122411","142112","142211","241211","221114","413111","241112","134111",
      "111242","121142","121241","114212","124112","124211","411212","421112","421211","212141",
      "214121","412121","111143","111341","131141","114113","114311","411113","411311","113141",
      "114131","311141","411131","211412","211214","211232","2331112"
    ];
  }

  function encodeCode128(value) {
    const text = String(value || "").trim();
    if (!text) {
      return [];
    }

    const codes = [];
    let index = 0;
    let currentSet = null;

    while (index < text.length) {
      const digitsAhead = text.slice(index).match(/^\d+/)?.[0] || "";
      const canUseC = digitsAhead.length >= 2;

      if (!currentSet) {
        if (canUseC) {
          codes.push(105);
          currentSet = "C";
        } else {
          codes.push(104);
          currentSet = "B";
        }
      }

      if (currentSet === "C") {
        if (digitsAhead.length >= 2) {
          codes.push(Number(text.slice(index, index + 2)));
          index += 2;
          continue;
        }
        codes.push(100);
        currentSet = "B";
        continue;
      }

      if (canUseC && digitsAhead.length >= 4) {
        codes.push(99);
        currentSet = "C";
        continue;
      }

      codes.push(text.charCodeAt(index) - 32);
      index += 1;
    }

    let checksum = codes[0];
    for (let i = 1; i < codes.length; i += 1) {
      checksum += codes[i] * i;
    }
    codes.push(checksum % 103);
    codes.push(106);
    return codes;
  }

  function drawCode128(ctx, value, x, y, width, height) {
    const codes = encodeCode128(value);
    if (!codes.length) {
      return;
    }

    const patterns = code128Pattern();
    const sequence = codes.map((code) => patterns[code]).join("");
    const totalUnits = sequence.split("").reduce((sum, item) => sum + Number(item), 0);
    const unitWidth = width / totalUnits;

    let cursor = x;
    let drawBar = true;
    ctx.fillStyle = "#000";

    for (const pattern of sequence) {
      const segment = Number(pattern) * unitWidth;
      if (drawBar) {
        ctx.fillRect(cursor, y, segment, height);
      }
      cursor += segment;
      drawBar = !drawBar;
    }
  }

  function drawBackCard(data) {
    const canvas = document.getElementById("backCanvas");
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
    ctx.drawImage(backImage, 0, 0, CARD_WIDTH, CARD_HEIGHT);

    ctx.fillStyle = "#000";
    ctx.textBaseline = "alphabetic";

    ctx.font = "bold 12px 'Courier New', monospace";
    ctx.fillText((data.nome || "").toUpperCase(), 58, 239 - 182.31);

    ctx.font = "bold 11px 'Courier New', monospace";
    ctx.fillText("Data Nasc.:", 58, 239 - 150.57);
    ctx.fillText(data.dataNascimento || "", 136, 239 - 150.57);
    ctx.fillText("Sexo:", 255, 239 - 150.57);
    ctx.fillText(normalizeSexo(data.sexo), 291, 239 - 150.57);

    ctx.font = "bold 21px 'Courier New', monospace";
    ctx.fillText(`CPF: ${data.cpf || ""}`, 67.8, 239 - 108.41);

    ctx.font = "bold 8px 'Courier New', monospace";
    ctx.fillText(`CNS: ${groupCns(data.cns)}`, 135.3, 239 - 134.87);

    drawCode128(ctx, String(data.cns || "").replace(/\D/g, ""), 90, 239 - 67 - 32, 203.38, 32);
  }

  function drawFrontCard() {
    const canvas = document.getElementById("frontCanvas");
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
    ctx.drawImage(frontImage, 0, 0, CARD_WIDTH, CARD_HEIGHT);
  }

  function renderCard() {
    const current = readFormData();
    drawFrontCard();
    drawBackCard(current);
  }

  function bindEvents() {
    const form = document.getElementById("editorForm");
    form.addEventListener("input", renderCard);

    document.getElementById("printButton").addEventListener("click", () => {
      window.print();
    });
  }

  function waitForImage(image) {
    return new Promise((resolve) => {
      if (image.complete) {
        resolve();
        return;
      }

      image.onload = resolve;
    });
  }

  Promise.all([
    waitForImage(frontImage),
    waitForImage(backImage)
  ]).then(() => {
    const data = decodeDataFromHash();
    fillForm(data);
    bindEvents();
    renderCard();
  });
})();
