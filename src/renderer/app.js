(function () {
  'use strict';

  const JO_START = '2026-02-06';
  const JO_END = '2026-02-22';
  const SCHEDULE_START = '2026-02-04';
  const SCHEDULE_END = '2026-02-22';

  // State
  let currentTab = 'medals';
  let scheduleDate = getTodayOrDefault();
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
        $lastUpdate.textContent = 'Derni\u00e8re MAJ : ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
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
      html += '<tr class="medal-row" data-detail="' + id + '">';
      html += '<td>' + entry.rank + '</td>';
      html += '<td>' + escapeHtml(countryName) + ' <span style="color:var(--text-muted);font-size:11px">(' + entry.organisation + ')</span></td>';
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
        html += '<div style="color:var(--text-muted);font-size:12px">Aucun d\u00e9tail par discipline</div>';
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
        detail.classList.toggle('open');
      });
    });
  }

  // --- SCHEDULE VIEW ---
  function renderSchedule() {
    const view = document.getElementById('view-schedule');

    let html = '<div class="schedule-nav">';
    html += '<button id="schedule-prev" title="Jour pr\u00e9c\u00e9dent">\u25C0</button>';
    html += '<span class="schedule-date">' + formatDateFR(scheduleDate) + '</span>';
    html += '<button id="schedule-next" title="Jour suivant">\u25B6</button>';
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

    renderScheduleList();
  }

  async function loadScheduleAndRender() {
    const view = document.getElementById('view-schedule');
    const navDate = view.querySelector('.schedule-date');
    const prevBtn = document.getElementById('schedule-prev');
    const nextBtn = document.getElementById('schedule-next');

    navDate.textContent = formatDateFR(scheduleDate);
    prevBtn.disabled = (scheduleDate <= SCHEDULE_START);
    nextBtn.disabled = (scheduleDate >= SCHEDULE_END);

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

    // Sort by start date
    const units = [...scheduleData.units].sort((a, b) => {
      return (a.startDate || '').localeCompare(b.startDate || '');
    });

    let html = '';
    units.forEach((unit, i) => {
      const isMedal = unit.medalEvent === true;
      const statusClass = getStatusClass(unit.status);
      const statusLabel = getStatusLabel(unit.status);
      const time = formatTime(unit.startDate);

      html += '<div class="schedule-unit' + (isMedal ? ' medal-event' : '') + '" data-unit-idx="' + i + '">';
      html += '<div class="unit-summary">';
      html += '<span class="unit-time">' + time + '</span>';
      html += '<div class="unit-info">';
      html += '<div class="unit-discipline">' + escapeHtml(unit.disciplineName || '') + '</div>';
      html += '<div class="unit-event">' + escapeHtml(unit.eventUnitName || unit.eventName || '') + '</div>';
      html += '</div>';
      html += '<div class="unit-badge">';
      if (isMedal) html += '<span class="badge-medal">\uD83C\uDFC5</span>';
      html += '<span class="badge-status ' + statusClass + '">' + statusLabel + '</span>';
      html += '</div></div>';

      // Detail
      html += '<div class="unit-detail" id="unit-detail-' + i + '">';
      if (unit.venueDescription) {
        html += '<div class="unit-detail-row"><strong>Lieu :</strong> ' + escapeHtml(unit.venueDescription) + '</div>';
      }
      html += '<div class="unit-detail-row"><strong>D\u00e9but :</strong> ' + formatDateTime(unit.startDate) + '</div>';
      if (unit.endDate && !unit.hideEndDate) {
        html += '<div class="unit-detail-row"><strong>Fin :</strong> ' + formatDateTime(unit.endDate) + '</div>';
      }
      html += '<div class="unit-detail-row"><strong>Statut :</strong> ' + escapeHtml(unit.status || 'N/A') + '</div>';
      if (unit.phaseName) {
        html += '<div class="unit-detail-row"><strong>Phase :</strong> ' + escapeHtml(unit.phaseName) + '</div>';
      }
      html += '</div></div>';
    });

    list.innerHTML = html;

    // Toggle details
    list.querySelectorAll('.schedule-unit').forEach(el => {
      el.addEventListener('click', () => {
        const idx = el.dataset.unitIdx;
        const detail = document.getElementById('unit-detail-' + idx);
        detail.classList.toggle('open');
      });
    });
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
    html += '<select id="filter-medal"><option value="">Toutes m\u00e9dailles</option>';
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
      html += '<div class="medallist-card" data-medallist-idx="' + i + '">';
      html += '<div class="medallist-summary">';
      html += '<span class="medallist-medal">' + emoji + '</span>';
      html += '<div class="medallist-info">';
      html += '<div class="medallist-name">' + escapeHtml(m.name) + '</div>';
      html += '<div class="medallist-event-name">' + escapeHtml(m.eventName || '') + '</div>';
      html += '</div>';
      html += '<span class="medallist-country">' + escapeHtml(m.country) + '</span>';
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
        detail.classList.toggle('open');
      });
    });
  }

  // --- SETTINGS VIEW ---
  function renderSettings() {
    const view = document.getElementById('view-settings');

    let html = '<div class="settings-title">Param\u00e8tres</div>';
    html += '<div class="settings-section">';
    html += '<div class="settings-row">';
    html += '<label><input type="checkbox" id="login-item-checkbox"> Lancer au d\u00e9marrage de macOS</label>';
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
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  function formatDateTime(isoStr) {
    if (!isoStr) return 'N/A';
    const d = new Date(isoStr);
    return d.toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
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

  function renderEmpty(msg, icon) {
    let html = '<div class="empty-state">';
    if (icon) html += '<div class="empty-state-icon">' + icon + '</div>';
    html += '<p>' + escapeHtml(msg) + '</p></div>';
    return html;
  }
})();
