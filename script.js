let allData = [];
let currentPage = 1;
const pageSize = 1;

async function loadData() {
  const [resCorrect, resWrong, resCorrect_SD, resWrong_SD, resCorrect_FLUX, resWrong_FLUX, resCorrect_FLite, resWrong_FLite] = await Promise.all([
    fetch('original_correct.json'),
    fetch('original_random.json'),
    fetch('Stable-Diffusion_correct.json'),
    fetch('Stable-Diffusion_random.json'),
    fetch('FLUX_correct.json'),
    fetch('FLUX_random.json'),
    fetch('F-Lite_correct.json'),
    fetch('F-Lite_random.json')
  ]);
  const dataCorrect = await resCorrect.json();
  const dataWrong = await resWrong.json();
  const dataCorrect_SD = await resCorrect_SD.json();
  const dataWrong_SD = await resWrong_SD.json();
  const dataCorrect_FLUX = await resCorrect_FLUX.json();
  const dataWrong_FLUX = await resWrong_FLUX.json();
  const dataCorrect_FLite = await resCorrect_FLite.json();
  const dataWrong_FLite = await resWrong_FLite.json();

  // Group by generator
  allData = {
    'Original': { correct: dataCorrect, random: dataWrong },
    'Stable-Diffusion': { correct: dataCorrect_SD, random: dataWrong_SD },
    'FLUX': { correct: dataCorrect_FLUX, random: dataWrong_FLUX },
    'F-Lite': { correct: dataCorrect_FLite, random: dataWrong_FLite }
  };

  // Only remaining selects
  ['prompt', 'artist', 'genre', 'style'].forEach(field => {
    populateSelect(field);
    document.getElementById(field + 'Select').addEventListener('change', () => {
      currentPage = 1;
      applyFilters();
    });
  });

  applyFilters();
}

function populateSelect(field) {
  const select = document.getElementById(field + 'Select');
  select.innerHTML = '<option value="all">All</option>';
  // Combine all arrays from generators to get all possible values
  let values = [];
  Object.values(allData).forEach(group => {
    values = values.concat(group.correct.map(d => d[field]), group.random.map(d => d[field]));
  });
  values = Array.from(new Set(values)).sort();
  values.forEach(v => {
    const option = document.createElement('option');
    option.value = v;
    option.textContent = v;
    if (field === 'prompt' && v === 'Correct Painter') {
      option.selected = true;
    }
    select.appendChild(option);
  });
}

function applyFilters() {
  const prompt = document.getElementById('promptSelect').value;
  const artist = document.getElementById('artistSelect').value;
  const genre = document.getElementById('genreSelect').value;
  const style = document.getElementById('styleSelect').value;

  // Determine if showing correct or random
  let promptType = 'correct';
  if (prompt === 'Incorrect Painter') promptType = 'random';

  // For each generator, filter its corresponding array
  const filteredByGenerator = {};
  let minLength = Infinity;
  Object.entries(allData).forEach(([generator, group]) => {
    let arr = group[promptType];
    if (prompt !== 'all') arr = arr.filter(d => d.prompt === prompt);
    if (artist !== 'all') arr = arr.filter(d => d.artist === artist);
    if (genre !== 'all') arr = arr.filter(d => d.genre === genre);
    if (style !== 'all') arr = arr.filter(d => d.style === style);
    filteredByGenerator[generator] = arr;
    if (arr.length < minLength) minLength = arr.length;
  });

  displayImagesByPosition(filteredByGenerator, minLength);
}

function getColorSquare(result) {
  if (result === 'correct') {
    return `<span style="color: green; font-weight: bold; font-size: 22px; vertical-align: middle;">✅</span>`;
  } else if (result === 'wrong') {
    return `<span style="color: red; font-weight: bold; font-size: 22px; vertical-align: middle;">❌</span>`;
  }
  return '';
}

