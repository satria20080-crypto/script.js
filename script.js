// ================= CONFIGURATION =================
const DB_NAME = 'hkr_finance_db_v12';
const PLAN_NAME = 'hkr_plans_db_v12';
const CURRENCY = 'IDR';
const LOCALE = 'id-ID';

let dataFinance = JSON.parse(localStorage.getItem(DB_NAME)) || [];
let vaultPlans = JSON.parse(localStorage.getItem(PLAN_NAME)) || [];
let viewDate = new Date().toISOString().split('T')[0];

// ================= TOAST NOTIFICATION =================
function toast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = message;
    container.appendChild(el);
    setTimeout(() => el.remove(), 3000);
}

// ================= NUMBER ANIMATION =================
function animateValue(element, start, end, duration) {
    if (!element) return;
    const range = end - start;
    const minTimer = 50;
    let stepTime = Math.abs(Math.floor(duration / range));
    stepTime = Math.max(stepTime, minTimer);
    let startTime = new Date().getTime();
    let endTime = startTime + duration;
    let timer;
    
    function run() {
        let now = new Date().getTime();
        let remaining = Math.max((endTime - now) / duration, 0);
        let value = Math.round(end - (remaining * range));
        element.textContent = formatRupiah(value);
        if (value == end) clearInterval(timer);
    }
    
    timer = setInterval(run, stepTime);
    run();
}

// ================= REAL-TIME CLOCK =================
function updateRealTime() {
    const now = new Date();
    document.getElementById('realTimeClock').textContent = now.toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    document.getElementById('realTimeDate').textContent = now.toLocaleDateString(LOCALE, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}
setInterval(updateRealTime, 1000);
updateRealTime();

// ================= NAVIGATION =================
function switchTab(tab, event) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById('page-' + tab).classList.add('active');
    if(event) event.currentTarget.classList.add('active');
    updateUI();
}

