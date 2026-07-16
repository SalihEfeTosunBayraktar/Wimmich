/**
 * Wimmich - SPA hash router and admin job polling.
 */
function navigateTo(page) {
    if (!pages[page]) page = 'gallery';
    state.currentPage = page;
    location.hash = page;

    if (page !== 'admin' && adminPollInterval) {
        clearInterval(adminPollInterval);
        adminPollInterval = null;
    }

    qsa('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.page === page));
    $('topbar-title').textContent = pages[page].title;
    $('page-content').innerHTML = '<div class="empty-state"><div class="skeleton" style="width:100%;height:300px;border-radius:12px"></div></div>';
    state.selectedAssets.clear();
    removeSelectionBar();
    $('sidebar').classList.remove('open');
    $('select-all-btn').classList.toggle('hidden', !SELECT_ALL_PAGES.has(page));

    pages[page].render();
}

async function pollAdminJobs() {
    if (state.currentPage !== 'admin') {
        if (adminPollInterval) {
            clearInterval(adminPollInterval);
            adminPollInterval = null;
        }
        return;
    }

    try {
        const data = await API.getJobs();
        const content = $('job-list-content');
        if (!content) return;

        if (!data.jobs || !data.jobs.length) {
            content.innerHTML = `<p class="text-muted" style="font-size:13px;margin:0;padding:24px 0;text-align:center">${t('admin.no_jobs')}</p>`;
            return;
        }

        content.innerHTML = renderJobList(data.jobs);
    } catch (e) {
        console.error('Error polling jobs:', e);
    }
}

window.cancelJob = async function(jobId) {
    if (!confirm(t('admin.confirm_cancel_job'))) return;
    try {
        await API.cancelJob(jobId);
        toast(t('admin.job_cancelled'), 'success');
        pollAdminJobs();
    } catch (e) {
        toast(t('common.error_prefix') + e.message, 'error');
    }
}

window.addEventListener('hashchange', () => navigateTo(location.hash.slice(1)));