function displayImagesByPosition(filteredByGenerator, minLength) {
  const container = document.getElementById('imageContainer');
  container.innerHTML = '';

  if (minLength === 0) {
    container.textContent = 'No images found for selected filters.';
    document.getElementById('paginationContainer').innerHTML = '';
    return;
  }

  const totalPages = Math.ceil(minLength / pageSize);
  if (currentPage > totalPages) currentPage = 1;

  const start = (currentPage - 1) * pageSize;
  const end = Math.min(start + pageSize, minLength);

  // Fixed generator order
  const generatorOrder = ['Original', 'Stable-Diffusion', 'FLUX', 'F-Lite'];

  for (let i = start; i < end; i++) {
    // 1. Highlighted block for the first generator (Original)
    const firstGenerator = generatorOrder[0];
    const arrFirst = filteredByGenerator[firstGenerator];
    if (arrFirst && arrFirst[i]) {
      const generatorContainer = document.createElement('div');
      generatorContainer.className = 'generator-block';
      generatorContainer.style.display = 'flex';
      generatorContainer.style.flexDirection = 'column';
      generatorContainer.style.alignItems = 'center';
      generatorContainer.style.marginBottom = '32px';

      // Title: full model name
      let fullName = arrFirst[i].generator || firstGenerator;
      const groupTitle = document.createElement('h2');
      groupTitle.textContent = fullName;
      groupTitle.style.textAlign = 'center';
      groupTitle.style.margin = '32px 0 12px 0';
      groupTitle.style.color = '#4e6edb';
      generatorContainer.appendChild(groupTitle);
      // Full image block (with details)
      const parentDiv = renderImageBox(arrFirst[i]);
      generatorContainer.appendChild(parentDiv);
      container.appendChild(generatorContainer);
    }

    // 2. The rest in a grid
    // Add title above the grid
    const gridTitle = document.createElement('h3');
    gridTitle.textContent = 'Generated versions';
    gridTitle.style.textAlign = 'center';
    gridTitle.style.margin = '24px 0 12px 0';
    gridTitle.style.color = '#4e6edb';
    container.appendChild(gridTitle);

    const gridContainer = document.createElement('div');
    gridContainer.className = 'generators-grid';
    gridContainer.style.display = 'grid';
    gridContainer.style.gridTemplateColumns = 'repeat(auto-fit, minmax(260px, 1fr))';
    gridContainer.style.gap = '32px';
    gridContainer.style.width = '100%';
    gridContainer.style.margin = '0 auto 32px auto';
    gridContainer.style.justifyItems = 'center';

    // For the VLM Results table
    const vlmResults = [];
    let analyserNames = [];

    for (let g = 1; g < generatorOrder.length; g++) {
      const generator = generatorOrder[g];
      const arr = filteredByGenerator[generator];
      if (arr && arr[i]) {
        // Simple grid block
        const gridBlock = document.createElement('div');
        gridBlock.className = 'generator-grid-block';
        gridBlock.style.display = 'flex';
        gridBlock.style.flexDirection = 'column';
        gridBlock.style.alignItems = 'center';
        gridBlock.style.background = '#f8fafc';
        gridBlock.style.borderRadius = '16px';
        gridBlock.style.boxShadow = '0 2px 8px rgba(60,60,120,0.07)';
        gridBlock.style.padding = '18px 10px 18px 10px';
        gridBlock.style.width = '100%';
        gridBlock.style.maxWidth = '340px';

        // Only full model name and image
        let fullName = arr[i].generator || generator;
        const name = document.createElement('h3');
        name.textContent = fullName;
        name.style.textAlign = 'center';
        name.style.margin = '0 0 12px 0';
        name.style.color = '#4e6edb';
        gridBlock.appendChild(name);

        const img = document.createElement('img');
        img.src = arr[i].image;
        img.alt = generator + ' image';
        img.style.width = '100%';
        img.style.height = 'auto';
        img.style.maxHeight = '40vh';
        img.style.objectFit = 'contain';
        img.style.borderRadius = '12px';
        img.style.background = '#e7eaf3';
        img.style.boxShadow = '0 2px 12px rgba(60,60,120,0.10)';
        img.addEventListener('click', () => showImageModal(img.src, fullName));
        img.style.cursor = 'zoom-in';
        gridBlock.appendChild(img);

        gridContainer.appendChild(gridBlock);

        // For the VLM Results table
        vlmResults.push({
          generator: fullName,
          analysers: [arr[i].analyser1, arr[i].analyser2, arr[i].analyser3, arr[i].analyser4, arr[i].analyser5, arr[i].analyser6],
          results: [arr[i].result1, arr[i].result2, arr[i].result3, arr[i].result4, arr[i].result5, arr[i].result6]
        });
        if (analyserNames.length === 0) {
          analyserNames = [arr[i].analyser1, arr[i].analyser2, arr[i].analyser3, arr[i].analyser4, arr[i].analyser5, arr[i].analyser6];
        }
      }
    }
    container.appendChild(gridContainer);

    // 3. VLM Results table for all generators on the page
    if (vlmResults.length > 0) {
      // Always include 'Original' as the first row if available
      const originalGenerator = 'Original';
      let originalRow = null;
      for (let g = 0; g < generatorOrder.length; g++) {
        if (generatorOrder[g] === originalGenerator) {
          const arr = filteredByGenerator[originalGenerator];
          if (arr && arr[i]) {
            let fullName = arr[i].generator || originalGenerator;
            let results = [arr[i].result1, arr[i].result2, arr[i].result3, arr[i].result4, arr[i].result5, arr[i].result6];
            originalRow = {
              generator: fullName,
              results: results
            };
          }
        }
      }
      // Build table rows: start with Original, then the rest (skip duplicate if already included)
      let tableRows = [];
      if (originalRow) tableRows.push(originalRow);
      vlmResults.forEach(row => {
        if (!originalRow || row.generator !== originalRow.generator) {
          tableRows.push(row);
        }
      });

      // Title and info icon
      const tableTitleWrapper = document.createElement('div');
      tableTitleWrapper.style.display = 'flex';
      tableTitleWrapper.style.justifyContent = 'center';
      tableTitleWrapper.style.alignItems = 'center';
      tableTitleWrapper.style.gap = '10px';
      tableTitleWrapper.style.margin = '24px 0 12px 0';

      const tableTitle = document.createElement('h3');
      tableTitle.textContent = 'VLM Results';
      tableTitle.style.textAlign = 'center';
      tableTitle.style.margin = '0';
      tableTitle.style.color = '#4e6edb';
      tableTitleWrapper.appendChild(tableTitle);

      // Info icon (inline, not a button)
      const infoIcon = document.createElement('span');
      infoIcon.textContent = 'ℹ️';
      infoIcon.style.fontSize = '18px';
      infoIcon.style.color = '#4e6edb';
      infoIcon.style.cursor = 'help';
      infoIcon.style.margin = '0';
      infoIcon.style.position = 'relative';
      infoIcon.setAttribute('tabindex', '0');
      infoIcon.setAttribute('aria-label', 'Info');

      // Tooltip
      const tooltip = document.createElement('div');
      tooltip.textContent = 'These results represent whether the model correctly (tick) or incorrectly (cross) identified if the artwork (or its version) belongs to the indicated author.';
      tooltip.style.position = 'absolute';
      tooltip.style.bottom = '120%';
      tooltip.style.left = '50%';
      tooltip.style.transform = 'translateX(-50%)';
      tooltip.style.background = '#222';
      tooltip.style.color = '#fff';
      tooltip.style.padding = '8px 14px';
      tooltip.style.borderRadius = '8px';
      tooltip.style.fontSize = '14px';
      tooltip.style.whiteSpace = 'pre-line';
      tooltip.style.boxShadow = '0 2px 8px rgba(0,0,0,0.18)';
      tooltip.style.zIndex = '10000';
      tooltip.style.display = 'none';
      tooltip.style.pointerEvents = 'none';
      tooltip.style.maxWidth = '420px';
      tooltip.style.minWidth = '260px';

      infoIcon.addEventListener('mouseenter', () => {
        tooltip.style.display = 'block';
      });
      infoIcon.addEventListener('mouseleave', () => {
        tooltip.style.display = 'none';
      });
      infoIcon.addEventListener('focus', () => {
        tooltip.style.display = 'block';
      });
      infoIcon.addEventListener('blur', () => {
        tooltip.style.display = 'none';
      });
      infoIcon.appendChild(tooltip);
      tableTitleWrapper.appendChild(infoIcon);
      container.appendChild(tableTitleWrapper);

      const tableDiv = document.createElement('div');
      tableDiv.style.width = '100%';
      tableDiv.style.overflowX = 'auto';
      tableDiv.style.margin = '0 0 0 0';
      tableDiv.style.display = 'flex';
      tableDiv.style.justifyContent = 'center';

      const table = document.createElement('table');
      table.style.borderCollapse = 'collapse';
      table.style.fontSize = '20px';
      table.style.background = '#f8fafc';
      table.style.boxShadow = '0 2px 8px rgba(60,60,120,0.07)';
      table.style.borderRadius = '12px';
      table.style.margin = '0 auto';
      table.style.minWidth = '480px';

      // Table header
      const thead = document.createElement('thead');
      const headRow = document.createElement('tr');
      const thGen = document.createElement('th');
      thGen.textContent = 'Generator';
      thGen.style.padding = '10px 12px';
      thGen.style.textAlign = 'center';
      thGen.style.background = '#e0e7ef';
      thGen.style.fontWeight = 'bold';
      headRow.appendChild(thGen);
      analyserNames.forEach(analyser => {
        const th = document.createElement('th');
        th.textContent = analyser;
        th.style.padding = '10px 12px';
        th.style.textAlign = 'center';
        th.style.background = '#e0e7ef';
        th.style.fontWeight = 'bold';
        headRow.appendChild(th);
      });
      thead.appendChild(headRow);
      table.appendChild(thead);

      // Table body
      const tbody = document.createElement('tbody');
      tableRows.forEach(row => {
        const tr = document.createElement('tr');
        const tdGen = document.createElement('td');
        tdGen.textContent = row.generator;
        tdGen.style.padding = '8px 10px';
        tdGen.style.textAlign = 'center';
        tdGen.style.fontWeight = 'bold';
        tr.appendChild(tdGen);
        row.results.forEach(result => {
          const td = document.createElement('td');
          td.style.padding = '8px 10px';
          td.style.textAlign = 'center';
          td.innerHTML = getColorSquare(result);
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      tableDiv.appendChild(table);
      container.appendChild(tableDiv);
    }
  }

  renderPagination(totalPages);
}

// Modal logic for showing large image
function showImageModal(imageSrc, altText) {
  // Remove any existing modal
  const existingModal = document.getElementById('image-modal-overlay');
  if (existingModal) existingModal.remove();

  // Create overlay
  const overlay = document.createElement('div');
  overlay.id = 'image-modal-overlay';
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100vw';
  overlay.style.height = '100vh';
  overlay.style.background = 'rgba(0,0,0,0.75)';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.zIndex = '9999';
  overlay.style.cursor = 'zoom-out';

  // Create image
  const img = document.createElement('img');
  img.src = imageSrc;
  img.alt = altText || '';
  img.style.maxWidth = '90vw';
  img.style.maxHeight = '90vh';
  img.style.borderRadius = '16px';
  img.style.boxShadow = '0 4px 32px rgba(0,0,0,0.25)';
  img.style.background = '#fff';
  img.style.cursor = 'auto';

  // Prevent click on image from closing modal
  img.addEventListener('click', e => e.stopPropagation());

  // Close modal on overlay click
  overlay.addEventListener('click', () => overlay.remove());

  // Close modal on Escape key
  function escListener(e) {
    if (e.key === 'Escape') {
      overlay.remove();
      document.removeEventListener('keydown', escListener);
    }
  }
  document.addEventListener('keydown', escListener);

  overlay.appendChild(img);
  document.body.appendChild(overlay);
}

// Extract image rendering to a function
function renderImageBox(item) {
  let promptText = '';
  if (item.prompt === 'Correct Painter') {
    promptText = `Is this a real painting from ${item.artist}? Please answer only yes or no.`;
  } else if (item.prompt === 'Incorrect Painter') {
    promptText = 'Is this a real painting from {Random Artist}? Please answer only yes or no.';
  } else {
    promptText = `${item.prompt}`;
  }
  const pGenerator = document.createElement('p');
  pGenerator.innerText = `Prompt: ${promptText}`;
  pGenerator.style.textAlign = 'center';
  const img = document.createElement('img');
  img.src = item.image;
  img.alt = item.generator || '';
  img.style.width = '100%';
  img.style.height = 'auto';
  img.style.maxHeight = '65vh';
  img.style.objectFit = 'contain';
  img.style.borderRadius = '12px';
  img.style.background = '#e7eaf3';
  img.style.boxShadow = '0 2px 12px rgba(60,60,120,0.10)';
  // Add click event to show modal
  img.style.cursor = 'zoom-in';
  img.addEventListener('click', () => showImageModal(item.image, item.generator || ''));
  const p = document.createElement('div');

  const table1 = `
    <table style="border-collapse: collapse; margin-bottom: 8px; font-size: 22px; width: 100%;">
      <tbody>
        <tr>
          <th style="padding: 8px 4px; text-align: left; width: 120px; font-weight: bold;">Painter</th>
          <td style="padding: 8px 4px; text-align: left; font-weight: normal;">${item.artist}</td>
        </tr>
        <tr>
          <th style="padding: 8px 4px; text-align: left; font-weight: bold;">Genre</th>
          <td style="padding: 8px 4px; text-align: left; font-weight: normal;">${item.genre}</td>
        </tr>
        <tr>
          <th style="padding: 8px 4px; text-align: left; font-weight: bold;">Style</th>
          <td style="padding: 8px 4px; text-align: left; font-weight: normal;">${item.style}</td>
        </tr>
      </tbody>
    </table>
  `;

  // Build VLM results table rows for the current item only
  const analysers = [item.analyser1, item.analyser2, item.analyser3, item.analyser4, item.analyser5, item.analyser6];
  const results = [item.result1, item.result2, item.result3, item.result4, item.result5, item.result6];
  let rowsHtml = '';
  for (let i = 0; i < analysers.length; i++) {
    rowsHtml += `
      <tr>
        <td style="padding: 4px; font-weight: bold; text-align: center;">${analysers[i]}</td>
        <td style="padding: 4px;"></td>
        <td style="padding: 4px; font-weight: bold; text-align: center;">${getColorSquare(results[i])}</td>
        <td style="padding: 4px;"></td>
      </tr>
    `;
  }

  const table2 = `
    <div style="display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 20px;">
      <h3 style="text-align: center; font-size: 24px; color: #4e6edb; margin: 0;">VLM results</h3>
      <span class="vlm-info-icon" tabindex="0" aria-label="Info" style="font-size: 18px; color: #4e6edb; cursor: help; position: relative; margin: 0; display: inline-block;">ℹ️
        <span class="vlm-tooltip" style="position: absolute; bottom: 120%; left: 50%; transform: translateX(-50%); background: #222; color: #fff; padding: 8px 14px; border-radius: 8px; font-size: 14px; white-space: pre-line; box-shadow: 0 2px 8px rgba(0,0,0,0.18); z-index: 10000; display: none; pointer-events: none; max-width: 420px; min-width: 260px;">These results represent whether the model correctly (tick) or incorrectly (cross) identified if the artwork (or its version) belongs to the indicated author.</span>
      </span>
    </div>
    <table style="border-collapse: collapse; margin-bottom: 8px; font-size: 22px; width: 100%;">
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
  `;

  // Add tooltip show/hide logic for the info icon
  setTimeout(() => {
    const infoIcon = p.querySelector('.vlm-info-icon');
    const tooltip = p.querySelector('.vlm-tooltip');
    if (infoIcon && tooltip) {
      infoIcon.addEventListener('mouseenter', () => { tooltip.style.display = 'block'; });
      infoIcon.addEventListener('mouseleave', () => { tooltip.style.display = 'none'; });
      infoIcon.addEventListener('focus', () => { tooltip.style.display = 'block'; });
      infoIcon.addEventListener('blur', () => { tooltip.style.display = 'none'; });
    }
  }, 0);

  const pTable1 = document.createElement('div');
  pTable1.innerHTML = table1;

  p.innerHTML = table2;

  const parentDiv = document.createElement('div');
  parentDiv.className = 'image-box';
  parentDiv.style.alignItems = 'center';

  // First column: data table
  const group1 = document.createElement('div');
  group1.style.display = 'flex';
  group1.style.flexDirection = 'column';
  group1.appendChild(pTable1);
  group1.style.flex = '0 0 auto';
  group1.style.alignItems = 'center';
  group1.style.flex = '1 1 0';

  // Second column: image and prompt
  const group_img = document.createElement('div');
  group_img.style.display = 'flex';
  group_img.style.flexDirection = 'column';
  group_img.appendChild(pGenerator);
  group_img.appendChild(img);
  group_img.style.flex = '0 0 auto';
  group_img.style.alignItems = 'center';
  group_img.style.flex = '6 1 0';

  // Third column: results table
  const group2 = document.createElement('div');
  group2.appendChild(p);
  group2.style.alignItems = 'center';
  group2.style.flex = '1 1 0';

  group1.style.flex = '1';
  group2.style.flex = '3';
  group_img.style.flex = '8';

  parentDiv.appendChild(group1);
  parentDiv.appendChild(group_img);
  parentDiv.appendChild(group2);

  return parentDiv;
}

function renderPagination(totalPages) {
  const container = document.getElementById('paginationContainer');
  container.innerHTML = '';

  const prevBtn = document.createElement('button');
  prevBtn.textContent = 'Previous';
  prevBtn.disabled = currentPage === 1;
  prevBtn.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      applyFilters();
    }
  });
  container.appendChild(prevBtn);

  const pageButtonsToShow = 9;
  let startPage = Math.max(1, currentPage - Math.floor(pageButtonsToShow / 2));
  let endPage = startPage + pageButtonsToShow - 1;
  if (endPage > totalPages) {
    endPage = totalPages;
    startPage = Math.max(1, endPage - pageButtonsToShow + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    btn.disabled = i === currentPage;
    btn.addEventListener('click', () => {
      currentPage = i;
      applyFilters();
    });
    container.appendChild(btn);
  }

  const nextBtn = document.createElement('button');
  nextBtn.textContent = 'Next';
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.addEventListener('click', () => {
    if (currentPage < totalPages) {
      currentPage++;
      applyFilters();
    }
  });
  container.appendChild(nextBtn);

  const infoSpan = document.createElement('span');
  infoSpan.style.marginLeft = '10px';
  infoSpan.textContent = `Total ${totalPages} pages, current page ${currentPage}`;
  container.appendChild(infoSpan);

  const input = document.createElement('input');
  input.type = 'number';
  input.min = 1;
  input.max = totalPages;
  input.placeholder = 'Go to';
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const val = Number(input.value);
      if (val >= 1 && val <= totalPages) {
        currentPage = val;
        applyFilters();
        input.value = '';
      } else {
        alert(`Please enter a number between 1 and ${totalPages}`);
      }
    }
  });
  container.appendChild(input);
}

loadData(); 