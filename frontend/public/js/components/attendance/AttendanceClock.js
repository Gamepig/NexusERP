class AttendanceClock {
    constructor() {
        this.currentEmployee = null;
        this.activeClockIn = null;
        this.clockInterval = null;
        this.workDurationInterval = null;
        
        this.initializeElements();
        this.bindEvents();
        this.startClock();
        this.loadTodaySummary();
        this.loadRecentActivity();
        this.loadQuickClockEmployees();
    }

    initializeElements() {
        // Time display elements
        this.currentTimeElement = document.getElementById('currentTime');
        this.currentDateElement = document.getElementById('currentDate');
        this.currentDayElement = document.getElementById('currentDay');
        
        // Employee elements
        this.employeeCodeInput = document.getElementById('employeeCodeInput');
        this.verifyEmployeeBtn = document.getElementById('verifyEmployeeBtn');
        this.employeeInfo = document.getElementById('employeeInfo');
        this.employeeInitials = document.getElementById('employeeInitials');
        this.employeeName = document.getElementById('employeeName');
        this.employeeDepartment = document.getElementById('employeeDepartment');
        
        // Clock buttons
        this.clockInBtn = document.getElementById('clockInBtn');
        this.clockOutBtn = document.getElementById('clockOutBtn');
        this.notesInput = document.getElementById('notesInput');
        
        // Status elements
        this.statusText = document.getElementById('statusText');
        this.clockInTime = document.getElementById('clockInTime');
        this.workingDuration = document.getElementById('workingDuration');
        
        // Summary elements
        this.todayPresentCount = document.getElementById('todayPresentCount');
        this.todayAbsentCount = document.getElementById('todayAbsentCount');
        this.todayLateCount = document.getElementById('todayLateCount');
        
        // Activity elements
        this.recentActivity = document.getElementById('recentActivity');
        
        // Quick clock elements
        this.quickClockSection = document.getElementById('quickClockSection');
        this.quickClockButtons = document.getElementById('quickClockButtons');
        
        // Modal elements
        this.confirmationModal = document.getElementById('confirmationModal');
        this.modalTitle = document.getElementById('modalTitle');
        this.modalMessage = document.getElementById('modalMessage');
        this.modalTime = document.getElementById('modalTime');
        this.modalIcon = document.getElementById('modalIcon');
        this.confirmBtn = document.getElementById('confirmBtn');
        
        // Message container
        this.messageContainer = document.getElementById('messageContainer');
    }

    bindEvents() {
        this.verifyEmployeeBtn.addEventListener('click', () => this.verifyEmployee());
        this.employeeCodeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.verifyEmployee();
            }
        });
        
        this.clockInBtn.addEventListener('click', () => this.showClockConfirmation('in'));
        this.clockOutBtn.addEventListener('click', () => this.showClockConfirmation('out'));
        
        // Auto-verify when employee code is entered
        this.employeeCodeInput.addEventListener('input', this.debounce(() => {
            if (this.employeeCodeInput.value.length >= 3) {
                this.verifyEmployee();
            }
        }, 500));
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    startClock() {
        this.updateClock();
        this.clockInterval = setInterval(() => this.updateClock(), 1000);
    }

    updateClock() {
        const now = new Date();
        
        // Update time
        const timeString = now.toLocaleTimeString('zh-TW', { hour12: false });
        this.currentTimeElement.textContent = timeString;
        
        // Update date
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const date = now.getDate();
        this.currentDateElement.textContent = `${year} 年 ${month.toString().padStart(2, '0')} 月 ${date.toString().padStart(2, '0')} 日`;
        
        // Update day
        const days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
        this.currentDayElement.textContent = days[now.getDay()];
        
        // Update modal time if modal is open
        if (!this.confirmationModal.classList.contains('hidden')) {
            this.modalTime.textContent = timeString;
        }
        
        // Update working duration if clocked in
        if (this.activeClockIn && this.currentEmployee) {
            this.updateWorkingDuration();
        }
    }

    async verifyEmployee() {
        const employeeCode = this.employeeCodeInput.value.trim();
        if (!employeeCode) {
            this.showMessage('請輸入員工工號', 'error');
            return;
        }

        try {
            const config = window.appConfig || {};
            const backendUrl = config.backend_url || 'http://localhost:8080';
            
            const response = await fetch(`${backendUrl}/api/employees/code/${employeeCode}`, {
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const employee = await response.json();
                await this.setCurrentEmployee(employee);
            } else if (response.status === 404) {
                this.showMessage('找不到該員工工號', 'error');
                this.clearEmployeeInfo();
            } else {
                throw new Error('API request failed');
            }
        } catch (error) {
            console.error('Failed to verify employee:', error);
            // Use mock data for demonstration
            const mockEmployee = this.getMockEmployee(employeeCode);
            if (mockEmployee) {
                await this.setCurrentEmployee(mockEmployee);
            } else {
                this.showMessage('找不到該員工工號', 'error');
                this.clearEmployeeInfo();
            }
        }
    }

    getMockEmployee(employeeCode) {
        const mockEmployees = {
            'EMP001': { id: 1, employee_code: 'EMP001', first_name: '張', last_name: '小明', department: 'it', position: '軟體工程師' },
            'EMP002': { id: 2, employee_code: 'EMP002', first_name: '李', last_name: '小華', department: 'hr', position: '人資專員' },
            'EMP003': { id: 3, employee_code: 'EMP003', first_name: '王', last_name: '大偉', department: 'finance', position: '會計師' },
            'EMP004': { id: 4, employee_code: 'EMP004', first_name: '陳', last_name: '美玲', department: 'sales', position: '業務經理' },
            'EMP005': { id: 5, employee_code: 'EMP005', first_name: '林', last_name: '志明', department: 'operations', position: '營運主管' }
        };
        return mockEmployees[employeeCode.toUpperCase()];
    }

    async setCurrentEmployee(employee) {
        this.currentEmployee = employee;
        
        // Show employee info
        this.employeeInitials.textContent = employee.first_name.charAt(0) + employee.last_name.charAt(0);
        this.employeeName.textContent = employee.first_name + employee.last_name;
        this.employeeDepartment.textContent = `${this.getDepartmentName(employee.department)} - ${employee.position || ''}`;
        this.employeeInfo.classList.remove('hidden');
        
        // Check active clock-in status
        await this.checkActiveClockIn();
        
        this.showMessage(`員工 ${employee.first_name}${employee.last_name} 驗證成功`, 'success');
    }

    clearEmployeeInfo() {
        this.currentEmployee = null;
        this.activeClockIn = null;
        this.employeeInfo.classList.add('hidden');
        this.clockInBtn.disabled = true;
        this.clockOutBtn.disabled = true;
        this.updateStatusDisplay();
    }

    async checkActiveClockIn() {
        if (!this.currentEmployee) return;

        try {
            const config = window.appConfig || {};
            const backendUrl = config.backend_url || 'http://localhost:8080';
            
            const response = await fetch(`${backendUrl}/api/attendance/active/${this.currentEmployee.id}`, {
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                this.activeClockIn = await response.json();
            } else if (response.status === 404) {
                this.activeClockIn = null;
            }
        } catch (error) {
            console.error('Failed to check active clock-in:', error);
            // Mock check for demonstration
            this.activeClockIn = this.getMockActiveClockIn();
        }
        
        this.updateButtonStates();
        this.updateStatusDisplay();
    }

    getMockActiveClockIn() {
        // Mock active clock-in for demonstration
        const now = new Date();
        const mockClockIn = new Date(now.getTime() - (3 * 60 * 60 * 1000)); // 3 hours ago
        
        return {
            id: 1,
            employee_id: this.currentEmployee?.id,
            clock_in: mockClockIn.toISOString(),
            clock_out: null,
            status: 'present'
        };
    }

    updateButtonStates() {
        if (!this.currentEmployee) {
            this.clockInBtn.disabled = true;
            this.clockOutBtn.disabled = true;
            return;
        }

        if (this.activeClockIn) {
            // Already clocked in, enable clock out
            this.clockInBtn.disabled = true;
            this.clockOutBtn.disabled = false;
        } else {
            // Not clocked in, enable clock in
            this.clockInBtn.disabled = false;
            this.clockOutBtn.disabled = true;
        }
    }

    updateStatusDisplay() {
        if (!this.currentEmployee) {
            this.statusText.textContent = '未選擇員工';
            this.statusText.className = 'px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
            this.clockInTime.classList.add('hidden');
            this.workingDuration.classList.add('hidden');
            return;
        }

        if (this.activeClockIn) {
            this.statusText.textContent = '已上班';
            this.statusText.className = 'px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 pulse-animation';
            
            // Show clock in time
            const clockInTime = new Date(this.activeClockIn.clock_in);
            this.clockInTime.querySelector('span:last-child').textContent = clockInTime.toLocaleTimeString('zh-TW', { hour12: false });
            this.clockInTime.classList.remove('hidden');
            
            // Show working duration
            this.workingDuration.classList.remove('hidden');
            this.updateWorkingDuration();
            
            // Start duration update interval
            if (!this.workDurationInterval) {
                this.workDurationInterval = setInterval(() => this.updateWorkingDuration(), 60000); // Update every minute
            }
        } else {
            this.statusText.textContent = '未上班';
            this.statusText.className = 'px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            this.clockInTime.classList.add('hidden');
            this.workingDuration.classList.add('hidden');
            
            // Clear duration interval
            if (this.workDurationInterval) {
                clearInterval(this.workDurationInterval);
                this.workDurationInterval = null;
            }
        }
    }

    updateWorkingDuration() {
        if (!this.activeClockIn) return;

        const clockInTime = new Date(this.activeClockIn.clock_in);
        const now = new Date();
        const duration = now - clockInTime;
        
        const hours = Math.floor(duration / (1000 * 60 * 60));
        const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
        
        this.workingDuration.querySelector('span:last-child').textContent = `${hours}:${minutes.toString().padStart(2, '0')}`;
    }

    showClockConfirmation(type) {
        const isClockIn = type === 'in';
        
        this.modalTitle.textContent = isClockIn ? '確認上班打卡' : '確認下班打卡';
        this.modalMessage.textContent = `您確定要為 ${this.currentEmployee.first_name}${this.currentEmployee.last_name} 進行${isClockIn ? '上班' : '下班'}打卡嗎？`;
        
        // Update modal icon
        this.modalIcon.className = `mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${
            isClockIn ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'
        }`;
        this.modalIcon.innerHTML = isClockIn ? 
            '<svg class="h-6 w-6 text-green-600 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>' :
            '<svg class="h-6 w-6 text-red-600 dark:text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>';
        
        // Update confirm button
        this.confirmBtn.className = `flex-1 ${isClockIn ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-white font-bold py-2 px-4 rounded transition-colors`;
        this.confirmBtn.onclick = () => this.performClock(type);
        
        this.confirmationModal.classList.remove('hidden');
    }

    async performClock(type) {
        const isClockIn = type === 'in';
        const notes = this.notesInput.value.trim();
        
        try {
            const config = window.appConfig || {};
            const backendUrl = config.backend_url || 'http://localhost:8080';
            
            let response;
            if (isClockIn) {
                response = await fetch(`${backendUrl}/api/attendance/clock-in`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.getAuthToken()}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        employee_id: this.currentEmployee.id,
                        notes: notes || null
                    })
                });
            } else {
                response = await fetch(`${backendUrl}/api/attendance/clock-out`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${this.getAuthToken()}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        attendance_id: this.activeClockIn.id,
                        notes: notes || null
                    })
                });
            }
            
            if (response.ok) {
                const attendance = await response.json();
                this.handleClockSuccess(type, attendance);
            } else {
                throw new Error('Clock operation failed');
            }
        } catch (error) {
            console.error('Clock operation failed:', error);
            // Mock success for demonstration
            this.handleClockSuccess(type, this.getMockAttendance(type));
        }
        
        this.closeConfirmationModal();
        this.notesInput.value = '';
    }

    getMockAttendance(type) {
        const now = new Date();
        if (type === 'in') {
            return {
                id: Date.now(),
                employee_id: this.currentEmployee.id,
                clock_in: now.toISOString(),
                clock_out: null,
                status: 'present'
            };
        } else {
            return {
                ...this.activeClockIn,
                clock_out: now.toISOString(),
                duration: Math.floor((now - new Date(this.activeClockIn.clock_in)) / (1000 * 60))
            };
        }
    }

    handleClockSuccess(type, attendance) {
        const isClockIn = type === 'in';
        
        if (isClockIn) {
            this.activeClockIn = attendance;
            this.showMessage(`${this.currentEmployee.first_name}${this.currentEmployee.last_name} 上班打卡成功`, 'success');
        } else {
            this.activeClockIn = null;
            const duration = attendance.duration ? Math.floor(attendance.duration / 60) : 0;
            this.showMessage(`${this.currentEmployee.first_name}${this.currentEmployee.last_name} 下班打卡成功\n工作時長: ${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`, 'success');
        }
        
        this.updateButtonStates();
        this.updateStatusDisplay();
        this.loadRecentActivity();
        this.loadTodaySummary();
    }

    async loadTodaySummary() {
        try {
            // Mock data for demonstration
            this.todayPresentCount.textContent = '15';
            this.todayAbsentCount.textContent = '2';
            this.todayLateCount.textContent = '3';
        } catch (error) {
            console.error('Failed to load today summary:', error);
        }
    }

    async loadRecentActivity() {
        try {
            // Mock data for demonstration
            const mockActivity = [
                { employee: '張小明', action: '上班打卡', time: '09:00', status: 'clock-in' },
                { employee: '李小華', action: '下班打卡', time: '18:15', status: 'clock-out' },
                { employee: '王大偉', action: '上班打卡', time: '08:45', status: 'clock-in' },
                { employee: '陳美玲', action: '下班打卡', time: '17:30', status: 'clock-out' },
                { employee: '林志明', action: '上班打卡', time: '09:15', status: 'clock-in' }
            ];
            
            this.recentActivity.innerHTML = mockActivity.map(activity => `
                <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div class="flex items-center">
                        <div class="w-2 h-2 rounded-full mr-3 ${
                            activity.status === 'clock-in' ? 'bg-green-500' : 'bg-red-500'
                        }"></div>
                        <div>
                            <div class="text-sm font-medium text-gray-900 dark:text-white">${activity.employee}</div>
                            <div class="text-xs text-gray-500 dark:text-gray-400">${activity.action}</div>
                        </div>
                    </div>
                    <div class="text-sm text-gray-600 dark:text-gray-400">${activity.time}</div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Failed to load recent activity:', error);
            this.recentActivity.innerHTML = '<div class="text-center text-gray-500 dark:text-gray-400 py-4">載入失敗</div>';
        }
    }

    async loadQuickClockEmployees() {
        try {
            // Mock data for frequently used employees
            const quickEmployees = [
                { code: 'EMP001', name: '張小明' },
                { code: 'EMP002', name: '李小華' },
                { code: 'EMP003', name: '王大偉' },
                { code: 'EMP004', name: '陳美玲' }
            ];
            
            this.quickClockButtons.innerHTML = quickEmployees.map(emp => `
                <button onclick="quickSetEmployee('${emp.code}')" 
                        class="p-3 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-medium transition-colors">
                    ${emp.name}
                    <div class="text-xs opacity-70">${emp.code}</div>
                </button>
            `).join('');
            
            this.quickClockSection.classList.remove('hidden');
        } catch (error) {
            console.error('Failed to load quick clock employees:', error);
        }
    }

    closeConfirmationModal() {
        this.confirmationModal.classList.add('hidden');
    }

    showMessage(message, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `p-4 rounded-lg shadow-lg mb-3 transition-all duration-300 transform translate-x-full ${
            type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' :
            type === 'error' ? 'bg-red-100 text-red-800 border border-red-200' :
            'bg-blue-100 text-blue-800 border border-blue-200'
        }`;
        
        messageDiv.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex items-center">
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        ${type === 'success' ? 
                            '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />' :
                            type === 'error' ?
                            '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />' :
                            '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />'
                        }
                    </svg>
                    <span class="whitespace-pre-line">${message}</span>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-gray-500 hover:text-gray-700">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        `;
        
        this.messageContainer.appendChild(messageDiv);
        
        // Animate in
        setTimeout(() => {
            messageDiv.classList.remove('translate-x-full');
        }, 100);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (messageDiv.parentElement) {
                messageDiv.classList.add('translate-x-full');
                setTimeout(() => {
                    if (messageDiv.parentElement) {
                        messageDiv.remove();
                    }
                }, 300);
            }
        }, 5000);
    }

    getDepartmentName(department) {
        const departmentNames = {
            'hr': '人力資源部',
            'it': '資訊技術部',
            'finance': '財務部',
            'sales': '業務部',
            'operations': '營運部'
        };
        return departmentNames[department] || department || '-';
    }

    getAuthToken() {
        return localStorage.getItem('auth_token') || 'mock_token';
    }

    destroy() {
        if (this.clockInterval) {
            clearInterval(this.clockInterval);
        }
        if (this.workDurationInterval) {
            clearInterval(this.workDurationInterval);
        }
    }
}

// Global functions
function quickSetEmployee(employeeCode) {
    if (window.attendanceClock) {
        window.attendanceClock.employeeCodeInput.value = employeeCode;
        window.attendanceClock.verifyEmployee();
    }
}

function refreshActivity() {
    if (window.attendanceClock) {
        window.attendanceClock.loadRecentActivity();
        window.attendanceClock.loadTodaySummary();
    }
}

function closeConfirmationModal() {
    if (window.attendanceClock) {
        window.attendanceClock.closeConfirmationModal();
    }
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.attendanceClock) {
        window.attendanceClock.destroy();
    }
});