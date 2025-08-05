@extends('layouts.app')

@section('title', '員工詳情')

@section('content')
<!-- 讀取風格指南配置 -->
<?php
$stylePath = public_path('style/style.json');
if (file_exists($stylePath)) {
    $style = json_decode(file_get_contents($stylePath), true);
    $colors = $style['style_guide']['colors'] ?? [];
    $components = $style['style_guide']['components'] ?? [];
} else {
    // 預設樣式配置
    $colors = [
        'primary' => ['background' => '#1f2937', 'card_background' => '#374151'],
        'text' => ['primary' => '#f9fafb', 'secondary' => '#d1d5db'],
        'accent' => ['purple' => '#8b5cf6', 'blue' => '#3b82f6', 'green' => '#10b981', 'orange' => '#f59e0b', 'red' => '#ef4444'],
        'border' => ['primary' => '#4b5563']
    ];
    $components = [
        'card' => ['default' => ['border_radius' => '8px', 'padding' => '1.5rem', 'box_shadow' => '0 4px 6px -1px rgba(0, 0, 0, 0.1)']],
        'button' => ['primary' => ['border_radius' => '6px', 'padding' => '0.75rem 1rem']]
    ];
}
?>

<style>
/* NexusERP 深色主題樣式 */
:root {
    --nexus-primary-bg: <?php echo $colors['primary']['background']; ?>;
    --nexus-secondary-bg: <?php echo $colors['primary']['secondary_background'] ?? $colors['primary']['card_background']; ?>;
    --nexus-card-bg: <?php echo $colors['primary']['card_background']; ?>;
    --nexus-text-primary: <?php echo $colors['text']['primary']; ?>;
    --nexus-text-secondary: <?php echo $colors['text']['secondary']; ?>;
    --nexus-text-muted: <?php echo $colors['text']['muted'] ?? $colors['text']['secondary']; ?>;
    --nexus-accent-purple: <?php echo $colors['accent']['purple']; ?>;
    --nexus-accent-blue: <?php echo $colors['accent']['blue']; ?>;
    --nexus-accent-green: <?php echo $colors['accent']['green']; ?>;
    --nexus-accent-orange: <?php echo $colors['accent']['orange']; ?>;
    --nexus-accent-red: <?php echo $colors['accent']['red']; ?>;
    --nexus-border-primary: <?php echo $colors['border']['primary']; ?>;
}

body {
    background-color: var(--nexus-primary-bg);
    color: var(--nexus-text-primary);
}

.nx-card {
    background: var(--nexus-card-bg);
    border: 1px solid var(--nexus-border-primary);
    border-radius: <?php echo $components['card']['default']['border_radius']; ?>;
    box-shadow: <?php echo $components['card']['default']['box_shadow']; ?>;
}

.status-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 500;
}

.status-active {
    background: rgba(16, 185, 129, 0.2);
    color: var(--nexus-accent-green);
    border: 1px solid rgba(16, 185, 129, 0.3);
}

.status-inactive {
    background: rgba(107, 114, 128, 0.2);
    color: #9ca3af;
    border: 1px solid rgba(107, 114, 128, 0.3);
}

.status-terminated {
    background: rgba(239, 68, 68, 0.2);
    color: var(--nexus-accent-red);
    border: 1px solid rgba(239, 68, 68, 0.3);
}

.status-on_leave {
    background: rgba(245, 158, 11, 0.2);
    color: var(--nexus-accent-orange);
    border: 1px solid rgba(245, 158, 11, 0.3);
}

.nx-btn {
    border-radius: 0.5rem;
    padding: 0.5rem 1rem;
    font-weight: 500;
    transition: all 0.2s;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
}

.nx-btn-primary {
    background: var(--nexus-accent-purple);
    color: white;
    border: none;
}

.nx-btn-primary:hover {
    background: #7c3aed;
    color: white;
}

.nx-btn-secondary {
    background: var(--nexus-accent-blue);
    color: white;
    border: none;
}

.nx-btn-secondary:hover {
    background: #2563eb;
    color: white;
}

.nx-btn-danger {
    background: var(--nexus-accent-red);
    color: white;
    border: none;
}

.nx-btn-danger:hover {
    background: #dc2626;
    color: white;
}

.info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
}

.info-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.info-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--nexus-text-secondary);
}

.info-value {
    font-size: 1rem;
    color: var(--nexus-text-primary);
}

.attendance-item {
    padding: 1rem;
    border: 1px solid var(--nexus-border-primary);
    border-radius: 0.5rem;
    margin-bottom: 0.75rem;
}

