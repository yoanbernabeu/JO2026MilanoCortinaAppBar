(function () {
  'use strict';

  const JO_START = '2026-02-06';
  const JO_END = '2026-02-22';
  const SCHEDULE_START = '2026-02-04';
  const SCHEDULE_END = '2026-02-22';

  const CHEVRON_SVG = '<svg class="expand-chevron" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 4l4 4-4 4"/></svg>';

  // State
  let currentTab = 'medals';
  let scheduleDate = getTodayOrDefault();
  let showFinished = false;
  let medalsData = null;
  let medallistsData = null;
  let scheduleData = null;

  // DOM refs
  const $offSeason = document.getElementById('off-season');
  const $offSeasonText = document.getElementById('off-season-text');
  const $mainApp = document.getElementById('main-app');
  const $loading = document.getElementById('loading');
  const $content = document.getElementById('content');
  const $lastUpdate = document.getElementById('last-update');
  const $btnRefresh = document.getElementById('btn-refresh');

  // --- Init ---
  init();

  async function init() {
    const period = getJOPeriod();

    if (period === 'before') {
      $loading.style.display = 'none';
      $offSeasonText.textContent = 'Les Jeux Olympiques d\'hiver 2026 d\u00e9butent le 6 f\u00e9vrier \u00e0 Milano Cortina \u2744\uFE0F';
      $offSeason.style.display = 'flex';
      return;
    }

    if (period === 'after') {
      $loading.style.display = 'none';
      $offSeasonText.textContent = 'Les Jeux Olympiques d\'hiver 2026 sont termin\u00e9s \u2014 Rendez-vous en 2030 !';
      $offSeason.style.display = 'flex';
      return;
    }

    // During JO
    setupTabs();
    setupFooter();
    setupAutoRefreshListener();

    await loadInitialData();

    $loading.style.display = 'none';
    $mainApp.style.display = 'flex';

    renderCurrentTab();
  }

  function getJOPeriod() {
    const today = getToday();
    if (today < JO_START) return 'before';
    if (today > JO_END) return 'after';
    return 'during';
  }

  function getToday() {
    return new Date().toISOString().slice(0, 10);
  }

  function getTodayOrDefault() {
    const today = getToday();
    if (today >= SCHEDULE_START && today <= SCHEDULE_END) return today;
    if (today < SCHEDULE_START) return SCHEDULE_START;
    return SCHEDULE_END;
  }

  // --- Tabs ---
  function setupTabs() {
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;
        if (tabName === currentTab) return;
        currentTab = tabName;
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.getElementById('view-' + tabName).classList.add('active');
        renderCurrentTab();
      });
    });
  }

  function renderCurrentTab() {
    switch (currentTab) {
      case 'medals': renderMedals(); break;
      case 'schedule': renderSchedule(); break;
      case 'medallists': renderMedallists(); break;
      case 'settings': renderSettings(); break;
    }
  }

  // --- Footer ---
  function setupFooter() {
    $btnRefresh.addEventListener('click', async () => {
      $btnRefresh.disabled = true;
      $btnRefresh.textContent = '\uD83D\uDD04 Actualisation...';
      try {
        await window.jo2026.refresh();
        await loadInitialData();
        renderCurrentTab();
        updateLastUpdate();
      } catch (e) {
        console.error('Refresh error:', e);
      } finally {
        $btnRefresh.textContent = '\uD83D\uDD04 Actualiser';
        setTimeout(() => { $btnRefresh.disabled = false; }, 3000);
      }
    });
  }

  async function updateLastUpdate() {
    try {
      const ts = await window.jo2026.getLastUpdate();
      if (ts) {
        const d = new Date(ts);
        $lastUpdate.textContent = 'MAJ ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      }
    } catch (_) {}
  }

  // --- Auto-refresh listener ---
  function setupAutoRefreshListener() {
    window.jo2026.onDataUpdated(async () => {
      await loadInitialData();
      renderCurrentTab();
      updateLastUpdate();
    });
  }

  // --- Data loading ---
  async function loadInitialData() {
    try {
      const [medals, medallists, schedule] = await Promise.all([
        window.jo2026.getMedals(),
        window.jo2026.getMedallists(),
        window.jo2026.getDailySchedule(scheduleDate)
      ]);
      if (!medals.error) medalsData = medals;
      if (!medallists.error) medallistsData = medallists;
      if (!schedule.error) scheduleData = schedule;
      updateLastUpdate();
    } catch (e) {
      console.error('Load data error:', e);
    }
  }

  // --- MEDALS VIEW ---
  function renderMedals() {
    const view = document.getElementById('view-medals');

    if (!medalsData || !medalsData.medalStandings) {
      view.innerHTML = renderEmpty('Aucune donn\u00e9e de m\u00e9dailles disponible');
      return;
    }

    const table = medalsData.medalStandings.medalsTable || [];
    if (table.length === 0) {
      view.innerHTML = renderEmpty('Aucune m\u00e9daille distribu\u00e9e pour le moment', '\uD83C\uDFC5');
      return;
    }

    let html = '<table class="medals-table"><thead><tr>';
    html += '<th>#</th><th>Pays</th><th>\uD83E\uDD47</th><th>\uD83E\uDD48</th><th>\uD83E\uDD49</th><th>Total</th>';
    html += '</tr></thead><tbody>';

    table.forEach((entry) => {
      const id = 'medal-detail-' + entry.organisation;
      const totals = (entry.medalsNumber || []).find(m => m.type === 'Total') || {};
      const gold = totals.gold ?? entry.gold ?? 0;
      const silver = totals.silver ?? entry.silver ?? 0;
      const bronze = totals.bronze ?? entry.bronze ?? 0;
      const total = totals.total ?? entry.total ?? 0;
      const countryName = entry.description || entry.organisationName || entry.organisation;
      const rank = entry.rank;

      html += '<tr class="medal-row" data-detail="' + id + '">';
      html += '<td>' + renderRankBadge(rank) + '</td>';
      const flag = countryFlag(entry.organisation);
      html += '<td>' + flag + ' ' + escapeHtml(countryName) + ' <span class="country-code">' + entry.organisation + '</span></td>';
      html += '<td>' + gold + '</td>';
      html += '<td>' + silver + '</td>';
      html += '<td>' + bronze + '</td>';
      html += '<td class="total">' + total + '</td>';
      html += '</tr>';

      // Detail row
      html += '<tr class="medal-detail" id="' + id + '"><td colspan="6"><div class="medal-detail-content">';
      if (entry.disciplines && entry.disciplines.length > 0) {
        entry.disciplines.forEach(d => {
          html += '<div class="discipline-row">';
          html += '<span class="discipline-name">' + escapeHtml(d.name) + '</span>';
          html += '<span class="discipline-medals">';
          html += '<span>\uD83E\uDD47 ' + d.gold + '</span>';
          html += '<span>\uD83E\uDD48 ' + d.silver + '</span>';
          html += '<span>\uD83E\uDD49 ' + d.bronze + '</span>';
          html += '</span></div>';
        });
      } else {
        html += '<div style="color:var(--text-muted);font-size:11px;padding:4px 0">Aucun d\u00e9tail par discipline</div>';
      }
      html += '</div></td></tr>';
    });

    html += '</tbody></table>';
    view.innerHTML = html;

    // Toggle detail
    view.querySelectorAll('.medal-row').forEach(row => {
      row.addEventListener('click', () => {
        const detailId = row.dataset.detail;
        const detail = document.getElementById(detailId);
        const isOpen = detail.classList.toggle('open');
        row.classList.toggle('expanded', isOpen);
      });
    });
  }

  function renderRankBadge(rank) {
    if (rank <= 3) {
      return '<span class="rank-badge rank-' + rank + '">' + rank + '</span>';
    }
    return '<span class="rank-other">' + rank + '</span>';
  }

  // --- SCHEDULE VIEW ---
  function renderSchedule() {
    const view = document.getElementById('view-schedule');
    const today = getToday();
    const isToday = scheduleDate === today;
    const todayInRange = today >= SCHEDULE_START && today <= SCHEDULE_END;

    let html = '<div class="schedule-nav">';
    html += '<button id="schedule-prev" title="Jour pr\u00e9c\u00e9dent">\u25C0</button>';
    html += '<span class="schedule-date">' + formatDateFR(scheduleDate) + '</span>';
    html += '<button id="schedule-next" title="Jour suivant">\u25B6</button>';
    if (todayInRange) {
      html += '<button class="btn-today" id="btn-today"' + (isToday ? ' disabled' : '') + ">Auj.</button>";
    }
    html += '</div>';
    html += '<div class="schedule-filter-bar">';
    html += '<button class="filter-chip' + (showFinished ? ' active' : '') + '" id="btn-show-finished">Termin\u00e9s</button>';
    html += '</div>';
    html += '<div id="schedule-list"></div>';

    view.innerHTML = html;

    // Nav buttons
    document.getElementById('schedule-prev').disabled = (scheduleDate <= SCHEDULE_START);
    document.getElementById('schedule-next').disabled = (scheduleDate >= SCHEDULE_END);

    document.getElementById('schedule-prev').addEventListener('click', () => {
      scheduleDate = addDays(scheduleDate, -1);
      loadScheduleAndRender();
    });

    document.getElementById('schedule-next').addEventListener('click', () => {
      scheduleDate = addDays(scheduleDate, 1);
      loadScheduleAndRender();
    });

    const btnToday = document.getElementById('btn-today');
    if (btnToday) {
      btnToday.addEventListener('click', () => {
        scheduleDate = today;
        loadScheduleAndRender();
      });
    }

    document.getElementById('btn-show-finished').addEventListener('click', () => {
      showFinished = !showFinished;
      document.getElementById('btn-show-finished').classList.toggle('active', showFinished);
      renderScheduleList();
    });

    renderScheduleList();
  }

  async function loadScheduleAndRender() {
    const view = document.getElementById('view-schedule');
    const navDate = view.querySelector('.schedule-date');
    const prevBtn = document.getElementById('schedule-prev');
    const nextBtn = document.getElementById('schedule-next');
    const btnToday = document.getElementById('btn-today');
    const today = getToday();

    navDate.textContent = formatDateFR(scheduleDate);
    prevBtn.disabled = (scheduleDate <= SCHEDULE_START);
    nextBtn.disabled = (scheduleDate >= SCHEDULE_END);
    if (btnToday) btnToday.disabled = (scheduleDate === today);

    try {
      scheduleData = await window.jo2026.getDailySchedule(scheduleDate);
    } catch (e) {
      console.error('Schedule load error:', e);
    }
    renderScheduleList();
  }

  function renderScheduleList() {
    const list = document.getElementById('schedule-list');

    if (!scheduleData || !scheduleData.units || scheduleData.units.length === 0) {
      list.innerHTML = renderEmpty('Aucun \u00e9v\u00e9nement ce jour', '\uD83D\uDCC5');
      return;
    }

    // Filter units whose local date (Europe/Rome) matches the selected schedule date
    // The API may return UTC dates that fall on a different day in CET
    const allUnits = [...scheduleData.units].filter(u => {
      if (!u.startDate) return true;
      const localDate = new Date(u.startDate).toLocaleDateString('sv-SE', { timeZone: 'Europe/Rome' });
      return localDate === scheduleDate;
    });
    const liveAndScheduled = allUnits
      .filter(u => u.status !== 'FINISHED')
      .sort((a, b) => {
        const aRunning = a.status === 'RUNNING' ? 0 : 1;
        const bRunning = b.status === 'RUNNING' ? 0 : 1;
        if (aRunning !== bRunning) return aRunning - bRunning;
        return (a.startDate || '').localeCompare(b.startDate || '');
      });

    const finished = allUnits
      .filter(u => u.status === 'FINISHED')
      .sort((a, b) => (b.startDate || '').localeCompare(a.startDate || ''));

    if (liveAndScheduled.length === 0 && !showFinished) {
      let html = renderEmpty('Tous les \u00e9v\u00e9nements sont termin\u00e9s', '\u2705');
      html += '<div style="text-align:center;margin-top:-20px">';
      html += '<button class="filter-chip-inline" id="btn-show-finished-inline">Voir les ' + finished.length + ' termin\u00e9s</button>';
      html += '</div>';
      list.innerHTML = html;
      document.getElementById('btn-show-finished-inline').addEventListener('click', () => {
        showFinished = true;
        document.getElementById('btn-show-finished').classList.add('active');
        renderScheduleList();
      });
      return;
    }

    let html = '';
    let idx = 0;

    // Live & scheduled
    liveAndScheduled.forEach((unit) => {
      html += renderScheduleUnit(unit, idx++);
    });

    // Finished section
    if (showFinished && finished.length > 0) {
      html += '<div class="schedule-section-header">Termin\u00e9s &middot; ' + finished.length + '</div>';
      finished.forEach((unit) => {
        html += renderScheduleUnit(unit, idx++, true);
      });
    }

    list.innerHTML = html;

    // Toggle details
    list.querySelectorAll('.schedule-unit').forEach(el => {
      el.addEventListener('click', () => {
        const id = el.dataset.unitIdx;
        const detail = document.getElementById('unit-detail-' + id);
        const isOpen = detail.classList.toggle('open');
        el.classList.toggle('expanded', isOpen);
      });
    });
  }

  function renderScheduleUnit(unit, idx, isFinished) {
    const isMedal = unit.medalEvent === true;
    const isRunning = unit.status === 'RUNNING';
    const statusClass = getStatusClass(unit.status);
    const statusLabel = getStatusLabel(unit.status);
    const time = formatTime(unit.startDate);
    const delay = Math.min(idx * 25, 250);

    let classes = 'schedule-unit';
    if (isRunning) classes += ' running-event';
    if (isMedal) classes += ' medal-event';
    if (isFinished) classes += ' finished-event';

    let html = '<div class="' + classes + '" data-unit-idx="' + idx + '" style="animation-delay:' + delay + 'ms">';
    html += '<div class="unit-summary">';
    html += '<span class="unit-time">' + time + '</span>';
    html += '<div class="unit-info">';
    html += '<div class="unit-discipline">' + escapeHtml(unit.disciplineName || '') + '</div>';
    html += '<div class="unit-event">' + escapeHtml(unit.eventUnitName || unit.eventName || '') + '</div>';
    html += '</div>';
    html += '<div class="unit-badge">';
    if (isMedal) html += '<span class="badge-medal">\uD83C\uDFC5</span>';
    html += '<span class="badge-status ' + statusClass + '">' + statusLabel + '</span>';
    html += CHEVRON_SVG;
    html += '</div></div>';

    // Detail + results for finished medal events
    html += '<div class="unit-detail" id="unit-detail-' + idx + '">';
    if (unit.venueDescription) {
      html += '<div class="unit-detail-row"><strong>Lieu :</strong> ' + escapeHtml(unit.venueDescription) + '</div>';
    }
    html += '<div class="unit-detail-row"><strong>D\u00e9but :</strong> ' + formatDateTime(unit.startDate) + '</div>';
    if (unit.endDate && !unit.hideEndDate) {
      html += '<div class="unit-detail-row"><strong>Fin :</strong> ' + formatDateTime(unit.endDate) + '</div>';
    }
    if (unit.phaseName) {
      html += '<div class="unit-detail-row"><strong>Phase :</strong> ' + escapeHtml(unit.phaseName) + '</div>';
    }

    // Show medallists for finished medal events
    if (isFinished && isMedal && medallistsData && medallistsData.athletes) {
      const results = findMedallists(unit);
      if (results.length > 0) {
        html += '<div class="unit-results">';
        html += '<div class="unit-results-title">R\u00e9sultats</div>';
        results.forEach(r => {
          html += '<div class="unit-result-row">';
          html += '<span class="unit-result-medal">' + getMedalEmoji(r.medalType) + '</span>';
          html += '<span class="unit-result-name">' + countryFlag(r.country) + ' ' + escapeHtml(r.name) + '</span>';
          html += '<span class="unit-result-country">' + escapeHtml(r.country) + '</span>';
          html += '</div>';
        });
        html += '</div>';
      }
    }

    html += '</div></div>';
    return html;
  }

  function findMedallists(unit) {
    if (!medallistsData || !medallistsData.athletes) return [];
    const results = [];
    const eventName = (unit.eventUnitName || unit.eventName || '').toLowerCase();
    const discipline = (unit.disciplineName || '').toLowerCase();

    medallistsData.athletes.forEach(a => {
      (a.medals || []).forEach(m => {
        const mEvent = (m.eventName || '').toLowerCase();
        const mDisc = (m.disciplineName || '').toLowerCase();
        if (mDisc === discipline && (mEvent === eventName || eventName.includes(mEvent) || mEvent.includes(eventName))) {
          results.push({
            name: a.tvName || a.fullName,
            country: a.organisation,
            medalType: m.medalType
          });
        }
      });
    });

    const medalOrder = { 'ME_GOLD': 0, 'ME_SILVER': 1, 'ME_BRONZE': 2 };
    results.sort((a, b) => (medalOrder[a.medalType] ?? 3) - (medalOrder[b.medalType] ?? 3));
    return results;
  }

  // --- MEDALLISTS VIEW ---
  function renderMedallists() {
    const view = document.getElementById('view-medallists');

    if (!medallistsData || !medallistsData.athletes) {
      view.innerHTML = renderEmpty('Aucune donn\u00e9e de m\u00e9daill\u00e9s disponible');
      return;
    }

    const athletes = medallistsData.athletes || [];
    if (athletes.length === 0) {
      view.innerHTML = renderEmpty('Aucun m\u00e9daill\u00e9 pour le moment', '\uD83C\uDFC5');
      return;
    }

    // Flatten medals for filtering
    const allMedals = [];
    athletes.forEach(a => {
      (a.medals || []).forEach(m => {
        allMedals.push({
          name: a.tvName || a.fullName,
          fullName: a.fullName,
          country: a.organisation,
          countryName: a.organisationName,
          medalType: m.medalType,
          eventName: m.eventName,
          disciplineName: m.disciplineName,
          disciplineCode: m.disciplineCode,
          date: m.date
        });
      });
    });

    // Extract unique disciplines and countries
    const disciplines = [...new Set(allMedals.map(m => m.disciplineName))].sort();
    const countries = [...new Set(allMedals.map(m => m.countryName))].sort();

    let html = '<div class="filters">';
    html += '<select id="filter-discipline"><option value="">Toutes disciplines</option>';
    disciplines.forEach(d => { html += '<option value="' + escapeAttr(d) + '">' + escapeHtml(d) + '</option>'; });
    html += '</select>';
    html += '<select id="filter-country"><option value="">Tous pays</option>';
    countries.forEach(c => { html += '<option value="' + escapeAttr(c) + '">' + escapeHtml(c) + '</option>'; });
    html += '</select>';
    html += '<select id="filter-medal"><option value="">Toutes</option>';
    html += '<option value="ME_GOLD">\uD83E\uDD47 Or</option>';
    html += '<option value="ME_SILVER">\uD83E\uDD48 Argent</option>';
    html += '<option value="ME_BRONZE">\uD83E\uDD49 Bronze</option>';
    html += '</select></div>';
    html += '<div id="medallists-list"></div>';

    view.innerHTML = html;

    // Store data for filtering
    view._allMedals = allMedals;

    // Setup filter listeners
    ['filter-discipline', 'filter-country', 'filter-medal'].forEach(id => {
      document.getElementById(id).addEventListener('change', () => renderMedallistsList());
    });

    renderMedallistsList();
  }

  function renderMedallistsList() {
    const view = document.getElementById('view-medallists');
    const list = document.getElementById('medallists-list');
    const allMedals = view._allMedals || [];

    const filterDiscipline = document.getElementById('filter-discipline').value;
    const filterCountry = document.getElementById('filter-country').value;
    const filterMedal = document.getElementById('filter-medal').value;

    let filtered = allMedals;
    if (filterDiscipline) filtered = filtered.filter(m => m.disciplineName === filterDiscipline);
    if (filterCountry) filtered = filtered.filter(m => m.countryName === filterCountry);
    if (filterMedal) filtered = filtered.filter(m => m.medalType === filterMedal);

    if (filtered.length === 0) {
      list.innerHTML = renderEmpty('Aucun r\u00e9sultat', '\uD83D\uDD0D');
      return;
    }

    // Sort: gold first, then silver, then bronze, then by name
    const medalOrder = { 'ME_GOLD': 0, 'ME_SILVER': 1, 'ME_BRONZE': 2 };
    filtered.sort((a, b) => {
      const oa = medalOrder[a.medalType] ?? 3;
      const ob = medalOrder[b.medalType] ?? 3;
      if (oa !== ob) return oa - ob;
      return (a.name || '').localeCompare(b.name || '');
    });

    let html = '';
    filtered.forEach((m, i) => {
      const emoji = getMedalEmoji(m.medalType);
      const delay = Math.min(i * 25, 250);

      html += '<div class="medallist-card" data-medallist-idx="' + i + '" style="animation-delay:' + delay + 'ms">';
      html += '<div class="medallist-summary">';
      html += '<span class="medallist-medal">' + emoji + '</span>';
      html += '<div class="medallist-info">';
      html += '<div class="medallist-name">' + escapeHtml(m.name) + '</div>';
      html += '<div class="medallist-event-name">' + escapeHtml(m.eventName || '') + '</div>';
      html += '</div>';
      html += '<span class="medallist-country">' + countryFlag(m.country) + ' ' + escapeHtml(m.country) + '</span>';
      html += CHEVRON_SVG;
      html += '</div>';

      // Detail
      html += '<div class="medallist-detail" id="medallist-detail-' + i + '">';
      html += '<div class="medallist-detail-row"><strong>Nom complet :</strong> ' + escapeHtml(m.fullName || m.name) + '</div>';
      html += '<div class="medallist-detail-row"><strong>Discipline :</strong> ' + escapeHtml(m.disciplineName || '') + '</div>';
      html += '<div class="medallist-detail-row"><strong>\u00c9preuve :</strong> ' + escapeHtml(m.eventName || '') + '</div>';
      html += '<div class="medallist-detail-row"><strong>Pays :</strong> ' + escapeHtml(m.countryName || '') + '</div>';
      if (m.date) {
        html += '<div class="medallist-detail-row"><strong>Date :</strong> ' + formatDateFR(m.date) + '</div>';
      }
      html += '</div></div>';
    });

    list.innerHTML = html;

    // Toggle details
    list.querySelectorAll('.medallist-card').forEach(el => {
      el.addEventListener('click', () => {
        const idx = el.dataset.medallistIdx;
        const detail = document.getElementById('medallist-detail-' + idx);
        const isOpen = detail.classList.toggle('open');
        el.classList.toggle('expanded', isOpen);
      });
    });
  }

  // --- SETTINGS VIEW ---
  function renderSettings() {
    const view = document.getElementById('view-settings');

    let html = '<div class="settings-title">Param\u00e8tres</div>';
    html += '<div class="settings-section">';
    html += '<div class="settings-row">';
    html += '<span class="settings-label" id="toggle-label">Lancer au d\u00e9marrage</span>';
    html += '<label class="toggle-switch">';
    html += '<input type="checkbox" id="login-item-checkbox">';
    html += '<span class="toggle-slider"></span>';
    html += '</label>';
    html += '</div></div>';
    html += '<div class="settings-section">';
    html += '<button class="btn-quit" id="btn-quit">Quitter l\'application</button>';
    html += '</div>';
    html += '<div class="settings-version">JO 2026 Milano Cortina v0.1.0</div>';

    view.innerHTML = html;

    // Login item
    const checkbox = document.getElementById('login-item-checkbox');
    window.jo2026.getLoginItemSettings().then(settings => {
      checkbox.checked = settings.openAtLogin || false;
    });

    checkbox.addEventListener('change', () => {
      window.jo2026.setLoginItemSettings(checkbox.checked);
    });

    // Toggle label clicks the checkbox
    document.getElementById('toggle-label').addEventListener('click', () => {
      checkbox.checked = !checkbox.checked;
      checkbox.dispatchEvent(new Event('change'));
    });

    // Quit
    document.getElementById('btn-quit').addEventListener('click', () => {
      window.jo2026.quit();
    });
  }

  // --- Helpers ---
  function formatDateFR(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  function formatTime(isoStr) {
    if (!isoStr) return '--:--';
    const d = new Date(isoStr);
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' });
  }

  function formatDateTime(isoStr) {
    if (!isoStr) return 'N/A';
    const d = new Date(isoStr);
    return d.toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' });
  }

  function addDays(dateStr, days) {
    const d = new Date(dateStr + 'T12:00:00');
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  }

  function getStatusClass(status) {
    switch (status) {
      case 'RUNNING': return 'status-running';
      case 'FINISHED': return 'status-finished';
      default: return 'status-scheduled';
    }
  }

  function getStatusLabel(status) {
    switch (status) {
      case 'RUNNING': return 'EN COURS';
      case 'FINISHED': return 'TERMIN\u00c9';
      default: return 'PR\u00c9VU';
    }
  }

  function getMedalEmoji(type) {
    switch (type) {
      case 'ME_GOLD': return '\uD83E\uDD47';
      case 'ME_SILVER': return '\uD83E\uDD48';
      case 'ME_BRONZE': return '\uD83E\uDD49';
      default: return '\uD83C\uDFC5';
    }
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function escapeAttr(str) {
    return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // Convert ISO 3166-1 alpha-3 country code to flag emoji
  // Maps 3-letter Olympic codes to 2-letter ISO codes, then to regional indicator symbols
  const ALPHA3_TO_ALPHA2 = {
    AFG:'AF',ALB:'AL',ALG:'DZ',AND:'AD',ANG:'AO',ANT:'AG',ARG:'AR',ARM:'AM',ARU:'AW',
    ASA:'AS',AUS:'AU',AUT:'AT',AZE:'AZ',BAH:'BS',BAN:'BD',BAR:'BB',BDI:'BI',BEL:'BE',
    BEN:'BJ',BER:'BM',BHU:'BT',BIH:'BA',BIZ:'BZ',BLR:'BY',BOL:'BO',BOT:'BW',BRA:'BR',
    BRN:'BH',BRU:'BN',BUL:'BG',BUR:'BF',CAF:'CF',CAM:'KH',CAN:'CA',CAY:'KY',CGO:'CG',
    CHA:'TD',CHI:'CL',CHN:'CN',CIV:'CI',CMR:'CM',COD:'CD',COK:'CK',COL:'CO',COM:'KM',
    CPV:'CV',CRC:'CR',CRO:'HR',CUB:'CU',CYP:'CY',CZE:'CZ',DEN:'DK',DJI:'DJ',DMA:'DM',
    DOM:'DO',ECU:'EC',EGY:'EG',ERI:'ER',ESA:'SV',ESP:'ES',EST:'EE',ETH:'ET',FIJ:'FJ',
    FIN:'FI',FRA:'FR',FSM:'FM',GAB:'GA',GAM:'GM',GBR:'GB',GBS:'GW',GEO:'GE',GEQ:'GQ',
    GER:'DE',GHA:'GH',GRE:'GR',GRN:'GD',GUA:'GT',GUI:'GN',GUM:'GU',GUY:'GY',HAI:'HT',
    HKG:'HK',HON:'HN',HUN:'HU',INA:'ID',IND:'IN',IRI:'IR',IRL:'IE',IRQ:'IQ',ISL:'IS',
    ISR:'IL',ISV:'VI',ITA:'IT',IVB:'VG',JAM:'JM',JOR:'JO',JPN:'JP',KAZ:'KZ',KEN:'KE',
    KGZ:'KG',KIR:'KI',KOR:'KR',KOS:'XK',KSA:'SA',KUW:'KW',LAO:'LA',LAT:'LV',LBA:'LY',
    LBN:'LB',LBR:'LR',LCA:'LC',LES:'LS',LIE:'LI',LTU:'LT',LUX:'LU',MAD:'MG',MAR:'MA',
    MAS:'MY',MAW:'MW',MDA:'MD',MDV:'MV',MEX:'MX',MGL:'MN',MHL:'MH',MKD:'MK',MLI:'ML',
    MLT:'MT',MNE:'ME',MON:'MC',MOZ:'MZ',MRI:'MU',MTN:'MR',MYA:'MM',NAM:'NA',NCA:'NI',
    NED:'NL',NEP:'NP',NGR:'NG',NIG:'NE',NOR:'NO',NRU:'NR',NZL:'NZ',OMA:'OM',PAK:'PK',
    PAN:'PA',PAR:'PY',PER:'PE',PHI:'PH',PLE:'PS',PLW:'PW',PNG:'PG',POL:'PL',POR:'PT',
    PRK:'KP',PUR:'PR',QAT:'QA',ROU:'RO',RSA:'ZA',RUS:'RU',RWA:'RW',SAM:'WS',SEN:'SN',
    SEY:'SC',SIN:'SG',SKN:'KN',SLE:'SL',SLO:'SI',SMR:'SM',SOL:'SB',SOM:'SO',SRB:'RS',
    SRI:'LK',STP:'ST',SUD:'SD',SUI:'CH',SUR:'SR',SVK:'SK',SWE:'SE',SWZ:'SZ',SYR:'SY',
    TAN:'TZ',TGA:'TO',THA:'TH',TJK:'TJ',TKM:'TM',TLS:'TL',TOG:'TG',TPE:'TW',TTO:'TT',
    TUN:'TN',TUR:'TR',TUV:'TV',UAE:'AE',UGA:'UG',UKR:'UA',URU:'UY',USA:'US',UZB:'UZ',
    VAN:'VU',VEN:'VE',VIE:'VN',VIN:'VC',YEM:'YE',ZAM:'ZM',ZIM:'ZW',
    AIN:'UN',EOR:'UN',ROC:'RU',OAR:'UN'
  };

  function countryFlag(code) {
    if (!code) return '';
    const alpha2 = ALPHA3_TO_ALPHA2[code.toUpperCase()];
    if (!alpha2) return '';
    return String.fromCodePoint(
      ...[...alpha2].map(c => 0x1F1E6 + c.charCodeAt(0) - 65)
    );
  }

  function renderEmpty(msg, icon) {
    let html = '<div class="empty-state">';
    if (icon) html += '<div class="empty-state-icon">' + icon + '</div>';
    html += '<p>' + escapeHtml(msg) + '</p></div>';
    return html;
  }
})();
