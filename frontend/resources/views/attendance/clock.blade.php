@extends('layouts.app')

@section('title', '出勤打卡')

@push('styles')
<style>
    .clock-display {
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        font-size: 3rem;
        line-height: 1;
    }
    
    .clock-in-btn {
        background: linear-gradient(135deg, #10b981, #059669);
        transition: all 0.3s ease;
        transform: translateY(0);
    }
    
    .clock-in-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 25px rgba(16, 185, 129, 0.3);
    }
    
    .clock-out-btn {
        background: linear-gradient(135deg, #ef4444, #dc2626);
        transition: all 0.3s ease;
        transform: translateY(0);
    }
    
    .clock-out-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 25px rgba(239, 68, 68, 0.3);
    }
    
    .status-card {
        backdrop-filter: blur(10px);
        background: rgba(255, 255, 255, 0.9);
    }
    
    .dark .status-card {
        background: rgba(31, 41, 55, 0.9);
    }
    
    .pulse-animation {
        animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
    }
    
    .attendance-history {
        max-height: 400px;
        overflow-y: auto;
    }
</style>
@endpush

@section('content')
<div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 py-6">
    <div class="container mx-auto px-4">
        <!-- Header -->
        <div class="text-center mb-8">
            <h1 class="text-4xl font-bold text-gray-900 mb-2">出勤打卡系統</h1>
            <p class="text-gray-600">員工出勤時間記錄</p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Clock Display and Controls -->
            <div class="lg:col-span-2">
                <div class="bg-white rounded-xl shadow-xl p-8 mb-6">
                    <!-- Current Time Display -->
                    <div class="text-center mb-8">
                        <div id="currentTime" class="clock-display text-gray-900 mb-2">
                            --:--:--
                        </div>
                        <div id="currentDate" class="text-xl text-gray-600">
                            ---- 年 -- 月 -- 日
                        </div>
                        <div id="currentDay" class="text-lg text-gray-500 mt-2">
                            星期--
                        </div>
                    </div>

                    <!-- Employee Selection -->
                    <div class="mb-6">
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            選擇員工或輸入工號
                        </label>
                        <div class="flex gap-3">
                            <div class="flex-1">
                                <input type="text" 
                                       id="employeeCodeInput" 
                                       placeholder="輸入員工工號 (例: EMP001)" 
                                       class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                            </div>
                            <button id="verifyEmployeeBtn" 
                                    class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                                驗證
                            </button>
                        </div>
                        <div id="employeeInfo" class="mt-3 p-3 bg-gray-50 rounded-lg hidden">
                            <div class="flex items-center">
                                <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                    <span id="employeeInitials" class="text-blue-600 font-semibold"></span>
                                </div>
                                <div>
                                    <div id="employeeName" class="font-semibold text-gray-900"></div>
                                    <div id="employeeDepartment" class="text-sm text-gray-600"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Clock In/Out Buttons -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <button id="clockInBtn" 
                                class="clock-in-btn text-white font-bold py-6 px-8 rounded-xl text-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                                disabled>
                            <div class="flex items-center justify-center">
                                <svg class="w-8 h-8 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                上班打卡
                            </div>
                            <div class="text-sm mt-1 opacity-90">Clock In</div>
                        </button>

                        <button id="clockOutBtn" 
                                class="clock-out-btn text-white font-bold py-6 px-8 rounded-xl text-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                                disabled>
                            <div class="flex items-center justify-center">
                                <svg class="w-8 h-8 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                下班打卡
                            </div>
                            <div class="text-sm mt-1 opacity-90">Clock Out</div>
                        </button>
                    </div>

                    <!-- Notes Input -->
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            備註 (選填)
                        </label>
                        <textarea id="notesInput" 
                                  rows="3" 
                                  placeholder="輸入備註..."
                                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"></textarea>
                    </div>

                    <!-- Quick Clock Buttons for Common Employees -->
                    <div id="quickClockSection" class="hidden">
                        <h3 class="text-lg font-semibold text-gray-900 mb-3">快速打卡</h3>
                        <div id="quickClockButtons" class="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <!-- Quick clock buttons will be populated here -->
                        </div>
                    </div>
                </div>
            </div>

            <!-- Status and History Sidebar -->
            <div class="space-y-6">
                <!-- Current Status Card -->
                <div class="status-card rounded-xl p-6 border border-gray-200">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">當前狀態</h3>
                    
                    <div id="currentStatus" class="space-y-3">
                        <div class="flex items-center justify-between">
                            <span class="text-gray-600">狀態:</span>
                            <span id="statusText" class="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                                未打卡
                            </span>
                        </div>
                        
                        <div id="clockInTime" class="flex items-center justify-between hidden">
                            <span class="text-gray-600">上班時間:</span>
                            <span class="text-gray-900 font-medium">--:--</span>
                        </div>
                        
                        <div id="workingDuration" class="flex items-center justify-between hidden">
                            <span class="text-gray-600">工作時長:</span>
                            <span class="text-gray-900 font-medium">--:--</span>
                        </div>
                    </div>
                </div>

                <!-- Today's Summary -->
                <div class="bg-white rounded-xl shadow-lg p-6">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">今日統計</h3>
                    
                    <div class="space-y-3">
                        <div class="flex items-center justify-between">
                            <span class="text-gray-600">出勤人數:</span>
                            <span id="todayPresentCount" class="text-emerald-600 font-semibold">-</span>
                        </div>
                        
                        <div class="flex items-center justify-between">
                            <span class="text-gray-600">缺勤人數:</span>
                            <span id="todayAbsentCount" class="text-red-600 font-semibold">-</span>
                        </div>
                        
                        <div class="flex items-center justify-between">
                            <span class="text-gray-600">遲到人數:</span>
                            <span id="todayLateCount" class="text-yellow-600 font-semibold">-</span>
                        </div>
                    </div>
                </div>

                <!-- Recent Activity -->
                <div class="bg-white rounded-xl shadow-lg p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-semibold text-gray-900">最近活動</h3>
                        <button onclick="refreshActivity()" 
                                class="text-blue-600 hover:text-blue-800">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>
                    </div>
                    
                    <div id="recentActivity" class="attendance-history space-y-3">
                        <div class="text-center text-gray-500 py-4">
                            載入中...
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Success/Error Messages -->
        <div id="messageContainer" class="fixed top-4 right-4 z-50"></div>
    </div>
</div>

<!-- Confirmation Modal -->
<div id="confirmationModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full hidden z-50">
    <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div class="mt-3">
            <div class="flex items-center justify-center mb-4">
                <div id="modalIcon" class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                    <svg class="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
            </div>
            <div class="text-center">
                <h3 id="modalTitle" class="text-lg leading-6 font-medium text-gray-900">
                    確認打卡
                </h3>
                <div class="mt-2 px-7 py-3">
                    <p id="modalMessage" class="text-sm text-gray-500">
                        您確定要進行打卡嗎？
                    </p>
                    <div id="modalTime" class="mt-3 text-lg font-semibold text-gray-900">
                        --:--:--
                    </div>
                </div>
                <div class="flex gap-3 mt-4">
                    <button id="confirmBtn" 
                            class="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors">
                        確認
                    </button>
                    <button onclick="closeConfirmationModal()" 
                            class="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded transition-colors">
                        取消
                    </button>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection

@push('scripts')
<script src="{{ asset('js/components/attendance/AttendanceClock.js') }}"></script>
<script>
document.addEventListener('DOMContentLoaded', function() {
    window.attendanceClock = new AttendanceClock();
});
</script>
@endpush