.attendance-date {
    font-weight: 600;
    color: var(--nexus-text-primary);
    margin-bottom: 0.5rem;
}

.attendance-time {
    font-size: 0.875rem;
    color: var(--nexus-text-secondary);
}
</style>

<div class="min-h-screen py-6" style="background-color: var(--nexus-primary-bg);">
    <div class="container mx-auto px-4">
        <!-- Header -->
        <div class="nx-card mb-6">
            <div class="p-6 border-b" style="border-color: var(--nexus-border-primary);">
                <div class="flex justify-between items-start">
                    <div class="flex items-center space-x-4">
                        <div class="w-16 h-16 rounded-full flex items-center justify-center" style="background: rgba(139, 92, 246, 0.2);">
                            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color: var(--nexus-accent-purple);">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <div>
                            <h1 id="employeeName" class="text-3xl font-bold" style="color: var(--nexus-text-primary);">載入中...</h1>
                            <div class="flex items-center space-x-3 mt-2">
                                <span id="employeeCode" class="text-lg" style="color: var(--nexus-text-secondary);">-</span>
                                <span id="employeeStatus" class="status-badge">-</span>
                            </div>
                        </div>
                    </div>
                    <div class="flex space-x-3">
                        <a href="#" id="editButton" class="nx-btn nx-btn-primary">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            編輯員工
                        </a>
                        <a href="{{ route('employees.index') }}" class="nx-btn nx-btn-secondary">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            返回列表
                        </a>
                    </div>
                </div>
            </div>
        </div>

        <!-- Loading State -->
        <div id="loadingState" class="nx-card p-8 text-center">
            <div class="inline-flex items-center">
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" style="color: var(--nexus-accent-purple);">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span style="color: var(--nexus-text-primary);">載入員工詳情中...</span>
            </div>
        </div>

        <!-- Content -->
        <div id="employeeContent" class="hidden">
            <!-- Basic Information -->
            <div class="nx-card mb-6">
                <div class="p-6 border-b" style="border-color: var(--nexus-border-primary);">
                    <h2 class="text-xl font-semibold" style="color: var(--nexus-text-primary);">基本資訊</h2>
                </div>
                <div class="p-6">
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="info-label">員工姓名</span>
                            <span id="detailName" class="info-value">-</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">員工編號</span>
                            <span id="detailCode" class="info-value">-</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">電子郵件</span>
                            <span id="detailEmail" class="info-value">-</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">聯絡電話</span>
                            <span id="detailPhone" class="info-value">-</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">部門</span>
                            <span id="detailDepartment" class="info-value">-</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">職位</span>
                            <span id="detailPosition" class="info-value">-</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">到職日期</span>
                            <span id="detailHireDate" class="info-value">-</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">員工狀態</span>
                            <span id="detailStatus" class="info-value">-</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Additional Details -->
            <div class="nx-card mb-6">
                <div class="p-6 border-b" style="border-color: var(--nexus-border-primary);">
                    <h2 class="text-xl font-semibold" style="color: var(--nexus-text-primary);">詳細資訊</h2>
                </div>
                <div class="p-6">
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="info-label">薪資</span>
                            <span id="detailSalary" class="info-value">-</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">地址</span>
                            <span id="detailAddress" class="info-value">-</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">緊急聯絡人</span>
                            <span id="detailEmergencyContact" class="info-value">-</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">離職日期</span>
                            <span id="detailTerminationDate" class="info-value">-</span>
                        </div>
                    </div>
                    <div class="mt-6">
                        <div class="info-item">
                            <span class="info-label">備註</span>
                            <span id="detailNotes" class="info-value">-</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Recent Attendance -->
            <div class="nx-card mb-6">
                <div class="p-6 border-b" style="border-color: var(--nexus-border-primary);">
                    <div class="flex justify-between items-center">
                        <h2 class="text-xl font-semibold" style="color: var(--nexus-text-primary);">最近出勤記錄</h2>
                        <span class="text-sm" style="color: var(--nexus-text-secondary);">最近 10 筆記錄</span>
                    </div>
                </div>
                <div class="p-6">
                    <div id="attendanceList">
                        <div class="text-center py-8">
                            <svg class="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color: var(--nexus-text-secondary);">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p class="mt-2" style="color: var(--nexus-text-secondary);">載入出勤記錄中...</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Actions -->
            <div class="nx-card">
                <div class="p-6">
                    <div class="flex justify-between items-center">
                        <div>
                            <h3 class="text-lg font-medium" style="color: var(--nexus-text-primary);">操作</h3>
                            <p class="text-sm mt-1" style="color: var(--nexus-text-secondary);">對此員工執行各種操作</p>
                        </div>
                        <div class="flex space-x-3">
                            <button onclick="deleteEmployee()" class="nx-btn nx-btn-danger">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                刪除員工
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Error State -->
        <div id="errorState" class="nx-card p-8 text-center hidden">
            <svg class="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color: var(--nexus-accent-red);">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h3 class="mt-2 text-lg font-medium" style="color: var(--nexus-text-primary);">載入失敗</h3>
            <p class="mt-1" style="color: var(--nexus-text-secondary);">無法載入員工詳情，請稍後再試</p>
            <div class="mt-6">
                <button onclick="location.reload()" class="nx-btn nx-btn-primary">重新載入</button>
            </div>
        </div>
    </div>
