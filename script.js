const scriptURL = 'https://script.google.com/macros/s/AKfycbxDn2A6pVL74dmi1TH-5Cc9SYT-g5egJayKpXbaR_meeC9t8bVix2GQz0ANreQc0lFb/exec'; 
let currentDataList = []; 

function toggleTheme(cb) { 
    if(cb.checked) { 
        document.body.classList.add('dark-mode'); 
        localStorage.setItem('admin_theme', 'dark'); 
    } else { 
        document.body.classList.remove('dark-mode'); 
        localStorage.setItem('admin_theme', 'light'); 
    } 
    ['checkbox-login', 'checkbox-dash'].forEach(id => { 
        const el = document.getElementById(id); 
        if (el) el.checked = cb.checked; 
    }); 
}

function applySavedTheme() { 
    if (localStorage.getItem('admin_theme') === 'dark') { 
        document.body.classList.add('dark-mode'); 
        ['checkbox-login', 'checkbox-dash'].forEach(id => { 
            const el = document.getElementById(id); 
            if (el) el.checked = true; 
        }); 
    } 
}

window.onload = () => { 
    applySavedTheme(); 
    if (localStorage.getItem('admin_logged_in') === 'true') { 
        document.getElementById('login-overlay').style.display = 'none'; 
        document.getElementById('dashboard').style.display = 'flex'; 
        loadClasses(); 
    } 
};

function checkLogin() { 
    const pass = document.getElementById('login-pass').value; 
    if (pass === (localStorage.getItem('admin_password') || 'admin123')) { 
        localStorage.setItem('admin_logged_in', 'true'); 
        window.location.reload(); 
    } else {
        alert('❌ Incorrect password!'); 
    }
}

async function loadClasses() {
    const sel = document.getElementById('class-select'); 
    sel.innerHTML = '<option>⏳ Loading classes...</option>';
    try { 
        const res = await fetch(`${scriptURL}?action=getClasses`); 
        const data = await res.json(); 
        if (data.success) { 
            sel.innerHTML = '<option value="">-- Select class --</option>'; 
            data.classes.forEach(c => sel.innerHTML += `<option value="${c}">📚 Session: ${c}</option>`); 
        } 
    } catch (e) { 
        sel.innerHTML = '<option>❌ Error</option>'; 
    }
}

async function loadDates() {
    const cid = document.getElementById('class-select').value; 
    const sel = document.getElementById('date-select'); 
    if (!cid) return; 
    sel.innerHTML = '<option>⏳ Loading dates...</option>';
    try { 
        const res = await fetch(`${scriptURL}?action=getDates&classId=${encodeURIComponent(cid)}`); 
        const data = await res.json(); 
        if (data.success) { 
            sel.innerHTML = '<option value="">-- Select date --</option>'; 
            data.dates.reverse().forEach(d => sel.innerHTML += `<option value="${d}">Date ${d}</option>`); 
        } 
    } catch (e) { 
        sel.innerHTML = '<option>❌ Error</option>'; 
    }
}

function handleClassChange() { loadDates(); }
function refreshData() { loadStats(); }

async function loadStats() {
    const cid = document.getElementById('class-select').value; 
    const date = document.getElementById('date-select').value; 
    const tb = document.getElementById('attendance-list'); 
    const tot = document.getElementById('total-present'); 
    const btn = document.getElementById('btnRef');
    
    if (!cid || !date) return; 
    tb.innerHTML = '<tr><td colspan="3" align="center">⏳ Loading...</td></tr>'; 
    btn.innerText = "⏳ LOADING..."; 
    btn.disabled = true;
    
    try {
        const res = await fetch(`${scriptURL}?action=getStats&classId=${encodeURIComponent(cid)}&date=${encodeURIComponent(date)}`); 
        const data = await res.json(); 
        currentDataList = data.list; 
        tot.innerText = data.total;
        
        if (data.total > 0) { 
            tb.innerHTML = ''; 
            data.list.forEach(s => tb.innerHTML += `<tr><td style="font-weight:bold;">${s.mssv}</td><td>${s.name}</td><td style="color:var(--accent-color); font-weight:bold;" align="center">${s.time}</td></tr>`); 
        } else {
            tb.innerHTML = '<tr><td colspan="3" align="center" style="color:red;">No Data</td></tr>';
        }
    } catch (e) { 
        tb.innerHTML = '<tr><td colspan="3" align="center" style="color:red;">❌ Network Error</td></tr>'; 
    } finally { 
        btn.innerText = "🔄 REFRESH"; 
        btn.disabled = false; 
    }
}

function showSearchModal() { document.getElementById('search-modal').style.display = 'flex'; }
function closeSearchModal() { document.getElementById('search-modal').style.display = 'none'; document.getElementById('search-result').style.display = 'none'; }

async function searchStudent() { 
    const m = document.getElementById('search-mssv').value.trim(); 
    const btn = document.getElementById('btnSearch'); 
    const resB = document.getElementById('search-result'); 
    
    if (!m) return; 
    btn.innerText = "SEARCHING..."; 
    btn.disabled = true; 
    
    try { 
        const res = await fetch(`${scriptURL}?action=searchStudent&mssv=${m}`); 
        const data = await res.json(); 
        if (data.success) { 
            document.getElementById('res-mssv').innerText = data.mssv; 
            document.getElementById('res-name').innerText = data.name; 
            document.getElementById('res-pass').innerText = data.password; 
            resB.style.display = 'block'; 
        } else {
            alert("❌ Not found or Error"); 
        }
    } catch(e) {
        alert("❌ Network Error");
    } finally { 
        btn.innerText = "SEARCH"; 
        btn.disabled = false; 
    } 
}

function showPassModal() { document.getElementById('password-modal').style.display = 'flex'; }
function closePassModal() { document.getElementById('password-modal').style.display = 'none'; }

function updatePassword() { 
    const op = document.getElementById('old-pass').value; 
    const np = document.getElementById('new-pass').value; 
    if (op !== (localStorage.getItem('admin_password') || 'admin123')) return alert('❌ Incorrect current password!'); 
    if (np.length < 6) return alert('⚠️ Password too short!'); 
    localStorage.setItem('admin_password', np); 
    alert('✅ Saved successfully!'); 
    closePassModal(); 
}

async function forceSyncData() { 
    if(!confirm("Force sync Cache with Google Sheets?")) return; 
    try { 
        const res = await fetch(`${scriptURL}?action=clearCache`); 
        const data = await res.json(); 
        if(data.success) { 
            alert("✅ " + data.message); 
            window.location.reload(); 
        } 
    } catch (e) { 
        alert("❌ Sync Error!"); 
    } 
}

function exportToExcel() { 
    if (!currentDataList.length) return alert("⚠️ No data to export!"); 
    const cid = document.getElementById('class-select').value; 
    const ds = document.getElementById('date-select').value.replace(/\//g, '-'); 
    const d = [["LECTURER ID", "FULL NAME", "TIME"]]; 
    currentDataList.forEach(i => d.push([i.mssv, i.name, i.time])); 
    const wb = XLSX.utils.book_new(); 
    const ws = XLSX.utils.aoa_to_sheet(d); 
    ws['!cols'] = [{wch:15}, {wch:35}, {wch:20}]; 
    XLSX.utils.book_append_sheet(wb, ws, "DATA"); 
    XLSX.writeFile(wb, `ATTENDANCE_${cid}_${ds}.xlsx`); 
}
