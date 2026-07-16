/**
 * Wimmich API Client - admin/tunnel/import/config endpoints.
 * Extends the API object defined in api.js (must load after it).
 */
Object.assign(API, {
    // Admin
    getAdminStats() { return this.request('/api/admin/stats'); },
    getAdminUsers() { return this.request('/api/admin/users'); },
    createUser(data) { return this.request('/api/admin/users', { method: 'POST', body: data }); },
    deleteUser(id) { return this.request(`/api/admin/users/${id}`, { method: 'DELETE' }); },
    updateUserQuota(id, quota) { return this.request(`/api/admin/users/${id}/quota`, { method: 'PUT', body: { storage_quota_mb: quota } }); },
    approveUser(id, isApproved) { return this.request(`/api/admin/users/${id}/approve`, { method: 'PUT', body: { is_approved: isApproved } }); },
    updateUserAdmin(id, isAdmin) { return this.request(`/api/admin/users/${id}/admin`, { method: 'PUT', body: { is_admin: isAdmin } }); },
    getJobs(status) { return this.request(`/api/admin/jobs${status ? '?status=' + status : ''}`); },
    runJob(type) { return this.request(`/api/admin/jobs/${type}/run`, { method: 'POST' }); },
    cancelJob(jobId) { return this.request(`/api/admin/jobs/${jobId}/cancel`, { method: 'POST' }); },
    cancelAllJobs() { return this.request('/api/admin/jobs/cancel-all', { method: 'POST' }); },

    // Tunnel
    getTunnelStatus() { return this.request('/api/tunnel/status'); },
    startTunnel() { return this.request('/api/tunnel/start', { method: 'POST' }); },
    stopTunnel() { return this.request('/api/tunnel/stop', { method: 'POST' }); },
    downloadCloudflared() { return this.request('/api/tunnel/download', { method: 'POST' }); },

    // Import
    browsePath(path) {
        return this.request('/api/import/browse', { method: 'POST', body: { path: path || '' } });
    },
    scanFolder(path, copyFiles = true, recursive = true) {
        return this.request('/api/import/scan', { method: 'POST', body: { path, copy_files: copyFiles, recursive } });
    },
    startImport(path, copyFiles = true, recursive = true) {
        return this.request('/api/import/start', { method: 'POST', body: { path, copy_files: copyFiles, recursive } });
    },
    getImportStatus(jobId) { return this.request(`/api/import/status/${jobId}`); },

    // Config
    getStorageConfig() { return this.request('/api/admin/config'); },
    updateStorageConfig(dataDir, tunnelToken, totalLimit, autoStart, tunnelCustomDomain) {
        return this.request('/api/admin/config', {
            method: 'POST',
            body: {
                data_dir: dataDir,
                tunnel_token: tunnelToken,
                total_storage_limit_mb: totalLimit,
                auto_start_tunnel: autoStart,
                tunnel_custom_domain: tunnelCustomDomain,
            }
        });
    },

    // Backup
    getBackupSettings() { return this.request('/api/admin/backup/settings'); },
    updateBackupSettings(backupDir, intervalHours, enabled) {
        return this.request('/api/admin/backup/settings', {
            method: 'POST',
            body: { backup_dir: backupDir, interval_hours: intervalHours, enabled },
        });
    },
});