</div>

<!-- Delete Confirmation Modal -->
<div id="deleteModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full hidden z-50">
    <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div class="mt-3 text-center">
            <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 18.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
            </div>
            <h3 class="text-lg leading-6 font-medium text-gray-900 mt-4">確認刪除</h3>
            <div class="mt-2 px-7 py-3">
                <p class="text-sm text-gray-500">
                    您確定要刪除此員工嗎？此操作無法復原。
                </p>
            </div>
            <div class="items-center px-4 py-3">
                <button id="confirmDelete" class="px-4 py-2 bg-red-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300">
                    確認刪除
                </button>
                <button onclick="closeDeleteModal()" class="mt-3 px-4 py-2 bg-gray-300 text-gray-800 text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300">
                    取消
                </button>
            </div>
        </div>
    </div>
</div>
@endsection

@push('scripts')
<script>
document.addEventListener('DOMContentLoaded', function() {
    const employeeId = {{ $employeeId ?? 'null' }};
    
    if (!employeeId) {
        showError();
        return;
    }
    
    loadEmployeeDetails(employeeId);
});

async function loadEmployeeDetails(employeeId) {
    try {
        const response = await fetch(`/api/employees/${employeeId}`);
        
        if (!response.ok) {
            // 如果 API 不可用，使用 mock 資料
            if (response.status === 404 || response.status >= 500) {
                loadMockEmployeeDetails(employeeId);
                return;
            }
            throw new Error('Failed to load employee');
        }
        
        const data = await response.json();
        
        if (data.success) {
            displayEmployeeDetails(data.data);
        } else {
            throw new Error(data.message || 'Failed to load employee');
        }
    } catch (error) {
        console.log('API error, using mock data:', error);
        loadMockEmployeeDetails(employeeId);
    }
}

function loadMockEmployeeDetails(employeeId) {
    // Mock 員工資料
    const mockEmployees = {
        1: {
            id: 1,
            first_name: '張',
            last_name: '三',
            employee_code: 'EMP001',
            email: 'zhang.san@company.com',
            phone: '0912-345-678',
            department: '資訊部',
            position: '軟體工程師',
            hire_date: '2023-01-15',
            status: 'active',
            salary: 45000,
            address: '台北市信義區信義路五段7號',
            emergency_contact: '張四 (父親) - 0987-654-321',
            termination_date: null,
            notes: '表現優秀，具備豐富的程式開發經驗'
        },
        2: {
            id: 2,
            first_name: '李',
            last_name: '四',
            employee_code: 'EMP002',
            email: 'li.si@company.com',
            phone: '0987-654-321',
            department: '業務部',
            position: '業務代表',
            hire_date: '2023-03-01',
            status: 'active',
            salary: 38000,
            address: '台北市大安區忠孝東路四段181號',
            emergency_contact: '李五 (配偶) - 0912-345-678',
            termination_date: null,
            notes: '業務能力強，客戶關係良好'
        },
        3: {
            id: 3,
            first_name: '王',
            last_name: '五',
            employee_code: 'EMP003',
            email: 'wang.wu@company.com',
            phone: '0965-432-109',
            department: '人事部',
            position: '人事專員',
            hire_date: '2022-11-20',
            status: 'on_leave',
            salary: 42000,
            address: '台北市中山區南京東路二段125號',
            emergency_contact: '王六 (兄弟) - 0976-543-210',
            termination_date: null,
            notes: '目前請育嬰假，預計明年復職'
        }
    };
    
    const employee = mockEmployees[employeeId];
    if (employee) {
        displayEmployeeDetails(employee);
    } else {
        showError();
    }
}

