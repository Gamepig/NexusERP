/**
 * NexusERP Chart.js 深色主題配置
 * 專為 NexusERP 深色主題優化的圖表配置
 */

const NexusChartTheme = {
    // 顏色調色盤 - 與 NexusERP 主題顏色一致
    colorPalette: [
        '#8b5cf6', // 紫色 (主色)
        '#3b82f6', // 藍色
        '#10b981', // 綠色
        '#f59e0b', // 橘色
        '#ef4444', // 紅色
        '#06b6d4', // 青色
        '#8b5fbf', // 深紫色
        '#4fd1c7', // 淺青色
        '#9f7aea', // 淺紫色
        '#38b2ac'  // 青綠色
    ],

    // 預設配置
    defaults: {
        // 全域配置
        responsive: true,
        maintainAspectRatio: false,
        
        // 字體配置
        font: {
            family: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            size: 12,
            weight: '400'
        },
        
        // 顏色配置
        color: '#e1e5f2', // 主要文字顏色
        backgroundColor: 'transparent', // 透明背景讓容器背景顯示
        borderColor: '#4a5568',
        
        // 插件配置
        plugins: {
            legend: {
                labels: {
                    color: '#e1e5f2',
                    padding: 20,
                    usePointStyle: true,
                    font: {
                        family: "'Inter', sans-serif",
                        size: 12,
                        weight: '500'
                    }
                }
            },
            tooltip: {
                backgroundColor: '#2d3142',
                titleColor: '#e1e5f2',
                bodyColor: '#e1e5f2',
                borderColor: '#4a5568',
                borderWidth: 1,
                cornerRadius: 8,
                padding: 12,
                displayColors: true,
                titleFont: {
                    family: "'Inter', sans-serif",
                    size: 13,
                    weight: '600'
                },
                bodyFont: {
                    family: "'Inter', sans-serif",
                    size: 12,
                    weight: '400'
                }
            }
        },
        
        // 座標軸配置
        scales: {
            x: {
                ticks: {
                    color: '#a0aec0',
                    font: {
                        family: "'Inter', sans-serif",
                        size: 11
                    }
                },
                grid: {
                    color: '#4a5568',
                    borderColor: '#4a5568',
                    lineWidth: 1
                },
                border: {
                    color: '#4a5568'
                }
            },
            y: {
                ticks: {
                    color: '#a0aec0',
                    font: {
                        family: "'Inter', sans-serif",
                        size: 11
                    }
                },
                grid: {
                    color: '#4a5568',
                    borderColor: '#4a5568',
                    lineWidth: 1
                },
                border: {
                    color: '#4a5568'
                }
            }
        },
        
        // 動畫配置
        animation: {
            duration: 1000,
            easing: 'easeInOutQuart'
        }
    },

    /**
     * 套用主題到圖表配置
     */
    applyTheme: function(chartConfig) {
        // 深拷貝預設配置避免修改原始物件
        const themedConfig = JSON.parse(JSON.stringify(chartConfig));
        
        // 合併預設配置
        themedConfig.options = this.mergeDeep(this.defaults, themedConfig.options || {});
        
        // 套用顏色調色盤到資料集
        if (themedConfig.data && themedConfig.data.datasets) {
            themedConfig.data.datasets.forEach((dataset, index) => {
                const colorIndex = index % this.colorPalette.length;
                const baseColor = this.colorPalette[colorIndex];
                
                // 根據圖表類型設定顏色
                if (chartConfig.type === 'line') {
                    dataset.borderColor = dataset.borderColor || baseColor;
                    dataset.backgroundColor = dataset.backgroundColor || this.hexToRgba(baseColor, 0.1);
                    dataset.pointBackgroundColor = dataset.pointBackgroundColor || baseColor;
                    dataset.pointBorderColor = dataset.pointBorderColor || baseColor;
                    dataset.pointHoverBackgroundColor = dataset.pointHoverBackgroundColor || baseColor;
                    dataset.pointHoverBorderColor = dataset.pointHoverBorderColor || baseColor;
                } else if (chartConfig.type === 'bar') {
                    dataset.backgroundColor = dataset.backgroundColor || baseColor;
                    dataset.borderColor = dataset.borderColor || baseColor;
                    dataset.hoverBackgroundColor = dataset.hoverBackgroundColor || this.adjustBrightness(baseColor, 20);
                    dataset.hoverBorderColor = dataset.hoverBorderColor || this.adjustBrightness(baseColor, 20);
                } else if (chartConfig.type === 'doughnut' || chartConfig.type === 'pie') {
                    if (!dataset.backgroundColor) {
                        dataset.backgroundColor = this.colorPalette.slice(0, themedConfig.data.labels.length);
                    }
                    if (!dataset.borderColor) {
                        dataset.borderColor = '#2d3142';
                    }
                    dataset.borderWidth = dataset.borderWidth || 2;
                    dataset.hoverBorderWidth = dataset.hoverBorderWidth || 3;
                }
                
                // 設定通用屬性
                dataset.tension = dataset.tension !== undefined ? dataset.tension : 0.4;
            });
        }
        
        return themedConfig;
    },

    /**
     * 建立線性圖表配置
     */
    createLineChart: function(data, options = {}) {
        return this.applyTheme({
            type: 'line',
            data: data,
            options: {
                ...options,
                elements: {
                    point: {
                        radius: 4,
                        hoverRadius: 6,
                        borderWidth: 2,
                        hoverBorderWidth: 3
                    },
                    line: {
                        borderWidth: 3,
                        tension: 0.4
                    }
                }
            }
        });
    },

    /**
     * 建立長條圖配置
     */
    createBarChart: function(data, options = {}) {
        return this.applyTheme({
            type: 'bar',
            data: data,
            options: {
                ...options,
                borderRadius: 4,
                borderSkipped: false
            }
        });
    },

    /**
     * 建立甜甜圈圖配置
     */
    createDoughnutChart: function(data, options = {}) {
        return this.applyTheme({
            type: 'doughnut',
            data: data,
            options: {
                ...options,
                cutout: '65%',
                elements: {
                    arc: {
                        borderWidth: 2,
                        hoverBorderWidth: 3
                    }
                }
            }
        });
    },

    /**
     * 深度合併物件
     */
    mergeDeep: function(target, source) {
        const output = Object.assign({}, target);
        if (this.isObject(target) && this.isObject(source)) {
            Object.keys(source).forEach(key => {
                if (this.isObject(source[key])) {
                    if (!(key in target))
                        Object.assign(output, { [key]: source[key] });
                    else
                        output[key] = this.mergeDeep(target[key], source[key]);
                } else {
                    Object.assign(output, { [key]: source[key] });
                }
            });
        }
        return output;
    },

    /**
     * 檢查是否為物件
     */
    isObject: function(item) {
        return item && typeof item === 'object' && !Array.isArray(item);
    },

    /**
     * 將 hex 顏色轉換為 rgba
     */
    hexToRgba: function(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    },

    /**
     * 調整顏色亮度
     */
    adjustBrightness: function(hex, percent) {
        const num = parseInt(hex.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    },

    /**
     * 格式化貨幣數值
     */
    formatCurrency: function(value, currency = 'TWD') {
        return new Intl.NumberFormat('zh-TW', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    },

    /**
     * 格式化數字
     */
    formatNumber: function(value, decimals = 0) {
        return new Intl.NumberFormat('zh-TW', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(value);
    }
};

// 全域設定 Chart.js 預設值
if (typeof Chart !== 'undefined') {
    Chart.defaults.font.family = NexusChartTheme.defaults.font.family;
    Chart.defaults.font.size = NexusChartTheme.defaults.font.size;
    Chart.defaults.color = NexusChartTheme.defaults.color;
    Chart.defaults.backgroundColor = 'transparent';
    
    // 設定全域插件預設值
    Chart.defaults.plugins.legend.labels.color = NexusChartTheme.defaults.color;
    Chart.defaults.plugins.tooltip.backgroundColor = NexusChartTheme.defaults.plugins.tooltip.backgroundColor;
    Chart.defaults.plugins.tooltip.titleColor = NexusChartTheme.defaults.plugins.tooltip.titleColor;
    Chart.defaults.plugins.tooltip.bodyColor = NexusChartTheme.defaults.plugins.tooltip.bodyColor;
}

// 導出供其他檔案使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NexusChartTheme;
}