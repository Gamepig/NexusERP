import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';
import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.js',
        './resources/js/**/*.vue',
    ],

    // 支援多種暗色模式策略
    darkMode: ['class', '[data-theme="dark"]'],

    theme: {
        // 覆寫 Tailwind 預設值以使用 NexusERP 設計令牌
        screens: {
            'sm': '640px',
            'md': '768px', 
            'lg': '1024px',
            'xl': '1280px',
            '2xl': '1536px',
        },
        
        colors: {
            // 透明與白黑保持 Tailwind 預設
            transparent: 'transparent',
            current: 'currentColor',
            white: '#ffffff',
            black: '#000000',
            
            // NexusERP 品牌色系 - 直接對應設計令牌
            nexus: {
                primary: {
                    50: 'var(--nexus-primary-50)',
                    100: 'var(--nexus-primary-100)', 
                    200: 'var(--nexus-primary-200)',
                    300: 'var(--nexus-primary-300)',
                    400: 'var(--nexus-primary-400)',
                    500: 'var(--nexus-primary-500)',
                    600: 'var(--nexus-primary-600)',
                    700: 'var(--nexus-primary-700)',
                    800: 'var(--nexus-primary-800)',
                    900: 'var(--nexus-primary-900)',
                    950: 'var(--nexus-primary-950)',
                },
                gray: {
                    50: 'var(--nexus-gray-50)',
                    100: 'var(--nexus-gray-100)',
                    200: 'var(--nexus-gray-200)',
                    300: 'var(--nexus-gray-300)',
                    400: 'var(--nexus-gray-400)',
                    500: 'var(--nexus-gray-500)',
                    600: 'var(--nexus-gray-600)',
                    700: 'var(--nexus-gray-700)',
                    800: 'var(--nexus-gray-800)',
                    900: 'var(--nexus-gray-900)',
                    950: 'var(--nexus-gray-950)',
                },
                success: {
                    50: 'var(--nexus-success-50)',
                    100: 'var(--nexus-success-100)',
                    500: 'var(--nexus-success-500)',
                    600: 'var(--nexus-success-600)',
                    700: 'var(--nexus-success-700)',
                },
                warning: {
                    50: 'var(--nexus-warning-50)',
                    100: 'var(--nexus-warning-100)',
                    500: 'var(--nexus-warning-500)',
                    600: 'var(--nexus-warning-600)',
                    700: 'var(--nexus-warning-700)',
                },
                error: {
                    50: 'var(--nexus-error-50)',
                    100: 'var(--nexus-error-100)',
                    500: 'var(--nexus-error-500)',
                    600: 'var(--nexus-error-600)',
                    700: 'var(--nexus-error-700)',
                },
                info: {
                    50: 'var(--nexus-info-50)',
                    100: 'var(--nexus-info-100)',
                    500: 'var(--nexus-info-500)',
                    600: 'var(--nexus-info-600)',
                    700: 'var(--nexus-info-700)',
                },
                purple: {
                    500: 'var(--nexus-purple-500)',
                    600: 'var(--nexus-purple-600)',
                },
                indigo: {
                    500: 'var(--nexus-indigo-500)',
                    600: 'var(--nexus-indigo-600)',
                }
            },
            
            // 語義化顏色別名 - 方便使用
            primary: {
                50: 'var(--nexus-primary-50)',
                100: 'var(--nexus-primary-100)',
                200: 'var(--nexus-primary-200)',
                300: 'var(--nexus-primary-300)',
                400: 'var(--nexus-primary-400)',
                500: 'var(--nexus-primary-500)',
                600: 'var(--nexus-primary-600)',
                700: 'var(--nexus-primary-700)',
                800: 'var(--nexus-primary-800)',
                900: 'var(--nexus-primary-900)',
            },
            gray: {
                50: 'var(--nexus-gray-50)',
                100: 'var(--nexus-gray-100)',
                200: 'var(--nexus-gray-200)',
                300: 'var(--nexus-gray-300)',
                400: 'var(--nexus-gray-400)',
                500: 'var(--nexus-gray-500)',
                600: 'var(--nexus-gray-600)',
                700: 'var(--nexus-gray-700)',
                800: 'var(--nexus-gray-800)',
                900: 'var(--nexus-gray-900)',
            },
            
            // 狀態色別名
            success: 'var(--nexus-success-500)',
            warning: 'var(--nexus-warning-500)',
            error: 'var(--nexus-error-500)',
            info: 'var(--nexus-info-500)',
        },

        extend: {
            // 添加標準 Tailwind 顏色（與 NexusERP 自定義顏色併存）
            colors: {
                // 標準 Tailwind 顏色 - 用於美化效果
                slate: {
                    50: '#f8fafc',
                    100: '#f1f5f9',
                    200: '#e2e8f0',
                    300: '#cbd5e1',
                    400: '#94a3b8',
                    500: '#64748b',
                    600: '#475569',
                    700: '#334155',
                    800: '#1e293b',
                    900: '#0f172a',
                    950: '#020617'
                },
                blue: {
                    50: '#eff6ff',
                    100: '#dbeafe',
                    200: '#bfdbfe',
                    300: '#93c5fd',
                    400: '#60a5fa',
                    500: '#3b82f6',
                    600: '#2563eb',
                    700: '#1d4ed8',
                    800: '#1e40af',
                    900: '#1e3a8a',
                    950: '#172554'
                },
                indigo: {
                    50: '#eef2ff',
                    100: '#e0e7ff',
                    200: '#c7d2fe',
                    300: '#a5b4fc',
                    400: '#818cf8',
                    500: '#6366f1',
                    600: '#4f46e5',
                    700: '#4338ca',
                    800: '#3730a3',
                    900: '#312e81',
                    950: '#1e1b4b'
                },
                purple: {
                    50: '#faf5ff',
                    100: '#f3e8ff',
                    200: '#e9d5ff',
                    300: '#d8b4fe',
                    400: '#c084fc',
                    500: '#a855f7',
                    600: '#9333ea',
                    700: '#7c3aed',
                    800: '#6b21a8',
                    900: '#581c87',
                    950: '#3b0764'
                },
                green: {
                    50: '#f0fdf4',
                    100: '#dcfce7',
                    200: '#bbf7d0',
                    300: '#86efac',
                    400: '#4ade80',
                    500: '#22c55e',
                    600: '#16a34a',
                    700: '#15803d',
                    800: '#166534',
                    900: '#14532d',
                    950: '#052e16'
                },
                emerald: {
                    50: '#ecfdf5',
                    100: '#d1fae5',
                    200: '#a7f3d0',
                    300: '#6ee7b7',
                    400: '#34d399',
                    500: '#10b981',
                    600: '#059669',
                    700: '#047857',
                    800: '#065f46',
                    900: '#064e3b',
                    950: '#022c22'
                },
                teal: {
                    50: '#f0fdfa',
                    100: '#ccfbf1',
                    200: '#99f6e4',
                    300: '#5eead4',
                    400: '#2dd4bf',
                    500: '#14b8a6',
                    600: '#0d9488',
                    700: '#0f766e',
                    800: '#115e59',
                    900: '#134e4a',
                    950: '#042f2e'
                },
                orange: {
                    50: '#fff7ed',
                    100: '#ffedd5',
                    200: '#fed7aa',
                    300: '#fdba74',
                    400: '#fb923c',
                    500: '#f97316',
                    600: '#ea580c',
                    700: '#c2410c',
                    800: '#9a3412',
                    900: '#7c2d12',
                    950: '#431407'
                },
                amber: {
                    50: '#fffbeb',
                    100: '#fef3c7',
                    200: '#fde68a',
                    300: '#fcd34d',
                    400: '#fbbf24',
                    500: '#f59e0b',
                    600: '#d97706',
                    700: '#b45309',
                    800: '#92400e',
                    900: '#78350f',
                    950: '#451a03'
                },
                red: {
                    50: '#fef2f2',
                    100: '#fee2e2',
                    200: '#fecaca',
                    300: '#fca5a5',
                    400: '#f87171',
                    500: '#ef4444',
                    600: '#dc2626',
                    700: '#b91c1c',
                    800: '#991b1b',
                    900: '#7f1d1d',
                    950: '#450a0a'
                },
                pink: {
                    50: '#fdf2f8',
                    100: '#fce7f3',
                    200: '#fbcfe8',
                    300: '#f9a8d4',
                    400: '#f472b6',
                    500: '#ec4899',
                    600: '#db2777',
                    700: '#be185d',
                    800: '#9d174d',
                    900: '#831843',
                    950: '#500724'
                }
            },
            
            // 字體系統
            fontFamily: {
                sans: ['var(--nexus-font-family-sans)', ...defaultTheme.fontFamily.sans],
                mono: ['var(--nexus-font-family-mono)', ...defaultTheme.fontFamily.mono],
                display: ['var(--nexus-font-family-display)', ...defaultTheme.fontFamily.sans],
            },
            
            // 字體大小 - 對應設計令牌
            fontSize: {
                'nexus-xs': 'var(--nexus-text-xs)',
                'nexus-sm': 'var(--nexus-text-sm)',
                'nexus-base': 'var(--nexus-text-base)',
                'nexus-lg': 'var(--nexus-text-lg)',
                'nexus-xl': 'var(--nexus-text-xl)',
                'nexus-2xl': 'var(--nexus-text-2xl)',
                'nexus-3xl': 'var(--nexus-text-3xl)',
                'nexus-4xl': 'var(--nexus-text-4xl)',
                'nexus-5xl': 'var(--nexus-text-5xl)',
                'nexus-6xl': 'var(--nexus-text-6xl)',
            },
            
            // 字重
            fontWeight: {
                'nexus-thin': 'var(--nexus-font-thin)',
                'nexus-light': 'var(--nexus-font-light)',
                'nexus-normal': 'var(--nexus-font-normal)',
                'nexus-medium': 'var(--nexus-font-medium)',
                'nexus-semibold': 'var(--nexus-font-semibold)',
                'nexus-bold': 'var(--nexus-font-bold)',
                'nexus-extrabold': 'var(--nexus-font-extrabold)',
                'nexus-black': 'var(--nexus-font-black)',
            },
            
            // 行高
            lineHeight: {
                'nexus-none': 'var(--nexus-leading-none)',
                'nexus-tight': 'var(--nexus-leading-tight)',
                'nexus-snug': 'var(--nexus-leading-snug)',
                'nexus-normal': 'var(--nexus-leading-normal)',
                'nexus-relaxed': 'var(--nexus-leading-relaxed)',
                'nexus-loose': 'var(--nexus-leading-loose)',
            },
            
            // 間距系統 - 對應設計令牌
            spacing: {
                'nexus-px': 'var(--nexus-space-px)',
                'nexus-0': 'var(--nexus-space-0)',
                'nexus-0.5': 'var(--nexus-space-0-5)',
                'nexus-1': 'var(--nexus-space-1)',
                'nexus-1.5': 'var(--nexus-space-1-5)',
                'nexus-2': 'var(--nexus-space-2)',
                'nexus-2.5': 'var(--nexus-space-2-5)',
                'nexus-3': 'var(--nexus-space-3)',
                'nexus-3.5': 'var(--nexus-space-3-5)',
                'nexus-4': 'var(--nexus-space-4)',
                'nexus-5': 'var(--nexus-space-5)',
                'nexus-6': 'var(--nexus-space-6)',
                'nexus-7': 'var(--nexus-space-7)',
                'nexus-8': 'var(--nexus-space-8)',
                'nexus-9': 'var(--nexus-space-9)',
                'nexus-10': 'var(--nexus-space-10)',
                'nexus-11': 'var(--nexus-space-11)',
                'nexus-12': 'var(--nexus-space-12)',
                'nexus-14': 'var(--nexus-space-14)',
                'nexus-16': 'var(--nexus-space-16)',
                'nexus-20': 'var(--nexus-space-20)',
                'nexus-24': 'var(--nexus-space-24)',
                'nexus-28': 'var(--nexus-space-28)',
                'nexus-32': 'var(--nexus-space-32)',
            },
            
            // 陰影系統
            boxShadow: {
                'nexus-xs': 'var(--nexus-shadow-xs)',
                'nexus-sm': 'var(--nexus-shadow-sm)',
                'nexus-md': 'var(--nexus-shadow-md)',
                'nexus-lg': 'var(--nexus-shadow-lg)',
                'nexus-xl': 'var(--nexus-shadow-xl)',
                'nexus-2xl': 'var(--nexus-shadow-2xl)',
                'nexus-inner': 'var(--nexus-shadow-inner)',
                'nexus-primary': 'var(--nexus-shadow-primary)',
                'nexus-success': 'var(--nexus-shadow-success)',
                'nexus-warning': 'var(--nexus-shadow-warning)',
                'nexus-error': 'var(--nexus-shadow-error)',
            },
            
            // 邊框半徑
            borderRadius: {
                'nexus-none': 'var(--nexus-radius-none)',
                'nexus-sm': 'var(--nexus-radius-sm)',
                'nexus-md': 'var(--nexus-radius-md)',
                'nexus-lg': 'var(--nexus-radius-lg)',
                'nexus-xl': 'var(--nexus-radius-xl)',
                'nexus-2xl': 'var(--nexus-radius-2xl)',
                'nexus-3xl': 'var(--nexus-radius-3xl)',
                'nexus-full': 'var(--nexus-radius-full)',
            },
            
            // 邊框寬度
            borderWidth: {
                'nexus-0': 'var(--nexus-border-0)',
                'nexus-1': 'var(--nexus-border-1)',
                'nexus-2': 'var(--nexus-border-2)',
                'nexus-4': 'var(--nexus-border-4)',
                'nexus-8': 'var(--nexus-border-8)',
            },
            
            // 過渡動畫時間
            transitionDuration: {
                'nexus-fast': 'var(--nexus-transition-fast)',
                'nexus-normal': 'var(--nexus-transition-normal)',
                'nexus-slow': 'var(--nexus-transition-slow)',
                'nexus-slower': 'var(--nexus-transition-slower)',
            },
            
            // 動畫緩動函數
            transitionTimingFunction: {
                'nexus-linear': 'var(--nexus-ease-linear)',
                'nexus-in': 'var(--nexus-ease-in)',
                'nexus-out': 'var(--nexus-ease-out)',
                'nexus-in-out': 'var(--nexus-ease-in-out)',
                'nexus-bounce': 'var(--nexus-ease-bounce)',
            },
            
            // Z-index 系統
            zIndex: {
                'nexus-auto': 'var(--nexus-z-auto)',
                'nexus-0': 'var(--nexus-z-0)',
                'nexus-10': 'var(--nexus-z-10)',
                'nexus-20': 'var(--nexus-z-20)',
                'nexus-30': 'var(--nexus-z-30)',
                'nexus-40': 'var(--nexus-z-40)',
                'nexus-50': 'var(--nexus-z-50)',
                'nexus-dropdown': 'var(--nexus-z-dropdown)',
                'nexus-sticky': 'var(--nexus-z-sticky)',
                'nexus-fixed': 'var(--nexus-z-fixed)',
                'nexus-modal-backdrop': 'var(--nexus-z-modal-backdrop)',
                'nexus-modal': 'var(--nexus-z-modal)',
                'nexus-popover': 'var(--nexus-z-popover)',
                'nexus-tooltip': 'var(--nexus-z-tooltip)',
                'nexus-toast': 'var(--nexus-z-toast)',
                'nexus-max': 'var(--nexus-z-max)',
            },

            // 語義化背景色
            backgroundColor: {
                'nexus-primary': 'var(--nexus-bg-primary)',
                'nexus-secondary': 'var(--nexus-bg-secondary)',
                'nexus-tertiary': 'var(--nexus-bg-tertiary)',
                'nexus-quaternary': 'var(--nexus-bg-quaternary)',
                'nexus-surface': 'var(--nexus-surface-primary)',
                'nexus-surface-secondary': 'var(--nexus-surface-secondary)',
                'nexus-surface-elevated': 'var(--nexus-surface-elevated)',
            },
            
            // 語義化文字色
            textColor: {
                'nexus-primary': 'var(--nexus-text-primary)',
                'nexus-secondary': 'var(--nexus-text-secondary)',
                'nexus-tertiary': 'var(--nexus-text-tertiary)',
                'nexus-quaternary': 'var(--nexus-text-quaternary)',
                'nexus-disabled': 'var(--nexus-text-disabled)',
                'nexus-inverse': 'var(--nexus-text-inverse)',
            },
            
            // 語義化邊框色
            borderColor: {
                'nexus-primary': 'var(--nexus-border-primary)',
                'nexus-secondary': 'var(--nexus-border-secondary)',
                'nexus-tertiary': 'var(--nexus-border-tertiary)',
                'nexus-focus': 'var(--nexus-border-focus)',
            },
            
            // 自定義動畫
            animation: {
                'nexus-fade-in': 'nexusFadeIn var(--nexus-transition-normal) var(--nexus-ease-out)',
                'nexus-fade-out': 'nexusFadeOut var(--nexus-transition-normal) var(--nexus-ease-in)',
                'nexus-slide-up': 'nexusSlideUp var(--nexus-transition-normal) var(--nexus-ease-out)',
                'nexus-slide-down': 'nexusSlideDown var(--nexus-transition-normal) var(--nexus-ease-out)',
                'nexus-scale-up': 'nexusScaleUp var(--nexus-transition-fast) var(--nexus-ease-out)',
                'nexus-scale-down': 'nexusScaleDown var(--nexus-transition-fast) var(--nexus-ease-in)',
                'nexus-bounce': 'nexusBounce var(--nexus-transition-slow) var(--nexus-ease-bounce)',
                'nexus-pulse': 'nexusPulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'nexus-spin': 'spin var(--nexus-transition-slow) linear infinite',
            },
            
            // 自定義關鍵幀
            keyframes: {
                nexusFadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' }
                },
                nexusFadeOut: {
                    '0%': { opacity: '1' },
                    '100%': { opacity: '0' }
                },
                nexusSlideUp: {
                    '0%': { transform: 'translateY(100%)' },
                    '100%': { transform: 'translateY(0)' }
                },
                nexusSlideDown: {
                    '0%': { transform: 'translateY(-100%)' },
                    '100%': { transform: 'translateY(0)' }
                },
                nexusScaleUp: {
                    '0%': { transform: 'scale(0.95)', opacity: '0' },
                    '100%': { transform: 'scale(1)', opacity: '1' }
                },
                nexusScaleDown: {
                    '0%': { transform: 'scale(1)', opacity: '1' },
                    '100%': { transform: 'scale(0.95)', opacity: '0' }
                },
                nexusBounce: {
                    '0%, 100%': { transform: 'translateY(-25%)', animationTimingFunction: 'cubic-bezier(0.8,0,1,1)' },
                    '50%': { transform: 'none', animationTimingFunction: 'cubic-bezier(0,0,0.2,1)' }
                },
                nexusPulse: {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '.5' }
                }
            }
        },
    },

    plugins: [
        forms({
            strategy: 'class' // 使用 class 策略避免衝突
        }),
        typography({
            className: 'nexus-prose'
        }),
        
        // 自定義 NexusERP 工具類別插件
        function({ addUtilities, addComponents, theme }) {
            // 添加語義化工具類別
            addUtilities({
                '.nexus-focus-ring': {
                    'outline': '2px solid var(--nexus-focus-ring)',
                    'outline-offset': '2px'
                },
                '.nexus-hover-lift': {
                    'transition': 'all var(--nexus-transition-fast) var(--nexus-ease-out)',
                    '&:hover': {
                        'transform': 'translateY(-2px)',
                        'box-shadow': 'var(--nexus-shadow-lg)'
                    }
                },
                '.nexus-press-effect': {
                    'transition': 'all var(--nexus-transition-fast) var(--nexus-ease-out)',
                    '&:active': {
                        'transform': 'scale(0.98)'
                    }
                }
            });

            // 添加組件基礎樣式
            addComponents({
                '.nexus-card': {
                    'background-color': 'var(--nexus-surface-primary)',
                    'border': 'var(--nexus-border-1) solid var(--nexus-border-primary)',
                    'border-radius': 'var(--nexus-radius-lg)',
                    'box-shadow': 'var(--nexus-shadow-sm)',
                    'padding': 'var(--nexus-space-6)'
                },
                '.nexus-input': {
                    'display': 'block',
                    'width': '100%',
                    'background-color': 'var(--nexus-surface-primary)',
                    'border': 'var(--nexus-border-1) solid var(--nexus-border-primary)',
                    'border-radius': 'var(--nexus-radius-md)',
                    'color': 'var(--nexus-text-primary)',
                    'font-size': 'var(--nexus-text-base)',
                    'line-height': 'var(--nexus-leading-normal)',
                    'padding': 'var(--nexus-space-3) var(--nexus-space-4)',
                    'transition': 'all var(--nexus-transition-fast) var(--nexus-ease-out)',
                    '&:focus': {
                        'outline': 'none',
                        'border-color': 'var(--nexus-border-focus)',
                        'box-shadow': '0 0 0 3px rgba(59, 130, 246, 0.1)'
                    },
                    '&::placeholder': {
                        'color': 'var(--nexus-text-quaternary)'
                    }
                }
            });
        }
    ],
};
