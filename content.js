(() => {
  const BUTTON_ID = "sus-card-trigger";
  const BUTTON_TEXT = "Gerar Carteirinha SUS";
  let observer;

  function normalize(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function isVisible(element) {
    if (!element || !(element instanceof HTMLElement)) {
      return false;
    }

    const style = window.getComputedStyle(element);
    return style.display !== "none" && style.visibility !== "hidden";
  }

  function findUpdateButton() {
    const exactButton = document.querySelector('[data-cy="CidadaoCabecalho.atualizarCadastro"]');
    if (exactButton && isVisible(exactButton)) {
      return exactButton;
    }

    const candidates = Array.from(document.querySelectorAll("button, input[type='button'], input[type='submit'], a"));
    return candidates.find((element) => {
      const text = normalize(element.textContent || element.value || "");
      return text.includes("atualizar cadastro") && isVisible(element);
    });
  }

  function buildTriggerButton() {
    const button = document.createElement("button");
    button.id = BUTTON_ID;
    button.type = "button";
    button.className = "sus-card-trigger";
    button.textContent = BUTTON_TEXT;
    button.addEventListener("click", handleGenerateClick);
    return button;
  }

  function injectButton() {
    const target = findUpdateButton();
    if (!target || document.getElementById(BUTTON_ID)) {
      return;
    }

    target.parentElement?.insertBefore(buildTriggerButton(), target);
  }

  function findSection(title) {
    const headings = Array.from(document.querySelectorAll("h1, h2, h3, h4"));
    const heading = headings.find((element) => normalize(element.textContent) === normalize(title));
    return heading ? heading.parentElement : null;
  }

  function readValueCard(sectionTitle, label) {
    const section = findSection(sectionTitle);
    if (!section) {
      return "";
    }

    const labelNodes = Array.from(section.querySelectorAll("div, span, p"));
    const match = labelNodes.find((node) => normalize(node.textContent) === normalize(label));
    if (!match) {
      return "";
    }

    const wrapper = match.parentElement;
    if (!wrapper) {
      return "";
    }

    const valueNode = Array.from(wrapper.children).find((node) => {
      const text = String(node.textContent || "").trim();
      return node !== match && Boolean(text) && normalize(text) !== normalize(label);
    });

    return valueNode ? String(valueNode.textContent || "").trim() : "";
  }

  function readHeaderName() {
    const header = document.querySelector('[data-cy="CidadaoCabecalho.nome"]');
    if (!header) {
      return "";
    }

    const clone = header.cloneNode(true);
    clone.querySelectorAll("span").forEach((span) => span.remove());
    return String(clone.textContent || "").replace(/\s+/g, " ").trim();
  }

  function readHeaderBirthDate() {
    const node = document.querySelector('[data-cy="CidadaoCabecalho.nome"]')
      ?.closest("div.css-19b1bap")
      ?.querySelector("time");

    return node ? String(node.textContent || "").trim() : "";
  }

  function readHeaderPhone() {
    const labels = Array.from(document.querySelectorAll("span, p, div"));
    const label = labels.find((node) => normalize(node.textContent) === "telefone");
    if (!label) {
      return "";
    }

    const parent = label.parentElement;
    if (!parent) {
      return "";
    }

    const valueNode = Array.from(parent.children).find((node) => {
      return node !== label && String(node.textContent || "").trim();
    });

    return valueNode ? String(valueNode.textContent || "").trim() : "";
  }

  function splitMunicipioUf(value) {
    const text = String(value || "").trim();
    if (!text) {
      return { municipio: "", uf: "" };
    }

    const parts = text.split(" - ").map((part) => part.trim()).filter(Boolean);
    if (parts.length >= 2) {
      return { municipio: parts[0], uf: parts[1] };
    }

    return { municipio: text, uf: "" };
  }

  function extractEsusData() {
    const nascimentoMunicipio = splitMunicipioUf(readValueCard("Dados pessoais", "Municipio de nascimento"));
    const estadoResidencia = readValueCard("Residencia", "Estado");
    const municipioResidencia = readValueCard("Residencia", "Municipio");
    const telefoneContato =
      readValueCard("Contatos", "Telefone celular") ||
      readValueCard("Contatos", "Telefone de contato") ||
      readHeaderPhone();

    return {
      nome: readHeaderName(),
      nomeSocial: readValueCard("Dados pessoais", "Nome social"),
      nomeMae: readValueCard("Dados pessoais", "Nome da mae"),
      dataNascimento: readValueCard("Dados pessoais", "Data de nascimento") || readHeaderBirthDate(),
      cpf: readValueCard("Dados pessoais", "CPF"),
      cns: readValueCard("Dados pessoais", "CNS"),
      sexo: readValueCard("Dados pessoais", "Sexo"),
      telefone: telefoneContato,
      municipio: municipioResidencia || nascimentoMunicipio.municipio,
      uf: estadoResidencia || nascimentoMunicipio.uf,
      endereco: readValueCard("Residencia", "Logradouro"),
      numero: readValueCard("Residencia", "Numero"),
      bairro: readValueCard("Residencia", "Bairro"),
      cep: readValueCard("Residencia", "CEP"),
      complemento: readValueCard("Residencia", "Complemento"),
      unidadeResponsavel: readValueCard("Equipe de referencia", "Unidade de saude")
    };
  }

  function extractRegistrationData() {
    const data = extractEsusData();
    data.documentTitle = document.title;
    data.sourceUrl = window.location.href;
    return data;
  }

  function buildPreviewUrl(data) {
    const url = chrome.runtime.getURL("preview.html");
    const encoded = encodeURIComponent(JSON.stringify(data));
    return `${url}#data=${encoded}`;
  }

  function handleGenerateClick() {
    const data = extractRegistrationData();
    window.open(buildPreviewUrl(data), "_blank", "noopener,noreferrer");
  }

  function startObserver() {
    observer = new MutationObserver(() => {
      injectButton();
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  injectButton();
  startObserver();
})();
