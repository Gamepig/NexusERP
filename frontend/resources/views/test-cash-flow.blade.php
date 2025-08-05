<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>現金流量表顏色測試</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {}
            }
        }
    </script>
</head>
<body class="bg-gray-100 dark:bg-gray-900">
    <div class="container mx-auto p-8">
        <div class="mb-4 flex justify-between items-center">
            <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-200">現金流量表顏色主題測試</h1>
            <button onclick="toggleDarkMode()" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                切換深色模式
            </button>
        </div>

        <!-- 現金流摘要卡片 -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 class="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">營業活動現金流</h3>
                <p class="text-3xl font-bold text-green-600 dark:text-green-400">$3,200,000</p>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">較上期 +41.0%</p>
            </div>

            <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 class="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">投資活動現金流</h3>
                <p class="text-3xl font-bold text-orange-600 dark:text-orange-400">-$1,500,000</p>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">設備投資支出</p>
            </div>

            <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 class="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">籌資活動現金流</h3>
                <p class="text-3xl font-bold text-blue-600 dark:text-blue-400">-$450,000</p>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">償還借款</p>
            </div>
        </div>

        <!-- 現金流量表主體示例 -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 class="text-xl font-semibold mb-6 text-gray-800 dark:text-gray-200">現金流量表明細（部分）</h3>
            
            <table class="min-w-full">
                <thead>
                    <tr class="border-b-2 border-gray-200 dark:border-gray-700">
                        <th class="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">項目</th>
                        <th class="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">本期金額</th>
                        <th class="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">變動</th>
                    </tr>
                </thead>
                <tbody>
                    <!-- 營業活動 -->
                    <tr class="bg-green-50 dark:bg-green-900/20">
                        <td class="py-3 px-4 font-semibold text-green-800 dark:text-green-400" colspan="3">營業活動現金流量</td>
                    </tr>
                    <tr>
                        <td class="py-2 px-8 text-gray-600 dark:text-gray-400">　稅前淨利</td>
                        <td class="py-2 px-4 text-right text-gray-600 dark:text-gray-400">$3,770,000</td>
                        <td class="py-2 px-4 text-right text-green-600 dark:text-green-400">+60.4%</td>
                    </tr>
                    <tr class="bg-green-100 dark:bg-green-900/30 border-t dark:border-gray-700">
                        <td class="py-3 px-4 font-semibold text-green-800 dark:text-green-400">營業活動淨額</td>
                        <td class="py-3 px-4 text-right font-semibold text-green-800 dark:text-green-400">$3,200,000</td>
                        <td class="py-3 px-4 text-right text-green-600 dark:text-green-400 font-semibold">+41.0%</td>
                    </tr>

                    <!-- 投資活動 -->
                    <tr class="bg-orange-50 dark:bg-orange-900/20 border-t dark:border-gray-700">
                        <td class="py-3 px-4 font-semibold text-orange-800 dark:text-orange-400" colspan="3">投資活動現金流量</td>
                    </tr>
                    <tr>
                        <td class="py-2 px-8 text-gray-600 dark:text-gray-400">　取得固定資產</td>
                        <td class="py-2 px-4 text-right text-gray-600 dark:text-gray-400">($1,200,000)</td>
                        <td class="py-2 px-4 text-right text-red-600 dark:text-red-400">+50.0%</td>
                    </tr>
                    <tr class="bg-orange-100 dark:bg-orange-900/30 border-t dark:border-gray-700">
                        <td class="py-3 px-4 font-semibold text-orange-800 dark:text-orange-400">投資活動淨額</td>
                        <td class="py-3 px-4 text-right font-semibold text-orange-800 dark:text-orange-400">($1,500,000)</td>
                        <td class="py-3 px-4 text-right text-orange-600 dark:text-orange-400 font-semibold">+42.9%</td>
                    </tr>

                    <!-- 籌資活動 -->
                    <tr class="bg-blue-50 dark:bg-blue-900/20 border-t dark:border-gray-700">
                        <td class="py-3 px-4 font-semibold text-blue-800 dark:text-blue-400" colspan="3">籌資活動現金流量</td>
                    </tr>
                    <tr>
                        <td class="py-2 px-8 text-gray-600 dark:text-gray-400">　銀行借款增減</td>
                        <td class="py-2 px-4 text-right text-gray-600 dark:text-gray-400">($300,000)</td>
                        <td class="py-2 px-4 text-right text-red-600 dark:text-red-400">-160.0%</td>
                    </tr>
                    <tr class="bg-blue-100 dark:bg-blue-900/30 border-t dark:border-gray-700">
                        <td class="py-3 px-4 font-semibold text-blue-800 dark:text-blue-400">籌資活動淨額</td>
                        <td class="py-3 px-4 text-right font-semibold text-blue-800 dark:text-blue-400">($450,000)</td>
                        <td class="py-3 px-4 text-right text-blue-600 dark:text-blue-400 font-semibold">-221.6%</td>
                    </tr>

                    <!-- 現金總計 -->
                    <tr class="bg-gray-100 dark:bg-gray-700 border-t-2 dark:border-gray-600">
                        <td class="py-4 px-4 font-bold text-gray-800 dark:text-gray-200 text-lg">本期現金淨增減</td>
                        <td class="py-4 px-4 text-right font-bold text-gray-800 dark:text-gray-200 text-lg">$1,250,000</td>
                        <td class="py-4 px-4 text-right text-red-600 dark:text-red-400 font-bold">-21.4%</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- 健康指標 -->
        <div class="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
            <h4 class="text-lg font-semibold mb-4 text-blue-800 dark:text-blue-400">現金流健康指標</h4>
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div class="text-center">
                    <div class="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">256%</div>
                    <div class="text-sm text-blue-700 dark:text-blue-300">營業現金流佔比</div>
                </div>
                <div class="text-center">
                    <div class="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">4.2</div>
                    <div class="text-sm text-blue-700 dark:text-blue-300">現金週轉率</div>
                </div>
                <div class="text-center">
                    <div class="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-2">68天</div>
                    <div class="text-sm text-blue-700 dark:text-blue-300">現金週期</div>
                </div>
                <div class="text-center">
                    <div class="text-2xl font-bold text-orange-600 dark:text-orange-400 mb-2">12.8%</div>
                    <div class="text-sm text-blue-700 dark:text-blue-300">現金收益率</div>
                </div>
            </div>
        </div>
    </div>

    <script>
        function toggleDarkMode() {
            document.documentElement.classList.toggle('dark');
        }
    </script>
</body>
</html>