function displayEmployeeDetails(employee) {
    // 隱藏載入狀態
    document.getElementById('loadingState').classList.add('hidden');
    document.getElementById('employeeContent').classList.remove('hidden');
    
    // 更新頁面標題區域
    document.getElementById('employeeName').textContent = `${employee.first_name}${employee.last_name}`;
    document.getElementById('employeeCode').textContent = employee.employee_code;
    
    // 更新狀態徽章
    const statusElement = document.getElementById('employeeStatus');
    statusElement.textContent = formatStatus(employee.status);
    statusElement.className = `status-badge status-${employee.status}`;
    
    // 更新編輯按鈕連結
    document.getElementById('editButton').href = `/employees/${employee.id}/edit`;
    
    // 更新基本資訊
    document.getElementById('detailName').textContent = `${employee.first_name}${employee.last_name}`;
    document.getElementById('detailCode').textContent = employee.employee_code;
    document.getElementById('detailEmail').textContent = employee.email || '未填寫';
    document.getElementById('detailPhone').textContent = employee.phone || '未填寫';
    document.getElementById('detailDepartment').textContent = employee.department || '未指派';
    document.getElementById('detailPosition').textContent = employee.position || '未指派';
    document.getElementById('detailHireDate').textContent = formatDate(employee.hire_date);
    document.getElementById('detailStatus').textContent = formatStatus(employee.status);
    
    // 更新詳細資訊
    document.getElementById('detailSalary').textContent = employee.salary ? `NT$ ${employee.salary.toLocaleString()}` : '未填寫';
    document.getElementById('detailAddress').textContent = employee.address || '未填寫';
    document.getElementById('detailEmergencyContact').textContent = employee.emergency_contact || '未填寫';
    document.getElementById('detailTerminationDate').textContent = employee.termination_date ? formatDate(employee.termination_date) : '未離職';
    document.getElementById('detailNotes').textContent = employee.notes || '無備註';
    
    // 載入出勤記錄
    loadAttendanceRecords(employee.id);
    
    // 設置刪除確認
    document.getElementById('confirmDelete').onclick = () => confirmDeleteEmployee(employee.id);
}

function loadAttendanceRecords(employeeId) {
    // Mock 出勤記錄資料
    const mockAttendance = [
        {
            id: 1,
            clock_in: '2025-07-24T09:00:00',
            clock_out: '2025-07-24T18:00:00',
            duration: 480,
            status: 'present'
        },
        {
            id: 2,
            clock_in: '2025-07-23T08:45:00',
            clock_out: '2025-07-23T17:30:00',
            duration: 465,
            status: 'present'
        },
        {
            id: 3,
            clock_in: '2025-07-22T09:15:00',
            clock_out: '2025-07-22T18:15:00',
            duration: 480,
            status: 'late'
        }
    ];
    
    const attendanceList = document.getElementById('attendanceList');
    
    if (mockAttendance.length === 0) {
        attendanceList.innerHTML = `
            <div class="text-center py-8">
                <svg class="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color: var(--nexus-text-secondary);">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p class="mt-2" style="color: var(--nexus-text-secondary);">暫無出勤記錄</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    mockAttendance.forEach(record => {
        html += `
            <div class="attendance-item">
                <div class="attendance-date">${formatDate(record.clock_in)}</div>
                <div class="attendance-time">
                    上班: ${formatTime(record.clock_in)} | 
                    下班: ${record.clock_out ? formatTime(record.clock_out) : '未打卡'} | 
                    時數: ${record.duration ? (record.duration / 60).toFixed(1) : '0'} 小時
                </div>
                <div class="mt-2">
                    <span class="status-badge status-${record.status === 'present' ? 'active' : 'on_leave'}">
                        ${record.status === 'present' ? '正常出勤' : record.status === 'late' ? '遲到' : '其他'}
                    </span>
                </div>
            </div>
        `;
    });
    
    attendanceList.innerHTML = html;
}

function showError() {
    document.getElementById('loadingState').classList.add('hidden');
    document.getElementById('errorState').classList.remove('hidden');
}

function formatStatus(status) {
    const statusMap = {
        'active': '在職',
        'inactive': '停職',
        'on_leave': '請假',
        'terminated': '離職'
    };
    return statusMap[status] || status;
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

function formatTime(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleTimeString('zh-TW', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function deleteEmployee() {
    document.getElementById('deleteModal').classList.remove('hidden');
}

function closeDeleteModal() {
    document.getElementById('deleteModal').classList.add('hidden');
}

function confirmDeleteEmployee(employeeId) {
    // 這裡應該呼叫刪除 API
    alert('員工刪除功能尚未實作');
    closeDeleteModal();
}
</script>
@endpush