// ================= UTILITY FUNCTIONS =================
function formatRupiah(amount) {
    return new Intl.NumberFormat(LOCALE, { style: 'currency', currency: CURRENCY, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
}
function formatDate(timestamp) {
    return new Date(timestamp).toLocaleDateString(LOCALE, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function formatDateShort(timestamp) {
    return new Date(timestamp).toLocaleDateString(LOCALE, { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function getDayName(dateStr) {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return days[new Date(dateStr).getDay()];
}
function getMonthName(monthIndex) {
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return months[monthIndex];
}
function getWeekRange() {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return `${monday.toLocaleDateString(LOCALE, { day: 'numeric', month: 'short' })} - ${sunday.toLocaleDateString(LOCALE, { day: 'numeric', month: 'short' })}`;
}

// 📊 Time Checkers
function isInViewDate(timestamp) {
    const tx = new Date(timestamp);
    const view = new Date(viewDate);
    return tx.getDate() === view.getDate() && tx.getMonth() === view.getMonth() && tx.getFullYear() === view.getFullYear();
}

function isThisWeek(timestamp) {
    const tx = new Date(timestamp);
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return tx >= monday && tx <= sunday;
}

function isCurrentMonth(timestamp) {
    const tx = new Date(timestamp), now = new Date();
    return tx.getMonth() === now.getMonth() && tx.getFullYear() === now.getFullYear();
}

// ================= TRANSACTION FUNCTIONS =================
function tambahData() {
    const tanggalInput = document.getElementById('tanggalTransaksi').value;
    const ket = document.getElementById('keterangan').value.trim();
    const nom = parseInt(document.getElementById('nominal').value);
    const sumber = document.getElementById('sumber').value;
    const tipe = document.getElementById('tipe').value;

    if (!ket || !nom || nom <= 0) { toast('⚠️ Isi keterangan dan nominal yang valid!', 'error'); return; }

    let timestamp = tanggalInput ? new Date(tanggalInput).setHours(new Date().getHours(), new Date().getMinutes(), 0, 0) : Date.now();

    dataFinance.push({ id: Date.now(), keterangan: ket, nominal: nom, sumber: sumber, tipe: tipe, timestamp: timestamp });
    saveData();
    
    document.getElementById('tanggalTransaksi').value = '';
    document.getElementById('keterangan').value = '';
    document.getElementById('nominal').value = '';
    document.getElementById('dayPreview').textContent = '-';
    
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('tanggalTransaksi').value = today;
    updateDayPreview();
    toast('✅ Transaksi berhasil dicatat!', 'success');
}

function deleteTransaction(id) {
    dataFinance = dataFinance.filter(d => d.id !== id);
    saveData();
    toast('🗑️ Transaksi dihapus', 'warning');
}

// ================= DIGITAL FUNCTIONS (ENHANCED) =================
function prosesDigitalTransaction() {
    const tanggalInput = document.getElementById('digitalTanggal').value;
    const ket = document.getElementById('digitalKeterangan').value.trim();
    const nom = parseInt(document.getElementById('digitalNominal').value);
    const tipe = document.getElementById('digitalTipe').value;

    if (!ket || !nom || nom <= 0) { toast('⚠️ Isi keperluan & nominal yang valid!', 'error'); return; }

    let timestamp = tanggalInput ? new Date(tanggalInput).setHours(new Date().getHours(), new Date().getMinutes(), 0, 0) : Date.now();

    dataFinance.push({ 
        id: Date.now(), 
        keterangan: `📱 ${ket}`, 
        nominal: nom, 
        tipe: tipe, 
        sumber: 'digital', 
        timestamp: timestamp 
    });
    
    saveData();
    
    document.getElementById('digitalTanggal').value = '';
    document.getElementById('digitalKeterangan').value = '';
    document.getElementById('digitalNominal').value = '';
    document.getElementById('digitalDayPreview').textContent = '-';
    
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('digitalTanggal').value = today;
    updateDigitalDayPreview();
    toast('✅ Transaksi digital tersimpan!', 'success');
}

// ================= VAULT FUNCTIONS =================
function createVaultPlan() {
    const nama = document.getElementById('inputNamaGoal').value.trim();
    const target = parseInt(document.getElementById('inputTargetNominal').value);
    if (!nama || !target || target <= 0) { toast('⚠️ Isi nama & target yang valid!', 'error'); return; }
    vaultPlans.push({ id: Date.now(), nama: nama, target: target, createdAt: Date.now() });
    localStorage.setItem(PLAN_NAME, JSON.stringify(vaultPlans));
    document.getElementById('inputNamaGoal').value = '';
    document.getElementById('inputTargetNominal').value = '';
    updateUI();
    toast('🎁 Plan baru dibuat!', 'success');
}

function deletePlan(id) {
    if(!confirm('🗑️ Hapus target ini? Semua data tabungan terkait akan hilang.')) return;
    vaultPlans = vaultPlans.filter(p => p.id !== id);
    dataFinance = dataFinance.filter(d => d.planId !== id);
    localStorage.setItem(PLAN_NAME, JSON.stringify(vaultPlans));
    saveData();
    toast('🗑️ Plan dihapus', 'warning');
}

function prosesTabungan(aksi) {
    const planId = parseInt(document.getElementById('pilihPlan').value);
    const nom = parseInt(document.getElementById('nominalNabung').value);
    if (!nom || nom <= 0 || !planId) { toast('⚠️ Pilih target & masukkan nominal!', 'error'); return; }
    const plan = vaultPlans.find(p => p.id === planId);
    if (!plan) { toast('⚠️ Plan tidak ditemukan!', 'error'); return; }

    if (aksi === 'masuk') {
        dataFinance.push({ id: Date.now(), keterangan: `🏦 Vault In: ${plan.nama}`, nominal: nom, tipe: 'masuk', sumber: 'cash', planId: planId, timestamp: Date.now() });
        toast(`🔒 Rp ${formatRupiah(nom)} masuk ke vault "${plan.nama}"`, 'success');
    } else {
        const currentSaved = calculateVaultProgress(planId);
        if (nom > currentSaved) { toast(`⚠️ Saldo vault "${plan.nama}" tidak cukup! (Tersisa: ${formatRupiah(currentSaved)})`, 'error'); return; }
        dataFinance.push({ id: Date.now(), keterangan: `🔓 Vault Out: ${plan.nama}`, nominal: nom, tipe: 'keluar', sumber: 'cash', planId: planId, isWithdraw: true, timestamp: Date.now() });
        toast(`🔓 Rp ${formatRupiah(nom)} dirilis dari vault "${plan.nama}"`, 'warning');
    }
    saveData();
    document.getElementById('nominalNabung').value = '';
}

// ================= DATA PERSISTENCE & EXPORT =================
function saveData() {
    localStorage.setItem(DB_NAME, JSON.stringify(dataFinance));
    updateUI();
}

function exportData() {
    const exportObj = { finance: dataFinance, vault: vaultPlans, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HKRfinance_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('💾 Data berhasil di-export!', 'success');
}

// ================= 📊 TIME SUMMARY CALCULATION =================
function calculateTimeSummary() {
    let dailyMasuk = 0, dailyKeluar = 0;
    let weeklyMasuk = 0, weeklyKeluar = 0;
    let monthlyMasuk = 0, monthlyKeluar = 0;
    
    dataFinance.forEach(d => {
        if (isInViewDate(d.timestamp)) {
            if (d.tipe === 'masuk') dailyMasuk += d.nominal;
            else dailyKeluar += d.nominal;
        }
        if (isThisWeek(d.timestamp)) {
            if (d.tipe === 'masuk') weeklyMasuk += d.nominal;
            else weeklyKeluar += d.nominal;
        }
        if (isCurrentMonth(d.timestamp)) {
            if (d.tipe === 'masuk') monthlyMasuk += d.nominal;
            else monthlyKeluar += d.nominal;
        }
    });
    
    return {
        daily: { masuk: dailyMasuk, keluar: dailyKeluar, net: dailyMasuk - dailyKeluar },
        weekly: { masuk: weeklyMasuk, keluar: weeklyKeluar, net: weeklyMasuk - weeklyKeluar },
        monthly: { masuk: monthlyMasuk, keluar: monthlyKeluar, net: monthlyMasuk - monthlyKeluar }
    };
}

function calculateDigitalSummary() {
    let masuk = 0, keluar = 0;
    dataFinance.forEach(d => {
        if (d.sumber === 'digital' && isInViewDate(d.timestamp)) {
            if (d.tipe === 'masuk') masuk += d.nominal;
            else keluar += d.nominal;
        }
    });
    return { masuk, keluar, net: masuk - keluar };
}

function calculateVaultProgress(planId) {
    let saved = 0;
    dataFinance.filter(d => d.planId === planId).forEach(d => {
        saved += d.isWithdraw ? -d.nominal : d.nominal;
    });
    return Math.max(0, saved);
}

// ================= UI UPDATE =================
function updateUI() {
    let cash = 0, digital = 0;
    dataFinance.forEach(d => {
        const m = d.tipe === 'masuk' ? 1 : -1;
        if (d.sumber === 'cash' && !d.planId) cash += d.nominal * m;
        if (d.sumber === 'digital') digital += d.nominal * m;
    });
    
    animateValue(document.getElementById('saldoAktif'), 0, cash + digital, 600);
    animateValue(document.getElementById('saldoCash'), 0, cash, 600);
    animateValue(document.getElementById('saldoDigital'), 0, digital, 600);
    if (document.getElementById('saldoDigitalHalaman')) animateValue(document.getElementById('saldoDigitalHalaman'), 0, digital, 600);
    
    const summary = calculateTimeSummary();
    const digiSummary = calculateDigitalSummary();
    const view = new Date(viewDate);
    const now = new Date();
    
    document.getElementById('dailyDayName').textContent = view.toLocaleDateString(LOCALE, { weekday: 'long' });
    document.getElementById('dailyDate').textContent = view.toLocaleDateString(LOCALE, { day: 'numeric', month: 'long', year: 'numeric' });
    animateValue(document.getElementById('dailyMasuk'), 0, summary.daily.masuk, 500);
    animateValue(document.getElementById('dailyKeluar'), 0, summary.daily.keluar, 500);
    const dailyNetEl = document.getElementById('dailyNet');
    animateValue(dailyNetEl, 0, summary.daily.net, 500);
    dailyNetEl.className = `daily-value ${summary.daily.net >= 0 ? 'positive' : 'negative'}`;

    document.getElementById('weeklyRange').textContent = getWeekRange();
    animateValue(document.getElementById('weeklyMasuk'), 0, summary.weekly.masuk, 500);
    animateValue(document.getElementById('weeklyKeluar'), 0, summary.weekly.keluar, 500);
    const weeklyNetEl = document.getElementById('weeklyNet');
    animateValue(weeklyNetEl, 0, summary.weekly.net, 500);
    weeklyNetEl.className = `weekly-value ${summary.weekly.net >= 0 ? 'positive' : 'negative'}`;

    document.getElementById('monthlyName').textContent = getMonthName(now.getMonth()) + ' ' + now.getFullYear();
    animateValue(document.getElementById('monthlyMasuk'), 0, summary.monthly.masuk, 500);
    animateValue(document.getElementById('monthlyKeluar'), 0, summary.monthly.keluar, 500);
    const monthlyNetEl = document.getElementById('monthlyNet');
    animateValue(monthlyNetEl, 0, summary.monthly.net, 500);
    monthlyNetEl.className = `monthly-value ${summary.monthly.net >= 0 ? 'positive' : 'negative'}`;
    
    if (document.getElementById('digitalDayName')) {
        document.getElementById('digitalDayName').textContent = view.toLocaleDateString(LOCALE, { weekday: 'long' });
        document.getElementById('digitalDate').textContent = view.toLocaleDateString(LOCALE, { day: 'numeric', month: 'long', year: 'numeric' });
        animateValue(document.getElementById('digitalMasuk'), 0, digiSummary.masuk, 500);
        animateValue(document.getElementById('digitalKeluar'), 0, digiSummary.keluar, 500);
        const digitalNetEl = document.getElementById('digitalNet');
        animateValue(digitalNetEl, 0, digiSummary.net, 500);
        digitalNetEl.className = `digital-value ${digiSummary.net >= 0 ? 'positive' : 'negative'}`;
    }
    
    updateTransactionList();
    updateDigitalHistory();
    updateVaultPlans();
    updateVaultOverview();
}

function updateTransactionList() {
    const container = document.getElementById('daftar');
    if (!container) return;
    
    const searchTerm = document.getElementById('searchHistory').value.toLowerCase();
    let filtered = dataFinance.sort((a, b) => b.timestamp - a.timestamp);
    
    if (searchTerm) {
        filtered = filtered.filter(d => 
            d.keterangan.toLowerCase().includes(searchTerm) || 
            d.sumber.toLowerCase().includes(searchTerm) ||
            d.tipe.toLowerCase().includes(searchTerm)
        );
    }
    
    const displayData = filtered.slice(0, 15);
    
    if (displayData.length === 0) { 
        container.innerHTML = '<li class="text-center" style="color:var(--text-dim); padding:20px;">🔍 Tidak ada transaksi ditemukan</li>'; 
        return; 
    }
    
    container.innerHTML = displayData.map(d => {
        const date = new Date(d.timestamp);
        const dayName = date.toLocaleDateString(LOCALE, { weekday: 'short' });
        const isVault = !!d.planId;
        const amountClass = isVault ? 'vault' : (d.tipe === 'masuk' ? 'masuk' : 'keluar');
        const itemClass = isVault ? 'vault-tx' : d.tipe;
        
        return `
        <li class="transaction-item ${itemClass}">
            <div class="transaction-info">
                <div class="transaction-ket">${isVault ? '🏦 ' : ''}${escapeHtml(d.keterangan)}</div>
                <div class="transaction-meta">${d.sumber.toUpperCase()} • ${dayName}, ${formatDateShort(d.timestamp)}</div>
            </div>
            <div style="display:flex; align-items:center;">
                <span class="transaction-amount ${amountClass}">${d.tipe === 'masuk' ? '+' : '-'}${formatRupiah(d.nominal)}</span>
                ${!isVault ? `<button class="delete-btn" onclick="deleteTransaction(${d.id})">✕</button>` : ''}
            </div>
        </li>`;
    }).join('');
}

document.getElementById('searchHistory')?.addEventListener('input', updateTransactionList);

function updateDigitalHistory() {
    const container = document.getElementById('digitalHistory');
    if (!container) return;
    const digitalTx = dataFinance.filter(d => d.sumber === 'digital').sort((a, b) => b.timestamp - a.timestamp).slice(0, 10);
    if (digitalTx.length === 0) { 
        container.innerHTML = '<li class="text-center" style="color:var(--text-dim); padding:20px;">Belum ada transaksi digital</li>'; 
        return; 
    }
    container.innerHTML = digitalTx.map(d => `
        <li class="transaction-item ${d.tipe}">
            <div class="transaction-info">
                <div class="transaction-ket">${escapeHtml(d.keterangan)}</div>
                <div class="transaction-meta">${formatDate(d.timestamp)}</div>
            </div>
            <span class="transaction-amount ${d.tipe}">${d.tipe === 'masuk' ? '+' : '-'}${formatRupiah(d.nominal)}</span>
        </li>`).join('');
}

function updateVaultPlans() {
    const container = document.getElementById('vaultPlansContainer');
    const selectPlan = document.getElementById('pilihPlan');
    if (container) container.innerHTML = "";
    if (selectPlan) selectPlan.innerHTML = '<option value="">🎯 Pilih Target...</option>';
    
    if (vaultPlans.length === 0) {
        if (container) container.innerHTML = `<div class="glass-section text-center" style="padding:24px;"><p style="color:var(--text-dim); margin-bottom:8px;">🏦 Belum ada target tabungan</p><p style="font-size:0.8rem; color:var(--text-dim);">Buat plan baru untuk mulai menabung!</p></div>`;
        const areaNabung = document.getElementById('areaNabungVault');
        if (areaNabung) areaNabung.style.display = 'none';
        return;
    }
    
    vaultPlans.forEach(plan => {
        const saved = calculateVaultProgress(plan.id);
        const percent = Math.min(Math.round((saved / plan.target) * 100), 100);
        const remaining = plan.target - saved;
        
        if (container) {
            container.innerHTML += `
                <div class="vault-plan-card" onclick="selectVaultPlan(${plan.id})">
                    <div class="vault-plan-header">
                        <span class="vault-plan-name">🎯 ${escapeHtml(plan.nama)}</span>
                        <span class="vault-plan-percent">${percent}%</span>
                    </div>
                    <div class="vault-plan-amount">${formatRupiah(saved)}</div>
                    <div class="progress-track"><div class="progress-fill" style="width: ${percent}%"></div></div>
                    <div class="vault-plan-goal">
                        <span>Goal: ${formatRupiah(plan.target)}</span>
                        <span class="${remaining >= 0 ? 'text-success' : 'text-danger'}">${remaining >= 0 ? `Sisa: ${formatRupiah(remaining)}` : '✅ Tercapai!'}</span>
                    </div>
                    <div class="vault-plan-actions"><button class="delete-btn" onclick="event.stopPropagation(); deletePlan(${plan.id})">🗑️ Hapus</button></div>
                </div>`;
        }
        if (selectPlan) selectPlan.innerHTML += `<option value="${plan.id}">🎯 ${escapeHtml(plan.nama)} (${percent}%)</option>`;
    });
    
    const areaNabung = document.getElementById('areaNabungVault');
    if (areaNabung) areaNabung.style.display = vaultPlans.length > 0 ? 'block' : 'none';
}

function updateVaultOverview() {
    const totalSaved = vaultPlans.reduce((sum, plan) => sum + calculateVaultProgress(plan.id), 0);
    document.getElementById('totalVaultSaved').textContent = formatRupiah(totalSaved);
    document.getElementById('vaultPlansCount').textContent = `${vaultPlans.length} Active Goal${vaultPlans.length !== 1 ? 's' : ''}`;
}

function selectVaultPlan(planId) {
    const select = document.getElementById('pilihPlan');
    if (select) select.value = planId;
    switchTab('tabungan');
    const areaNabung = document.getElementById('areaNabungVault');
    if (areaNabung) areaNabung.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function escapeHtml(text) { const div = document.createElement('div'); div.textContent = text; return div.innerHTML; }

// ================= DATE FILTER LOGIC =================
function updateDayPreview() {
    const dateInput = document.getElementById('tanggalTransaksi').value;
    const dayPreview = document.getElementById('dayPreview');
    if (dateInput) {
        const dayName = getDayName(dateInput);
        const dateStr = new Date(dateInput).toLocaleDateString(LOCALE, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        dayPreview.textContent = `📅 ${dateStr}`;
    } else {
        dayPreview.textContent = '-';
    }
}

function updateDigitalDayPreview() {
    const dateInput = document.getElementById('digitalTanggal').value;
    const dayPreview = document.getElementById('digitalDayPreview');
    if (dateInput) {
        const dayName = getDayName(dateInput);
        const dateStr = new Date(dateInput).toLocaleDateString(LOCALE, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        dayPreview.textContent = `📅 ${dateStr}`;
    } else {
        dayPreview.textContent = '-';
    }
}

function resetToToday() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('dateFilter').value = today;
    viewDate = today;
    updateUI();
    toast('🔄 Filter direset ke hari ini', 'success');
}

window.onload = function() {
    updateRealTime();
    updateUI();
    
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('tanggalTransaksi').value = today;
    document.getElementById('dateFilter').value = today;
    document.getElementById('digitalTanggal').value = today;
    viewDate = today;
    updateDayPreview();
    updateDigitalDayPreview();
    
    document.getElementById('dateFilter').addEventListener('change', function() {
        viewDate = this.value;
        updateUI();
    });
    
    document.getElementById('tanggalTransaksi').addEventListener('change', updateDayPreview);
    document.getElementById('digitalTanggal').addEventListener('change', updateDigitalDayPreview);
    document.getElementById('nominal')?.addEventListener('keypress', function(e) { if (e.key === 'Enter') tambahData(); });
    document.getElementById('keterangan')?.addEventListener('keypress', function(e) { if (e.key === 'Enter') document.getElementById('nominal').focus(); });
};

setInterval(() => {
    localStorage.setItem(DB_NAME, JSON.stringify(dataFinance));
    localStorage.setItem(PLAN_NAME, JSON.stringify(vaultPlans));
}, 30000);
